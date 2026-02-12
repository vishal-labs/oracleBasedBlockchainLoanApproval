import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const LoanStatus = ({ contract, account }) => {
    const [activities, setActivities] = useState([]);
    const [listening, setListening] = useState(false);

    useEffect(() => {
        if (!contract || !account) {
            console.log("⚠️ LoanStatus: Missing dependencies", { contract: !!contract, account });
            return;
        }

        console.log("✅ LoanStatus: Setting up event listener for LoanProcessed...");
        console.log("📍 Contract address:", contract.target);
        console.log("👤 Listening for account:", account);

        // CRITICAL FIX: Use JsonRpcProvider for reliable event listening
        // BrowserProvider doesn't always receive events reliably
        const eventProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const eventContract = new ethers.Contract(
            contract.target,
            contract.interface,
            eventProvider
        );

        setListening(true);

        const handleLoanProcessed = (requestId, borrower, creditScore, approved, interestRate, event) => {
            console.log("🔔 ===== LoanProcessed event received! =====");
            console.log("📦 Event data:", {
                requestId,
                borrower,
                creditScore: creditScore.toString(),
                approved,
                interestRate: interestRate.toString()
            });
            console.log("🎯 Current account:", account);
            console.log("🔍 Match:", borrower.toLowerCase() === account.toLowerCase());

            if (borrower.toLowerCase() !== account.toLowerCase()) {
                console.log("⏭️ Event not for current account, skipping");
                return;
            }

            console.log("✅ Event matches current account, adding to activities");

            const activity = {
                id: requestId,
                borrower,
                approved,
                creditScore: creditScore.toString(),
                interestRate: interestRate.toString(),
                timestamp: new Date().toLocaleTimeString(),
                txHash: event.log.transactionHash
            };

            console.log("💾 Activity object created:", activity);
            setActivities(prev => {
                console.log("📝 Updating activities array");
                return [activity, ...prev];
            });
        };

        console.log("🎧 Attaching event listener to JsonRpcProvider contract...");
        eventContract.on("LoanProcessed", handleLoanProcessed);
        console.log("✅ Event listener attached successfully");

        return () => {
            console.log("🧹 Cleaning up event listener");
            eventContract.off("LoanProcessed", handleLoanProcessed);
            setListening(false);
        };
    }, [contract, account]);

    return (
        <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-highlight flex items-center gap-2">
                    <span>📊</span> Loan Activity
                </h2>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${listening ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                    {listening ? '● Live' : '○ Offline'}
                </div>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">📭</div>
                    <p className="text-beige-500 mb-2">No loan requests yet</p>
                    <p className="text-sm text-beige-500/70">
                        Submit a loan request to see your results here
                    </p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {activities.map((activity, index) => (
                        <div
                            key={activity.id}
                            className="card hover:scale-[1.02] animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Status Badge */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    {activity.approved ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-900/30 border border-green-500/30">
                                            <span className="text-lg">✅</span>
                                            <span className="status-approved text-sm">APPROVED</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-900/30 border border-red-500/30">
                                            <span className="text-lg">❌</span>
                                            <span className="status-rejected text-sm">REJECTED</span>
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-beige-500">{activity.timestamp}</span>
                            </div>

                            {/* Credit Score */}
                            <div className="mb-3">
                                <p className="text-xs text-beige-500 mb-1">Credit Score</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-highlight">
                                        {activity.creditScore}
                                    </span>
                                    <span className="text-sm text-beige-500">/ 850</span>
                                </div>
                                {/* Score Bar */}
                                <div className="mt-2 h-2 bg-brown-900 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${activity.approved
                                            ? 'bg-gradient-to-r from-amber-500 to-green-500'
                                            : 'bg-gradient-to-r from-red-700 to-red-500'
                                            }`}
                                        style={{ width: `${(parseInt(activity.creditScore) / 850) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Transaction Hash */}
                            <div className="pt-3 border-t border-brown-600/30">
                                <p className="text-xs text-beige-500 mb-1">Transaction</p>
                                <a
                                    href={`https://etherscan.io/tx/${activity.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
                                >
                                    {activity.txHash.slice(0, 20)}...
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LoanStatus;
