import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer, borrower] = await ethers.getSigners();
    const lendingOracle = await ethers.getContractAt("LendingOracle", process.env.CONTRACT_ADDRESS);
    const mockENS = await ethers.getContractAt("MockENS", process.env.MOCK_ENS_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3");
    const mockResolver = await ethers.getContractAt("MockResolver", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"); // Assuming deterministic deploy address for local node

    console.log("Requesting loan...");

    // Register ENS if not already (might need re-doing if node restarted)
    const ensName = `user${Date.now()}.eth`;
    const namehash = ethers.namehash(ensName);

    // We need to know ENS address if not hardcoded, but if we run on fresh node addresses are deterministic.
    // 0x5FbDB... is usually first deploy.

    // Setup ENS
    await mockENS.setResolver(namehash, await mockResolver.getAddress());
    await mockResolver.setAddr(namehash, borrower.address);

    const tx = await lendingOracle.connect(borrower).requestLoan(ensName, ethers.parseEther("2.5"));
    await tx.wait();
    console.log(`Requested loan for ${ensName}`);
}

// Ensure .env is loaded
import dotenv from 'dotenv';
dotenv.config();

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
