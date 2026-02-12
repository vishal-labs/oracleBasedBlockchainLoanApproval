import React, { useState } from 'react';
import { ethers } from 'ethers';
import mockENSArtifact from '../../artifacts/contracts/mocks/MockENS.sol/MockENS.json';
import mockResolverArtifact from '../../artifacts/contracts/mocks/MockResolver.sol/MockResolver.json';

const MOCK_ENS_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MOCK_RESOLVER_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const AddENS = () => {
    const [ensName, setEnsName] = useState('');
    const [address, setAddress] = useState('');
    const [addSocial, setAddSocial] = useState(true);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [{ msg, type, timestamp }, ...prev]);
    };

    const generateRandomAddress = () => {
        const randomWallet = ethers.Wallet.createRandom();
        setAddress(randomWallet.address);
        addLog(`Generated random address: ${randomWallet.address}`, 'success');
    };

    const namehash = (name) => {
        if (name === '') {
            return '0x0000000000000000000000000000000000000000000000000000000000000000';
        }

        let node = '0x0000000000000000000000000000000000000000000000000000000000000000';
        const labels = name.split('.').reverse();

        for (const label of labels) {
            const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
            node = ethers.keccak256(ethers.concat([node, labelHash]));
        }

        return node;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        addLog(`Registering ${ensName} → ${address}...`, 'info');

        try {
            const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            const signer = await provider.getSigner(0);

            const mockENS = new ethers.Contract(MOCK_ENS_ADDRESS, mockENSArtifact.abi, signer);
            const mockResolver = new ethers.Contract(MOCK_RESOLVER_ADDRESS, mockResolverArtifact.abi, signer);

            const node = namehash(ensName);

            addLog('Setting resolver...', 'info');
            const tx1 = await mockENS.setResolver(node, MOCK_RESOLVER_ADDRESS);
            await tx1.wait();
            addLog('✅ Resolver set', 'success');

            addLog('Setting address record...', 'info');
            const tx2 = await mockResolver.setAddr(node, address);
            await tx2.wait();
            addLog('✅ Address record set', 'success');

            if (addSocial) {
                addLog('Adding social media records...', 'info');

                const tx3 = await mockResolver.setText(node, "com.twitter", `https://twitter.com/${ensName.replace('.eth', '')}`);
                await tx3.wait();

                const tx4 = await mockResolver.setText(node, "com.github", `https://github.com/${ensName.replace('.eth', '')}`);
                await tx4.wait();

                addLog('✅ Social media records added', 'success');
            }

            addLog(`🎉 ${ensName} successfully registered!`, 'success');

            setEnsName('');
            setAddress('');

        } catch (err) {
            console.error(err);
            addLog(`❌ Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="glass-panel p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-highlight mb-2 flex items-center gap-2">
                                <span>🌐</span> Register ENS Names
                            </h1>
                            <p className="text-beige-500 text-sm">
                                Register .eth names on localhost for testing
                            </p>
                        </div>
                        <a href="/" className="btn-secondary">
                            ← Back to App
                        </a>
                    </div>
                </header>

                {/* Main Form */}
                <div className="glass-panel p-8 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ENS Name */}
                        <div>
                            <label className="block text-sm font-semibold text-cream-200 mb-2">
                                ENS Name
                            </label>
                            <input
                                type="text"
                                value={ensName}
                                onChange={(e) => setEnsName(e.target.value)}
                                placeholder="e.g., myname.eth"
                                className="w-full"
                                required
                            />
                            <p className="text-xs text-beige-500 mt-1">
                                Must end with .eth
                            </p>
                        </div>

                        {/* Wallet Address */}
                        <div>
                            <label className="block text-sm font-semibold text-cream-200 mb-2">
                                Wallet Address
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="flex-1"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateRandomAddress}
                                    className="btn-secondary px-6"
                                >
                                    🎲 Random
                                </button>
                            </div>
                        </div>

                        {/* Social Media Toggle */}
                        <div className="glass-panel-brown p-4 rounded-lg flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="addSocial"
                                checked={addSocial}
                                onChange={(e) => setAddSocial(e.target.checked)}
                                className="w-5 h-5 accent-amber-500 cursor-pointer"
                            />
                            <label htmlFor="addSocial" className="text-sm text-cream-200 cursor-pointer flex-1">
                                Add social media records (Twitter & GitHub)
                                <span className="block text-xs text-amber-400 mt-1">
                                    +50 credit score bonus
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-4 text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-shimmer">⏳</span> Registering...
                                </span>
                            ) : (
                                '⚡ Register ENS Name'
                            )}
                        </button>

                        {/* Info Box */}
                        <div className="glass-panel-brown p-4 border-l-4 border-amber-500">
                            <h4 className="text-amber-400 font-semibold text-sm mb-2">
                                ℹ️ How it works
                            </h4>
                            <ul className="text-xs space-y-1 text-beige-500">
                                <li>• Registers ENS name on localhost MockENS contract</li>
                                <li>• You can then use this ENS name in loan requests</li>
                                <li>• Social records give +50 credit score bonus</li>
                                <li>• Only works on Hardhat Localhost network</li>
                            </ul>
                        </div>
                    </form>
                </div>

                {/* Console Logs */}
                <div className="glass-panel p-6">
                    <h3 className="text-highlight font-bold mb-4 flex items-center gap-2">
                        <span>📟</span> Console Output
                    </h3>
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-sm h-80 overflow-y-auto border border-brown-600">
                        {logs.length === 0 && (
                            <span className="text-beige-500">Waiting for action...</span>
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
                                <span className="text-beige-500">[{log.timestamp}]</span> {log.msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddENS;
