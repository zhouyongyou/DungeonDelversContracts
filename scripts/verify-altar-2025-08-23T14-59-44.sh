#!/bin/bash
# AltarOfAscension 合約驗證腳本
# 生成時間: 2025-08-23T14:59:44.355Z

echo "正在驗證 AltarOfAscension 合約..."
BSCSCAN_API_KEY=2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC npx hardhat verify --network bsc 0x5FbDB2315678afecb367f032d93F642f64180aa3

echo "驗證完成！"
echo "BSCScan 連結: https://bscscan.com/address/0x5FbDB2315678afecb367f032d93F642f64180aa3#code"
