import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("LendingOracle Phase 2", function () {
    let lendingOracle;
    let mockENS;
    let mockResolver;
    let owner; // deployer & oracle
    let otherAccount;
    let borrower;

    const ensName = "vitalik.eth";
    let requestId;

    beforeEach(async function () {
        [owner, otherAccount, borrower] = await ethers.getSigners();

        // Deploy mocks
        const MockENS = await ethers.getContractFactory("MockENS");
        mockENS = await MockENS.deploy();
        const MockResolver = await ethers.getContractFactory("MockResolver");
        mockResolver = await MockResolver.deploy();

        // Deploy Oracle
        const LendingOracle = await ethers.getContractFactory("LendingOracle");
        lendingOracle = await LendingOracle.deploy(await mockENS.getAddress());

        // Setup ENS
        const namehash = ethers.namehash(ensName);
        await mockENS.setResolver(namehash, await mockResolver.getAddress());
        await mockResolver.setAddr(namehash, borrower.address);

        // Create a request
        const tx = await lendingOracle.connect(borrower).requestLoan(ensName, ethers.parseEther("1.0"));
        const receipt = await tx.wait();

        // Parse logs to get requestId
        // LendingOracle emits LoanRequested(bytes32, address, uint256, string)
        // We can fetch events from the contract
        const filter = lendingOracle.filters.LoanRequested;
        const events = await lendingOracle.queryFilter(filter);
        requestId = events[events.length - 1].args[0];
    });

    it("Should revert if called by non-oracle", async function () {
        await expect(
            lendingOracle.connect(otherAccount).fulfillLoanRequest(requestId, 700, 500, true)
        ).to.be.revertedWith("Only oracle can call");
    });

    it("Should revert if request does not exist", async function () {
        const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
        await expect(
            lendingOracle.fulfillLoanRequest(fakeId, 700, 500, true)
        ).to.be.revertedWith("Request does not exist");
    });

    it("Should revert if score is out of range", async function () {
        await expect(
            lendingOracle.fulfillLoanRequest(requestId, 200, 500, true)
        ).to.be.revertedWith("Credit score out of range");

        await expect(
            lendingOracle.fulfillLoanRequest(requestId, 900, 500, true)
        ).to.be.revertedWith("Credit score out of range");
    });

    it("Should revert if interest rate is too high", async function () {
        await expect(
            lendingOracle.fulfillLoanRequest(requestId, 700, 10001, true)
        ).to.be.revertedWith("Interest rate too high");
    });

    it("Should fulfill request and emit LoanProcessed", async function () {
        await expect(lendingOracle.fulfillLoanRequest(requestId, 750, 500, true))
            .to.emit(lendingOracle, "LoanProcessed")
            .withArgs(requestId, borrower.address, 750, true, 500);

        const req = await lendingOracle.getLoanRequest(requestId);
        expect(req.processed).to.be.true;
        expect(req.creditScore).to.equal(750);
        expect(req.approved).to.be.true;
    });

    it("Should execute loan and emit LoanExecuted if approved", async function () {
        // 1 ETH loan, 5% interest (500 BPS)
        // Interest = 1.0 * 500 / 10000 = 0.05 ETH
        // Total Repayment = 1.05 ETH
        const amount = ethers.parseEther("1.0");
        const interestBPS = 500n;
        const expectedInterest = (amount * interestBPS) / 10000n;
        const expectedTotal = amount + expectedInterest;

        await expect(lendingOracle.fulfillLoanRequest(requestId, 750, interestBPS, true))
            .to.emit(lendingOracle, "LoanExecuted")
            .withArgs(borrower.address, amount, expectedTotal, interestBPS);
    });

    it("Should NOT execute loan if not approved", async function () {
        await expect(lendingOracle.fulfillLoanRequest(requestId, 400, 0, false))
            .to.emit(lendingOracle, "LoanProcessed")
            .withArgs(requestId, borrower.address, 400, false, 0)
            .not.to.emit(lendingOracle, "LoanExecuted");
    });

    it("Should revert if trying to process twice", async function () {
        await lendingOracle.fulfillLoanRequest(requestId, 750, 500, true);
        await expect(
            lendingOracle.fulfillLoanRequest(requestId, 750, 500, true)
        ).to.be.revertedWith("Request already processed");
    });
});
