#!/bin/bash

# 封存有問題的 v25-update-master-config.js

echo "封存 v25-update-master-config.js..."

# 創建封存目錄
mkdir -p scripts/archive/problematic-scripts

# 移動檔案
mv scripts/active/v25-update-master-config.js scripts/archive/problematic-scripts/v25-update-master-config.js.archived

# 創建說明文件
cat > scripts/archive/problematic-scripts/README.md << 'EOF'
# 有問題的腳本封存

## v25-update-master-config.js.archived
- 封存日期：2025-08-05
- 問題：包含舊的、錯誤的合約地址
- 建議：使用 v25-sync-all.js 代替
- 注意：此腳本不應再被使用
EOF

echo "✅ 封存完成"
echo "請使用 scripts/active/v25-sync-all.js 進行配置同步"