#!/bin/bash

# V26 VRF 完整部署腳本 - 統一 VRF 版本一鍵部署
# 
# 功能：
# 1. 環境檢查
# 2. 部署 VRF 合約
# 3. 驗證 VRF 合約
# 4. 同步 VRF 配置
# 5. 部署子圖（可選）
# 
# 使用方式：
# bash scripts/active/v26-full-deploy-vrf.sh
# bash scripts/active/v26-full-deploy-vrf.sh --skip-subgraph
# bash scripts/active/v26-full-deploy-vrf.sh --test-mode
# bash scripts/active/v26-full-deploy-vrf.sh --testnet

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
PURPLE='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 配置
SKIP_SUBGRAPH=false
TEST_MODE=false
USE_TESTNET=false
SUBGRAPH_VERSION=""
DEPLOYMENT_LOG="scripts/deployments/v26-vrf-deployment-$(date +%Y%m%d-%H%M%S).log"

# 解析參數
for arg in "$@"
do
    case $arg in
        --skip-subgraph)
        SKIP_SUBGRAPH=true
        shift
        ;;
        --test-mode)
        TEST_MODE=true
        shift
        ;;
        --testnet)
        USE_TESTNET=true
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

log_vrf() {
    log "${PURPLE}[VRF]${NC} $(date '+%H:%M:%S') $1"
}

# 標題
clear
echo -e "${BOLD}"
echo "=================================================="
echo "🔮 V26 VRF 完整部署腳本 - 統一 VRF 版本"
echo "=================================================="
echo -e "${NC}"

# 創建日誌目錄
mkdir -p scripts/deployments

# 顯示 VRF 特色
echo -e "${PURPLE}"
echo "🔮 VRF 升級特色："
echo "- 所有隨機性操作使用 Chainlink VRF v2.5"
echo "- Direct Funding 模式 (用戶支付 BNB)"
echo "- 統一稀有度機率 (44%/35%/15%/5%/1%)"
echo "- 預計等待時間：10-30 秒"
echo -e "${NC}"
echo ""

# 詢問子圖版本（如果沒有通過參數提供）
if [ -z "$SUBGRAPH_VERSION" ] && [ "$SKIP_SUBGRAPH" = false ]; then
    echo -e "${YELLOW}請輸入子圖版本號（例如：v4.0.0-vrf）：${NC}"
    read -p "版本號: " SUBGRAPH_VERSION
    
    # 驗證版本格式
    if [[ ! $SUBGRAPH_VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
        log_error "版本號格式不正確，請使用格式：v4.0.0-vrf"
        exit 1
    fi
    
    log_info "將使用子圖版本：$SUBGRAPH_VERSION"
fi

# 設置網路
if [ "$USE_TESTNET" = true ]; then
    NETWORK="bsc_testnet"
    log_warning "使用 BSC 測試網"
else
    NETWORK="bsc"
    log_info "使用 BSC 主網"
fi

# 顯示配置
log_info "部署配置："
log_info "- 網路: $NETWORK"
log_info "- 跳過子圖: $SKIP_SUBGRAPH"
log_info "- 測試模式: $TEST_MODE"
log_info "- 子圖版本: ${SUBGRAPH_VERSION:-'未設置'}"
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

# 檢查網路連接
log_info "檢查 BSC 網路連接..."
npx hardhat run scripts/utils/check-network.js --network $NETWORK &> /dev/null
if [ $? -eq 0 ]; then
    log_success "BSC 網路連接正常"
else
    log_error "無法連接到 BSC 網路"
    exit 1
fi

# VRF 特定檢查
log_vrf "檢查 VRF 配置..."
if [ "$USE_TESTNET" = true ]; then
    VRF_WRAPPER="0x699d428ee890d55D56d5FC6e26290f3247A762bd"
    LINK_TOKEN="0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06"
    log_vrf "BSC 測試網 VRF 配置"
else
    VRF_WRAPPER="0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94"
    LINK_TOKEN="0x404460C6A5EdE2D891e8297795264fDe62ADBB75"
    log_vrf "BSC 主網 VRF 配置"
fi
log_vrf "VRF Wrapper: $VRF_WRAPPER"
log_vrf "LINK Token: $LINK_TOKEN"

echo ""

# 2. 編譯合約
log_info "編譯 VRF 合約..."
npx hardhat compile --force
if [ $? -eq 0 ]; then
    log_success "VRF 合約編譯成功"
else
    log_error "VRF 合約編譯失敗"
    exit 1
fi

echo ""

# 3. 部署 VRF 合約
log_vrf "開始部署 V26 VRF 合約..."
if [ "$TEST_MODE" = true ]; then
    log_warning "測試模式：跳過實際部署"
else
    npx hardhat run scripts/active/v26-deploy-complete-sequential-vrf.js --network $NETWORK
    if [ $? -eq 0 ]; then
        log_success "V26 VRF 合約部署成功"
    else
        log_error "V26 VRF 合約部署失敗"
        exit 1
    fi
fi

echo ""

# 4. 等待區塊確認（生產環境）
if [ "$TEST_MODE" = false ] && [ "$USE_TESTNET" = false ]; then
    log_info "等待 30 秒讓交易確認..."
    sleep 30
fi

# 5. 驗證合約（如果有 API key）
if [ ! -z "$BSCSCAN_API_KEY" ] && [ "$TEST_MODE" = false ]; then
    log_info "開始驗證 VRF 合約..."
    node scripts/active/v26-verify-contracts-vrf.js
    if [ $? -eq 0 ]; then
        log_success "VRF 合約驗證完成"
    else
        log_warning "部分 VRF 合約驗證失敗，請稍後手動驗證"
    fi
else
    log_warning "跳過合約驗證"
fi

echo ""

# 6. 同步 VRF 配置
log_vrf "同步 VRF 配置到各項目..."
if [ -n "$SUBGRAPH_VERSION" ]; then
    node scripts/active/v26-sync-all-vrf.js "$SUBGRAPH_VERSION"
else
    node scripts/active/v26-sync-all-vrf.js
fi
if [ $? -eq 0 ]; then
    log_success "VRF 配置同步成功"
else
    log_error "VRF 配置同步失敗"
    exit 1
fi

echo ""

# 7. VRF 特定警告
log_vrf "🔮 VRF 部署注意事項："
log_warning "1. 前端需要更新處理異步操作 (10-30秒等待)"
log_warning "2. 子圖需要添加 VRF 事件處理 (手動更新 schema)"
log_warning "3. 用戶成本增加約 $0.6-1.0 每次操作"
log_warning "4. 稀有度機率已統一 (1個和50個相同機率)"
echo ""

# 8. 部署子圖（可選）
if [ "$SKIP_SUBGRAPH" = false ] && [ "$TEST_MODE" = false ]; then
    log_vrf "準備部署 VRF 子圖..."
    log_warning "⚠️ 子圖需要手動更新 schema.graphql 和 mapping.ts 以支援 VRF 事件"
    
    echo -e "${YELLOW}是否已更新子圖以支援 VRF？(y/N):${NC}"
    read -r subgraph_ready
    
    if [[ $subgraph_ready =~ ^[Yy]$ ]]; then
        # 切換到子圖目錄
        cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
        
        # Codegen
        log_info "執行子圖 codegen..."
        npm run codegen
        if [ $? -eq 0 ]; then
            log_success "子圖 codegen 成功"
        else
            log_error "子圖 codegen 失敗"
            cd -
            exit 1
        fi
        
        # Build
        log_info "構建子圖..."
        npm run build
        if [ $? -eq 0 ]; then
            log_success "子圖構建成功"
        else
            log_error "子圖構建失敗"
            cd -
            exit 1
        fi
        
        # Deploy
        log_info "部署子圖..."
        log_warning "請在提示時輸入版本標籤（如 $SUBGRAPH_VERSION）"
        npm run deploy
        
        # 返回原目錄
        cd -
    else
        log_warning "跳過子圖部署 - 請手動更新子圖支援 VRF"
    fi
else
    log_warning "跳過子圖部署"
fi

echo ""

# 9. 生成部署總結
log_info "生成 VRF 部署總結..."

if [ -f "config/v26-vrf-config.js" ]; then
    echo -e "${BOLD}"
    echo "=================================================="
    echo "📊 V26 VRF 部署總結"
    echo "=================================================="
    echo -e "${NC}"
    
    # 使用 node 讀取並顯示關鍵地址
    node -e "
    const config = require('./config/v26-vrf-config.js');
    console.log('🔮 VRF 合約地址：');
    console.log('- Hero_UnifiedVRF:', config.contracts.HERO?.address || 'N/A');
    console.log('- Relic_UnifiedVRF:', config.contracts.RELIC?.address || 'N/A');
    console.log('- DungeonMaster_UnifiedVRF:', config.contracts.DUNGEONMASTER?.address || 'N/A');
    console.log('- AltarOfAscension_UnifiedVRF:', config.contracts.ALTAROFASCENSION?.address || 'N/A');
    console.log('');
    console.log('📦 標準合約地址：');
    console.log('- DungeonCore:', config.contracts.DUNGEONCORE?.address || 'N/A');
    console.log('- SoulShard:', config.contracts.SOULSHARD?.address || 'N/A');
    console.log('');
    console.log('🔗 VRF 配置：');
    console.log('- VRF Wrapper:', config.vrfConfig?.wrapperAddress || 'N/A');
    console.log('- LINK Token:', config.vrfConfig?.linkToken || 'N/A');
    console.log('- 使用原生支付:', config.vrfConfig?.useNativePayment || false);
    console.log('');
    console.log('📊 統一稀有度機率：');
    console.log('- 1星:', config.unifiedRarityConfig?.rarity1Chance || 0, '%');
    console.log('- 2星:', config.unifiedRarityConfig?.rarity2Chance || 0, '%');
    console.log('- 3星:', config.unifiedRarityConfig?.rarity3Chance || 0, '%');
    console.log('- 4星:', config.unifiedRarityConfig?.rarity4Chance || 0, '%');
    console.log('- 5星:', config.unifiedRarityConfig?.rarity5Chance || 0, '%');
    console.log('');
    console.log('部署區塊:', config.startBlock);
    "
fi

echo ""

# 10. 顯示下一步
echo -e "${BOLD}"
echo "=================================================="
echo "🎯 V26 VRF 部署後續步驟"
echo "=================================================="
echo -e "${NC}"

echo "1. 測試 VRF 功能："
echo "   cd /Users/sotadic/Documents/GitHub/DungeonDelvers"
echo "   npm run dev"
echo "   # 測試鑄造等待時間 (10-30秒)"
echo "   # 測試統一稀有度機率"
echo ""

echo "2. 更新前端處理 VRF："
echo "   - 實現等待狀態 UI"
echo "   - 添加請求進度追蹤"
echo "   - 更新費用計算顯示"
echo ""

echo "3. 更新子圖支援 VRF："
echo "   cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers"
echo "   # 手動更新 schema.graphql 添加 VRF 實體"
echo "   # 更新 mapping.ts 處理 VRF 事件"
echo "   npm run codegen && npm run build && npm run deploy"
echo ""

echo "4. VRF 功能測試："
echo "   # 測試單個 NFT 鑄造 (使用 VRF)"
echo "   # 測試批量鑄造 (統一機率)"
echo "   # 測試升級系統 (異步結果)"
echo "   # 測試地城探索 (VRF 隨機)"
echo ""

echo "5. 監控 VRF 性能："
echo "   - 平均等待時間"
echo "   - VRF 費用統計"
echo "   - 失敗率監控"
echo ""

# 11. 完成
log_success "🎉 V26 VRF 部署流程完成！"
log_vrf "🔮 所有合約已升級為統一 VRF 版本"
log_info "完整日誌已保存至: $DEPLOYMENT_LOG"

# 如果有錯誤，顯示錯誤摘要
if grep -q "ERROR" "$DEPLOYMENT_LOG"; then
    echo ""
    log_warning "部署過程中有錯誤發生："
    grep "ERROR" "$DEPLOYMENT_LOG" | tail -5
fi

# VRF 成本提醒
echo ""
echo -e "${PURPLE}"
echo "💰 VRF 成本提醒："
echo "- 每次操作增加約 $0.6-1.0 VRF 費用"
echo "- 用戶需要支付 BNB (Direct Funding)"
echo "- 建議在 UI 明確顯示費用明細"
echo -e "${NC}"

exit 0