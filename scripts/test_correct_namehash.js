import hre from "hardhat";

/**
 * PROPER ENS NAMEHASH IMPLEMENTATION
 * Matches the algorithm in LendingOracle.sol
 */

function namehash(name) {
    if (name === '') {
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }

    let node = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const labels = name.split('.').reverse();

    for (const label of labels) {
        const labelHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(label));
        node = hre.ethers.keccak256(hre.ethers.concat([node, labelHash]));
    }

    return node;
}

async function main() {
    console.log("🔍 Testing ENS Namehash Algorithm\n");

    // Test namehash calculation
    const testNames = ["vishal.eth", "vitalik.eth", "test.eth", "testuser.eth"];

    console.log("JavaScript namehash results:");
    for (const name of testNames) {
        const hash = namehash(name);
        console.log(`${name} → ${hash}`);
    }

    //Compare with contract's namehash
    console.log("\n✅ Now testing actual registration and loan request...\n");

    const ensAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const resolverAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const lendingOracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    const mockENS = await hre.ethers.getContractAt("MockENS", ensAddress);
    const mockResolver = await hre.ethers.getContractAt("MockResolver", resolverAddress);
    const lendingOracle = await hre.ethers.getContractAt("LendingOracle", lendingOracleAddress);

    const [deployer] = await hre.ethers.getSigners();
    const userWallet = "0x6851e28f83d0bdba3e778146c79eb73f5b053229";

    // Register alice.eth with CORRECT namehash
    const testENS = "alice.eth";
    const correctNode = namehash(testENS);

    console.log(`Registering ${testENS} with CORRECT namehash...`);
    console.log(`Node: ${correctNode}\n`);

    const tx1 = await mockENS.setResolver(correctNode, resolverAddress);
    await tx1.wait();

    const tx2 = await mockResolver.setAddr(correctNode, userWallet);
    await tx2.wait();

    const tx3 = await mockResolver.setText(correctNode, "com.twitter", "https://twitter.com/alice");
    await tx3.wait();
    const tx4 = await mockResolver.setText(correctNode, "com.github", "https://github.com/alice");
    await tx4.wait();

    console.log("✅ Registered alice.eth");

    // Verify
    const storedAddr = await mockResolver.addr(correctNode);
    console.log(`Verified: ${testENS} → ${storedAddr}\n`);

    //Now test loan request
    console.log("Testing loan request with alice.eth...");

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [userWallet],
    });

    const userSigner = await hre.ethers.getSigner(userWallet);

    try {
        const tx = await lendingOracle.connect(userSigner).requestLoan(testENS, hre.ethers.parseEther("20.0"));
        await tx.wait();
        console.log("🎉 SUCCESS! Loan request with alice.eth worked!\n");
    } catch (error) {
        console.error("❌ FAILED:", error.message, "\n");
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
