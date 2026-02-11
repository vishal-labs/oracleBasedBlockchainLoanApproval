import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LoanForm from './LoanForm';
import LoanStatus from './LoanStatus';
import lendingOracleArtifact from '../../artifacts/contracts/LendingOracle.sol/LendingOracle.json';

// CONTRACT ADDRESS - Dynamically updated by deploy script or manually set
import contractConfig from './contract-config.json';
const CONTRACT_ADDRESS = contractConfig.address;

const Home = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');

  // DISABLED AUTO-CONNECT - User must manually connect
  // useEffect(() => {
  //   checkWallet();
  // }, []);

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setError('');
    console.log("Wallet disconnected");
  };

  const switchToLocalhost = async (provider) => {
    const network = await provider.getNetwork();
    if (network.chainId === 31337n) return; // Already on Localhost

    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: "0x7A69" }]); // 31337 in hex
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      // Ethers.js might wrap the error, so we check multiple paths or the message string.
      if (
        switchError.code === 4902 ||
        (switchError.error && switchError.error.code === 4902) ||
        (switchError.info && switchError.info.error && switchError.info.error.code === 4902) ||
        switchError.message.includes("Unrecognized chain ID")
      ) {
        try {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0x7A69",
            chainName: "Hardhat Localhost",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18
            }
          }]);
        } catch (addError) {
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      // Auto-switch network
      await switchToLocalhost(provider);

      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      initializeContract(signer);
      setError('');
    } catch (err) {
      // Handle "Request already pending" error
      if (err.code === -32002 || (err.info && err.info.error && err.info.error.code === -32002)) {
        setError("MetaMask request is already pending. Please open the MetaMask extension to approve it.");
      } else {
        setError(err.reason || err.message || "Failed to connect wallet.");
      }
      console.error(err);
    }
  };


  const initializeContract = async (signer) => {
    try {
      const lendingContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        lendingOracleArtifact.abi,
        signer
      );
      setContract(lendingContract);
      console.log("Contract initialized:", lendingContract.target);
    } catch (err) {
      console.error("Contract Error:", err);
      setError("Failed to load contract.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <header className="bg-slate-800 p-4 shadow-md border-b border-slate-700">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            DeFi Lend AI
          </h1>
          {account ? (
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-slate-700 rounded-full text-sm font-mono border border-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </div>
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-all shadow-lg shadow-blue-900/50"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-8">
        {error && (
          <div className="bg-red-900/80 border border-red-500 text-white p-4 rounded mb-6 text-center">
            {error}
          </div>
        )}

        {!account ? (
          <div className="text-center mt-20">
            <h2 className="text-3xl font-bold mb-4">Welcome to Intelligent Lending</h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto mb-8">
              Get instant loans backed by AI credit scoring. Use your ENS domain to boost your reputation.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <LoanForm
                contract={contract}
                account={account}
                onLoanRequested={(hash) => console.log("Request sent:", hash)}
              />

              <div className="bg-yellow-900/20 border-2 border-yellow-600/50 p-4 rounded-lg">
                <h3 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">
                  ⚙️ Developer Zone
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        const localProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
                        const [funder] = await localProvider.listAccounts();
                        const tx = await funder.sendTransaction({
                          to: account,
                          value: ethers.parseEther("50.0")
                        });
                        console.log("Faucet Tx:", tx.hash);
                        alert("💰 Sent 50 ETH to your wallet!");
                      } catch (e) {
                        console.error(e);
                        alert("Faucet failed. Ensure 'run_system.sh' is running.");
                      }
                    }}
                    disabled={!account}
                    className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 rounded font-semibold transition"
                  >
                    💰 Mint 50 Test ETH
                  </button>
                  <a
                    href="/sampletest"
                    className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-semibold text-center transition"
                  >
                    🧪 Debug Loan Test
                  </a>
                  <a
                    href="/addENS"
                    className="block w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-semibold text-center transition"
                  >
                    🌐 Register ENS Names
                  </a>
                </div>
              </div>
            </div>

            <div>
              <LoanStatus
                contract={contract}
                account={account}
              />
            </div>
          </div>
        )
        }
      </main >
    </div >
  );
};

export default Home;
