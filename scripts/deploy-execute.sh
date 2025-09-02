#!/bin/bash

# 🚀 DungeonDelvers V25.2.3 部署執行腳本
# Hero, Relic, VIPStaking 一鍵部署 + 驗證 + 配置

echo "🏗️ DungeonDelvers V25.2.3 Complete Deployment"
echo "=============================================="
echo "📋 將部署: Hero, Relic, VIPStaking"
echo "🔗 將設定: CORE 互連"
echo "✅ 將驗證: BSCScan 開源"
echo "📝 將更新: 配置文件"
echo ""

# 檢查環境
echo "🔍 檢查部署環境..."

# 檢查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴..."
    npm install
fi

# 檢查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ 錯誤: .env 文件不存在"
    echo "請創建 .env 文件並設定 PRIVATE_KEY 和 BSCSCAN_API_KEY"
    exit 1
fi

# 檢查私鑰
if ! grep -q "PRIVATE_KEY" .env; then
    echo "❌ 錯誤: .env 中未設定 PRIVATE_KEY"
    exit 1
fi

# 檢查 BSCScan API Key
if ! grep -q "BSCSCAN_API_KEY" .env; then
    echo "⚠️  警告: .env 中未設定 BSCSCAN_API_KEY"
    echo "   合約將部署但無法自動驗證開源"
fi

echo "✅ 環境檢查通過"
echo ""

# 編譯合約
echo "🔨 編譯合約..."
npx hardhat compile

if [ $? -ne 0 ]; then
    echo "❌ 合約編譯失敗"
    exit 1
fi

echo "✅ 合約編譯成功"
echo ""

# 確認部署
echo "⚠️  準備部署到 BSC 主網"
echo "📍 網路: BSC Mainnet"
echo "💰 預估費用: ~0.05 BNB"
echo ""
read -p "確定要繼續部署嗎？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 0
fi

echo ""
echo "🚀 開始部署..."
echo ""

# 執行部署
npx hardhat run scripts/deploy-hero-relic-vip.js --network bsc

DEPLOY_EXIT_CODE=$?

echo ""
echo "=============================================="

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo "🎉 部署成功完成！"
    echo ""
    echo "📋 下一步建議："
    echo "1. 檢查 deployments/ 目錄中的部署報告"
    echo "2. 在 BSCScan 確認合約驗證狀態"
    echo "3. 執行統一配置同步:"
    echo "   node scripts/ultimate-config-system.js sync"
    echo "4. 重啟前端和後端服務"
    echo ""
    echo "📊 部署文件位置:"
    echo "   - JSON: deployments/v25-2-3-deployment.json"
    echo "   - 報告: deployments/v25-2-3-deployment-*.md"
else
    echo "❌ 部署失敗！"
    echo ""
    echo "🔍 故障排除:"
    echo "1. 檢查 .env 中的 PRIVATE_KEY 是否正確"
    echo "2. 確認部署者錢包有足夠的 BNB (至少 0.1 BNB)"
    echo "3. 檢查網路連接和 RPC 節點狀態"
    echo "4. 查看詳細錯誤訊息在上方輸出中"
    echo ""
    echo "📋 錯誤記錄已保存到: deployments/v25-2-3-deployment.json"
    exit 1
fi