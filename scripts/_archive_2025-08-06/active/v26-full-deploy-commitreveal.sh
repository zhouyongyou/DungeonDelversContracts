#!/bin/bash

# V26 Commit-Reveal 完整部署腳本 - 一鍵部署
# 
# 功能：
# 1. 環境檢查
# 2. 部署 Commit-Reveal 合約
# 3. 設置未揭示 URI
# 4. 驗證合約
# 5. 同步配置
# 
# 使用方式：
# bash scripts/active/v26-full-deploy-commitreveal.sh
# bash scripts/active/v26-full-deploy-commitreveal.sh --skip-uri-setup
# bash scripts/active/v26-full-deploy-commitreveal.sh --test-mode

# 載入 .env 文件
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "已載入 .env 環境變數"
fi

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 配置
SKIP_URI_SETUP=false
TEST_MODE=false
DEPLOYMENT_LOG="scripts/deployments/v26-deployment-$(date +%Y%m%d-%H%M%S).log"

# 解析參數
for arg in "$@"
do
    case $arg in
        --skip-uri-setup)
        SKIP_URI_SETUP=true
        shift
        ;;
        --test-mode)
        TEST_MODE=true
        shift
        ;;
        *)
        shift
        ;;
    esac
done

# 日誌函數
log() {
    echo -e "$1" | tee -a "$DEPLOYMENT_LOG"
}

log_info() {
    log "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $1"
}

log_critical() {
    log "${MAGENTA}[CRITICAL]${NC} $(date '+%H:%M:%S') $1"
}

# 標題
clear
echo -e "${BOLD}"
echo "=================================================="
echo "🚀 V26 Commit-Reveal 完整部署腳本"
echo "=================================================="
echo -e "${NC}"

# 創建日誌目錄
mkdir -p scripts/deployments

# ⚠️ 安全警告
echo -e "${BOLD}${RED}"
echo "=================================================="
echo "⚠️  重要安全警告"
echo "=================================================="
echo -e "${NC}${YELLOW}"
echo "當前 Commit-Reveal 實現存在預測攻擊風險！"
echo "攻擊者可能預測結果並選擇性揭示。"
echo ""
echo "建議修復方案："
echo "1. 強制揭示（過期自動揭示）"
echo "2. 承諾時鎖定結果"
echo "3. 經濟懲罰機制"
echo "4. 集成 Chainlink VRF"
echo -e "${NC}"
echo ""
read -p "確認已了解風險並繼續部署？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_error "部署已取消"
    exit 1
fi

# 顯示配置
log_info "部署配置："
log_info "- 跳過 URI 設置: $SKIP_URI_SETUP"
log_info "- 測試模式: $TEST_MODE"
log_info "- 日誌文件: $DEPLOYMENT_LOG"
echo ""

# 1. 環境檢查
log_info "執行環境檢查..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安裝"
    exit 1
fi
NODE_VERSION=$(node -v)
log_success "Node.js 版本: $NODE_VERSION"

# 檢查環境變數
if [ -z "$PRIVATE_KEY" ]; then
    log_error "PRIVATE_KEY 環境變數未設置"
    log_info "請執行: export PRIVATE_KEY=\"你的私鑰\""
    exit 1
fi
log_success "PRIVATE_KEY 已設置"

if [ -z "$BSCSCAN_API_KEY" ]; then
    log_warning "BSCSCAN_API_KEY 未設置，將跳過自動驗證"
else
    log_success "BSCSCAN_API_KEY 已設置"
fi

# 檢查未揭示 URI 文件
if [ "$SKIP_URI_SETUP" = false ]; then
    if [ ! -f "unrevealed-uris.json" ]; then
        log_warning "未找到 unrevealed-uris.json"
        log_info "請先執行: node scripts/upload-unrevealed-assets.js"
        read -p "是否跳過 URI 設置？(y/n): " skip_uri
        if [[ $skip_uri =~ ^[Yy]$ ]]; then
            SKIP_URI_SETUP=true
        else
            exit 1
        fi
    else
        log_success "找到 unrevealed-uris.json"
    fi
fi

echo ""

# 2. 編譯合約
log_info "編譯 Commit-Reveal 合約..."
npx hardhat compile --force
if [ $? -eq 0 ]; then
    log_success "合約編譯成功"
else
    log_error "合約編譯失敗"
    exit 1
fi

echo ""

# 3. 部署合約
log_info "開始部署 V26 Commit-Reveal 合約..."
log_critical "BSC 揭示窗口時間：3.19 分鐘（255 區塊 × 0.75 秒）"

if [ "$TEST_MODE" = true ]; then
    log_warning "測試模式：跳過實際部署"
else
    npx hardhat run scripts/active/v26-deploy-commitreveal-sequential.js --network bsc
    if [ $? -eq 0 ]; then
        log_success "V26 合約部署成功"
    else
        log_error "V26 合約部署失敗"
        exit 1
    fi
fi

echo ""

# 4. 設置未揭示 URI
if [ "$SKIP_URI_SETUP" = false ] && [ "$TEST_MODE" = false ]; then
    log_info "設置未揭示 URI..."
    
    # 從部署結果讀取合約地址
    if [ -f ".env.deployment" ]; then
        export $(cat .env.deployment | grep -v '^#' | xargs)
        
        # 使用 node 設置 URI
        node -e "
        const { ethers } = require('hardhat');
        const uris = require('./unrevealed-uris.json');
        
        async function setURIs() {
            const [signer] = await ethers.getSigners();
            
            // Hero
            if (process.env.HERO_ADDRESS) {
                const hero = await ethers.getContractAt('Hero', process.env.HERO_ADDRESS);
                await hero.setUnrevealedURI(uris['hero-unrevealed'].metadataURI);
                console.log('✅ Hero 未揭示 URI 已設置');
            }
            
            // Relic
            if (process.env.RELIC_ADDRESS) {
                const relic = await ethers.getContractAt('Relic', process.env.RELIC_ADDRESS);
                await relic.setUnrevealedURI(uris['relic-unrevealed'].metadataURI);
                console.log('✅ Relic 未揭示 URI 已設置');
            }
        }
        
        setURIs().catch(console.error);
        " --network bsc
    else
        log_warning "未找到部署地址，跳過 URI 設置"
    fi
fi

echo ""

# 5. 驗證合約
if [ ! -z "$BSCSCAN_API_KEY" ] && [ "$TEST_MODE" = false ]; then
    log_info "開始驗證合約..."
    log_info "等待 30 秒讓 BSCScan 索引合約..."
    sleep 30
    
    node scripts/active/v26-verify-commitreveal.js
    if [ $? -eq 0 ]; then
        log_success "合約驗證完成"
    else
        log_warning "部分合約驗證失敗，請稍後手動驗證"
    fi
else
    log_warning "跳過合約驗證"
fi

echo ""

# 6. 更新前端配置
log_info "更新前端配置..."
if [ -f ".env.deployment" ]; then
    # 複製到前端項目
    cp .env.deployment /Users/sotadic/Documents/GitHub/DungeonDelvers/.env.contracts
    log_success "前端合約地址已更新"
    
    # 提醒更新 ABI
    log_warning "請記得更新前端 ABI 文件："
    echo "   1. 複製 artifacts/contracts/current/*.sol/*.json"
    echo "   2. 到前端項目的 contracts/abis/ 目錄"
else
    log_warning "未找到部署地址文件"
fi

echo ""

# 7. 生成部署總結
log_info "生成部署總結..."

echo -e "${BOLD}"
echo "=================================================="
echo "📊 V26 Commit-Reveal 部署總結"
echo "=================================================="
echo -e "${NC}"

if [ -f ".env.deployment" ]; then
    cat .env.deployment | grep "_ADDRESS" | while read line; do
        echo "- $line"
    done
fi

echo ""
echo -e "${BOLD}${YELLOW}⚠️ Commit-Reveal 特性：${NC}"
echo "- 鑄造：commit 後需在 3 分鐘內 reveal"
echo "- 升級：材料在 commit 時鎖定，reveal 時才燃燒"
echo "- 探索：隊伍立即進入冷卻，reveal 獲得結果"
echo "- 過期：可申請退款（注意安全風險）"

echo ""

# 8. 顯示下一步
echo -e "${BOLD}"
echo "=================================================="
echo "🎯 下一步行動"
echo "=================================================="
echo -e "${NC}"

echo "1. 更新前端代碼支援 Commit-Reveal："
echo "   - 實施兩步驟 UI 流程"
echo "   - 加入倒計時顯示"
echo "   - 實施緊急通知系統"
echo ""

echo "2. 更新子圖支援新事件："
echo "   - MintCommitted/MintRevealed"
echo "   - UpgradeCommitted/UpgradeRevealed"
echo "   - ExpeditionCommitted/ExpeditionRevealed"
echo ""

echo "3. 考慮實施安全修復："
echo "   - 強制揭示機制"
echo "   - 經濟懲罰系統"
echo "   - 或集成 Chainlink VRF"
echo ""

echo "4. 測試關鍵流程："
echo "   - 正常 commit-reveal 流程"
echo "   - 過期處理流程"
echo "   - 退款機制"
echo ""

# 9. 完成
log_success "🎉 V26 Commit-Reveal 部署流程完成！"
log_info "完整日誌已保存至: $DEPLOYMENT_LOG"

# 最終安全提醒
echo ""
echo -e "${BOLD}${RED}=================================================="
echo "🚨 最終安全提醒"
echo "=================================================="
echo -e "${NC}${YELLOW}"
echo "請在生產環境部署前解決預測攻擊問題！"
echo "當前實現允許攻擊者選擇性揭示有利結果。"
echo -e "${NC}"

exit 0