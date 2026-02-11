import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer, borrower] = await ethers.getSigners();
    const lendingOracle = await ethers.getContractAt("LendingOracle", process.env.CONTRACT_ADDRESS);

    console.log("Requesting loan WITHOUT ENS...");

    // Request loan with empty string for ENS
    const tx = await lendingOracle.connect(borrower).requestLoan("", ethers.parseEther("1.0"));
    const receipt = await tx.wait();

    // Find LoanRequested event
    const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'LoanRequested');
    const requestId = event.args[0];

    console.log(`✅ Loan Requested! ID: ${requestId}`);
    console.log(`   ENS Name: "${event.args[3]}" (Should be empty)`);
}

// Ensure .env is loaded
import dotenv from 'dotenv';
dotenv.config();

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
