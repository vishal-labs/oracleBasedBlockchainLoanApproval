import React, { useState, useEffect } from 'react';

const LoanStatus = ({ contract, account }) => {
    const [loanEvents, setLoanEvents] = useState([]);

    useEffect(() => {
        if (!contract || !account) return;

        console.log("🔍 LoanStatus: Setting up event listeners for", account);

        // Fetch past events from this session
        const fetchPastEvents = async () => {
            try {
                // Get LoanRequested events for this user
                const requestFilter = contract.filters.LoanRequested(null, account);
                const requestedEvents = await contract.queryFilter(requestFilter, -1000); // Last 1000 blocks

                console.log(`Found ${requestedEvents.length} past LoanRequested events`);

                for (const event of requestedEvents) {
                    const { requestId, amount, ensName } = event.args;
                    addEvent({
                        type: 'Requested',
                        requestId,
                        amount,
                        ensName,
                        hash: event.transactionHash,
                        timestamp: new Date(event.blockNumber * 1000).toLocaleTimeString()
                    });
                }

                // Get LoanProcessed events for this user
                const processFilter = contract.filters.LoanProcessed(null, account);
                const processedEvents = await contract.queryFilter(processFilter, -1000);

                console.log(`Found ${processedEvents.length} past LoanProcessed events`);

                for (const event of processedEvents) {
                    const { requestId, creditScore, approved, interestRate } = event.args;
                    updateEvent(requestId, {
                        type: 'Processed',
                        creditScore: Number(creditScore),
                        approved,
                        interestRate: Number(interestRate),
                        processedTime: new Date(event.blockNumber * 1000).toLocaleTimeString()
                    });
                }
            } catch (error) {
                console.error("Error fetching past events:", error);
            }
        };

        fetchPastEvents();

        // Listener for LoanRequested
        const onLoanRequested = (requestId, borrower, amount, ensName, event) => {
            console.log("📥 LoanRequested event:", { requestId, borrower, amount: amount.toString(), ensName });
            if (borrower.toLowerCase() === account.toLowerCase()) {
                console.log("✅ My Loan Requested:", requestId);
                addEvent({
                    type: 'Requested',
                    requestId,
                    amount,
                    ensName,
                    hash: event.log.transactionHash,
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        };

        // Listener for LoanProcessed
        const onLoanProcessed = (requestId, borrower, creditScore, approved, interestRate, event) => {
            console.log("📥 LoanProcessed event:", { requestId, borrower, creditScore: creditScore.toString(), approved, interestRate: interestRate.toString() });
            if (borrower.toLowerCase() === account.toLowerCase()) {
                console.log("✅ My Loan Processed:", requestId);
                updateEvent(requestId, {
                    type: 'Processed',
                    creditScore: Number(creditScore),
                    approved,
                    interestRate: Number(interestRate),
                    processedTime: new Date().toLocaleTimeString()
                });
            }
        };

        contract.on('LoanRequested', onLoanRequested);
        contract.on('LoanProcessed', onLoanProcessed);

        // Cleanup
        return () => {
            contract.removeAllListeners('LoanRequested');
            contract.removeAllListeners('LoanProcessed');
        };
    }, [contract, account]);

    const addEvent = (newEvent) => {
        setLoanEvents(prev => [newEvent, ...prev]);
    };

    const updateEvent = (requestId, updateData) => {
        setLoanEvents(prev => prev.map(event =>
            event.requestId === requestId ? { ...event, ...updateData } : event
        ));
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Your Activity</h2>

            {loanEvents.length === 0 ? (
                <p className="text-slate-500 text-center italic">No loan requests found in this session.</p>
            ) : (
                <div className="space-y-4">
                    {loanEvents.map((loan, idx) => (
                        <div key={idx} className="border border-slate-700 bg-slate-750 p-4 rounded-md">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-400">
                                    ID: {loan.requestId.substring(0, 10)}...
                                </span>
                                <span className="text-xs text-slate-500">{loan.timestamp}</span>
                            </div>

                            <div className="mb-2">
                                <p><span className="text-slate-400">Amount:</span> {Number(loan.amount) / 10 ** 18} ETH</p>
                                <p><span className="text-slate-400">ENS:</span> {loan.ensName || "None"}</p>
                            </div>

                            {/* Status Badge */}
                            <div className="mt-3">
                                {loan.type === 'Requested' ? (
                                    <div className="flex items-center text-yellow-400 gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                                        <span>Oracle Processing...</span>
                                    </div>
                                ) : (
                                    <div className={`p-3 rounded-md ${loan.approved ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
                                        <div className="font-bold flex items-center gap-2 mb-1">
                                            <span className={loan.approved ? "text-green-400" : "text-red-400"}>
                                                {loan.approved ? "✅ APPROVED" : "❌ REJECTED"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 text-sm gap-2">
                                            <p className="text-slate-300">Score: <span className="font-mono font-bold">{loan.creditScore}</span></p>
                                            {loan.approved && (
                                                <p className="text-slate-300">Rate: <span className="font-mono font-bold">{loan.interestRate / 100}%</span></p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LoanStatus;
