#!/bin/bash

# V25 維護腳本 - 合約健康檢查和修復
# 
# 功能：
# 1. 檢查所有合約連接狀態
# 2. 修復已知問題（如 Party.dungeonCoreContract）
# 3. 驗證關鍵參數設置
# 4. 同步最新配置
# 
# 使用方式：
# bash scripts/active/v25-maintenance.sh check        # 只檢查狀態
# bash scripts/active/v25-maintenance.sh fix          # 修復問題
# bash scripts/active/v25-maintenance.sh sync         # 同步配置
# bash scripts/active/v25-maintenance.sh full         # 完整維護

# 載入 .env 文件
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# 配置
MODE=${1:-check}
LOG_FILE="scripts/deployments/maintenance-$(date +%Y%m%d-%H%M%S).log"

# 日誌函數
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_info() {
    log "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1"
}

log_success() {
    log "${GREEN}[✓]${NC} $(date '+%H:%M:%S') $1"
}

log_error() {
    log "${RED}[✗]${NC} $(date '+%H:%M:%S') $1"
}

log_warning() {
    log "${YELLOW}[!]${NC} $(date '+%H:%M:%S') $1"
}

# 標題
clear
echo -e "${BOLD}"
echo "=================================================="
echo "🔧 V25 維護腳本"
echo "=================================================="
echo -e "${NC}"
log_info "執行模式: $MODE"
echo ""

# 創建日誌目錄
mkdir -p scripts/deployments

# 1. 檢查合約狀態
check_contracts() {
    log_info "檢查合約連接狀態..."
    
    # 執行合約連接測試
    npx tsx scripts/test-contract-connections.ts 2>&1 | tee -a "$LOG_FILE"
    
    # 檢查特定問題
    if grep -q "Party.*dungeonCoreContract.*reverted" "$LOG_FILE"; then
        log_error "檢測到 Party 合約問題"
        echo "PARTY_ISSUE=true" >> /tmp/v25_issues.txt
    fi
    
    # 檢查 Oracle
    log_info "檢查 Oracle 狀態..."
    node -e "
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/');
    const oracleAddress = '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a';
    
    provider.getCode(oracleAddress).then(code => {
        if (code !== '0x') {
            console.log('Oracle 合約存在: ' + oracleAddress);
        } else {
            console.error('Oracle 合約不存在！');
        }
    });
    " 2>&1 | tee -a "$LOG_FILE"
    
    # 檢查關鍵地址匹配
    log_info "驗證配置一致性..."
    if [ -f "config/v25-config.js" ]; then
        node scripts/active/v25-verify-config.js 2>&1 | tee -a "$LOG_FILE"
    else
        log_error "找不到 v25-config.js"
    fi
}

# 2. 修復已知問題
fix_issues() {
    log_info "開始修復已知問題..."
    
    # 修復 Party 合約
    if [ -f "/tmp/v25_issues.txt" ] && grep -q "PARTY_ISSUE=true" /tmp/v25_issues.txt; then
        log_warning "修復 Party 合約連接..."
        npx hardhat run scripts/fix-party-dungeoncore.js --network bsc
        
        if [ $? -eq 0 ]; then
            log_success "Party 合約修復成功"
        else
            log_error "Party 合約修復失敗"
        fi
    fi
    
    # 修復其他合約依賴
    log_info "檢查並修復其他依賴..."
    npx hardhat run scripts/active/v25-fix-contract-dependencies.js --network bsc 2>&1 | tee -a "$LOG_FILE"
    
    # 清理臨時文件
    rm -f /tmp/v25_issues.txt
}

# 3. 同步配置
sync_configs() {
    log_info "同步配置到所有項目..."
    
    # 執行主同步腳本
    node scripts/active/v25-sync-all.js 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "配置同步成功"
    else
        log_error "配置同步失敗"
        return 1
    fi
    
    # 檢查新的 sync-system
    if [ -d "scripts/active/sync-system" ]; then
        log_info "執行 sync-system..."
        node scripts/active/sync-system/index.js 2>&1 | tee -a "$LOG_FILE"
    fi
    
    # Marketplace 同步
    log_info "檢查 Marketplace 配置..."
    node scripts/active/marketplace-sync.js --check-only 2>&1 | tee -a "$LOG_FILE"
}

# 4. 生成健康報告
generate_report() {
    log_info "生成健康檢查報告..."
    
    REPORT_FILE="scripts/deployments/health-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# V25 健康檢查報告

生成時間: $(date)

## 檢查結果

### 合約連接狀態
$(grep -E "(✅|❌|⚠️)" "$LOG_FILE" | tail -20)

### 發現的問題
$(grep -E "ERROR|失敗|reverted" "$LOG_FILE" | head -10)

### 修復操作
$(grep -E "修復|成功|fixed" "$LOG_FILE" | head -10)

## 當前配置

### 主要合約地址
EOF

    if [ -f "config/v25-config.js" ]; then
        node -e "
        const config = require('./config/v25-config.js');
        console.log('- DungeonCore:', config.contracts.DUNGEONCORE?.address || 'N/A');
        console.log('- Hero:', config.contracts.HERO?.address || 'N/A');
        console.log('- Relic:', config.contracts.RELIC?.address || 'N/A');
        console.log('- Party:', config.contracts.PARTY?.address || 'N/A');
        console.log('- SoulShard:', config.contracts.SOULSHARD?.address || 'N/A');
        " >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "## 建議操作" >> "$REPORT_FILE"
    
    if grep -q "ERROR" "$LOG_FILE"; then
        echo "- ⚠️ 發現錯誤，建議執行修復: bash scripts/active/v25-maintenance.sh fix" >> "$REPORT_FILE"
    fi
    
    if grep -q "配置不一致" "$LOG_FILE"; then
        echo "- ⚠️ 配置不一致，建議同步: bash scripts/active/v25-maintenance.sh sync" >> "$REPORT_FILE"
    fi
    
    log_success "報告已生成: $REPORT_FILE"
}

# 主流程
case $MODE in
    check)
        check_contracts
        generate_report
        ;;
    fix)
        check_contracts
        fix_issues
        generate_report
        ;;
    sync)
        sync_configs
        ;;
    full)
        check_contracts
        fix_issues
        sync_configs
        generate_report
        ;;
    *)
        log_error "無效的模式: $MODE"
        echo "使用方式："
        echo "  bash $0 check  # 只檢查狀態"
        echo "  bash $0 fix    # 修復問題"
        echo "  bash $0 sync   # 同步配置"
        echo "  bash $0 full   # 完整維護"
        exit 1
        ;;
esac

# 顯示總結
echo ""
echo -e "${BOLD}"
echo "=================================================="
echo "📊 維護總結"
echo "=================================================="
echo -e "${NC}"

# 統計結果
SUCCESS_COUNT=$(grep -c "✓\|成功" "$LOG_FILE" 2>/dev/null || echo 0)
ERROR_COUNT=$(grep -c "✗\|ERROR\|失敗" "$LOG_FILE" 2>/dev/null || echo 0)
WARNING_COUNT=$(grep -c "!\|WARNING\|警告" "$LOG_FILE" 2>/dev/null || echo 0)

echo "執行結果："
echo "  ✅ 成功: $SUCCESS_COUNT"
echo "  ❌ 錯誤: $ERROR_COUNT"
echo "  ⚠️  警告: $WARNING_COUNT"
echo ""
echo "日誌文件: $LOG_FILE"

# 如果有錯誤，顯示建議
if [ $ERROR_COUNT -gt 0 ]; then
    echo ""
    log_warning "發現 $ERROR_COUNT 個錯誤，建議："
    echo "1. 查看完整日誌: cat $LOG_FILE"
    echo "2. 執行修復: bash $0 fix"
    echo "3. 手動檢查 BSCScan: https://bscscan.com"
fi

exit 0