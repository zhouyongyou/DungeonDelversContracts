#!/bin/bash
# AltarOfAscension 合約驗證腳本
# 生成時間: 2025-08-23T15:02:02.401Z

echo "正在驗證 AltarOfAscension 合約..."
BSCSCAN_API_KEY=2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC npx hardhat verify --network bsc 0x1D71AF88a37cF51bE4D98238049b3E455192B0bE

echo "驗證完成！"
echo "BSCScan 連結: https://bscscan.com/address/0x1D71AF88a37cF51bE4D98238049b3E455192B0bE#code"
