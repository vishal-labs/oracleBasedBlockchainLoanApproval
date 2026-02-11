import hre from "hardhat";

async function main() {
    console.log("🔍 Debugging wallet state...\n");

    const userWallet = "0x6851e28f83d0bdba3e778146c79eb73f5b053229";
    const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    // Check balance
    const balance = await hre.ethers.provider.getBalance(userWallet);
    console.log(`Wallet: ${userWallet}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log(`Has 0.01 ETH minimum? ${balance >= hre.ethers.parseEther("0.01") ? "✅ YES" : "❌ NO"}`);

    // Check nonce (tx count)
    const nonce = await hre.ethers.provider.getTransactionCount(userWallet);
    console.log(`Transaction count (nonce): ${nonce}`);

    // Try to call requestLoan
    console.log("\n🧪 Testing requestLoan directly...");

    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", contractAddress);

    // Impersonate the user wallet (Hardhat-specific feature)
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [userWallet],
    });

    const userSigner = await hre.ethers.getSigner(userWallet);

    try {
        console.log("Attempting to request 1 ETH loan with no ENS...");
        const tx = await lendingOracle.connect(userSigner).requestLoan("", hre.ethers.parseEther("1.0"));
        console.log("✅ Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Transaction confirmed!");
    } catch (error) {
        console.error("\n❌ Transaction FAILED!");
        console.error("Error:", error.message);

        // Try to extract revert reason
        if (error.data) {
            console.error("Error data:", error.data);
        }

        // Check each validation step manually
        console.log("\n🔍 Manual validation checks:");

        try {
            const hasBalance = balance >= hre.ethers.parseEther("0.01");
            console.log(`1. Balance >= 0.01 ETH: ${hasBalance ? "✅" : "❌"}`);

            const hasHistory = balance > 0 || nonce > 0;
            console.log(`2. Has tx history (balance > 0 || nonce > 0): ${hasHistory ? "✅" : "❌"}`);

        } catch (e) {
            console.error("Validation check error:", e.message);
        }
    }

    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [userWallet],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
