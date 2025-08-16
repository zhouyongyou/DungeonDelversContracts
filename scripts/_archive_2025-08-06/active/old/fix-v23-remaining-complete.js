#!/usr/bin/env node

// 完整修復 V23 剩餘問題

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const v23Config = require('../../config/v23-config');
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function fixAllRemainingIssues() {
  console.log('🔧 完整修復 V23 剩餘問題...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  // 1. 修復驗證腳本的 getter 函數問題
  console.log('📌 1. 修復驗證腳本...');
  fixVerificationScript();
  
  // 2. 嘗試修復 Party.dungeonCoreContract
  console.log('\n📌 2. 修復 Party 合約設置...');
  await fixPartyContract(deployer, v23Config.contracts);
  
  // 3. 修復驗證腳本的 BigInt 問題
  console.log('\n📌 3. 修復驗證腳本的 BigInt 序列化問題...');
  fixBigIntSerialization();
  
  console.log('\n✅ 所有修復完成！');
}

// 1. 修復驗證腳本的 getter 函數問題
function fixVerificationScript() {
  const scriptPath = path.join(__dirname, 'verify-v23-setup.js');
  let content = fs.readFileSync(scriptPath, 'utf8');
  
  // 替換錯誤的 getter 函數名稱
  const replacements = [
    { old: '"function heroContract() view returns (address)"', new: '"function heroContractAddress() view returns (address)"' },
    { old: '"function relicContract() view returns (address)"', new: '"function relicContractAddress() view returns (address)"' },
    { old: '"function partyContract() view returns (address)"', new: '"function partyContractAddress() view returns (address)"' },
    { old: '"function dungeonMaster() view returns (address)"', new: '"function dungeonMasterAddress() view returns (address)"' },
    { old: '"function playerVault() view returns (address)"', new: '"function playerVaultAddress() view returns (address)"' },
    { old: '"function playerProfile() view returns (address)"', new: '"function playerProfileAddress() view returns (address)"' },
    { old: '"function vipStaking() view returns (address)"', new: '"function vipStakingAddress() view returns (address)"' },
    { old: '"function altarOfAscension() view returns (address)"', new: '"function altarOfAscensionAddress() view returns (address)"' },
    // 更新調用
    { old: 'dungeonCore.heroContract()', new: 'dungeonCore.heroContractAddress()' },
    { old: 'dungeonCore.relicContract()', new: 'dungeonCore.relicContractAddress()' },
    { old: 'dungeonCore.partyContract()', new: 'dungeonCore.partyContractAddress()' },
    { old: 'dungeonCore.dungeonMaster()', new: 'dungeonCore.dungeonMasterAddress()' },
    { old: 'dungeonCore.playerVault()', new: 'dungeonCore.playerVaultAddress()' },
    { old: 'dungeonCore.playerProfile()', new: 'dungeonCore.playerProfileAddress()' },
    { old: 'dungeonCore.vipStaking()', new: 'dungeonCore.vipStakingAddress()' },
    { old: 'dungeonCore.altarOfAscension()', new: 'dungeonCore.altarOfAscensionAddress()' }
  ];
  
  // 檢查內容是否包含錯誤的函數名
  const hasWrongFunctions = content.includes('heroContract()') || content.includes('"function heroContract()');
  
  if (!hasWrongFunctions) {
    console.log('  ✅ 驗證腳本已經是正確的版本');
    return;
  }
  
  // 備份原文件
  const backupPath = scriptPath + `.backup-${Date.now()}`;
  fs.writeFileSync(backupPath, content);
  console.log(`  📄 已備份原文件: ${backupPath}`);
  
  // 執行替換
  for (const replacement of replacements) {
    content = content.replace(new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.new);
  }
  
  // 寫回文件
  fs.writeFileSync(scriptPath, content);
  console.log('  ✅ 已修復驗證腳本的 getter 函數名稱');
}

// 2. 嘗試修復 Party.dungeonCoreContract
async function fixPartyContract(deployer, contracts) {
  try {
    // 檢查 Party 合約的各種可能的函數名
    const partyABI = [
      "function dungeonCoreContract() view returns (address)",
      "function setDungeonCoreContract(address _dungeonCore) external",
      "function setDungeonCore(address _dungeonCore) external",
      "function owner() view returns (address)",
      "function initialized() view returns (bool)"
    ];
    
    const party = new ethers.Contract(contracts.PARTY.address, partyABI, deployer.provider);
    
    // 檢查當前狀態
    try {
      const currentDungeonCore = await party.dungeonCoreContract();
      console.log(`  當前 dungeonCoreContract: ${currentDungeonCore}`);
      
      if (currentDungeonCore === ethers.ZeroAddress) {
        // 檢查 owner
        const owner = await party.owner();
        console.log(`  Party owner: ${owner}`);
        
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
          // 嘗試不同的設置函數
          try {
            console.log('  嘗試 setDungeonCoreContract...');
            const partyWithSigner = new ethers.Contract(contracts.PARTY.address, partyABI, deployer);
            const tx = await partyWithSigner.setDungeonCoreContract(contracts.DUNGEONCORE.address);
            await tx.wait();
            console.log('  ✅ 成功設置 dungeonCoreContract');
          } catch (e1) {
            console.log(`  ❌ setDungeonCoreContract 失敗: ${e1.message}`);
            
            // 嘗試另一個函數名
            try {
              console.log('  嘗試 setDungeonCore...');
              const tx = await partyWithSigner.setDungeonCore(contracts.DUNGEONCORE.address);
              await tx.wait();
              console.log('  ✅ 成功設置 dungeonCore');
            } catch (e2) {
              console.log(`  ❌ setDungeonCore 也失敗: ${e2.message}`);
              console.log('  ℹ️ Party 合約可能有特殊的初始化要求或已被鎖定');
            }
          }
        } else {
          console.log('  ❌ 不是 Party 合約的 owner，無法設置');
        }
      } else {
        console.log('  ✅ dungeonCoreContract 已設置');
      }
    } catch (error) {
      console.log(`  ❌ 無法讀取 Party 狀態: ${error.message}`);
    }
  } catch (error) {
    console.log(`  ❌ Party 修復失敗: ${error.message}`);
  }
}

// 3. 修復驗證腳本的 BigInt 序列化問題
function fixBigIntSerialization() {
  const scriptPath = path.join(__dirname, 'verify-v23-setup.js');
  let content = fs.readFileSync(scriptPath, 'utf8');
  
  // 檢查是否已經有 BigInt 處理
  if (content.includes('BigInt.prototype.toJSON')) {
    console.log('  ✅ BigInt 序列化已經修復');
    return;
  }
  
  // 在文件開頭添加 BigInt 序列化支持
  const bigIntFix = `// 修復 BigInt 序列化問題
BigInt.prototype.toJSON = function() { return this.toString(); };

`;
  
  // 在 require 語句後添加
  const requireIndex = content.indexOf("require('dotenv').config();");
  if (requireIndex !== -1) {
    const insertIndex = content.indexOf('\n', requireIndex) + 1;
    content = content.slice(0, insertIndex) + bigIntFix + content.slice(insertIndex);
  } else {
    // 如果找不到 dotenv，就在文件開頭添加
    content = bigIntFix + content;
  }
  
  // 另外，修復 JSON.stringify 調用，使用自定義 replacer
  const stringifyReplacer = `
// 自定義 JSON replacer 處理 BigInt
const jsonReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};
`;
  
  // 替換 JSON.stringify 調用
  content = content.replace(
    /JSON\.stringify\(([^,)]+)\)/g,
    'JSON.stringify($1, jsonReplacer)'
  );
  
  // 在適當位置添加 replacer 定義
  const functionIndex = content.indexOf('async function verifyV23Setup()');
  if (functionIndex !== -1) {
    content = content.slice(0, functionIndex) + stringifyReplacer + '\n' + content.slice(functionIndex);
  }
  
  // 寫回文件
  fs.writeFileSync(scriptPath, content);
  console.log('  ✅ 已添加 BigInt 序列化支持');
}

// 執行修復
if (require.main === module) {
  fixAllRemainingIssues().catch(console.error);
}

module.exports = { fixAllRemainingIssues };