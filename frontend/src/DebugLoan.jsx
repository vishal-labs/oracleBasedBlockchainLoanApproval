import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import lendingOracleArtifact from '../../artifacts/contracts/LendingOracle.sol/LendingOracle.json';
import contractConfig from './contract-config.json';

const CONTRACT_ADDRESS = contractConfig.address;

const DebugLoan = () => {
    const [borrower, setBorrower] = useState('');
    const [amount, setAmount] = useState('1.0');
    const [ensName, setEnsName] = useState('');
    const [balanceEth, setBalanceEth] = useState('2.0');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleDebugSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        addLog(`Initiating debug request for ${borrower}...`);

        try {
            // Connect to local node directly (Account #0 is deployer/oracle)
            const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            const signer = await provider.getSigner(0); // Get Account #0

            const contract = new ethers.Contract(CONTRACT_ADDRESS, lendingOracleArtifact.abi, signer);

            addLog(`Using Oracle Account: ${signer.address}`);
            addLog(`Test Balance: ${balanceEth} ETH`);

            const amountWei = ethers.parseEther(amount);
            const balanceWei = ethers.parseEther(balanceEth);

            // Call the DEBUG function with balance
            const tx = await contract.debugRequestLoanWithBalance(borrower, ensName, amountWei, balanceWei);
            addLog(`Tx Sent: ${tx.hash}`);

            await tx.wait();
            addLog(`✅ Tx Confirmed! Waiting for Oracle response...`);

            // Listen for completion
            contract.once("LoanProcessed", (requestId, borrowerAddr, score, approved, rate) => {
                if (borrowerAddr.toLowerCase() === borrower.toLowerCase()) {
                    addLog(`🔔 LOAN PROCESSED!`);
                    addLog(`   Score: ${score}`);
                    addLog(`   Approved: ${approved ? "✅ YES" : "❌ NO"}`);
                    addLog(`   Rate: ${Number(rate) / 100}%`);
                    setLoading(false);
                }
            });

        } catch (err) {
            console.error(err);
            addLog(`❌ Error: ${err.reason || err.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6 font-sans">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-yellow-500">🛠️ Developer Test Page</h1>
                    <a href="/" className="text-blue-400 hover:underline">← Back to App</a>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-6 border border-yellow-600/30">
                    <form onSubmit={handleDebugSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Simulated Borrower Address</label>
                            <input
                                type="text"
                                value={borrower}
                                onChange={(e) => setBorrower(e.target.value)}
                                placeholder="0x..."
                                className="w-full p-2 rounded bg-slate-700 border border-slate-600 font-mono"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setBorrower(ethers.Wallet.createRandom().address)}
                                className="text-xs text-blue-400 mt-1 hover:text-blue-300"
                            >
                                Generate Random Address
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Loan Amount (ETH)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full p-2 rounded bg-slate-700 border border-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Test Balance (ETH)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={balanceEth}
                                    onChange={(e) => setBalanceEth(e.target.value)}
                                    className="w-full p-2 rounded bg-slate-700 border border-slate-600"
                                    title="Simulated ETH balance for AI prediction"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">ENS Name (Optional)</label>
                            <input
                                type="text"
                                value={ensName}
                                onChange={(e) => setEnsName(e.target.value)}
                                placeholder="vitalik.eth"
                                className="w-full p-2 rounded bg-slate-700 border border-slate-600"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded font-bold ${loading ? 'bg-slate-600' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                        >
                            {loading ? 'Processing...' : '⚡ Trigger Debug Request'}
                        </button>
                    </form>
                </div>

                <div className="bg-black/50 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto border border-slate-700">
                    {logs.length === 0 && <span className="text-slate-500">Waiting for user action...</span>}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">{log}</div>
                    ))}
                </div>
            </div >
        </div >
    );
};

export default DebugLoan;
