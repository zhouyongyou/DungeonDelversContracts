#!/bin/bash

echo "🌐 使用 Sourcify 驗證 DungeonCore 和 Oracle..."
echo "================================================"

# 檢查 Sourcify 上是否已經有這些合約
echo "🔍 檢查 DungeonCore 是否已在 Sourcify 上..."
curl -s "https://sourcify.dev/server/check-by-addresses?addresses=0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5&chainIds=56"
echo ""

echo "🔍 檢查 Oracle 是否已在 Sourcify 上..."
curl -s "https://sourcify.dev/server/check-by-addresses?addresses=0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806&chainIds=56"
echo ""

echo "📝 如果上述查詢結果顯示 'perfect' 或 'partial'，表示合約已在 Sourcify 上！"
echo ""

echo "🔗 查看連結："
echo "- DungeonCore: https://sourcify.dev/#/lookup/0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5?chain=56"
echo "- Oracle: https://sourcify.dev/#/lookup/0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806?chain=56"
echo ""

echo "💡 Sourcify 是去中心化的合約驗證平台，"
echo "   即使 BSCScan 無法驗證，Sourcify 可能可以！"