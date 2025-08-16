#!/bin/bash

# ============================================
# V25 完整部署腳本 - 新版整合
# ============================================
# 
# 功能：
# 1. 環境檢查
# 2. 部署合約 (v25-deploy-complete-sequential.js)
# 3. 設置連接 (v25-fix-module-setup.js)
# 4. 同步配置 (新 sync-system)
# 5. 驗證合約 (可選)
# 6. 部署子圖 (可選)
# 
# 使用方式：
# bash scripts/active/v25-full-deploy-new.sh
# bash scripts/active/v25-full-deploy-new.sh --skip-subgraph
# bash scripts/active/v25-full-deploy-new.sh --skip-verify
# bash scripts/active/v25-full-deploy-new.sh v3.6.1  # 指定子圖版本

# 載入 .env 文件
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ 已載入 .env 環境變數"
fi

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 配置
SKIP_SUBGRAPH=false
SKIP_VERIFY=false
SUBGRAPH_VERSION=""
DEPLOYMENT_LOG="scripts/deployments/v25-deployment-$(date +%Y%m%d-%H%M%S).log"

# 解析參數
for arg in "$@"
do
    case $arg in
        --skip-subgraph)
        SKIP_SUBGRAPH=true
        shift
        ;;
        --skip-verify)
        SKIP_VERIFY=true
        shift
        ;;
        v[0-9].[0-9].[0-9])
        SUBGRAPH_VERSION=$arg
        shift
        ;;
        *)
        shift
        ;;
    esac
done

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $DEPLOYMENT_LOG
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $DEPLOYMENT_LOG
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $DEPLOYMENT_LOG
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $DEPLOYMENT_LOG
}

log_step() {
    echo -e "\n${CYAN}${BOLD}$1${NC}" | tee -a $DEPLOYMENT_LOG
    echo "========================================" | tee -a $DEPLOYMENT_LOG
}

# 顯示啟動畫面
clear
echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║             🚀 V25 完整部署腳本 - 新版整合                    ║"
echo "║                  一鍵部署 + 自動同步                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# 顯示配置
log_info "部署配置："
log_info "- 跳過子圖: $SKIP_SUBGRAPH"
log_info "- 跳過驗證: $SKIP_VERIFY"
log_info "- 子圖版本: ${SUBGRAPH_VERSION:-'將在同步時詢問'}"
log_info "- 日誌文件: $DEPLOYMENT_LOG"
echo ""

# ============================================
# 步驟 1: 環境檢查
# ============================================
log_step "步驟 1: 環境檢查"

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
    log_info "請在 .env 文件中設置 PRIVATE_KEY=\"你的私鑰\""
    exit 1
fi
log_success "PRIVATE_KEY 已設置"

if [ -z "$BSCSCAN_API_KEY" ]; then
    log_warning "BSCSCAN_API_KEY 未設置，將跳過自動驗證"
else
    log_success "BSCSCAN_API_KEY 已設置"
fi

# ============================================
# 步驟 2: 編譯合約
# ============================================
log_step "步驟 2: 編譯合約"

npx hardhat compile --force
if [ $? -eq 0 ]; then
    log_success "合約編譯成功"
else
    log_error "合約編譯失敗"
    exit 1
fi

# ============================================
# 步驟 3: 部署合約
# ============================================
log_step "步驟 3: 部署 V25 合約"

log_info "使用順序部署腳本..."
npx hardhat run scripts/active/v25-deploy-complete-sequential.js --network bsc
if [ $? -eq 0 ]; then
    log_success "V25 合約部署成功"
else
    log_error "V25 合約部署失敗"
    exit 1
fi

# ============================================
# 步驟 4: 設置合約連接（使用新的完整修復腳本）
# ============================================
log_step "步驟 4: 設置合約連接"

log_info "使用完整修復腳本設置所有合約連接..."

# 優先使用新的完整修復腳本
if [ -f "scripts/active/v25-complete-fix.js" ]; then
    log_info "執行 v25-complete-fix.js (完整雙向設定)..."
    npx hardhat run scripts/active/v25-complete-fix.js --network bsc
    if [ $? -eq 0 ]; then
        log_success "合約連接設置成功（使用完整修復腳本）"
    else
        log_warning "完整修復腳本執行失敗，嘗試備用腳本..."
        node scripts/active/v25-fix-module-setup.js
        if [ $? -eq 0 ]; then
            log_success "合約連接設置成功（使用備用腳本）"
        else
            log_error "合約連接設置失敗，請手動檢查"
        fi
    fi
else
    # 回退到原有腳本
    log_info "執行 v25-fix-module-setup.js..."
    node scripts/active/v25-fix-module-setup.js
    if [ $? -eq 0 ]; then
        log_success "合約連接設置成功"
    else
        log_warning "合約連接設置可能有問題，請檢查"
    fi
fi

# ============================================
# 步驟 5: 初始化地城（可選）
# ============================================
log_step "步驟 5: 初始化地城資料"

echo -e "${YELLOW}是否要初始化地城資料？(y/N):${NC}"
read -r init_dungeons
if [[ $init_dungeons =~ ^[Yy]$ ]]; then
    log_info "初始化地城資料..."
    node scripts/active/v25-setup-remaining-dungeons.js
    if [ $? -eq 0 ]; then
        log_success "地城資料初始化成功"
    else
        log_warning "地城資料初始化失敗，請稍後手動執行"
    fi
else
    log_info "跳過地城初始化"
fi

# ============================================
# 步驟 6: 同步配置（使用新系統）
# ============================================
log_step "步驟 6: 同步配置到各項目"

log_info "使用新的模組化同步系統..."
cd scripts/active/sync-system

if [ -n "$SUBGRAPH_VERSION" ]; then
    # 如果已指定版本，直接使用
    echo "$SUBGRAPH_VERSION" | node index.js
else
    # 互動式輸入版本
    log_info "請在提示時輸入子圖版本（如 v3.6.1）"
    node index.js
fi

if [ $? -eq 0 ]; then
    log_success "配置同步成功"
else
    log_error "配置同步失敗"
    cd ../../..
    exit 1
fi

cd ../../..

# ============================================
# 步驟 7: 驗證合約（可選）
# ============================================
if [ "$SKIP_VERIFY" = false ] && [ ! -z "$BSCSCAN_API_KEY" ]; then
    log_step "步驟 7: 驗證合約 (BSCScan)"
    
    log_info "開始驗證合約..."
    node scripts/verify/verify-all-v25.js
    if [ $? -eq 0 ]; then
        log_success "合約驗證完成"
    else
        log_warning "部分合約驗證失敗，請稍後手動驗證"
    fi
else
    log_info "跳過合約驗證"
fi

# ============================================
# 步驟 8: 部署子圖（可選）
# ============================================
if [ "$SKIP_SUBGRAPH" = false ]; then
    log_step "步驟 8: 部署子圖"
    
    echo -e "${YELLOW}是否要部署子圖？(y/N):${NC}"
    read -r deploy_subgraph
    if [[ $deploy_subgraph =~ ^[Yy]$ ]]; then
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
        
        # 部署
        log_info "部署子圖..."
        if [ -n "$SUBGRAPH_VERSION" ]; then
            npm run deploy:studio -- --version-label "$SUBGRAPH_VERSION"
        else
            npm run deploy:studio
        fi
        
        if [ $? -eq 0 ]; then
            log_success "子圖部署成功"
        else
            log_warning "子圖部署失敗，請手動部署"
        fi
        
        cd -
    else
        log_info "跳過子圖部署"
    fi
else
    log_info "跳過子圖部署（--skip-subgraph）"
fi

# ============================================
# 步驟 9: 最終檢查
# ============================================
log_step "步驟 9: 最終檢查"

log_info "執行部署狀態檢查..."
node scripts/active/v25-check-deployment-status.js
if [ $? -eq 0 ]; then
    log_success "部署狀態檢查通過"
else
    log_warning "部署狀態有問題，請檢查"
fi

# ============================================
# 完成
# ============================================
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 部署完成！                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
log_success "所有步驟完成！"
echo ""
echo "📋 後續步驟建議："
echo "1. 檢查前端：cd /Users/sotadic/Documents/GitHub/DungeonDelvers && npm run dev"
echo "2. 檢查後端：cd /Users/sotadic/Documents/dungeon-delvers-metadata-server && npm start"
echo "3. 驗證配置：cd scripts/active/sync-system && node index.js --validate-only"
echo ""
echo "📄 部署日誌已保存到: $DEPLOYMENT_LOG"
echo ""

# 保存部署資訊
echo "=========================" >> $DEPLOYMENT_LOG
echo "部署完成時間: $(date)" >> $DEPLOYMENT_LOG
echo "子圖版本: ${SUBGRAPH_VERSION:-'未指定'}" >> $DEPLOYMENT_LOG
echo "=========================" >> $DEPLOYMENT_LOG