#!/bin/bash

# 設置環境變量
export PATH="$HOME/.foundry/bin:$PATH"
source .env

# 合約參數
WRAPPER_ADDRESS="0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94"

echo "=== 使用 Foundry 部署並驗證 VRFManagerV2PlusFixed ==="
echo ""
echo "部署者: $(cast wallet address --private-key $PRIVATE_KEY)"
echo "Wrapper 地址: $WRAPPER_ADDRESS"
echo ""

# 1. 部署合約
echo "1. 部署合約..."
DEPLOY_OUTPUT=$(forge create \
  contracts/current/core/VRFManagerV2PlusFixed.sol:VRFManagerV2PlusFixed \
  --rpc-url https://bsc-dataseed.binance.org/ \
  --private-key $PRIVATE_KEY \
  --constructor-args $WRAPPER_ADDRESS \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --verify \
  --broadcast)

echo "$DEPLOY_OUTPUT"

# 提取合約地址
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ 部署失敗"
  exit 1
fi

echo ""
echo "✅ 合約部署成功: $CONTRACT_ADDRESS"
echo ""

# 2. 等待確認
echo "2. 等待區塊確認..."
sleep 10

# 3. 驗證合約（如果自動驗證失敗）
echo "3. 嘗試手動驗證..."
forge verify-contract \
  --chain-id 56 \
  --num-of-optimizations 200 \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address)" $WRAPPER_ADDRESS) \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --compiler-version v0.8.20+commit.a1b79de6 \
  $CONTRACT_ADDRESS \
  contracts/current/core/VRFManagerV2PlusFixed.sol:VRFManagerV2PlusFixed

echo ""
echo "4. 設置授權..."

# Hero
echo "   授權 Hero..."
cast send $CONTRACT_ADDRESS \
  "setAuthorizedContract(address,bool)" \
  0x575e7407C06ADeb47067AD19663af50DdAe460CF true \
  --rpc-url https://bsc-dataseed.binance.org/ \
  --private-key $PRIVATE_KEY

# Relic
echo "   授權 Relic..."
cast send $CONTRACT_ADDRESS \
  "setAuthorizedContract(address,bool)" \
  0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739 true \
  --rpc-url https://bsc-dataseed.binance.org/ \
  --private-key $PRIVATE_KEY

# DungeonMaster
echo "   授權 DungeonMaster..."
cast send $CONTRACT_ADDRESS \
  "setAuthorizedContract(address,bool)" \
  0xE391261741Fad5FCC2D298d00e8c684767021253 true \
  --rpc-url https://bsc-dataseed.binance.org/ \
  --private-key $PRIVATE_KEY

echo ""
echo "5. 更新 Hero 和 Relic VRF Manager..."

# Hero
echo "   更新 Hero..."
cast send 0x575e7407C06ADeb47067AD19663af50DdAe460CF \
  "setVRFManager(address)" \
  $CONTRACT_ADDRESS \
  --rpc-url https://bsc-dataseed.binance.org/ \
  --private-key $PRIVATE_KEY

# Relic
echo "   更新 Relic..."
cast send 0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739 \
  "setVRFManager(address)" \
  $CONTRACT_ADDRESS \
  --rpc-url https://bsc-dataseed.binance.org/ \
  --private-key $PRIVATE_KEY

echo ""
echo "=== 部署完成 ==="
echo "VRFManagerV2PlusFixed: $CONTRACT_ADDRESS"
echo "BSCScan: https://bscscan.com/address/$CONTRACT_ADDRESS#code"
echo ""

# 保存地址
echo "{
  \"VRFManagerV2PlusFixed\": \"$CONTRACT_ADDRESS\",
  \"deployedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"wrapper\": \"$WRAPPER_ADDRESS\",
  \"network\": \"BSC Mainnet\",
  \"deployedWith\": \"Foundry\"
}" > vrf-manager-foundry-deployment.json

echo "配置已保存到 vrf-manager-foundry-deployment.json"