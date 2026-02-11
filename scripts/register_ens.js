import hre from "hardhat";

/**
 * Register ENS names on the local blockchain
 * Usage: npx hardhat run scripts/register_ens.js --network localhost
 */

async function main() {
    const ensAddress = process.env.MOCK_ENS_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const resolverAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // MockResolver address

    const mockENS = await hre.ethers.getContractAt("MockENS", ensAddress);
    const mockResolver = await hre.ethers.getContractAt("MockResolver", resolverAddress);

    // Get deployer account (has permission)
    const [deployer] = await hre.ethers.getSigners();

    console.log("🌐 ENS Name Registration Tool\n");
    console.log(`ENS Contract: ${ensAddress}`);
    console.log(`Resolver Contract: ${resolverAddress}`);
    console.log(`Using account: ${deployer.address}\n`);

    // Define ENS names to register
    const registrations = [
        {
            name: "vishal.eth",
            owner: "0x6851e28f83d0bdba3e778146c79eb73f5b053229", // Your wallet
            hasSocial: true // Add social media records
        },
        {
            name: "vitalik.eth",
            owner: "0x6851e28f83d0bdba3e778146c79eb73f5b053229",
            hasSocial: true
        },
        {
            name: "test.eth",
            owner: "0x6851e28f83d0bdba3e778146c79eb73f5b053229",
            hasSocial: false
        }
    ];

    // Simple namehash function (matches the one in LendingOracle.sol)
    function namehash(name) {
        return hre.ethers.keccak256(hre.ethers.toUtf8Bytes(name));
    }

    for (const reg of registrations) {
        console.log(`📝 Registering: ${reg.name}`);
        const node = namehash(reg.name);

        try {
            // Step 1: Set resolver for this ENS name
            const tx1 = await mockENS.setResolver(node, resolverAddress);
            await tx1.wait();
            console.log(`   ✅ Resolver set`);

            // Step 2: Set address record in resolver
            const tx2 = await mockResolver.setAddr(node, reg.owner);
            await tx2.wait();
            console.log(`   ✅ Address set to ${reg.owner}`);

            // Step 3: Add social media records if requested
            if (reg.hasSocial) {
                const tx3 = await mockResolver.setText(node, "com.twitter", `https://twitter.com/${reg.name.replace('.eth', '')}`);
                await tx3.wait();

                const tx4 = await mockResolver.setText(node, "com.github", `https://github.com/${reg.name.replace('.eth', '')}`);
                await tx4.wait();

                console.log(`   ✅ Social media records added`);
            }

            console.log(`   🎉 ${reg.name} registered successfully!\n`);
        } catch (error) {
            console.error(`   ❌ Failed to register ${reg.name}:`, error.message, "\n");
        }
    }

    console.log("✅ ENS registration complete!");
    console.log("\n📋 You can now use these ENS names in loan requests:");
    registrations.forEach(reg => {
        console.log(`   • ${reg.name} → ${reg.owner}`);
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
