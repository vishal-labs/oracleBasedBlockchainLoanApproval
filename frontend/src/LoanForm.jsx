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
                        {[1, 5, 10, 20].map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAmount(val.toString())}
                                className="px-4 py-2 rounded-lg bg-brown-700 hover:bg-brown-600 text-cream-200 transition-all text-sm font-semibold"
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
                    className="btn-primary w-full py-4 text-lg relative overflow-hidden"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing Transaction...</span>
                        </span>
                    ) : (
                        '🚀 Submit Loan Request'
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
                    <p className="text-xs text-cream-200 font-semibold mb-2">Requirements:</p>
                    <ul className="text-xs text-beige-500 space-y-1">
                        <li>• Minimum 0.01 ETH balance required</li>
                        <li>• Must have transaction history</li>
                        <li>• ENS name optional (boosts approval odds)</li>
                    </ul>
                </div>
            </form>
        </div >
    );
};

export default LoanForm;
