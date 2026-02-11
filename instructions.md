Perfect. Let me create a comprehensive markdown file that synthesizes best practices from Anthropic, Google, and GitHub for AI agent orchestration.[1][2][3][4][5]

```markdown
# PROJECT SPECIFICATION: ENS-Based DeFi Lending Platform with AI Credit Scoring

**Agent Role:** You are a senior blockchain engineer with expertise in Solidity smart contracts, Python web3 development, and ML-powered DeFi applications. Your task is to build a production-ready lending protocol with off-chain AI credit scoring.

**Project Goal:** Create a decentralized lending platform where borrowers use ENS domains to apply for loans. The system performs on-chain validations, uses an off-chain Python oracle with AI/ML for credit scoring, and executes loan disbursements based on computed creditworthiness.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SMART CONTRACT (Solidity)                                │
│    -  ENS domain validation                                  │
│    -  ETH balance check                                      │
│    -  Transaction history verification                       │
│    -  Event emission (LoanRequested)                         │
│    -  Oracle callback handler (fulfillLoanRequest)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Blockchain Events
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PYTHON ORACLE (web3.py)                                  │
│    -  Event listener (WebSocket)                             │
│    -  Social media verification                              │
│    -  ETH/INR price fetching                                 │
│    -  AI/ML credit scoring                                   │
│    -  Transaction signing & submission                       │
└─────────────────────────────────────────────────────────────┘
```

---

## TECH STACK

- **Smart Contract:** Solidity ^0.8.20, ENS integration
- **Oracle:** Python 3.10+, web3.py, scikit-learn
- **Blockchain:** Ethereum (Sepolia testnet for development)
- **AI/ML:** scikit-learn, numpy, pandas
- **APIs:** CoinGecko (price data), ENS resolver

---

## DEVELOPMENT PHASES

You will build this in 7 sequential phases. Each phase includes:
1. **Context** - What this phase achieves
2. **Function Skeletons** - Exact function signatures you must implement
3. **Implementation Requirements** - Specific logic, error handling, validations
4. **Testing Criteria** - How to verify success
5. **Dependencies** - What must be completed first

**IMPORTANT INSTRUCTIONS:**
- Follow the skeletons EXACTLY - preserve function names, parameters, and return types [web:134][web:136]
- Add comprehensive error handling for every external call [web:133][web:139]
- Use explicit types and descriptive variable names [web:137][web:143]
- Write docstrings for every function explaining purpose, params, returns [web:143]
- Test each phase independently before moving to next [web:121][web:133]
- Never skip validation checks - security is critical [web:133][web:134]

---

## PHASE 1: SMART CONTRACT SETUP

### Context
Create the foundational Solidity contract that handles loan requests, validates borrower eligibility through three on-chain checks, and emits events for off-chain processing [web:134][web:136].

### File: `LendingOracle.sol`

#### Function Skeleton 1.1: Constructor

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
        // TODO: Implement initialization
        // HINT: Use IENS interface to wrap _ensRegistry
        // HINT: Set msg.sender as oracleAddress
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
    function setOracleAddress(address _oracle) external {
        // TODO: Implement oracle address update with validation
    }
```

#### Function Skeleton 1.2: ENS Validation

```solidity
    /**
     * @notice Compute ENS namehash for domain
     * @param name ENS domain name (e.g., "vitalik.eth")
     * @return node The namehash bytes32 value
     * 
     * REQUIREMENTS:
     * - Implement EIP-137 namehash algorithm
     * - Handle empty string edge case
     * - Split name by "." and hash recursively from right to left
     * 
     * ALGORITHM:
     * - Start with 32 zero bytes
     * - Hash "eth" label: keccak256(node, keccak256("eth"))
     * - Hash domain label: keccak256(node, keccak256(name))
     */
    function namehash(string memory name) internal pure returns (bytes32) {
        // TODO: Implement EIP-137 namehash
        // HINT: Start with bytes32 node = 0x0;
        // HINT: For .eth domains, hash in two steps
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
        // TODO: Implement ENS validation
        // HINT: bytes32 node = namehash(ensName);
        // HINT: address resolver = ens.resolver(node);
        // HINT: Use IResolver interface to call addr(node)
    }
```

#### Function Skeleton 1.3: Balance and Transaction Checks

```solidity
    /**
     * @notice Check if address has sufficient ETH balance
     * @param addr Address to check
     * @param minBalance Minimum required balance in wei
     * @return bool True if balance >= minBalance
     * 
     * REQUIREMENTS:
     * - Use address.balance to get ETH balance
     * - Compare with minBalance threshold
     * - Return boolean result (no revert)
     */
    function hasMinimumBalance(address addr, uint256 minBalance) internal view returns (bool) {
        // TODO: Implement balance check
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
     * - Note: Direct nonce check is not available in pure Solidity
     */
    function hasTransactionHistory(address addr) internal view returns (bool) {
        // TODO: Implement transaction history check
        // HINT: Use assembly { size := extcodesize(addr) }
        // HINT: For EOAs, balance > 0 indicates activity
    }
```

#### Function Skeleton 1.4: Loan Request Function

```solidity
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
        // TODO: Implement loan request flow
        // STEP 1: Get msg.sender as borrower
        // STEP 2: Validate ENS using validateENS()
        // STEP 3: Check hasMinimumBalance(borrower, 0.01 ether)
        // STEP 4: Check hasTransactionHistory(borrower)
        // STEP 5: Generate requestId = keccak256(abi.encodePacked(borrower, amount, ensName, block.timestamp, requestCounter))
        // STEP 6: Increment requestCounter
        // STEP 7: Store LoanRequest struct in loanRequests mapping
        // STEP 8: Emit LoanRequested event
        // STEP 9: Return requestId
    }
```

#### Function Skeleton 1.5: View Functions

```solidity
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
        // TODO: Implement getter for loan request
        // HINT: Return all fields from loanRequests[requestId]
    }
}
```

### Testing Criteria Phase 1
- [ ] Contract deploys successfully with ENS registry address
- [ ] namehash("vitalik.eth") returns correct hash
- [ ] requestLoan reverts if ENS doesn't exist
- [ ] requestLoan reverts if balance < 0.01 ETH
- [ ] requestLoan emits LoanRequested event with correct parameters
- [ ] getLoanRequest returns stored data correctly

---

## PHASE 2: ORACLE CALLBACK HANDLER

### Context
Implement the smart contract functions that receive credit scores from the off-chain oracle and execute loan logic based on creditworthiness [web:133][web:134].

### File: `LendingOracle.sol` (continued)

#### Function Skeleton 2.1: Oracle Fulfillment

```solidity
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
        // TODO: Implement oracle callback
        // STEP 1: Get loan request from storage
        // STEP 2: Require !request.processed
        // STEP 3: Require creditScore >= 300 && creditScore <= 850
        // STEP 4: Require interestRateBPS < 10000
        // STEP 5: Update request.creditScore, request.approved, request.processed
        // STEP 6: Emit LoanProcessed event
        // STEP 7: If approved, call executeLoan()
    }
```

#### Function Skeleton 2.2: Loan Execution

```solidity
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
        // TODO: Implement loan execution logic
        // STEP 1: Calculate interestAmount
        // STEP 2: Calculate totalRepayment
        // STEP 3: Emit LoanExecuted event
        // NOTE: In production, add actual fund transfer here
    }
```

### Testing Criteria Phase 2
- [ ] fulfillLoanRequest reverts if called by non-oracle
- [ ] fulfillLoanRequest reverts if request already processed
- [ ] fulfillLoanRequest reverts if creditScore out of range
- [ ] fulfillLoanRequest updates loan request state correctly
- [ ] executeLoan calculates interest correctly
- [ ] LoanProcessed and LoanExecuted events emit with correct data

---

## PHASE 3: PYTHON ORACLE - BLOCKCHAIN SETUP

### Context
Initialize the Python oracle with web3.py, connect to Ethereum, and set up event listening infrastructure [web:134][web:139].

### File: `oracle.py`

#### Function Skeleton 3.1: Environment Setup

```python
"""
ENS Lending Oracle - Off-chain AI Credit Scoring System

This oracle listens for LoanRequested events on Ethereum, performs
off-chain AI/ML credit scoring, and fulfills requests by calling
back to the smart contract.

Dependencies:
- web3.py: Ethereum interaction
- python-dotenv: Environment variables
- requests: HTTP calls for price data
- scikit-learn: ML models
- numpy: Numerical computation
"""

from web3 import Web3
from eth_account import Account
import json
import time
import os
import requests
import numpy as np
import pickle
from dotenv import load_dotenv

load_dotenv()

# ============= CONFIGURATION =============

def load_config():
    """
    Load configuration from environment variables
    
    REQUIREMENTS:
    - Load RPC_URL for Ethereum node connection
    - Load PRIVATE_KEY for oracle wallet
    - Load CONTRACT_ADDRESS for deployed LendingOracle
    - Validate all required vars are present
    - Return config dictionary
    
    RETURNS:
        dict: Configuration with keys 'rpc_url', 'private_key', 'contract_address'
    
    RAISES:
        ValueError: If any required environment variable is missing
    """
    # TODO: Implement config loading with validation
    # HINT: Use os.getenv() and check for None
    # HINT: Raise ValueError with clear message if missing
    pass

# Load configuration
config = load_config()

# ============= BLOCKCHAIN CONNECTION =============

def initialize_web3(rpc_url):
    """
    Initialize Web3 instance and verify connection
    
    REQUIREMENTS:
    - Create Web3 instance with HTTPProvider
    - Check connection using w3.is_connected()
    - Raise error if connection fails
    - Return connected Web3 instance
    
    ARGS:
        rpc_url (str): Ethereum node RPC endpoint
    
    RETURNS:
        Web3: Connected Web3 instance
    
    RAISES:
        ConnectionError: If cannot connect to Ethereum node
    """
    # TODO: Implement Web3 initialization
    # HINT: w3 = Web3(Web3.HTTPProvider(rpc_url))
    # HINT: Check w3.is_connected()
    pass

def load_account(private_key):
    """
    Load oracle account from private key
    
    REQUIREMENTS:
    - Create Account from private key
    - Validate account has non-zero address
    - Print oracle address for logging
    - Return Account instance
    
    ARGS:
        private_key (str): Ethereum private key (with or without 0x prefix)
    
    RETURNS:
        Account: eth_account.Account instance
    
    SECURITY:
    - Never log or print the private key
    - Only log the derived address
    """
    # TODO: Implement account loading
    # HINT: Account.from_key() handles both formats
    pass

# Initialize connections
w3 = initialize_web3(config['rpc_url'])
oracle_account = load_account(config['private_key'])
```

#### Function Skeleton 3.2: Contract Interface

```python
# ============= SMART CONTRACT SETUP =============

# Contract ABI - PASTE YOUR COMPILED ABI HERE
CONTRACT_ABI = json.loads('''
[
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "bytes32", "name": "requestId", "type": "bytes32"},
            {"indexed": true, "internalType": "address", "name": "borrower", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
            {"indexed": false, "internalType": "string", "name": "ensName", "type": "string"}
        ],
        "name": "LoanRequested",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "requestId", "type": "bytes32"},
            {"internalType": "uint256", "name": "creditScore", "type": "uint256"},
            {"internalType": "uint256", "name": "interestRateBPS", "type": "uint256"},
            {"internalType": "bool", "name": "approved", "type": "bool"}
        ],
        "name": "fulfillLoanRequest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]
''')

def initialize_contract(w3, address, abi):
    """
    Initialize contract interface
    
    REQUIREMENTS:
    - Convert address string to checksum address
    - Create contract instance using w3.eth.contract()
    - Validate contract exists at address (check bytecode)
    - Return contract instance
    
    ARGS:
        w3 (Web3): Connected Web3 instance
        address (str): Contract address
        abi (list): Contract ABI
    
    RETURNS:
        Contract: web3 Contract instance
    
    RAISES:
        ValueError: If no contract exists at address
    """
    # TODO: Implement contract initialization
    # HINT: w3.to_checksum_address(address)
    # HINT: Check w3.eth.get_code(address) != b''
    pass

lending_contract = initialize_contract(w3, config['contract_address'], CONTRACT_ABI)
```

#### Function Skeleton 3.3: Event Listener

```python
# ============= EVENT LISTENING =============

def create_event_filter(contract, event_name, from_block='latest'):
    """
    Create event filter for listening to blockchain events
    
    REQUIREMENTS:
    - Access event by name from contract.events
    - Create filter starting from specified block
    - Handle case where event doesn't exist in ABI
    - Return event filter instance
    
    ARGS:
        contract (Contract): web3 Contract instance
        event_name (str): Name of event to listen for
        from_block (str|int): Starting block ('latest' or block number)
    
    RETURNS:
        EventFilter: Filter instance for polling
    
    RAISES:
        AttributeError: If event not found in contract ABI
    """
    # TODO: Implement event filter creation
    # HINT: contract.events.EventName.create_filter(fromBlock=from_block)
    pass

def poll_events(event_filter, callback, poll_interval=2):
    """
    Continuously poll for new events and process them
    
    REQUIREMENTS:
    - Infinite loop with keyboard interrupt handling
    - Get new entries from event filter
    - Call callback function for each event
    - Sleep for poll_interval between checks
    - Handle and log any errors without crashing
    
    ARGS:
        event_filter (EventFilter): Filter to poll
        callback (callable): Function to call with event data
        poll_interval (int): Seconds between polls
    
    CALLBACK SIGNATURE:
        callback(event: AttributeDict) -> None
    
    ERROR HANDLING:
        - Catch all exceptions in callback
        - Log errors but continue polling
        - Allow KeyboardInterrupt to exit cleanly
    """
    # TODO: Implement event polling loop
    # HINT: Use try/except for KeyboardInterrupt
    # HINT: event_filter.get_new_entries() returns list
    # HINT: time.sleep(poll_interval) between polls
    pass
```

### Testing Criteria Phase 3
- [ ] Oracle connects to Ethereum node successfully
- [ ] Oracle account loads and address prints correctly
- [ ] Contract interface initializes without errors
- [ ] Event filter created for LoanRequested
- [ ] Polling loop starts without crashing
- [ ] Graceful shutdown on Ctrl+C

---

## PHASE 4: OFF-CHAIN VALIDATION - SOCIAL MEDIA & PRICE

### Context
Implement off-chain data fetching: ENS social media verification and real-time ETH/INR price conversion [web:133][web:134].

### File: `oracle.py` (continued)

#### Function Skeleton 4.1: Social Media Verification

```python
# ============= OFF-CHAIN VALIDATION =============

def check_social_media_links(ens_name):
    """
    Check if ENS domain has social media text records
    
    REQUIREMENTS:
    - Query ENS text records for social platforms
    - Check for: com.twitter, com.github, com.discord
    - Return dictionary with linked status and platforms list
    - Handle cases where ENS resolver doesn't support text records
    
    ARGS:
        ens_name (str): ENS domain name (e.g., "vitalik.eth")
    
    RETURNS:
        dict: {
            'linked': bool,  # True if any platform linked
            'platforms': list[str],  # List of linked platform names
            'details': dict  # Platform-specific usernames
        }
    
    IMPLEMENTATION NOTE:
    - For MVP, use mock data (random True/False)
    - In production, use ENS Python library:
        from ens import ENS
        ns = ENS.fromWeb3(w3)
        twitter = ns.resolver(ens_name).text('com.twitter')
    
    ERROR HANDLING:
    - Return {'linked': False, 'platforms': [], 'details': {}} on any error
    - Log errors for debugging
    """
    # TODO: Implement social media checking
    # MVP HINT: Use np.random.random() > 0.3 for mock
    # PRODUCTION HINT: Query ENS text records
    print(f"🔍 Checking social media for {ens_name}...")
    pass

def get_eth_to_inr_price(amount_wei):
    """
    Fetch current ETH/INR price and calculate loan value
    
    REQUIREMENTS:
    - Call CoinGecko API for ETH price in INR and USD
    - Convert amount from wei to ETH
    - Calculate loan value in INR
    - Determine dynamic interest rate based on loan size
    - Return dictionary with all computed values
    
    ARGS:
        amount_wei (int): Loan amount in wei
    
    RETURNS:
        dict: {
            'eth_to_inr': float,      # Current ETH/INR rate
            'eth_to_usd': float,      # Current ETH/USD rate
            'amount_eth': float,      # Loan amount in ETH
            'loan_value_inr': float,  # Loan value in INR
            'base_interest': float    # Interest rate percentage
        }
    
    INTEREST RATE LOGIC:
    - > ₹10,00,000 (10 Lakh): 8% interest
    - > ₹5,00,000 (5 Lakh): 10% interest
    - > ₹1,00,000 (1 Lakh): 11% interest
    - < ₹1,00,000: 12% interest
    
    ERROR HANDLING:
    - Use fallback values if API call fails
    - Log API errors
    - Return safe defaults: eth_to_inr=200000, base_interest=12.0
    """
    # TODO: Implement price fetching
    # API: https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr,usd
    # HINT: Use requests.get() with timeout
    # HINT: Convert wei: amount_eth = w3.from_wei(amount_wei, 'ether')
    print("💱 Fetching ETH to INR rate...")
    pass
```

### Testing Criteria Phase 4
- [ ] check_social_media_links returns valid dictionary
- [ ] get_eth_to_inr_price successfully calls CoinGecko API
- [ ] Interest rate calculation matches specification
- [ ] Error handling returns fallback values
- [ ] Functions log their progress clearly

---

## PHASE 5: AI CREDIT SCORING

### Context
Implement the AI/ML credit scoring engine that combines multiple signals into a single creditworthiness score [web:133][web:134][web:139].

### File: `oracle.py` (continued)

#### Function Skeleton 5.1: ML Model Loading

```python
# ============= AI/ML SETUP =============

def load_ml_model(model_path='credit_model.pkl'):
    """
    Load pre-trained ML model for credit scoring
    
    REQUIREMENTS:
    - Attempt to load pickled scikit-learn model
    - Return None if file doesn't exist (use rule-based fallback)
    - Validate loaded model has predict() method
    - Log success or fallback status
    
    ARGS:
        model_path (str): Path to pickled model file
    
    RETURNS:
        object|None: Loaded sklearn model or None if unavailable
    
    MODEL EXPECTED INPUT:
        np.array([[balance_eth, tx_count, has_social, loan_value_inr, domain_age_days]])
    
    MODEL EXPECTED OUTPUT:
        np.array([credit_score])  # Integer 300-850
    """
    # TODO: Implement model loading
    # HINT: Use pickle.load() with error handling
    # HINT: Check hasattr(model, 'predict')
    pass

credit_model = load_ml_model()
```

#### Function Skeleton 5.2: Feature Engineering

```python
def extract_features(w3, borrower_address, amount_wei, social_media, price_data):
    """
    Extract features for ML model from blockchain and off-chain data
    
    REQUIREMENTS:
    - Query borrower's ETH balance
    - Query borrower's transaction count (nonce)
    - Convert social media to binary (1 if linked, 0 otherwise)
    - Get loan value in INR from price_data
    - Mock domain age (query from ENS in production)
    - Return numpy array ready for model input
    
    ARGS:
        w3 (Web3): Web3 instance
        borrower_address (str): Borrower's Ethereum address
        amount_wei (int): Loan amount in wei
        social_media (dict): Result from check_social_media_links()
        price_data (dict): Result from get_eth_to_inr_price()
    
    RETURNS:
        np.array: Feature vector [[balance_eth, tx_count, has_social, loan_inr, domain_age]]
    
    FEATURES:
        1. balance_eth (float): Borrower's ETH balance
        2. tx_count (int): Number of transactions from address
        3. has_social (int): 1 if social media linked, 0 otherwise
        4. loan_value_inr (float): Loan amount in INR
        5. domain_age_days (int): Days since ENS registration (mock: 365)
    """
    # TODO: Implement feature extraction
    # HINT: w3.eth.get_balance(borrower_address)
    # HINT: w3.eth.get_transaction_count(borrower_address)
    # HINT: w3.from_wei(balance, 'ether')
    pass
```

#### Function Skeleton 5.3: Credit Scoring Logic

```python
def calculate_credit_score(w3, borrower_address, amount_wei, social_media, price_data, model=None):
    """
    Calculate credit score using ML model or rule-based fallback
    
    REQUIREMENTS:
    - Extract features from blockchain and off-chain data
    - If model exists, use model.predict()
    - If no model, use rule_based_credit_score()
    - Ensure score is in valid range 300-850
    - Return integer score
    
    ARGS:
        w3 (Web3): Web3 instance
        borrower_address (str): Borrower's address
        amount_wei (int): Loan amount in wei
        social_media (dict): Social media verification result
        price_data (dict): Price and interest data
        model (object|None): Trained ML model
    
    RETURNS:
        int: Credit score between 300-850
    
    SCORING APPROACH:
    - If model exists: Use ML prediction
    - If no model: Use weighted rule-based calculation
    """
    # TODO: Implement credit scoring
    print("\n🤖 Calculating credit score...")
    
    # Extract features
    features = extract_features(w3, borrower_address, amount_wei, social_media, price_data)
    
    # Use ML model or fallback
    if model is not None:
        # TODO: ML prediction
        # HINT: score = int(model.predict(features))
        pass
    else:
        # TODO: Call rule_based_credit_score()
        pass
    
    # Validate range
    # TODO: Clamp score to 300-850
    pass

def rule_based_credit_score(features, social_media, price_data):
    """
    Calculate credit score using rule-based algorithm
    
    REQUIREMENTS:
    - Start with base score of 300
    - Add points for each positive signal
    - Use weighted approach for fairness
    - Return score clamped to 300-850
    
    ARGS:
        features (np.array): Feature vector [balance_eth, tx_count, has_social, loan_inr, domain_age]
        social_media (dict): Social media data for bonus calculation
        price_data (dict): Price data for loan size assessment
    
    RETURNS:
        int: Credit score 300-850
    
    SCORING WEIGHTS:
    - ETH Balance (max 150 points):
        > 10 ETH: +150
        > 1 ETH: +100
        > 0.1 ETH: +50
    
    - Transaction History (max 150 points):
        tx_count * 2, capped at 150
    
    - Social Media (max 100 points):
        Linked: +100
        Not linked: +0
    
    - Loan Size (max 100 points):
        < ₹1 Lakh: +100 (manageable)
        < ₹5 Lakh: +50
        > ₹5 Lakh: +0 (higher risk)
    
    - Domain Age (max 100 points):
        1 point per 30 days, capped at 100
    """
    # TODO: Implement rule-based scoring
    # HINT: Parse features array for each component
    # HINT: Use min/max to cap scores
    pass
```

### Testing Criteria Phase 5
- [ ] extract_features returns correct numpy array shape
- [ ] rule_based_credit_score produces scores in 300-850 range
- [ ] High balance + social media = score > 700
- [ ] Low balance + no social = score < 500
- [ ] ML model loads if file exists
- [ ] Graceful fallback to rule-based if no model

---

## PHASE 6: BLOCKCHAIN TRANSACTION SUBMISSION

### Context
Implement transaction signing and submission to fulfill loan requests on-chain [web:133][web:134][web:139].

### File: `oracle.py` (continued)

#### Function Skeleton 6.1: Transaction Builder

```python
# ============= BLOCKCHAIN INTERACTION =============

def build_fulfill_transaction(contract, oracle_account, request_id, credit_score, interest_rate, approved):
    """
    Build transaction to fulfill loan request on-chain
    
    REQUIREMENTS:
    - Convert interest rate to basis points (12.5% -> 1250)
    - Build transaction using contract.functions
    - Set gas limit (300,000 for safety)
    - Get current gas price from network
    - Get nonce for oracle account
    - Return unsigned transaction dictionary
    
    ARGS:
        contract (Contract): Lending contract instance
        oracle_account (Account): Oracle's account
        request_id (bytes): Request ID from event
        credit_score (int): Computed credit score 300-850
        interest_rate (float): Interest rate percentage (e.g., 12.5)
        approved (bool): Whether loan is approved
    
    RETURNS:
        dict: Unsigned transaction ready for signing
    
    TRANSACTION FIELDS:
        - from: oracle_account.address
        - nonce: Current nonce from network
        - gas: 300000
        - gasPrice: Current network gas price
        - chainId: Auto-detected from web3
    
    VALIDATION:
    - Ensure credit_score in range 300-850
    - Ensure interest_rate < 100.0
    - Convert floats to integers for Solidity
    """
    # TODO: Implement transaction building
    # HINT: interest_bps = int(interest_rate * 100)
    # HINT: contract.functions.fulfillLoanRequest(...).build_transaction({...})
    pass

def sign_and_send_transaction(w3, account, transaction):
    """
    Sign transaction with oracle private key and broadcast
    
    REQUIREMENTS:
    - Sign transaction using account
    - Send raw transaction to network
    - Wait for transaction receipt
    - Return receipt with block number and gas used
    
    ARGS:
        w3 (Web3): Web3 instance
        account (Account): Oracle account with private key
        transaction (dict): Unsigned transaction
    
    RETURNS:
        dict: Transaction receipt from blockchain
    
    RECEIPT FIELDS:
        - transactionHash: Transaction hash
        - blockNumber: Block where tx was mined
        - gasUsed: Actual gas consumed
        - status: 1 for success, 0 for revert
    
    ERROR HANDLING:
    - Raise exception if transaction reverts (status = 0)
    - Include revert reason if available
    - Timeout after 120 seconds waiting for receipt
    """
    # TODO: Implement signing and sending
    # HINT: signed_txn = account.sign_transaction(transaction)
    # HINT: tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    # HINT: receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    pass
```

#### Function Skeleton 6.2: Fulfillment Wrapper

```python
def fulfill_loan_request(w3, contract, oracle_account, request_id, credit_score, interest_rate, approved):
    """
    Complete fulfillment workflow: build, sign, send, wait
    
    REQUIREMENTS:
    - Log fulfillment attempt details
    - Build transaction
    - Sign and send transaction
    - Wait for confirmation
    - Log success with block number and gas
    - Return transaction receipt
    
    ARGS:
        w3 (Web3): Web3 instance
        contract (Contract): Lending contract
        oracle_account (Account): Oracle account
        request_id (bytes): Loan request ID
        credit_score (int): Credit score 300-850
        interest_rate (float): Interest percentage
        approved (bool): Approval decision
    
    RETURNS:
        dict: Transaction receipt
    
    LOGS:
        - Request ID (hex)
        - Credit score
        - Interest rate
        - Approval status
        - Transaction hash
        - Block number
        - Gas used
    
    ERROR HANDLING:
    - Catch and log transaction errors
    - Return None on failure
    - Print clear error messages for debugging
    """
    # TODO: Implement fulfillment wrapper
    print("\n📤 Sending result to blockchain...")
    print(f"   Credit Score: {credit_score}")
    print(f"   Interest Rate: {interest_rate}%")
    print(f"   Approved: {approved}")
    
    try:
        # TODO: Build transaction
        # TODO: Sign and send
        # TODO: Log success
        pass
    except Exception as e:
        print(f"❌ Error fulfilling request: {e}")
        return None
```

### Testing Criteria Phase 6
- [ ] Transaction builds with correct parameters
- [ ] Interest rate converts to basis points correctly
- [ ] Transaction signs successfully
- [ ] Transaction sends and gets mined
- [ ] Receipt contains blockNumber and gasUsed
- [ ] Error handling catches revert reasons

---

## PHASE 7: MAIN ORCHESTRATION & EVENT PROCESSING

### Context
Tie everything together into the main event processing loop that coordinates all phases [web:121][web:133][web:134].

### File: `oracle.py` (continued)

#### Function Skeleton 7.1: Event Processor

```python
# ============= MAIN PROCESSING =============

def process_loan_request(w3, contract, oracle_account, event, model=None):
    """
    Main workflow: process loan request event end-to-end
    
    REQUIREMENTS:
    - Extract event parameters
    - Perform off-chain validations
    - Calculate credit score with AI
    - Determine approval and interest rate
    - Fulfill request on blockchain
    - Log complete workflow
    
    ARGS:
        w3 (Web3): Web3 instance
        contract (Contract): Lending contract
        oracle_account (Account): Oracle account
        event (AttributeDict): LoanRequested event data
        model (object|None): ML model if available
    
    WORKFLOW:
        1. Parse event data (requestId, borrower, amount, ensName)
        2. Check social media links
        3. Get ETH/INR price
        4. Calculate credit score
        5. Determine approval based on score:
           - >= 700: Approved, interest - 2%
           - >= 600: Approved, base interest
           - >= 500: Approved, interest + 2%
           - < 500: Rejected
        6. Fulfill request on-chain
        7. Log completion
    
    APPROVAL LOGIC:
        if credit_score >= 700:
            approved = True
            interest = base_interest - 2.0
        elif credit_score >= 600:
            approved = True
            interest = base_interest
        elif credit_score >= 500:
            approved = True
            interest = base_interest + 2.0
        else:
            approved = False
            interest = base_interest + 5.0
    
    LOGGING:
        - Request header with separator
        - All event parameters
        - Each processing step
        - Final decision
        - Transaction confirmation
        - Completion message
    """
    # TODO: Implement main processing workflow
    print("\n" + "="*60)
    print("🎯 PROCESSING LOAN REQUEST")
    print("="*60)
    
    # STEP 1: Parse event
    # TODO: Extract args from event['args']
    
    # STEP 2: Off-chain validation
    # TODO: Call check_social_media_links()
    # TODO: Call get_eth_to_inr_price()
    
    # STEP 3: AI scoring
    # TODO: Call calculate_credit_score()
    
    # STEP 4: Approval logic
    # TODO: Implement tiered approval system
    
    # STEP 5: Fulfill on-chain
    # TODO: Call fulfill_loan_request()
    
    # STEP 6: Log completion
    print("\n🎉 Processing complete!")
    print("="*60 + "\n")
```

#### Function Skeleton 7.2: Main Entry Point

```python
def main():
    """
    Main entry point - start oracle and listen for events
    
    REQUIREMENTS:
    - Print startup banner with configuration
    - Create event filter for LoanRequested
    - Start polling loop
    - Handle KeyboardInterrupt gracefully
    - Log all errors and continue running
    
    STARTUP BANNER:
        - Oracle address
        - Contract address
        - Network/chain ID
        - ML model status
        - Listening message
    
    ERROR HANDLING:
        - Catch all exceptions in event processing
        - Log errors but don't crash oracle
        - Allow Ctrl+C to exit cleanly
    """
    print("="*60)
    print("🔮 PYTHON ORACLE STARTED")
    print("="*60)
    print(f"Oracle Address: {oracle_account.address}")
    print(f"Contract Address: {config['contract_address']}")
    print(f"Network Chain ID: {w3.eth.chain_id}")
    print(f"ML Model: {'Loaded' if credit_model else 'Rule-based fallback'}")
    print("="*60)
    print("\n👂 Listening for LoanRequested events...\n")
    
    # TODO: Create event filter
    # TODO: Define callback that calls process_loan_request
    # TODO: Start polling with error handling
    pass

if __name__ == "__main__":
    main()
```

### Testing Criteria Phase 7
- [ ] Oracle starts and prints configuration
- [ ] Event listener detects LoanRequested events
- [ ] Complete workflow executes for test event
- [ ] Credit score calculated correctly
- [ ] Transaction sent to blockchain
- [ ] Loan status updates on contract
- [ ] Oracle continues running after processing
- [ ] Graceful shutdown on Ctrl+C

---

## DEPLOYMENT CHECKLIST

### Smart Contract Deployment

```bash
# Using Remix IDE
1. Compile LendingOracle.sol with Solidity 0.8.20
2. Deploy to Sepolia testnet
3. Constructor param: ENS Registry = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
4. Copy deployed contract address
5. Call setOracleAddress() with your Python oracle address
```

### Oracle Deployment

```bash
# Create .env file
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_oracle_private_key_here
CONTRACT_ADDRESS=deployed_contract_address_here

# Install dependencies
pip install web3 python-dotenv requests scikit-learn numpy

# Run oracle
python oracle.py
```

### Testing Flow

```bash
# In Remix, call requestLoan:
requestLoan("yourdomain.eth", 1000000000000000000)  # 1 ETH

# Watch oracle console for:
# ✅ Event detected
# ✅ Social media check
# ✅ Price fetch
# ✅ Credit score calculation
# ✅ Transaction sent
# ✅ Confirmation received

# Verify on contract:
getLoanRequest(requestId)
# Should show: processed=true, creditScore>0, approved=true/false
```

---

## SUCCESS CRITERIA

Your implementation is complete when:

- [ ] Smart contract deploys without errors
- [ ] All on-chain validations work correctly
- [ ] Events emit with correct parameters
- [ ] Oracle connects to blockchain
- [ ] Social media check executes (mock or real)
- [ ] Price API call succeeds
- [ ] Credit score calculates in 300-850 range
- [ ] Transactions sign and send successfully
- [ ] Contract state updates after fulfillment
- [ ] End-to-end loan flow completes
- [ ] Error handling prevents crashes
- [ ] Logging provides clear visibility

---

## ADVANCED FEATURES (OPTIONAL)

After core implementation, consider:

1. **Real ENS Text Record Queries**
   ```python
   from ens import ENS
   ns = ENS.fromWeb3(w3)
   twitter = ns.resolver('vitalik.eth').text('com.twitter')
   ```

2. **Train Actual ML Model**
   ```python
   from sklearn.ensemble import RandomForestClassifier
   # Collect historical loan data
   # Train model on repayment outcomes
   # Save with pickle for production use
   ```

3. **Multi-Oracle Consensus**
   - Deploy multiple oracle instances
   - Require 2-of-3 agreement on credit scores
   - Prevents single point of failure

4. **Chainlink Functions Integration**
   - Replace custom oracle with Chainlink network
   - Decentralized execution of scoring logic

5. **Frontend DApp**
   - React + ethers.js UI
   - Connect wallet
   - Apply for loans
   - View loan status

---

## DEBUGGING TIPS

### Common Issues

**"ENS domain not registered"**
- Use a real ENS domain for testing (e.g., vitalik.eth)
- Or register a test domain on Sepolia

**"Insufficient ETH balance"**
- Send >= 0.01 ETH to borrower address on Sepolia
- Get testnet ETH from faucet

**"Transaction reverts"**
- Check gas limit is sufficient (300,000)
- Verify oracle address is authorized
- Check requestId hasn't been processed already

**"Oracle not detecting events"**
- Verify RPC URL is correct
- Check contract address matches deployed contract
- Ensure events are emitting (check on Etherscan)
- Try fromBlock='latest' vs specific block number

**"API calls fail"**
- CoinGecko rate limits: Use fallback values
- Check internet connection
- Add timeout to requests.get()

---

## ARCHITECTURE DECISIONS EXPLAINED

### Why Web3.py over Node.js?
- Python has superior ML ecosystem (scikit-learn, PyTorch, TensorFlow) [web:111]
- Single language for entire oracle (no microservices needed)
- Simpler deployment and debugging
- web3.py is production-ready and widely used [web:108]

### Why Off-Chain Computation?
- Querying APIs from Solidity is impossible (no outbound calls) [web:40][web:50]
- Complex calculations (ML models) cost 500k-1M gas on-chain [web:54]
- Off-chain is free, only pay gas for final result submission [web:40]

### Why Events Over Direct Calls?
- Events are cheap to emit (375 gas + 8 gas/byte) [web:60]
- Oracles can efficiently filter events by contract [web:63]
- Decouples smart contract from oracle infrastructure [web:70]

### Why Credit Score Range 300-850?
- Familiar to users (matches FICO scores)
- Allows nuanced risk assessment
- Easy to translate to approval tiers [web:55]

---

## SECURITY CONSIDERATIONS

1. **Oracle Authorization**: Only authorized address can fulfill requests
2. **Double-Processing Prevention**: Check `processed` flag before fulfilling
3. **Input Validation**: Validate credit score and interest rate ranges
4. **Private Key Security**: Never log or commit private keys
5. **Gas Limits**: Cap gas to prevent runaway transactions
6. **Error Handling**: Fail gracefully without exposing sensitive data

---

## RESOURCES

- **Solidity Docs**: https://docs.soliditylang.org/
- **web3.py Docs**: https://web3py.readthedocs.io/
- **ENS Docs**: https://docs.ens.domains/
- **CoinGecko API**: https://www.coingecko.com/en/api
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Remix IDE**: https://remix.ethereum.org/

---

## CONCLUSION

This specification provides complete function signatures, requirements, and implementation guidance. Follow each phase sequentially, test thoroughly, and refer to the architecture diagram when confused about component interaction [web:121][web:133][web:134].

**Key Principles:**
- Specificity leads to better results [web:134][web:136][web:137]
- Break complex tasks into phases [web:143]
- Validate at every step [web:133]
- Handle errors gracefully [web:139]
- Log generously for debugging [web:145]

**Remember**: You're not just coding—you're orchestrating trust between blockchain immutability and AI intelligence [web:133]. Every function is a critical piece of that bridge.

Good luck! 🚀
```

This markdown file synthesizes best practices from:
- **Anthropic**: Progressive disclosure, structured prompts with XML/Markdown, specific instructions, context engineering[2][3][4][6]
- **GitHub Copilot**: Single/specific/short/surround framework, clear comments, function signatures[7][8][9][10]
- **Google Gemini**: Structured outputs, persona/task/context/format framework[5][11][12]

The structure uses:
✅ Clear phase separation[9][1]
✅ Explicit function skeletons with types[7][9]
✅ Detailed requirements in plain language[3][4]
✅ TODO comments for AI guidance[13][7]
✅ Testing criteria for validation[1][2]
✅ Security considerations[14][2]
✅ Error handling patterns[10][14]

Sources
[1] Google, Anthropic, and OpenAI's Guides to AI Agents ALL in 18 ... https://www.youtube.com/watch?v=TlbcAphLGSc
[2] Building Effective AI Agents - Anthropic https://www.anthropic.com/research/building-effective-agents
[3] Effective context engineering for AI agents - Anthropic https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[4] Best practices for agentic coding https://www.rivista.ai/wp-content/uploads/2025/05/1746131911005.pdf
[5] Prompt design strategies | Gemini API https://ai.google.dev/gemini-api/docs/prompting-strategies
[6] Claude Code Best Practices \ Anthropic https://www.anthropic.com/engineering/claude-code-best-practices?curius=2107
[7] Prompt Engineering Tips with GitHub Copilot - GeeksforGeeks https://www.geeksforgeeks.org/git/prompt-engineering-tips-with-github-copilot/
[8] Writing Effective Prompts https://xebia.com/blog/microsoft-services-startup-guide-to-prompt-engineering-using-github-copilot/
[9] Prompt Engineering for GitHub Copilot: Writing Effective ... https://skywork.ai/blog/agent/prompt-engineering-for-github-copilot-writing-effective-ai-instructions/
[10] GitHub Copilot Prompt Engineering - Tutorials Dojo https://tutorialsdojo.com/github-copilot-prompt-engineering/
[11] Crafting Effective Prompts for Gemini & All LLMs - Ep 009 - YouTube https://www.youtube.com/watch?v=D9dkJKnRMjc
[12] GitHub - danielrosehill/Structured-Gemini-Prompts: A couple of examples of using Gemini 2.5 with structured outputs in Google AI Studio in order to conduct document analysis. https://github.com/danielrosehill/Structured-Gemini-Prompts
[13] 5 Copilot Prompts That Make Programming Easier (Step-by-Step) https://www.youtube.com/watch?v=zi1OcDmRqi8
[14] Claude Agent SDK Best Practices for AI Agent Development (2025) https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/
[15] The complete guide to Agent Skills - YouTube https://www.youtube.com/watch?v=fabAI1OKKww
[16] Tips for building AI agents - YouTube https://www.youtube.com/watch?v=LP5OCa20Zpg
[17] Claude Code best practices | Code w - YouTube https://www.youtube.com/watch?v=gv0WHhKelSE
[18] Learn to equip AI agents with reusable skills - YouTube https://www.youtube.com/watch?v=qD_5iCe1s1E
[19] How to Use Prompt Files in GitHub Copilot VS Code - YouTube https://www.youtube.com/watch?v=nNiDplJqU6w
[20] Gemini LLM JSON Mode: Generate Structured Output from LLM https://www.youtube.com/watch?v=zzKFWwVEQEM
[21] Claude Agent SDK [Full Workshop] — Thariq Shihipar, Anthropic https://www.youtube.com/watch?v=TqC1qOfiVcQ
[22] Building Multi-modal LLMs Applications with Google's Gemini https://www.youtube.com/watch?v=tgKPj1PyovE
[23] Build Specialized Claude Agents (Complete Tutorial) - YouTube https://www.youtube.com/watch?v=WbGSkKrq0Bs
[24] GitHub Copilot deep dive: Model selection, prompting ... - YouTube https://www.youtube.com/watch?v=0Oz-WQi51aU
[25] Anthropic Reveals How to Prompt Claude Code 10x Better - YouTube https://www.youtube.com/watch?v=pb0lVGDiigI
[26] Prompt Engineering with GitHub Copilot - YouTube https://www.youtube.com/watch?v=yduxrQkqlxg
[27] Anthropic's Guide to Claude Code: Best Practices for Agentic Coding https://www.reddit.com/r/ClaudeAI/comments/1k5slll/anthropics_guide_to_claude_code_best_practices/
[28] Generate structured output with the Gemini API | Google AI for Developers https://ai.google.dev/gemini-api/docs/structured-output?lang=node
[29] Code execution with MCP: building more efficient AI agents - Anthropic https://www.anthropic.com/engineering/code-execution-with-mcp
