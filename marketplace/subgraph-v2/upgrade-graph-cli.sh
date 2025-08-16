#!/bin/bash

echo "升級 Graph CLI 到相容版本..."

# 升級到穩定版本
npm install --save-dev @graphprotocol/graph-cli@0.80.0 @graphprotocol/graph-ts@0.35.1

echo "版本升級完成，請重新執行 codegen 和 build"