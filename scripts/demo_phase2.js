import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("🚀 Starting Phase 2 Interaction/Demo Script...\n");

    const [deployer, borrower] = await ethers.getSigners();
    console.log("Acting as Oracle (Deployer):", deployer.address);
    console.log("Acting as Borrower:", borrower.address);

    // 1. Deploy Mocks
    console.log("\n1️⃣  Deploying Mocks...");
    const MockENS = await ethers.getContractFactory("MockENS");
    const mockENS = await MockENS.deploy();
    await mockENS.waitForDeployment();
    const MockResolver = await ethers.getContractFactory("MockResolver");
    const mockResolver = await MockResolver.deploy();
    await mockResolver.waitForDeployment();
    console.log("   MockENS deployed at:", await mockENS.getAddress());

    // 2. Deploy LendingOracle
    console.log("\n2️⃣  Deploying LendingOracle...");
    const LendingOracle = await ethers.getContractFactory("LendingOracle");
    const lendingOracle = await LendingOracle.deploy(await mockENS.getAddress());
    await lendingOracle.waitForDeployment();
    console.log("   LendingOracle deployed at:", await lendingOracle.getAddress());

    // 3. Setup ENS for Borrower
    console.log("\n3️⃣  Setting up ENS for borrower...");
    const ensName = "demo.eth";
    const namehash = ethers.namehash(ensName);
    await mockENS.setResolver(namehash, await mockResolver.getAddress());
    await mockResolver.setAddr(namehash, borrower.address);
    console.log(`   Registered ${ensName} -> ${borrower.address}`);

    // 4. Request Loan
    console.log("\n4️⃣  Borrower requesting loan...");
    const loanAmount = ethers.parseEther("5.0"); // 5 ETH
    const tx = await lendingOracle.connect(borrower).requestLoan(ensName, loanAmount);
    const receipt = await tx.wait();

    // Find event
    const log = receipt.logs.find(x => x.fragment && x.fragment.name === 'LoanRequested');
    const requestId = log.args[0];
    console.log(`   ✅ Loan Requested! ID: ${requestId}`);

    // 5. Oracle Fulfills Request
    console.log("\n5️⃣  Oracle fulfilling request...");
    const creditScore = 780;
    const interestRateBPS = 450; // 4.5%
    const isApproved = true;

    console.log(`   Processing: Score=${creditScore}, Rate=${interestRateBPS / 100}%, Approved=${isApproved}`);

    const fulfillTx = await lendingOracle.connect(deployer).fulfillLoanRequest(
        requestId,
        creditScore,
        interestRateBPS,
        isApproved
    );
    const fulfillReceipt = await fulfillTx.wait();

    console.log("\n6️⃣  Events Emitted:");
    fulfillReceipt.logs.forEach(log => {
        if (log.fragment) {
            console.log(`   🔸 ${log.fragment.name}`);
            if (log.fragment.name === 'LoanExecuted') {
                console.log(`      Term: Total Repayment ${ethers.formatEther(log.args[2])} ETH`);
            }
        }
    });

    // 6. Verify State
    const finalRequest = await lendingOracle.getLoanRequest(requestId);
    console.log("\n7️⃣  Final Loan State:");
    console.log(`   Processed: ${finalRequest.processed}`);
    console.log(`   Credit Score: ${finalRequest.creditScore}`);
    console.log(`   Approved: ${finalRequest.approved}`);

    console.log("\n✅ Demo Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
