#!/bin/bash

# V25 子圖部署腳本（修復版）
# 添加了 graph auth 認證步驟

echo "================================"
echo "V25 子圖部署腳本（修復版）"
echo "================================"

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置
DEPLOY_KEY="1a4c2c9d0a6d88c5a67193a04eb93e14"
SUBGRAPH_NAME="dungeon-delvers---bsc"
SUBGRAPH_PATH="/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers"

# 檢查 graph-cli 是否安裝
if ! command -v graph &> /dev/null; then
    echo -e "${RED}錯誤：graph-cli 未安裝${NC}"
    echo "請先執行: yarn global add @graphprotocol/graph-cli"
    exit 1
fi

# 進入子圖目錄
cd "$SUBGRAPH_PATH" || exit 1

echo -e "${YELLOW}當前目錄: $(pwd)${NC}"

# 步驟 1: 認證（關鍵步驟！）
echo -e "${GREEN}步驟 1: 認證 Graph Studio${NC}"
graph auth --studio "$DEPLOY_KEY"

if [ $? -ne 0 ]; then
    echo -e "${RED}認證失敗！${NC}"
    exit 1
fi

echo -e "${GREEN}認證成功！${NC}"

# 步驟 2: 代碼生成
echo -e "${GREEN}步驟 2: 生成 TypeScript 代碼${NC}"
graph codegen

if [ $? -ne 0 ]; then
    echo -e "${RED}代碼生成失敗！${NC}"
    exit 1
fi

# 步驟 3: 構建子圖
echo -e "${GREEN}步驟 3: 構建子圖${NC}"
graph build

if [ $? -ne 0 ]; then
    echo -e "${RED}構建失敗！${NC}"
    exit 1
fi

# 步驟 4: 部署到 Studio
echo -e "${GREEN}步驟 4: 部署到 The Graph Studio${NC}"
echo -e "${YELLOW}部署名稱: $SUBGRAPH_NAME${NC}"

# 使用 --studio 標誌來指定部署到 Studio
graph deploy --studio "$SUBGRAPH_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}子圖部署成功！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "子圖名稱: ${YELLOW}$SUBGRAPH_NAME${NC}"
    echo -e "查看子圖: ${YELLOW}https://thegraph.com/studio/subgraph/$SUBGRAPH_NAME${NC}"
else
    echo -e "${RED}部署失敗！${NC}"
    exit 1
fi

# 提供後續步驟
echo ""
echo -e "${GREEN}後續步驟：${NC}"
echo "1. 在 The Graph Studio 中發布子圖到去中心化網絡"
echo "2. 使用 GRT 代幣進行 Signal"
echo "3. 等待索引器開始索引你的子圖"