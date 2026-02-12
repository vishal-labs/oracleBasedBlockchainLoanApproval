import React, { useState } from 'react';
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

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev]);
    };

    const handleDebugSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        addLog(`Initiating debug request for ${borrower}...`, 'info');

        try {
            const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            const signer = await provider.getSigner(0);

            const contract = new ethers.Contract(CONTRACT_ADDRESS, lendingOracleArtifact.abi, signer);

            addLog(`Using Oracle Account: ${signer.address}`, 'success');
            addLog(`Test Balance: ${balanceEth} ETH`, 'info');

            const amountWei = ethers.parseEther(amount);
            const balanceWei = ethers.parseEther(balanceEth);

            const tx = await contract.debugRequestLoanWithBalance(borrower, ensName, amountWei, balanceWei);
            addLog(`Transaction sent: ${tx.hash}`, 'success');

            await tx.wait();
            addLog(`✅ Transaction confirmed! Waiting for Oracle...`, 'success');

            contract.once("LoanProcessed", (requestId, borrowerAddr, score, approved, rate) => {
                if (borrowerAddr.toLowerCase() === borrower.toLowerCase()) {
                    addLog(`🎉 LOAN PROCESSED!`, 'success');
                    addLog(`Credit Score: ${score}`, 'info');
                    addLog(`Status: ${approved ? "✅ APPROVED" : "❌ REJECTED"}`, approved ? 'success' : 'error');
                    addLog(`Interest Rate: ${Number(rate) / 100}%`, 'info');
                    setLoading(false);
                }
            });

        } catch (err) {
            addLog(`❌ Error: ${err.message}`, 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 animate-fade-in">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="glass-panel p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-highlight mb-2 flex items-center gap-2">
                                <span>🧪</span> Debug Loan Request
                            </h1>
                            <p className="text-beige-500 text-sm">
                                Test loans with custom balances (Developer Tool)
                            </p>
                        </div>
                        <a href="/" className="btn-secondary">
                            ← Back to App
                        </a>
                    </div>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-highlight mb-6">Test Parameters</h2>

                        <form onSubmit={handleDebugSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-cream-200 mb-2">
                                    Borrower Address
                                </label>
                                <input
                                    type="text"
                                    value={borrower}
                                    onChange={(e) => setBorrower(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-cream-200 mb-2">
                                    ENS Name <span className="text-beige-500 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={ensName}
                                    onChange={(e) => setEnsName(e.target.value)}
                                    placeholder="name.eth"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-cream-200 mb-2">
                                    Loan Amount (ETH)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    step="0.01"
                                    min="0.01"
                                    className="w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-cream-200 mb-2">
                                    Simulated Balance (ETH)
                                </label>
                                <input
                                    type="number"
                                    value={balanceEth}
                                    onChange={(e) => setBalanceEth(e.target.value)}
                                    step="0.1"
                                    className="w-full"
                                    required
                                />
                                <p className="text-xs text-beige-500 mt-1">
                                    Override actual wallet balance for testing
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-4"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-shimmer">⏳</span> Processing...
                                    </span>
                                ) : (
                                    '🚀 Submit Debug Request'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Console */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold text-highlight mb-6 flex items-center gap-2">
                            <span>📟</span> Console Output
                        </h2>
                        <div className="bg-black/50 p-4 rounded-lg font-mono text-sm h-[500px] overflow-y-auto border border-brown-600">
                            {logs.length === 0 && (
                                <span className="text-beige-500">Waiting for submit...</span>
                            )}
                            {logs.map((log, i) => (
                                <div
                                    key={i}
                                    className={`mb-2 pb-2 border-b border-brown-800/50 last:border-0 animate-fade-in ${log.type === 'error' ? 'text-red-400' :
                                            log.type === 'success' ? 'text-amber-400' :
                                                'text-cream-200'
                                        }`}
                                    style={{ animationDelay: `${i * 30}ms` }}
                                >
                                    <span className="text-beige-500">[{log.time}]</span> {log.msg}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugLoan;
