#!/bin/bash

# 批量替換部署者錢包地址為管理員錢包地址
# 從: 0x10925A7138649C7E1794CE646182eeb5BF8ba647 (部署者)
# 到: 0xEbCF4A36Ad1485A9737025e9d72186b604487274 (管理員)

OLD_ADDRESS="0x10925A7138649C7E1794CE646182eeb5BF8ba647"
NEW_ADDRESS="0xEbCF4A36Ad1485A9737025e9d72186b604487274"

echo "🔄 開始替換部署者錢包地址..."
echo "舊地址: $OLD_ADDRESS"
echo "新地址: $NEW_ADDRESS"

# 統計需要替換的文件
TOTAL_FILES=$(grep -r "$OLD_ADDRESS" . --include="*.js" --include="*.ts" --include="*.json" --include="*.env*" -l | wc -l)
echo "📊 發現 $TOTAL_FILES 個文件需要替換"

# 備份重要文件
echo "📦 備份重要配置文件..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "沒有 .env 需要備份"

# 執行替換
echo "🔧 執行替換..."
grep -r "$OLD_ADDRESS" . --include="*.js" --include="*.ts" --include="*.json" --include="*.env*" -l | while IFS= read -r file
do
    echo "處理: $file"
    sed -i "" "s/$OLD_ADDRESS/$NEW_ADDRESS/g" "$file"
done

# 驗證結果
REMAINING=$(grep -r "$OLD_ADDRESS" . --include="*.js" --include="*.ts" --include="*.json" --include="*.env*" | wc -l)
echo "📊 替換完成，剩餘: $REMAINING 個引用"

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ 所有地址都已成功替換！"
else
    echo "⚠️ 還有 $REMAINING 個地址未替換，請檢查："
    grep -r "$OLD_ADDRESS" . --include="*.js" --include="*.ts" --include="*.json" --include="*.env*" | head -5
fi

echo "🎉 替換完成！"