// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

interface IENS {
    function resolver(bytes32 node) external view returns (address);
}

interface IResolver {
    function addr(bytes32 node) external view returns (address);
}

contract LendingOracle {
    // State variables
    IENS public ens;
    address public oracleAddress;
    uint256 public requestCounter;
    
    struct LoanRequest {
        address borrower;
        uint256 amount;
        string ensName;
        bool processed;
        uint256 creditScore;
        bool approved;
    }
    
    mapping(bytes32 => LoanRequest) public loanRequests;
    
    // Events
    event LoanRequested(
        bytes32 indexed requestId,
        address indexed borrower,
        uint256 amount,
        string ensName
    );
    
    event LoanProcessed(
        bytes32 indexed requestId,
        address indexed borrower,
        uint256 creditScore,
        bool approved,
        uint256 interestRate
    );
    
    event DebugLoanRequested(
        bytes32 indexed requestId,
        address indexed borrower,
        uint256 amount,
        string ensName,
        uint256 testBalanceEth
    );
    
    event LoanExecuted(
        address indexed borrower,
        uint256 loanAmount,
        uint256 totalRepayment,
        uint256 interestRate
    );
    
    /**
     * @notice Initialize the lending contract with ENS registry
     * @param _ensRegistry Address of the ENS registry contract
     * 
     * REQUIREMENTS:
     * - Store ENS registry interface
     * - Set deployer as initial oracle address
     * - Initialize requestCounter to 0
     */
    constructor(address _ensRegistry) {
        ens = IENS(_ensRegistry);
        oracleAddress = msg.sender;
        requestCounter = 0;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only oracle can call");
        _;
    }
    
    /**
     * @notice Update the authorized oracle address
     * @param _oracle New oracle address
     * 
     * REQUIREMENTS:
     * - Only current oracle can call
     * - Validate _oracle is not zero address
     */
    function setOracleAddress(address _oracle) external onlyOracle {
        require(_oracle != address(0), "Oracle address cannot be zero");
        oracleAddress = _oracle;
    }

    /**
     * @notice Compute ENS namehash for domain
     * @param name ENS domain name (e.g., "vitalik.eth")
     * @return node The namehash bytes32 value
     * 
     * REQUIREMENTS:
     * - Implement EIP-137 namehash algorithm
     * - Handle empty string edge case
     * - Split name by "." and hash recursively from right to left
     */
    function namehash(string memory name) internal pure returns (bytes32) {
        bytes32 node = 0x0;
        if (bytes(name).length == 0) {
            return node;
        }
        
        bytes memory nameBytes = bytes(name);
        uint256 len = nameBytes.length;
        uint256 labelEnd = len;
        
        // Loop backwards to find separators
        for (uint256 i = len; i > 0; i--) {
            if (nameBytes[i-1] == '.') {
                bytes32 labelHash = keccak256(substring(nameBytes, i, labelEnd));
                node = keccak256(abi.encodePacked(node, labelHash));
                labelEnd = i - 1;
            }
        }
        
        // Process the first label (or the only label if no separators)
        bytes32 firstLabelHash = keccak256(substring(nameBytes, 0, labelEnd));
        node = keccak256(abi.encodePacked(node, firstLabelHash));
        
        return node;
    }
    
    // Helper for substring to avoid external library dependency for now
    function substring(bytes memory strBytes, uint startIndex, uint endIndex) internal pure returns (bytes memory) {
        bytes memory result = new bytes(endIndex - startIndex);
        for(uint i = 0; i < endIndex - startIndex; i++) {
            result[i] = strBytes[startIndex + i];
        }
        return result;
    }
    
    /**
     * @notice Validate ENS domain exists and resolves to an address
     * @param ensName The ENS domain to validate
     * @return ensOwner The address the ENS domain resolves to
     * 
     * REQUIREMENTS:
     * - Query ENS registry for resolver using namehash
     * - Require resolver exists (non-zero address)
     * - Query resolver for addr() record
     * - Require addr record exists (non-zero address)
     * - Return the resolved address
     */
    function validateENS(string memory ensName) internal view returns (address) {
        console.log("validateENS: Starting validation for:", ensName);
        bytes32 node = namehash(ensName);
        console.log("validateENS: Computed node hash");
        console.logBytes32(node);
        
        address resolverAddr = ens.resolver(node);
        console.log("validateENS: Got resolver address:", resolverAddr);
        
        require(resolverAddr != address(0), "ENS domain not registered");
        console.log("validateENS: Resolver check passed");
        
        IResolver resolver = IResolver(resolverAddr);
        address addr = resolver.addr(node);
        console.log("validateENS: Got address from resolver:", addr);
        
        require(addr != address(0), "ENS domain not registered");
        console.log("validateENS: Address check passed, returning:", addr);
        
        return addr;
    }
    
    /**
     * @notice Check if address has sufficient ETH balance
     * @param addr Address to check
     * @param minBalance Minimum required balance in wei
     * @return bool True if balance >= minBalance
     */
    function hasMinimumBalance(address addr, uint256 minBalance) internal view returns (bool) {
        return addr.balance >= minBalance;
    }
    
    /**
     * @notice Check if address has transaction history
     * @param addr Address to check
     * @return bool True if address has made at least one transaction
     * 
     * REQUIREMENTS:
     * - Check if address is a contract (has code)
     * - If contract, return true (contracts must have deployment tx)
     * - If EOA, check if balance > 0 as proxy for tx history
     */
    function hasTransactionHistory(address addr) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(addr) }
        if (size > 0) return true;
        
        // For testing: Accept any address with balance > 0
        // In production, you'd want to check nonce via off-chain oracle
        // or use a more sophisticated on-chain verification
        return addr.balance > 0;
    }
    
    /**
     * @notice Request a loan using ENS domain as identity
     * @param ensName Borrower's ENS domain (e.g., "borrower.eth")
     * @param amount Loan amount requested in wei
     * @return requestId Unique identifier for this loan request
     * 
     * REQUIREMENTS:
     * 1. Validate ENS domain exists and resolves
     * 2. Check borrower has >= 0.01 ETH balance
     * 3. Check borrower has transaction history
     * 4. Generate unique requestId using keccak256
     * 5. Store loan request in mapping
     * 6. Emit LoanRequested event
     * 7. Return requestId
     * 
     * VALIDATION FAILURES:
     * - Revert with "ENS domain not registered" if ENS invalid
     * - Revert with "Insufficient ETH balance" if balance < 0.01 ETH
     * - Revert with "No transaction history" if hasTransactionHistory fails
     */
    function requestLoan(string memory ensName, uint256 amount) external returns (bytes32) {
        address borrower = msg.sender;
        
        // STEP 2: Validate ENS using validateENS() if provided
        if (bytes(ensName).length > 0) {
            address ensOwner = validateENS(ensName);
            // CRITICAL: Verify msg.sender owns this ENS name
            require(ensOwner == borrower, "You do not own this ENS name");
        }
        
        // STEP 3: Check hasMinimumBalance(borrower, 0.01 ether)
        require(hasMinimumBalance(borrower, 0.01 ether), "Insufficient ETH balance");
        
        // STEP 4: Check hasTransactionHistory(borrower)
        require(hasTransactionHistory(borrower), "No transaction history");
        
        // STEP 5: Generate requestId
        // STEP 5: Generate requestId with better entropy to prevent collisions
        bytes32 requestId = keccak256(
            abi.encodePacked(
                borrower, 
                amount, 
                ensName, 
                block.timestamp, 
                block.number,
                requestCounter
            )
        );
        
        // STEP 6: Increment requestCounter
        requestCounter++;
        
        // STEP 7: Store LoanRequest struct in loanRequests mapping
        loanRequests[requestId] = LoanRequest({
            borrower: borrower,
            amount: amount,
            ensName: ensName,
            processed: false,
            creditScore: 0,
            approved: false
        });
        
        // STEP 8: Emit LoanRequested event
        emit LoanRequested(requestId, borrower, amount, ensName);
        
        // STEP 9: Return requestId
        return requestId;
    }
    
    /**
     * @notice DEBUG ONLY: Request a loan on behalf of another address (bypassing checks)
     * @param _borrower The address to simulate as borrower
     * @param _ensName The ENS name to associate
     * @param _amount The loan amount
     */
    function debugRequestLoan(address _borrower, string memory _ensName, uint256 _amount) external onlyOracle returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(_borrower, _amount, _ensName, block.timestamp, requestCounter));
        requestCounter++;
        
        loanRequests[requestId] = LoanRequest({
            borrower: _borrower,
            amount: _amount,
            ensName: _ensName,
            processed: false,
            creditScore: 0,
            approved: false
        });
        
        emit LoanRequested(requestId, _borrower, _amount, _ensName);
        return requestId;
    }
    
    /**
     * @notice DEBUG ONLY: Request loan with custom balance for testing
     * @param _borrower The address to simulate as borrower
     * @param _ensName The ENS name to associate
     * @param _amount The loan amount
     * @param _testBalanceEth Test balance in wei (used by oracle for prediction)
     */
    function debugRequestLoanWithBalance(
        address _borrower, 
        string memory _ensName, 
        uint256 _amount,
        uint256 _testBalanceEth
    ) external onlyOracle returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(_borrower, _amount, _ensName, block.timestamp, requestCounter));
        requestCounter++;
        
        loanRequests[requestId] = LoanRequest({
            borrower: _borrower,
            amount: _amount,
            ensName: _ensName,
            processed: false,
            creditScore: 0,
            approved: false
        });
        
        emit DebugLoanRequested(requestId, _borrower, _amount, _ensName, _testBalanceEth);
        return requestId;
    }

    /**
     * @notice Get details of a loan request
     * @param requestId The unique loan request identifier
     * @return borrower Address of borrower
     * @return amount Loan amount in wei
     * @return ensName ENS domain used
     * @return processed Whether oracle has processed this request
     * @return creditScore Credit score assigned by oracle (0 if not processed)
     * @return approved Whether loan was approved
     */
    function getLoanRequest(bytes32 requestId) external view returns (
        address borrower,
        uint256 amount,
        string memory ensName,
        bool processed,
        uint256 creditScore,
        bool approved
    ) {
        LoanRequest memory req = loanRequests[requestId];
        return (
            req.borrower,
            req.amount,
            req.ensName,
            req.processed,
            req.creditScore,
            req.approved
        );
    }
    /**
     * @notice Oracle callback to fulfill loan request with credit score
     * @param requestId The loan request being fulfilled
     * @param creditScore Credit score computed off-chain (300-850 range)
     * @param interestRateBPS Interest rate in basis points (1% = 100 BPS)
     * @param approved Whether loan is approved
     * 
     * REQUIREMENTS:
     * - Only oracle address can call (onlyOracle modifier)
     * - Request must exist and not be processed
     * - Update loan request with credit score and approval
     * - Mark request as processed
     * - Emit LoanProcessed event
     * - If approved, call executeLoan()
     * 
     * SECURITY:
     * - Prevent double processing
     * - Validate creditScore is in range 300-850
     * - Validate interestRateBPS is reasonable (< 10000 = 100%)
     */
    function fulfillLoanRequest(
        bytes32 requestId,
        uint256 creditScore,
        uint256 interestRateBPS,
        bool approved
    ) external onlyOracle {
        // STEP 1: Get loan request from storage
        LoanRequest storage request = loanRequests[requestId];
        
        // STEP 2: Require !request.processed
        require(!request.processed, "Request already processed");
        
        // Check request exists (borrower != 0)
        require(request.borrower != address(0), "Request does not exist");

        // STEP 3: Require creditScore >= 300 && creditScore <= 850
        require(creditScore >= 300 && creditScore <= 850, "Credit score out of range");
        
        // STEP 4: Require interestRateBPS < 10000
        require(interestRateBPS < 10000, "Interest rate too high");
        
        // STEP 5: Update request.creditScore, request.approved, request.processed
        request.creditScore = creditScore;
        request.approved = approved;
        request.processed = true;
        
        // STEP 6: Emit LoanProcessed event
        emit LoanProcessed(requestId, request.borrower, creditScore, approved, interestRateBPS);
        
        // STEP 7: If approved, call executeLoan()
        if (approved) {
            executeLoan(request.borrower, request.amount, interestRateBPS);
        }
    }

    /**
     * @notice Execute approved loan (transfer funds and record terms)
     * @param borrower Address receiving the loan
     * @param amount Loan principal in wei
     * @param interestRateBPS Annual interest rate in basis points
     * 
     * REQUIREMENTS:
     * - Calculate interest amount: (amount * interestRateBPS) / 10000
     * - Calculate total repayment: amount + interestAmount
     * - Emit LoanExecuted event with all terms
     * 
     * PRODUCTION TODO (NOT IMPLEMENTED IN THIS SKELETON):
     * - Transfer ERC20 stablecoins to borrower
     * - Create repayment schedule
     * - Lock collateral if applicable
     * - Set up liquidation triggers
     * 
     * SECURITY:
     * - Only callable internally from fulfillLoanRequest
     * - Validate amounts don't overflow
     */
    function executeLoan(
        address borrower,
        uint256 amount,
        uint256 interestRateBPS
    ) internal {
        // STEP 1: Calculate interestAmount
        uint256 interestAmount = (amount * interestRateBPS) / 10000;
        
        // STEP 2: Calculate totalRepayment
        uint256 totalRepayment = amount + interestAmount;
        
        // STEP 3: Emit LoanExecuted event
        // NOTE: In production, add actual fund transfer here
        emit LoanExecuted(borrower, amount, totalRepayment, interestRateBPS);
    }
}
