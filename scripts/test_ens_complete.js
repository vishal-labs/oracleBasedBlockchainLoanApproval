import hre from "hardhat";

/**
 * COMPREHENSIVE ENS + LOAN TEST
 * Tests the complete flow from ENS registration to loan request
 */

async function main() {
    console.log("🧪 COMPREHENSIVE ENS + LOAN REQUEST TEST\n");
    console.log("=".repeat(60));

    const ensAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const resolverAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const lendingOracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    const mockENS = await hre.ethers.getContractAt("MockENS", ensAddress);
    const mockResolver = await hre.ethers.getContractAt("MockResolver", resolverAddress);
    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", lendingOracleAddress);

    const [deployer] = await hre.ethers.getSigners();
    const userWallet = "0x6851e28f83d0bdba3e778146c79eb73f5b053229";

    const namehash = (name) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(name));

    console.log("\n📋 SETUP:");
    console.log(`   User Wallet: ${userWallet}`);
    console.log(`   User Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(userWallet))} ETH`);

    // TEST 1: Register new ENS name
    console.log("\n" + "=".repeat(60));
    console.log("TEST 1: Register testuser.eth to user wallet");
    console.log("=".repeat(60));

    const testENS = "testuser.eth";
    const testNode = namehash(testENS);

    try {
        console.log(`Registering ${testENS}...`);

        const tx1 = await mockENS.setResolver(testNode, resolverAddress);
        await tx1.wait();
        console.log("✅ Step 1: Resolver set");

        const tx2 = await mockResolver.setAddr(testNode, userWallet);
        await tx2.wait();
        console.log("✅ Step 2: Address set to user wallet");

        const tx3 = await mockResolver.setText(testNode, "com.twitter", "https://twitter.com/testuser");
        await tx3.wait();
        const tx4 = await mockResolver.setText(testNode, "com.github", "https://github.com/testuser");
        await tx4.wait();
        console.log("✅ Step 3: Social media records added");

        // Verify registration
        const resolvedAddr = await mockResolver.addr(testNode);
        console.log(`\n✅ VERIFICATION: ${testENS} → ${resolvedAddr}`);
        console.log(`   Matches user wallet: ${resolvedAddr.toLowerCase() === userWallet.toLowerCase()}`);

    } catch (error) {
        console.error(`❌ Registration failed: ${error.message}`);
        return;
    }

    // TEST 2: Request loan with registered ENS
    console.log("\n" + "=".repeat(60));
    console.log("TEST 2: Request 20 ETH loan with testuser.eth");
    console.log("=".repeat(60));

    try {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [userWallet],
        });

        const userSigner = await hre.ethers.getSigner(userWallet);

        console.log(`Requesting loan from ${userWallet}...`);
        console.log(`   ENS Name: ${testENS}`);
        console.log(`   Amount: 20 ETH`);

        const tx = await lendingOracle.connect(userSigner).requestLoan(testENS, hre.ethers.parseEther("20.0"));
        const receipt = await tx.wait();

        console.log(`\n✅ LOAN REQUEST SUCCESSFUL!`);
        console.log(`   Transaction: ${receipt.hash}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [userWallet],
        });

    } catch (error) {
        console.error(`\n❌ LOAN REQUEST FAILED!`);
        console.error(`   Error: ${error.message}`);

        if (error.message.includes("ENS domain not registered")) {
            console.error(`\n🔍 DEBUG: ENS validation failed in contract`);
            console.error(`   This means validateENS() is not finding the registration`);

            // Debug: Check what the contract sees
            console.error(`\n   Checking contract's view:`);
            const resolverFromENS = await mockENS.resolver(testNode);
            console.error(`   - MockENS.resolver(node): ${resolverFromENS}`);

            if (resolverFromENS !== hre.ethers.ZeroAddress) {
                const addrFromResolver = await mockResolver.addr(testNode);
                console.error(`   - MockResolver.addr(node): ${addrFromResolver}`);
            }
        }

        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [userWallet],
        });
        return;
    }

    // TEST 3: Try to register same ENS to different address (should work but we'll note it)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 3: Try registering testuser.eth to DIFFERENT address");
    console.log("=".repeat(60));

    const randomAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    try {
        console.log(`Attempting to reassign ${testENS} to ${randomAddr}...`);

        const tx = await mockResolver.setAddr(testNode, randomAddr);
        await tx.wait();

        const newAddr = await mockResolver.addr(testNode);
        console.log(`\n⚠️ REASSIGNMENT WORKED!`);
        console.log(`   ${testENS} now points to: ${newAddr}`);
        console.log(`   \n   ⚠️ WARNING: MockResolver allows reassignment by default!`);
        console.log(`   To enforce uniqueness, we'd need access control in MockResolver.`);

    } catch (error) {
        console.log(`\n✅ REASSIGNMENT BLOCKED!`);
        console.log(`   Error: ${error.message}`);
    }

    // TEST 4: Check pre-registered ENS names
    console.log("\n" + "=".repeat(60));
    console.log("TEST 4: Verify pre-registered ENS names from deployment");
    console.log("=".repeat(60));

    const preregistered = ["vishal.eth", "vitalik.eth", "test.eth"];

    for (const name of preregistered) {
        const node = namehash(name);
        const addr = await mockResolver.addr(node);
        const twitter = await mockResolver.text(node, "com.twitter");

        console.log(`\n${name}:`);
        console.log(`   Address: ${addr}`);
        console.log(`   Correct: ${addr.toLowerCase() === userWallet.toLowerCase() ? "✅" : "❌"}`);
        console.log(`   Twitter: ${twitter || "NOT SET"}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST SUITE COMPLETE");
    console.log("=".repeat(60));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
