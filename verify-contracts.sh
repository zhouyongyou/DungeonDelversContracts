#!/bin/bash
# BSCScan 合約驗證腳本
# 使用 forge verify-contract 命令

echo "🔍 開始驗證合約..."
echo "================================"

# BSCScan API Key
API_KEY="YHSYB5WKIMABIDXB9TWM6TQGC2RTK5G9MK"

# 已部署的代幣地址（構造函數參數）
SOULSHARD="0x1a98769b8034d400745cc658dc204cd079de36fa"
USD="0x916a2a1eb605e88561139c56af0698de241169f2"
OWNER="0x84Cd63a840274d267aCb19e708d7f6298c315E75"

# 驗證函數
verify_contract() {
    local ADDRESS=$1
    local CONTRACT=$2
    local CONSTRUCTOR_ARGS=$3

    echo ""
    echo "📋 驗證 $CONTRACT..."

    if [ -z "$CONSTRUCTOR_ARGS" ]; then
        forge verify-contract \
            --chain-id 56 \
            --etherscan-api-key $API_KEY \
            $ADDRESS \
            $CONTRACT
    else
        forge verify-contract \
            --chain-id 56 \
            --etherscan-api-key $API_KEY \
            --constructor-args $CONSTRUCTOR_ARGS \
            $ADDRESS \
            $CONTRACT
    fi

    echo "✅ $CONTRACT 提交驗證"
    sleep 3  # 避免 API 速率限制
}

# 驗證所有合約
echo "1️⃣ 驗證 NFT 合約..."
verify_contract "0x52A0Ba2a7efB9519b73E671D924F03575fA64269" "contracts/current/nft/Hero.sol:Hero"
verify_contract "0x04c6bc2548B9F5C38be2bE0902259D428f1FEc2b" "contracts/current/nft/Relic.sol:Relic"
verify_contract "0x73953a4daC5339b28E13C38294E758655E62DFDe" "contracts/current/nft/Party.sol:Party"
verify_contract "0xEa827e472937AbD1117f0d4104a76E173724a061" "contracts/current/nft/PlayerProfile.sol:PlayerProfile"
verify_contract "0xd82ef4be9e6d037140bD54Afa04BE983673637Fb" "contracts/current/nft/VIPStaking.sol:VIPStaking"

echo ""
echo "2️⃣ 驗證核心合約..."
# DungeonCore 需要構造函數參數 (owner, usd, soulShard)
CORE_ARGS=$(cast abi-encode "constructor(address,address,address)" $OWNER $USD $SOULSHARD)
verify_contract "0x6C900a1Cf182aA5960493BF4646C9EFC8eaeD16b" "contracts/current/core/DungeonCore.sol:DungeonCore" "$CORE_ARGS"

verify_contract "0xa573CCF8332A5B1E830eA04A87856a28C99D9b53" "contracts/current/core/DungeonMaster.sol:DungeonMaster"
verify_contract "0x8878A235d36F8a44F53D87654fdFb0e3C5b2C791" "contracts/current/core/DungeonStorage.sol:DungeonStorage"
verify_contract "0x1357C546CE8Cd529A1914e53f98405E1eBFbFC53" "contracts/current/core/AltarOfAscension.sol:AltarOfAscension"

echo ""
echo "3️⃣ 驗證 DeFi 合約..."
verify_contract "0x81Dad3AF7EdCf1026fE18977172FB6E24f3Cf7d0" "contracts/current/defi/PlayerVault.sol:PlayerVault"

echo ""
echo "4️⃣ 驗證 VRF 合約..."
verify_contract "0xCD6baD326c68ba4f4c07B2d3f9c945364E56840c" "contracts/current/core/VRFConsumerV2Plus.sol:VRFConsumerV2Plus"

echo ""
echo "================================"
echo "🎉 所有合約已提交驗證！"
echo ""
echo "📌 查看驗證狀態："
echo "https://bscscan.com/address/0x52A0Ba2a7efB9519b73E671D924F03575fA64269#code"
echo ""
echo "⏱️  驗證通常需要幾分鐘時間"