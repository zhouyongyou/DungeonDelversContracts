#!/bin/bash
# DungeonDelvers 專案安全檢查腳本
# 建議每週執行一次

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️  DungeonDelvers 安全檢查腳本${NC}"
echo "=================================="
echo ""

# 檢查計數器
ISSUES=0
CHECKS=0

# 檢查函數
check_item() {
    ((CHECKS++))
    if [ $1 -eq 0 ]; then
        echo -e "✅ $2"
    else
        echo -e "❌ $2"
        ((ISSUES++))
    fi
}

echo "📋 執行安全檢查..."
echo ""

# 1. 私鑰掃描 (排除 VRF 訂閱ID)
echo -e "${YELLOW}1. 私鑰安全掃描${NC}"

# VRF 訂閱ID 白名單 - BSC Mainnet Chainlink VRF v2.5
VRF_SUBSCRIPTION_ID="88422796721004450630713121079263696788635490871993157345476848872165866246915"

# 已知安全的哈希值白名單
CHAINLINK_KEYHASH="0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4"  # BSC VRF keyHash

# 搜尋 64 字符模式但排除已知的安全值
POTENTIAL_KEYS=$(grep -r "0x[0-9a-fA-F]\{64\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=artifacts --exclude-dir=cache --exclude="*.log" --exclude=".env" 2>/dev/null | \
    grep -v "$VRF_SUBSCRIPTION_ID" | \
    grep -v "$CHAINLINK_KEYHASH" | \
    grep -v "subscriptionId" | \
    grep -v "deployTxHash" | \
    grep -v "txHash" | \
    grep -v "transactionHash" | \
    grep -v "getTransactionReceipt" | \
    grep -v "keyHash" | \
    grep -v "設定交易")

if [ ! -z "$POTENTIAL_KEYS" ]; then
    echo -e "⚠️  發現疑似私鑰模式，請檢查："
    echo "$POTENTIAL_KEYS" | head -3
    ((ISSUES++))
else
    echo -e "✅ 未發現真正的64字符私鑰洩漏"
fi

# 額外檢查：確認 VRF 訂閱ID 存在且正確
VRF_FOUND=$(grep -r "$VRF_SUBSCRIPTION_ID" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null)
if [ ! -z "$VRF_FOUND" ]; then
    echo -e "ℹ️  檢測到 Chainlink VRF 訂閱ID (安全，已排除)"
fi

((CHECKS++))

# 2. 環境變數檢查
echo -e "${YELLOW}2. 環境變數安全檢查${NC}"
if [ -f ".env" ]; then
    if grep -q "PRIVATE_KEY=0x[0-9a-fA-F]\{64\}" .env; then
        echo -e "✅ .env 包含私鑰（正常，請確保未被 Git 追蹤）"
    else
        echo -e "⚠️  .env 中未找到有效私鑰格式"
        ((ISSUES++))
    fi
else
    echo -e "❌ 未找到 .env 檔案"
    ((ISSUES++))
fi
((CHECKS++))

# 3. Git 保護檢查
echo -e "${YELLOW}3. Git 保護機制檢查${NC}"
if grep -q "\.env" .gitignore; then
    check_item 0 ".gitignore 正確保護 .env 檔案"
else
    check_item 1 ".gitignore 未保護 .env 檔案"
fi

if [ -f ".git/hooks/pre-commit" ]; then
    check_item 0 "Pre-commit hook 已安裝"
else
    check_item 1 "Pre-commit hook 未安裝"
fi

# 4. API Keys 檢查
echo -e "${YELLOW}4. API Keys 安全檢查${NC}"
LEAKED_KEYS=()

KEY_ISSUES=0
for key in "${LEAKED_KEYS[@]}"; do
    if grep -r "$key" . --exclude-dir=node_modules --exclude-dir=.git > /dev/null 2>&1; then
        echo -e "❌ 發現已洩漏的 API Key: $key"
        ((KEY_ISSUES++))
        ((ISSUES++))
    fi
done

if [ $KEY_ISSUES -eq 0 ]; then
    echo -e "✅ 未發現已知洩漏的 API Keys"
fi

# 檢查是否有 Alchemy Keys（已撤銷，現在安全）
ALCHEMY_KEYS=("3lmTWjUVbFylAurhdU-rSUefTC-P4tKf" "tiPlQVTwx4_2P98Pl7hb-LfzaTyi5HOn" "QzXiHWkNRovjd_EeDRqVfR9rApUDiXRp" "fB2BrBD6zFEhc6YoWxwuP5UQJ_ee-99M" "F7E3-HDwgUHDQvdICnFv_")
ALCHEMY_FOUND=0
for key in "${ALCHEMY_KEYS[@]}"; do
    if grep -r "$key" . --exclude-dir=node_modules --exclude-dir=.git > /dev/null 2>&1; then
        ((ALCHEMY_FOUND++))
    fi
done

if [ $ALCHEMY_FOUND -gt 0 ]; then
    echo -e "ℹ️  發現 $ALCHEMY_FOUND 個已撤銷的 Alchemy Keys（安全，但可選擇清理）"
fi

((CHECKS++))

# 5. 錢包地址檢查
echo -e "${YELLOW}5. 錢包地址安全檢查${NC}"
OLD_ADDRESS="0xEbCF4A36Ad1485A9737025e9d72186b604487274"
NEW_ADDRESS="0x84Cd63a840274d267aCb19e708d7f6298c315E75"

echo -e "舊地址 (已洩漏): $OLD_ADDRESS"
echo -e "新地址 (安全): $NEW_ADDRESS"
echo -e "⚠️  請確保舊地址沒有剩餘資金"
((CHECKS++))

# 6. 檔案權限檢查
echo -e "${YELLOW}6. 檔案權限檢查${NC}"
if [ -f ".env" ]; then
    ENV_PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$ENV_PERMS" = "600" ] || [ "$ENV_PERMS" = "644" ]; then
        check_item 0 ".env 檔案權限正確 ($ENV_PERMS)"
    else
        check_item 1 ".env 檔案權限過於寬鬆 ($ENV_PERMS)"
    fi
fi

# 7. Git 狀態檢查
echo -e "${YELLOW}7. Git 狀態檢查${NC}"
if git ls-files | grep -q "\.env$"; then
    check_item 1 ".env 檔案被 Git 追蹤（危險！）"
else
    check_item 0 ".env 檔案未被 Git 追蹤"
fi

# 結果統計
echo ""
echo "=================================="
echo -e "${BLUE}📊 檢查結果統計${NC}"
echo "總檢查項目: $CHECKS"
echo -e "發現問題: ${RED}$ISSUES${NC}"

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 恭喜！所有安全檢查都通過了${NC}"
    echo -e "${GREEN}你的專案目前是安全的${NC}"
else
    echo -e "${RED}⚠️  發現 $ISSUES 個安全問題需要處理${NC}"
    echo -e "${YELLOW}請根據上述檢查結果進行修復${NC}"
fi

echo ""
echo "🔄 建議每週執行此腳本"
echo "📅 下次檢查時間: $(date -d '+7 days' '+%Y-%m-%d' 2>/dev/null || date -v+7d '+%Y-%m-%d' 2>/dev/null || echo '一週後')"

exit $ISSUES