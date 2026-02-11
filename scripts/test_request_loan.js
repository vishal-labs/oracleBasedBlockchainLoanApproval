import hre from "hardhat";

async function main() {
    const [deployer, user] = await hre.ethers.getSigners();

    const lendingOracleAddress = process.env.CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", lendingOracleAddress);

    console.log("Testing with user:", user.address);
    console.log("User balance:", hre.ethers.formatEther(await user.provider.getBalance(user.address)), "ETH");

    // Try to call requestLoan
    try {
        console.log("\n📝 Testing requestLoan with empty ENS...");
        const tx = await lendingOracle.connect(user).requestLoan("", hre.ethers.parseEther("1.0"));
        console.log("✅ Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Success!");
    } catch (error) {
        console.error("\n❌ Transaction failed!");
        console.error("Reason:", error.reason || error.message);

        // Try to decode the revert reason
        if (error.data) {
            console.error("Data:", error.data);
        }

        // Check individual requirements
        console.log("\n🔍 Checking validation conditions:");

        try {
            const balance = await user.provider.getBalance(user.address);
            console.log("Balance check:", hre.ethers.formatEther(balance), "ETH", balance >= hre.ethers.parseEther("0.01") ? "✅" : "❌");
        } catch (e) {
            console.error("Balance check error:", e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
