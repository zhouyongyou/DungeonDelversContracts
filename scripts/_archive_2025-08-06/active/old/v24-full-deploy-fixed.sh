#!/bin/bash

# V24 完整部署腳本（修正版）
# 使用方式: bash scripts/active/v24-full-deploy-fixed.sh

echo "🚀 開始 V24 完整部署流程"
echo "=================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查環境變數
if [ -z "$PRIVATE_KEY" ] && [ ! -f ".env" ]; then
    echo -e "${RED}❌ 錯誤: 缺少 PRIVATE_KEY 環境變數${NC}"
    echo "請先設置: export PRIVATE_KEY=你的私鑰"
    echo "或創建 .env 文件"
    exit 1
fi

if [ -z "$BSCSCAN_API_KEY" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  警告: 缺少 BSCSCAN_API_KEY，將跳過合約驗證${NC}"
fi

# 步驟 1: 部署合約（使用 Hardhat）
echo -e "\n${GREEN}📦 步驟 1: 部署合約${NC}"
echo "執行: npx hardhat run scripts/active/v24-deploy-complete-fixed.js --network bsc"
npx hardhat run scripts/active/v24-deploy-complete-fixed.js --network bsc

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 部署失敗${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 部署成功${NC}"

# 步驟 2: 驗證合約（如果有 API Key）
if [ ! -z "$BSCSCAN_API_KEY" ] || [ -f ".env" ]; then
    echo -e "\n${GREEN}🔍 步驟 2: 驗證合約${NC}"
    echo "等待 30 秒讓 BSCScan 索引合約..."
    sleep 30
    
    echo "執行: node scripts/active/v24-verify-contracts.js"
    node scripts/active/v24-verify-contracts.js
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  部分合約驗證失敗，但不影響使用${NC}"
    else
        echo -e "${GREEN}✅ 驗證完成${NC}"
    fi
else
    echo -e "\n${YELLOW}⏭️  跳過合約驗證（無 API Key）${NC}"
fi

# 步驟 3: 同步配置
echo -e "\n${GREEN}🔄 步驟 3: 同步配置到所有項目${NC}"
echo "執行: node scripts/active/v24-sync-all.js"
node scripts/active/v24-sync-all.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 配置同步失敗${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 配置同步成功${NC}"

# 完成
echo -e "\n${GREEN}🎉 V24 部署完成！${NC}"
echo "=================================="
echo -e "\n下一步:"
echo "1. 前端測試: cd ../GitHub/DungeonDelvers && npm run dev"
echo "2. 子圖部署:"
echo "   cd ../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers"
echo "   npm run codegen && npm run build && npm run deploy"
echo -e "\n${YELLOW}💡 提示: 可以直接在前端測試批量鑄造功能${NC}"