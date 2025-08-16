#!/bin/bash

echo "=== 同步 Graph 版本到與主子圖一致 ==="
echo "目標版本："
echo "- @graphprotocol/graph-cli@0.90.0"
echo "- @graphprotocol/graph-ts@0.35.0"
echo ""

# 升級到與主子圖相同的版本
npm install --save-dev @graphprotocol/graph-cli@0.90.0 @graphprotocol/graph-ts@0.35.0

echo ""
echo "版本同步完成！"
echo ""
echo "下一步："
echo "1. npm run codegen"
echo "2. npm run build"
echo "3. npm run deploy"