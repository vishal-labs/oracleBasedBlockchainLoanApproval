#!/bin/bash

# Kill any existing hardhat node or oracle
pkill -f "hardhat node"
pkill -f "python3 oracle.py"

echo "🚀 Starting System (Optional ENS Test)..."

# 1. Start Hardhat Node
echo "1️⃣  Starting Local Blockchain..."
npx hardhat node > hardhat.log 2>&1 &
NODE_PID=$!
echo "   Node started (PID: $NODE_PID). Waiting for initialization..."
sleep 5

# 2. Deploy Contracts
echo "2️⃣  Deploying Contracts..."
npx hardhat run scripts/deploy_local.js --network localhost

# 3. Start Python Oracle
echo "3️⃣  Starting Python Oracle..."
# Ensure we use unbuffered output to see logs immediately
python3 -u oracle.py > oracle.log 2>&1 &
ORACLE_PID=$!
echo "   Oracle started (PID: $ORACLE_PID)"

# 4. Trigger Loan Request (NO ENS)
echo "4️⃣  Triggering Loan Request (No ENS)..."
sleep 5
npx hardhat run scripts/trigger_no_ens.js --network localhost

# 5. Monitor logs
echo "5️⃣  Monitoring Oracle Logs (Press Ctrl+C to stop)..."
echo "---------------------------------------------------"
tail -f oracle.log &
TAIL_PID=$!

# Wait for user to exit
trap "kill $NODE_PID $ORACLE_PID $TAIL_PID; echo '🛑 System Stopped'; exit" INT TERM
wait
