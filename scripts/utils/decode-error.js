#!/usr/bin/env node

const { ethers } = require('ethers');

// 將 "OLD" 轉換為 hex
const errorString = "OLD";
const errorHex = ethers.hexlify(ethers.toUtf8Bytes(errorString));
const errorSelector = ethers.keccak256(ethers.toUtf8Bytes(errorString + "()")).slice(0, 10);

console.log('錯誤分析：');
console.log('字符串: "OLD"');
console.log('UTF-8 Hex:', errorHex);
console.log('錯誤選擇器 (如果是 custom error):', errorSelector);

// 檢查是否是 revert reason
const revertHex = ethers.AbiCoder.defaultAbiCoder().encode(['string'], [errorString]);
console.log('\nRevert reason 編碼:', revertHex);

// 解碼可能的格式
console.log('\n可能的錯誤來源：');
console.log('1. require(false, "OLD") - Solidity revert reason');
console.log('2. error OLD() - Solidity custom error');
console.log('3. 前端硬編碼的錯誤訊息');