#!/bin/bash

# DungeonDelvers V11 自動部署腳本
# 確保所有命令都能正確執行

echo "🚀 開始 DungeonDelvers V11 自動部署流程"
echo "========================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查 .env 文件
if [ ! -f .env ]; then
    echo -e "${RED}❌ 錯誤: .env 文件不存在${NC}"
    echo "請確保 .env 文件包含必要的環境變數"
    exit 1
fi

# 檢查必要的環境變數
source .env
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ 錯誤: PRIVATE_KEY 未設置${NC}"
    exit 1
fi

if [ -z "$BSCSCAN_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  警告: BSCSCAN_API_KEY 未設置，將無法驗證合約${NC}"
fi

# 步驟 1: 清理和編譯
echo -e "${GREEN}📦 步驟 1: 清理並編譯合約${NC}"
echo "----------------------------"
npx hardhat clean
npx hardhat compile

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 編譯失敗！${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 編譯成功${NC}"
echo ""

# 步驟 2: 執行部署
echo -e "${GREEN}🚀 步驟 2: 部署合約到 BSC 主網${NC}"
echo "--------------------------------"
echo "這可能需要 10-15 分鐘，請耐心等待..."
echo ""

npx hardhat run scripts/deploy/deploy-complete-v11.js --network bsc

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 部署失敗！${NC}"
    echo "請檢查錯誤日誌: deployments/ERROR_bsc_*.json"
    exit 1
fi

echo -e "${GREEN}✅ 部署成功${NC}"
echo ""

# 步驟 3: 執行部署後更新
echo -e "${GREEN}📋 步驟 3: 生成更新配置${NC}"
echo "------------------------"
node scripts/post-deployment-update.js

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  警告: 無法生成更新配置${NC}"
fi

# 步驟 4: 執行快速測試
echo -e "${GREEN}🧪 步驟 4: 執行快速測試${NC}"
echo "------------------------"
if [ -f scripts/quick-test.js ]; then
    npx hardhat run scripts/quick-test.js --network bsc
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  警告: 快速測試失敗，請手動檢查${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  跳過快速測試（測試腳本不存在）${NC}"
fi

echo ""
echo -e "${GREEN}🎉 部署流程完成！${NC}"
echo "=================="
echo ""
echo "📁 生成的文件："
echo "  - deployments/bsc_all_addresses.json"
echo "  - deployments/bsc_addresses.env"
echo "  - deployments/bsc_subgraph_update.md"
echo "  - abis/*.json"
echo ""
echo "📋 下一步："
echo "  1. 查看部署結果和更新指令（上方輸出）"
echo "  2. 更新前端配置文件"
echo "  3. 更新 Vercel 和 Render 環境變數"
echo "  4. 部署新的子圖"
echo "  5. 驗證合約（如果設置了 BSCSCAN_API_KEY）"
echo ""
echo "💡 提示：所有更新指令都在上方輸出中"