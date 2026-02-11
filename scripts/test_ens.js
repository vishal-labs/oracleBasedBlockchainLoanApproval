import hre from "hardhat";

/**
 * Test ENS registration and validation
 */

async function main() {
    console.log("🧪 Testing ENS Registration & Validation\n");

    const ensAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const resolverAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const lendingOracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    const mockENS = await hre.ethers.getContractAt("MockENS", ensAddress);
    const mockResolver = await hre.ethers.getContractAt("MockResolver", resolverAddress);
    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", lendingOracleAddress);

    const [deployer] = await hre.ethers.getSigners();
    const userWallet = "0x6851e28f83d0bdba3e778146c79eb73f5b053229";

    const namehash = (name) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(name));

    console.log("📋 Contract Addresses:");
    console.log(`   MockENS: ${ensAddress}`);
    console.log(`   MockResolver: ${resolverAddress}`);
    console.log(`   LendingOracle: ${lendingOracleAddress}`);
    console.log(`   User Wallet: ${userWallet}\n`);

    // Test 1: Check if vishal.eth is registered
    console.log("TEST 1: Checking vishal.eth registration");
    const vishalNode = namehash("vishal.eth");
    console.log(`   Node hash: ${vishalNode}`);

    const vishalResolver = await mockENS.resolver(vishalNode);
    console.log(`   Resolver: ${vishalResolver}`);

    if (vishalResolver === hre.ethers.ZeroAddress) {
        console.log("   ❌ No resolver set for vishal.eth!");
    } else {
        const vishalAddr = await mockResolver.addr(vishalNode);
        console.log(`   Address: ${vishalAddr}`);
        console.log(`   ${vishalAddr === userWallet ? "✅" : "❌"} Points to user wallet`);

        // Check social media
        const twitter = await mockResolver.text(vishalNode, "com.twitter");
        const github = await mockResolver.text(vishalNode, "com.github");
        console.log(`   Twitter: ${twitter || "NOT SET"}`);
        console.log(`   GitHub: ${github || "NOT SET"}`);
    }

    // Test 2: Try to validate ENS using LendingOracle contract
    console.log("\nTEST 2: Validating vishal.eth via LendingOracle");
    try {
        // We need to call the internal validateENS function
        // Let's try requesting a loan and see what happens

        // Impersonate user wallet
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [userWallet],
        });

        const userSigner = await hre.ethers.getSigner(userWallet);

        console.log("   Attempting loan request with vishal.eth...");
        const tx = await lendingOracle.connect(userSigner).requestLoan("vishal.eth", hre.ethers.parseEther("1.0"));
        await tx.wait();
        console.log("   ✅ Loan request succeeded with vishal.eth!");

        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [userWallet],
        });
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);

        // Let's manually register it
        console.log("\n🔧 ATTEMPTING TO REGISTER vishal.eth...");
        try {
            const tx1 = await mockENS.setResolver(vishalNode, resolverAddress);
            await tx1.wait();
            console.log("   ✅ Resolver set");

            const tx2 = await mockResolver.setAddr(vishalNode, userWallet);
            await tx2.wait();
            console.log("   ✅ Address set");

            const tx3 = await mockResolver.setText(vishalNode, "com.twitter", "https://twitter.com/vishal");
            await tx3.wait();
            const tx4 = await mockResolver.setText(vishalNode, "com.github", "https://github.com/vishal");
            await tx4.wait();
            console.log("   ✅ Social media set");

            console.log("\n   Trying loan request again...");
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [userWallet],
            });

            const userSigner2 = await hre.ethers.getSigner(userWallet);
            const tx = await lendingOracle.connect(userSigner2).requestLoan("vishal.eth", hre.ethers.parseEther("1.0"));
            await tx.wait();
            console.log("   ✅ Loan request now works!");

            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [userWallet],
            });
        } catch (e) {
            console.error("   ❌ Still failed:", e.message);
        }
    }

    // Test 3: Uniqueness - try to register same ENS to different address
    console.log("\nTEST 3: Testing ENS uniqueness");
    const differentAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    try {
        console.log(`   Attempting to point vishal.eth to ${differentAddr}...`);
        const tx = await mockResolver.setAddr(vishalNode, differentAddr);
        await tx.wait();

        const newAddr = await mockResolver.addr(vishalNode);
        console.log(`   ⚠️  ENS now points to: ${newAddr}`);
        console.log(`   ⚠️  WARNING: ENS can be reassigned! Not truly unique per design.`);
    } catch (e) {
        console.log(`   ✅ Cannot reassign (uniqueness enforced)`);
    }

    console.log("\n✅ Tests complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
