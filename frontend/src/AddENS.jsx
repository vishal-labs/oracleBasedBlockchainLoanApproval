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
            // Connect to local Hardhat node using deployer account (Account #0)
            const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            const signer = await provider.getSigner(0); // Oracle/deployer account

            const mockENS = new ethers.Contract(MOCK_ENS_ADDRESS, mockENSArtifact.abi, signer);
            const mockResolver = new ethers.Contract(MOCK_RESOLVER_ADDRESS, mockResolverArtifact.abi, signer);

            const node = namehash(ensName);

            // Step 1: Set resolver
            addLog('Setting resolver...', 'info');
            const tx1 = await mockENS.setResolver(node, MOCK_RESOLVER_ADDRESS);
            await tx1.wait();
            addLog('✅ Resolver set', 'success');

            // Step 2: Set address
            addLog('Setting address record...', 'info');
            const tx2 = await mockResolver.setAddr(node, address);
            await tx2.wait();
            addLog('✅ Address record set', 'success');

            // Step 3: Add social media records if requested
            if (addSocial) {
                addLog('Adding social media records...', 'info');

                const tx3 = await mockResolver.setText(node, "com.twitter", `https://twitter.com/${ensName.replace('.eth', '')}`);
                await tx3.wait();

                const tx4 = await mockResolver.setText(node, "com.github", `https://github.com/${ensName.replace('.eth', '')}`);
                await tx4.wait();

                addLog('✅ Social media records added', 'success');
            }

            addLog(`🎉 ${ensName} successfully registered!`, 'success');

            // Reset form
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
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-green-500">🌐 Register ENS Names</h1>
                    <a href="/" className="text-blue-400 hover:underline">← Back to App</a>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-6 border border-green-600/30">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">ENS Name</label>
                            <input
                                type="text"
                                value={ensName}
                                onChange={(e) => setEnsName(e.target.value)}
                                placeholder="e.g., myname.eth"
                                className="w-full p-2 rounded bg-slate-700 border border-slate-600 font-mono"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-1">Must end with .eth</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Wallet Address</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="flex-1 p-2 rounded bg-slate-700 border border-slate-600 font-mono"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateRandomAddress}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-semibold transition"
                                >
                                    🎲 Random
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="addSocial"
                                checked={addSocial}
                                onChange={(e) => setAddSocial(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <label htmlFor="addSocial" className="text-sm">
                                Add social media records (Twitter & GitHub)
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded font-bold ${loading ? 'bg-slate-600' : 'bg-green-600 hover:bg-green-500'}`}
                        >
                            {loading ? 'Registering...' : '⚡ Register ENS Name'}
                        </button>
                    </form>

                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-sm">
                        <p className="font-semibold mb-1">ℹ️ How it works:</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                            <li>• Registers ENS name on localhost MockENS contract</li>
                            <li>• You can then use this ENS name in loan requests</li>
                            <li>• Social records give +50 credit score bonus</li>
                            <li>• Only works on Hardhat Localhost network</li>
                        </ul>
                    </div>
                </div>

                {/* Logs */}
                <div className="bg-black/50 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto border border-slate-700">
                    <h3 className="text-slate-400 mb-2 font-sans">Console</h3>
                    {logs.length === 0 && <span className="text-slate-500">Waiting for action...</span>}
                    {logs.map((log, i) => (
                        <div
                            key={i}
                            className={`mb-1 border-b border-slate-800/50 pb-1 last:border-0 ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-green-400' :
                                    'text-slate-300'
                                }`}
                        >
                            [{log.timestamp}] {log.msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddENS;
