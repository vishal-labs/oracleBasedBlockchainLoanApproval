import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Using account:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

    // Address from latest run_system.sh output or .env
    const lendingOracleAddress = process.env.CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    console.log("Connecting to LendingOracle at:", lendingOracleAddress);

    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", lendingOracleAddress);

    try {
        console.log("Attempting requestLoan('', 1 ETH)...");
        // Simulate execution to catch revert reason without sending tx first
        await lendingOracle.requestLoan.staticCall("", hre.ethers.parseEther("1.0"));
        console.log("Static call successful. Sending transaction...");

        const tx = await lendingOracle.requestLoan("", hre.ethers.parseEther("1.0"));
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");
        console.log("Gas Used:", receipt.gasUsed.toString());
        console.log("Effective Gas Price:", receipt.effectiveGasPrice.toString());
    } catch (error) {
        console.error("\n❌ TRANSACTION FAILED");
        console.error("Reason:", error.reason || error.message);
        if (error.data) console.error("Data:", error.data);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
