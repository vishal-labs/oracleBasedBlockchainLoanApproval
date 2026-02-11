import hre from "hardhat";

async function main() {
    console.log("🔍 Direct MockResolver Test\n");

    const resolverAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const mockResolver = await hre.ethers.getContractAt("MockResolver", resolverAddress);

    const namehash = (name) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(name));

    const vishalNode = namehash("vishal.eth");
    console.log(`vishal.eth node: ${vishalNode}`);

    // Check what's stored
    console.log("\n📝 Checking stored data:");
    const storedAddr = await mockResolver.addr(vishalNode);
    console.log(`   addr(node): ${storedAddr}`);

    const storedTwitter = await mockResolver.text(vishalNode, "com.twitter");
    console.log(`   text(node, "com.twitter"): ${storedTwitter}`);

    // Check using addrs mapping directly
    console.log("\n📝 Checking public mapping:");
    const directAddr = await mockResolver.addrs(vishalNode);
    console.log(`   addrs[node]: ${directAddr}`);

    if (storedAddr === hre.ethers.ZeroAddress) {
        console.log("\n❌ PROBLEM: addr() returns zero address even though public mapping shows data!");
        console.log("   This suggests the addr() function might not be working correctly.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
