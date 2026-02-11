import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const MockENS = await hre.ethers.getContractFactory("MockENS");
    const mockENS = await MockENS.deploy();
    await mockENS.waitForDeployment();
    console.log("MockENS deployed to:", await mockENS.getAddress());

    const MockResolver = await hre.ethers.getContractFactory("MockResolver");
    const mockResolver = await MockResolver.deploy();
    await mockResolver.waitForDeployment();
    console.log("MockResolver deployed to:", await mockResolver.getAddress());

    const LendingOracle = await hre.ethers.getContractFactory("LendingOracle");
    const lendingOracle = await LendingOracle.deploy(await mockENS.getAddress());
    await lendingOracle.waitForDeployment();
    console.log("LendingOracle deployed to:", await lendingOracle.getAddress());

    // Write address to .env file for oracle.py
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    } else {
        envContent = 'RPC_URL=http://127.0.0.1:8545\nPRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80\n';
    }

    // Regex replace CONTRACT_ADDRESS or append if missing
    if (envContent.includes('CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${await lendingOracle.getAddress()}`);
    } else {
        envContent += `\nCONTRACT_ADDRESS=${await lendingOracle.getAddress()}`;
    }

    // Ensure mock address is also saved for trigger script
    if (envContent.includes('MOCK_ENS_ADDRESS=')) {
        envContent = envContent.replace(/MOCK_ENS_ADDRESS=.*/, `MOCK_ENS_ADDRESS=${await mockENS.getAddress()}`);
    } else {
        envContent += `\nMOCK_ENS_ADDRESS=${await mockENS.getAddress()}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env with new contract addresses");

    // ========== PRE-FUND TEST WALLETS ==========
    console.log("\n💰 Pre-funding test wallets...");
    const testWallets = [
        "0x6851e28f83d0bdba3e778146c79eb73f5b053229", // User's MetaMask wallet
        // Add more addresses if needed
    ];

    for (const wallet of testWallets) {
        try {
            const fundAmount = hre.ethers.parseEther("100"); // Give 100 ETH
            const tx = await deployer.sendTransaction({
                to: wallet,
                value: fundAmount
            });
            await tx.wait();
            console.log(`   ✅ Funded ${wallet} with 100 ETH`);
        } catch (e) {
            console.log(`   ⚠️  Could not fund ${wallet}: ${e.message}`);
        }
    }

    // ========== UPDATE FRONTEND CONFIG ==========
    const frontendConfigPath = path.resolve(process.cwd(), 'frontend/src/contract-config.json');
    if (fs.existsSync(path.dirname(frontendConfigPath))) {
        const address = await lendingOracle.getAddress();
        fs.writeFileSync(frontendConfigPath, JSON.stringify({ address }, null, 2));
        console.log(`Updated frontend contract config: ${address}`);
    }

    // ========== REGISTER TEST ENS NAMES ==========
    console.log("\n🌐 Registering test ENS names...");

    // PROPER ENS NAMEHASH - matches LendingOracle.sol algorithm
    const namehash = (name) => {
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
    };

    const testWallet = "0x6851e28f83d0bdba3e778146c79eb73f5b053229";

    const ensRegistrations = [
        { name: "vishal.eth", hasSocial: true },
        { name: "vitalik.eth", hasSocial: true },
        { name: "test.eth", hasSocial: false }
    ];

    for (const reg of ensRegistrations) {
        try {
            const node = namehash(reg.name);
            await mockENS.setResolver(node, await mockResolver.getAddress());
            await mockResolver.setAddr(node, testWallet);

            if (reg.hasSocial) {
                await mockResolver.setText(node, "com.twitter", `https://twitter.com/${reg.name.replace('.eth', '')}`);
                await mockResolver.setText(node, "com.github", `https://github.com/${reg.name.replace('.eth', '')}`);
            }

            console.log(`   ✅ Registered ${reg.name} → ${testWallet}${reg.hasSocial ? " (with social)" : ""}`);
        } catch (e) {
            console.log(`   ⚠️  Could not register ${reg.name}: ${e.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
