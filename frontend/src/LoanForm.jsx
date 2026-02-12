import React, { useState } from 'react';
import { ethers } from 'ethers';

const LoanForm = ({ contract, account, onLoanRequested }) => {
    const [amount, setAmount] = useState('1.0');
    const [ensName, setEnsName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!contract) throw new Error("Contract not connected");

            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(account);
            const network = await provider.getNetwork();

            if (balance < ethers.parseEther("0.01")) {
                const balanceEth = ethers.formatEther(balance);
                throw new Error(`Insufficient balance: ${balanceEth} ETH (minimum 0.01 ETH required)`);
            }

            const tx = await contract.requestLoan(ensName, ethers.parseEther(amount), {
                gasLimit: 500000
            });

            console.log("Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("Transaction confirmed:", receipt);

            onLoanRequested(receipt.hash);

        } catch (err) {
            console.error("Full error:", err);

            let errorMessage = "Transaction failed";

            if (err.reason) {
                errorMessage = err.reason;
            } else if (err.data && err.data.message) {
                errorMessage = err.data.message;
            } else if (err.message) {
                if (err.message.includes("Insufficient ETH balance")) {
                    errorMessage = "Insufficient ETH balance (minimum 0.01 ETH required)";
                } else if (err.message.includes("No transaction history")) {
                    errorMessage = "No transaction history detected";
                } else if (err.message.includes("You do not own this ENS name")) {
                    errorMessage = "You do not own this ENS name";
                } else if (err.message.includes("ENS domain not registered")) {
                    errorMessage = "ENS domain not registered. Register at /addENS";
                } else if (err.message.includes("user rejected")) {
                    errorMessage = "Transaction cancelled by user";
                } else {
                    errorMessage = err.message;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6">
            <h2 className="text-2xl font-bold text-highlight mb-6 flex items-center gap-2">
                <span>💰</span> Request a Loan
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* ENS Name Input */}
                <div>
                    <label className="block text-sm font-semibold text-cream-200 mb-2">
                        ENS Name <span className="text-beige-500 font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={ensName}
                        onChange={(e) => setEnsName(e.target.value)}
                        placeholder="yourname.eth"
                        className="w-full"
                    />
                    <p className="text-xs text-beige-500 mt-1">
                        ✨ ENS names with social media links get +50 credit boost
                    </p>
                </div>

                {/* Loan Amount Input */}
                <div>
                    <label className="block text-sm font-semibold text-cream-200 mb-2">
                        Loan Amount (ETH)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0.01"
                            required
                            className="w-full pr-16"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 font-semibold">
                            ETH
                        </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {['1', '5', '10', '20'].map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAmount(val)}
                                className="btn-secondary text-xs px-3 py-1"
                            >
                                {val} ETH
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg font-bold"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-shimmer">⏳</span> Processing...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            🚀 Submit Loan Request
                        </span>
                    )}
                </button>

                {/* Error Display */}
                {error && (
                    <div className="glass-panel-red p-4 border-l-4 border-red-500 animate-fade-in">
                        <p className="text-error text-sm font-semibold">❌ {error}</p>
                    </div>
                )}

                {/* Info Box */}
                <div className="glass-panel-brown p-4 border-l-4 border-amber-500">
                    <h4 className="text-amber-400 font-semibold text-sm mb-2">
                        📋 Requirements
                    </h4>
                    <ul className="text-xs space-y-1 text-beige-500">
                        <li>• Minimum balance: 0.01 ETH</li>
                        <li>• Transaction history required</li>
                        <li>• AI will analyze your creditworthiness</li>
                        <li>• Decision typically within 30 seconds</li>
                    </ul>
                </div>
            </form>
        </div>
    );
};

export default LoanForm;
