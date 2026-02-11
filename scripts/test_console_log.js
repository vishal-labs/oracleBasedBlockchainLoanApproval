import hre from "hardhat";

async function main() {
    console.log("Testing if console.log works in LendingOracle...\n");

    const lendingOracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", lendingOracleAddress);

    const userWallet = "0x6851e28f83d0bdba3e778146c79eb73f5b053229";

    // Test with NO ENS (should work)
    console.log("Test 1: Request loan with NO ENS name...");
    try {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [userWallet],
        });

        const userSigner = await hre.ethers.getSigner(userWallet);
        const tx = await lendingOracle.connect(userSigner).requestLoan("", hre.ethers.parseEther("1.0"));
        await tx.wait();
        console.log("✅ Success - no ENS name worked\n");

        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [userWallet],
        });
    } catch (e) {
        console.error("❌ Failed:", e.message, "\n");
    }

    // Test with vishal.eth
    console.log("Test 2: Request loan with vishal.eth...");
    console.log("(Watch for console.log output from contract)\n");
    try {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [userWallet],
        });

        const userSigner = await hre.ethers.getSigner(userWallet);
        const tx = await lendingOracle.connect(userSigner).requestLoan("vishal.eth", hre.ethers.parseEther("1.0"));
        await tx.wait();
        console.log("✅ Success - vishal.eth worked!\n");

        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [userWallet],
        });
    } catch (e) {
        console.error("❌ Failed:", e.message, "\n");
        console.error("No console.log output shown = console.log not working OR transaction failed before reaching validateENS");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
