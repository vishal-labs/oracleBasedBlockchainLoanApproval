import hre from "hardhat";

async function main() {
    console.log("🧪 Testing vishal.eth loan request\n");

    const lendingOracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", lendingOracleAddress);

    const userWallet = "0x6851e28f83d0bdba3e778146c79eb73f5b053229";

    console.log(`User wallet: ${userWallet}`);
    console.log(`Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(userWallet))} ETH\n`);

    // Test vishal.eth
    console.log("Testing loan request with vishal.eth for 20 ETH...");

    try {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [userWallet],
        });

        const userSigner = await hre.ethers.getSigner(userWallet);

        const tx = await lendingOracle.connect(userSigner).requestLoan("vishal.eth", hre.ethers.parseEther("20.0"));
        const receipt = await tx.wait();

        console.log("✅ SUCCESS!");
        console.log(`   TX Hash: ${receipt.hash}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [userWallet],
        });
    } catch (error) {
        console.error("❌ FAILED!");
        console.error(`   Error: ${error.message}`);
        console.error(`\n   Full error:`);
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
