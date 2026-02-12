import React, { useState } from 'react';
import { ethers } from 'ethers';
import LoanForm from './LoanForm';
import LoanStatus from './LoanStatus';
import lendingOracleArtifact from '../../artifacts/contracts/LendingOracle.sol/LendingOracle.json';
import contractConfig from './contract-config.json';

const CONTRACT_ADDRESS = contractConfig.address;

const Home = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setError('');
  };

  const switchToLocalhost = async (provider) => {
    const network = await provider.getNetwork();
    if (network.chainId === 31337n) return;

    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: "0x7A69" }]);
    } catch (switchError) {
      if (
        switchError.code === 4902 ||
        (switchError.error && switchError.error.code === 4902) ||
        (switchError.info && switchError.info.error && switchError.info.error.code === 4902) ||
        switchError.message.includes("Unrecognized chain ID")
      ) {
        await provider.send("wallet_addEthereumChain", [{
          chainId: "0x7A69",
          chainName: "Hardhat Localhost",
          rpcUrls: ["http://127.0.0.1:8545"],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }
        }]);
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
      await switchToLocalhost(provider);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);

      const lendingContract = new ethers.Contract(CONTRACT_ADDRESS, lendingOracleArtifact.abi, signer);
      setContract(lendingContract);
      setError('');
    } catch (err) {
      if (err.code === -32002 || (err.info && err.info.error && err.info.error.code === -32002)) {
        setError("MetaMask request pending. Please check the MetaMask extension.");
      } else {
        setError(err.reason || err.message || "Failed to connect wallet");
      }
    }
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <header className="glass-panel max-w-7xl mx-auto mb-8 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-highlight mb-2">
              🏦 Decentralized Lending Oracle
            </h1>
            <p className="text-beige-500 text-sm">
              AI-powered credit scoring on Ethereum
            </p>
          </div>

          {account ? (
            <div className="flex items-center gap-4">
              <div className="glass-panel-brown px-4 py-2 rounded-lg">
                <p className="text-xs text-beige-500 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm text-highlight">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
              <button onClick={disconnectWallet} className="btn-secondary">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} className="btn-primary px-8 py-3 text-lg">
              🔗 Connect Wallet
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 glass-panel-red p-4 border-l-4 border-red-500">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {!account ? (
          <div className="glass-panel p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🔐</div>
              <h2 className="text-3xl font-bold text-highlight mb-4">
                Welcome to the Future of Lending
              </h2>
              <p className="text-lg text-cream-200 mb-8 leading-relaxed">
                Connect your MetaMask wallet to access decentralized loans powered by
                AI credit scoring and blockchain transparency.
              </p>
              <button onClick={connectWallet} className="btn-primary px-10 py-4 text-xl">
                Get Started →
              </button>

              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                <div className="glass-panel-brown p-4 rounded-lg">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="text-highlight font-semibold mb-1">Instant Decision</h3>
                  <p className="text-sm text-beige-500">AI-powered in seconds</p>
                </div>
                <div className="glass-panel-brown p-4 rounded-lg">
                  <div className="text-2xl mb-2">🛡️</div>
                  <h3 className="text-highlight font-semibold mb-1">Transparent</h3>
                  <p className="text-sm text-beige-500">On-chain verification</p>
                </div>
                <div className="glass-panel-brown p-4 rounded-lg">
                  <div className="text-2xl mb-2">🌐</div>
                  <h3 className="text-highlight font-semibold mb-1">ENS Support</h3>
                  <p className="text-sm text-beige-500">Use your .eth name</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <LoanForm
                contract={contract}
                account={account}
                onLoanRequested={(hash) => console.log("Loan requested:", hash)}
              />

              {/* Developer Tools */}
              <div className="glass-panel-brown p-6 border-l-4 border-amber-500">
                <h3 className="text-highlight font-bold mb-4 flex items-center gap-2">
                  <span>⚙️</span> Developer Tools
                </h3>
                <div className="space-y-3">
                  <a href="/sampletest" className="block">
                    <button className="btn-secondary w-full">
                      🧪 Debug Loan Test
                    </button>
                  </a>
                  <a href="/addENS" className="block">
                    <button className="btn-secondary w-full">
                      🌐 Register ENS Names
                    </button>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <LoanStatus contract={contract} account={account} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 text-center text-beige-500 text-sm pb-6">
        <p>Built on Ethereum • Powered by Chainlink Oracles</p>
      </footer>
    </div>
  );
};

export default Home;
