import React, { useState } from 'react';
import { ethers } from 'ethers';

const LoanForm = ({ contract, account, onLoanRequested }) => {
    const [amount, setAmount] = useState('1.0'); // Default 1 ETH
    const [ensName, setEnsName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!contract) throw new Error("Contract not connected");

            const amountWei = ethers.parseEther(amount);
            console.log(`Requesting loan: ${amount} ETH, ENS: "${ensName}"`);

            // Check balance check (frontend validation optional but good UX)
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(account);
            const network = await provider.getNetwork();

            if (balance < ethers.parseEther("0.01")) {
                const balanceEth = ethers.formatEther(balance);
                throw new Error(`Insufficient balance: ${balanceEth} ETH. (Network: ${network.name}, ChainID: ${network.chainId}). Ensure MetaMask is connected to Localhost.`);
            }

            // Request loan with manual gas limit to avoid MetaMask estimation issues
            const tx = await contract.requestLoan(ensName, ethers.parseEther(amount), {
                gasLimit: 500000 // Manual gas limit to avoid estimation failures
            });

            console.log("Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("Transaction confirmed:", receipt);

            onLoanRequested(receipt.hash);

        } catch (err) {
            console.error("Full error:", err);

            // Extract meaningful error message
            let errorMessage = "Transaction failed";

            if (err.reason) {
                // Direct revert reason
                errorMessage = err.reason;
            } else if (err.data && err.data.message) {
                // Sometimes error is nested
                errorMessage = err.data.message;
            } else if (err.message) {
                // Extract from generic message
                if (err.message.includes("Insufficient ETH balance")) {
                    errorMessage = "Insufficient ETH balance (minimum 0.01 ETH required)";
                } else if (err.message.includes("No transaction history")) {
                    errorMessage = "No transaction history detected";
                } else if (err.message.includes("You do not own this ENS name")) {
                    errorMessage = "You do not own this ENS name";
                } else if (err.message.includes("user rejected")) {
                    errorMessage = "Transaction rejected by user";
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
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Request a Loan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Loan Amount (ETH)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:border-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">ENS Name (Optional)</label>
                    <input
                        type="text"
                        value={ensName}
                        onChange={(e) => setEnsName(e.target.value)}
                        placeholder="e.g., vitalik.eth"
                        className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:border-blue-500 outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Leave empty if you don't have one.</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/50 text-red-200 rounded text-sm border border-red-700">
                        Error: {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded font-bold transition-colors ${loading
                        ? 'bg-slate-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                >
                    {loading ? 'Processing...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
};

export default LoanForm;
