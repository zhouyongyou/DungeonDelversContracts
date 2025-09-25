#!/bin/bash

# 🚀 全面更新到 v1.4.0.3 版本
# 包含版本號更新和合約地址替換

echo "🔄 DungeonDelvers v1.4.0.3 全面更新腳本"
echo "================================"
echo "📅 部署時間: 2025-09-25T16:00:00+08:00"
echo "🔢 起始區塊: 62385903"
echo

# 定義項目路徑
FRONTEND_PATH="/Users/sotadic/Documents/GitHub/SoulboundSaga"
SUBGRAPH_PATH="/Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph"
BACKEND_PATH="/Users/sotadic/Documents/dungeon-delvers-metadata-server"
CONTRACTS_PATH="/Users/sotadic/Documents/DungeonDelversContracts"
WHITEPAPER_PATH="/Users/sotadic/Documents/GitHub/dungeon-delvers-whitepaper"

# 創建備份目錄
BACKUP_DIR="$CONTRACTS_PATH/backup-before-v1403-$(date +%Y%m%d-%H%M%S)"
echo "📁 創建備份目錄: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 舊合約地址 (大小寫不敏感)
OLD_HERO="0x52a0ba2a7efb9519b73e671d924f03575fa64269"
OLD_RELIC="0x04c6bc2548b9f5c38be2be0902259d428f1fec2b"
OLD_PARTY="0x73953a4dac5339b28e13c38294e758655e62dfde"
OLD_VIPSTAKING="0xd82ef4be9e6d037140bd54afa04be983673637fb"
OLD_ALTAR="0x66bebb3eaf6d3de769ae1de1d4f8471dc24c8ebf"

# 新合約地址 (全小寫)
NEW_HERO="0xc09b6613c32a505bf05f97ed2f567b4959914396"
NEW_RELIC="0xf4ae79568a34af621bbea06b716e8fb84b5b41b6"
NEW_PARTY="0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129"
NEW_VIPSTAKING="0xeee539746a302ac5c08f4fe4bbc55878d57a1d6d"
NEW_ALTAR="0x3dfd80271eb96c3be8d1e841643746954ffda11d"

# 備份重要文件的函數
backup_important_files() {
    local project_path=$1
    local project_name=$2

    echo "  📋 備份 $project_name 的重要文件..."

    # 備份 .env 文件
    if [ -f "$project_path/.env" ]; then
        cp "$project_path/.env" "$BACKUP_DIR/$project_name-env"
        echo "    ✅ .env 已備份"
    fi

    # 備份 package.json
    if [ -f "$project_path/package.json" ]; then
        cp "$project_path/package.json" "$BACKUP_DIR/$project_name-package.json"
        echo "    ✅ package.json 已備份"
    fi
}

# 更新版本號的函數
update_versions() {
    local path=$1
    local description=$2

    echo "  🔄 更新 $description 中的版本號..."

    # 版本號替換列表
    # v1.4.0.0 -> v1.4.0.3
    find "$path" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.json" -o -name "*.env" -o -name "*.md" -o -name "*.yaml" -o -name "*.yml" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/build/*" \
        -not -path "*/dist/*" \
        -exec sed -i '' \
        -e 's/v1\.4\.0\.0/v1.4.0.3/g' \
        -e 's/v1-4-0-0/v1-4-0-3/g' \
        -e 's/1\.4\.0\.0/1.4.0.3/g' \
        -e 's/1-4-0-0/1-4-0-3/g' \
        -e 's/v1400/v1403/g' \
        -e 's/v1401/v1403/g' \
        -e 's/v1402/v1403/g' \
        -e 's/1400/1403/g' \
        -e 's/1401/1403/g' \
        -e 's/1402/1403/g' \
        {} \;

    echo "    ✅ 版本號更新完成"
}

# 更新合約地址的函數 (大小寫不敏感)
update_addresses() {
    local path=$1
    local description=$2

    echo "  🔄 更新 $description 中的合約地址..."

    find "$path" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.json" -o -name "*.env" -o -name "*.md" -o -name "*.yaml" -o -name "*.yml" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/build/*" \
        -not -path "*/dist/*" \
        -exec sed -i '' \
        -e "s/$OLD_HERO/$NEW_HERO/gi" \
        -e "s/$OLD_RELIC/$NEW_RELIC/gi" \
        -e "s/$OLD_PARTY/$NEW_PARTY/gi" \
        -e "s/$OLD_VIPSTAKING/$NEW_VIPSTAKING/gi" \
        -e "s/$OLD_ALTAR/$NEW_ALTAR/gi" \
        {} \;

    echo "    ✅ 合約地址更新完成"
}

# 更新特定的配置文件
update_specific_configs() {
    local path=$1
    local description=$2

    echo "  🔧 更新 $description 的特定配置..."

    # 更新起始區塊
    if [ -f "$path/.env" ]; then
        sed -i '' 's/START_BLOCK=.*/START_BLOCK=62385903/g' "$path/.env"
    fi

    # 更新部署日期
    if [ -f "$path/.env" ]; then
        sed -i '' 's/DEPLOYMENT_DATE=.*/DEPLOYMENT_DATE=2025-09-25T16:00:00+08:00/g' "$path/.env"
    fi

    # 更新 Goldsky URL
    find "$path" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.env" \) \
        -not -path "*/node_modules/*" \
        -exec sed -i '' \
        's|/dungeon-delvers/v1-4-0-0/gn|/dungeon-delvers/v1-4-0-3/gn|g' \
        {} \;

    # 更新 Studio URL
    find "$path" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.env" \) \
        -not -path "*/node_modules/*" \
        -exec sed -i '' \
        's|/v1\.4\.0\.0|/v1.4.0.3|g' \
        {} \;

    echo "    ✅ 特定配置更新完成"
}

# 主執行流程
echo "🔄 開始全面更新..."
echo

# 1. 備份重要文件
echo "📦 Step 1: 備份重要文件"
backup_important_files "$FRONTEND_PATH" "frontend"
backup_important_files "$BACKEND_PATH" "backend"
backup_important_files "$SUBGRAPH_PATH" "subgraph"
backup_important_files "$CONTRACTS_PATH" "contracts"
echo

# 2. 更新前端
echo "🎨 Step 2: 更新前端項目"
if [ -d "$FRONTEND_PATH" ]; then
    update_versions "$FRONTEND_PATH" "前端"
    update_addresses "$FRONTEND_PATH" "前端"
    update_specific_configs "$FRONTEND_PATH" "前端"
else
    echo "  ⚠️ 前端路徑不存在: $FRONTEND_PATH"
fi
echo

# 3. 更新後端
echo "🖥️ Step 3: 更新後端項目"
if [ -d "$BACKEND_PATH" ]; then
    update_versions "$BACKEND_PATH" "後端"
    update_addresses "$BACKEND_PATH" "後端"
    update_specific_configs "$BACKEND_PATH" "後端"
else
    echo "  ⚠️ 後端路徑不存在: $BACKEND_PATH"
fi
echo

# 4. 更新子圖
echo "📊 Step 4: 更新子圖項目"
if [ -d "$SUBGRAPH_PATH" ]; then
    update_versions "$SUBGRAPH_PATH" "子圖"
    update_addresses "$SUBGRAPH_PATH" "子圖"
    update_specific_configs "$SUBGRAPH_PATH" "子圖"

    # 特別更新子圖的 startBlock
    if [ -f "$SUBGRAPH_PATH/subgraph.yaml" ]; then
        echo "  📝 更新 subgraph.yaml 的 startBlock..."
        sed -i '' 's/startBlock: [0-9]*/startBlock: 62385903/g' "$SUBGRAPH_PATH/subgraph.yaml"
    fi
else
    echo "  ⚠️ 子圖路徑不存在: $SUBGRAPH_PATH"
fi
echo

# 5. 更新合約項目
echo "📜 Step 5: 更新合約項目"
if [ -d "$CONTRACTS_PATH" ]; then
    update_versions "$CONTRACTS_PATH" "合約"
    update_addresses "$CONTRACTS_PATH" "合約"
    update_specific_configs "$CONTRACTS_PATH" "合約"
else
    echo "  ⚠️ 合約路徑不存在: $CONTRACTS_PATH"
fi
echo

# 6. 更新白皮書
echo "📄 Step 6: 更新白皮書"
if [ -d "$WHITEPAPER_PATH" ]; then
    update_versions "$WHITEPAPER_PATH" "白皮書"
    update_addresses "$WHITEPAPER_PATH" "白皮書"
else
    echo "  ⚠️ 白皮書路徑不存在: $WHITEPAPER_PATH"
fi
echo

# 7. 生成更新報告
REPORT_FILE="$CONTRACTS_PATH/update-v1403-report-$(date +%Y%m%d-%H%M%S).md"
cat > "$REPORT_FILE" << EOF
# 📋 v1.4.0.3 更新報告

## 📅 更新時間
$(date)

## 🔄 版本更新
- 舊版本: v1.4.0.0 / 1.4.0.0 / v1-4-0-0 / 1400 / 1401 / 1402
- 新版本: v1.4.0.3 / 1.4.0.3 / v1-4-0-3 / 1403

## 📍 合約地址更新
| 合約 | 舊地址 | 新地址 |
|------|--------|--------|
| Hero | $OLD_HERO | $NEW_HERO |
| Relic | $OLD_RELIC | $NEW_RELIC |
| Party | $OLD_PARTY | $NEW_PARTY |
| VIPStaking | $OLD_VIPSTAKING | $NEW_VIPSTAKING |
| AltarOfAscension | $OLD_ALTAR | $NEW_ALTAR |

## 🔢 其他更新
- 起始區塊: 62385903
- 部署時間: 2025-09-25T16:00:00+08:00

## 📁 備份位置
$BACKUP_DIR

## ✅ 更新的項目
- [x] 前端 (SoulboundSaga)
- [x] 後端 (metadata-server)
- [x] 子圖 (dungeon-delvers-subgraph)
- [x] 合約 (DungeonDelversContracts)
- [x] 白皮書

## 🔍 驗證建議
1. 檢查前端 .env 文件
2. 檢查後端 .env 文件
3. 檢查子圖 subgraph.yaml
4. 測試前端連接新合約
5. 重新部署子圖
EOF

echo "✅ 更新完成！"
echo "📋 更新報告已保存至: $REPORT_FILE"
echo "📦 備份文件位於: $BACKUP_DIR"
echo
echo "🔍 建議手動驗證以下關鍵文件："
echo "  1. $FRONTEND_PATH/.env"
echo "  2. $BACKEND_PATH/.env"
echo "  3. $SUBGRAPH_PATH/subgraph.yaml"
echo "  4. $SUBGRAPH_PATH/networks.json"