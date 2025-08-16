#!/usr/bin/env node

// 深度分析 requestExpedition 失敗原因

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

console.log(`
🔍 深度分析 requestExpedition 失敗原因 (#1002 錯誤)
======================================================

根據錯誤信息 "execution reverted #1002"，這是一個自定義錯誤代碼。

📋 **可能的失敗原因分析：**

1. **合約版本不匹配** ⚠️
   - 部署的可能是舊版本的 DungeonMaster
   - V22 配置指向的地址可能是錯誤版本
   - 函數簽名可能已經改變

2. **函數參數問題** 🔧
   - requestExpedition 可能需要不同的參數
   - 可能需要額外的參數（如 provisions 數量）
   - 參數順序可能不同

3. **權限和狀態檢查** 🔒
   - 合約可能被暫停（但我們檢查過是 false）
   - 可能有白名單限制
   - 可能需要特定角色才能調用

4. **依賴合約問題** 🔗
   - DungeonCore 連接可能有問題
   - DungeonStorage 可能未正確初始化
   - Oracle 合約可能返回異常價格

5. **遊戲邏輯限制** 🎮
   - 可能需要先購買 provisions（儲備）
   - 隊伍可能需要特定狀態
   - 可能有全局限制（如每日探索次數）

6. **經濟系統問題** 💰
   - BNB 費用可能不足（雖然發送了 0.000014 BNB）
   - 可能需要 SoulShard 代幣餘額
   - 可能有最低費用要求

7. **時間相關限制** ⏰
   - 可能有開放時間限制
   - 可能在維護模式
   - 冷卻時間可能有特殊邏輯

8. **錯誤代碼 #1002 的含義** 🚨
   - 這是自定義錯誤，可能表示特定的失敗條件
   - 需要查看合約源碼確認具體含義
`);

async function analyzeFailure() {
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  console.log('\n📊 **實際檢查結果：**\n');
  
  // 1. 檢查 explorationFee
  const dmAbi = ['function explorationFee() public view returns (uint256)'];
  const dm = new ethers.Contract(v22Config.contracts.DUNGEONMASTER.address, dmAbi, provider);
  
  try {
    const fee = await dm.explorationFee();
    console.log(`✅ 探索費用: ${ethers.formatEther(fee)} BNB`);
    console.log(`   你發送: 0.000014 BNB`);
    console.log(`   差額: ${ethers.formatEther(fee - BigInt('14000000000000'))} BNB`);
    
    if (fee > BigInt('14000000000000')) {
      console.log('   ❌ 費用不足！');
    }
  } catch (error) {
    console.log('❌ 無法獲取探索費用');
  }
  
  // 2. 檢查可能的函數變體
  console.log('\n📋 **可能的函數簽名變體：**');
  
  const possibleSignatures = [
    'requestExpedition(uint256,uint256)',
    'requestExpedition(uint256,uint256,uint256)',
    'requestExpedition(address,uint256,uint256)',
    'exploreDungeon(uint256,uint256)',
    'explore(uint256,uint256)',
    'startExpedition(uint256,uint256)'
  ];
  
  possibleSignatures.forEach(sig => {
    const selector = ethers.id(sig).substring(0, 10);
    console.log(`   ${sig} => ${selector}`);
  });
  
  console.log('\n💡 **建議的解決步驟：**\n');
  console.log('1. 檢查部署歷史，確認 DungeonMaster 的正確版本');
  console.log('2. 驗證合約 ABI 是否與部署的版本匹配');
  console.log('3. 檢查是否需要先調用 buyProvisions');
  console.log('4. 確認發送的 BNB 數量是否足夠（當前是 0.000014）');
  console.log('5. 查看合約源碼中錯誤代碼 #1002 的具體含義');
  console.log('6. 考慮使用正確的函數簽名或參數');
  
  console.log('\n🔧 **可能需要的操作：**\n');
  console.log('- 如果費用不足：增加發送的 BNB 數量');
  console.log('- 如果需要儲備：先調用 buyProvisions(partyId, amount)');
  console.log('- 如果版本錯誤：重新部署正確版本的 DungeonMaster');
  console.log('- 如果簽名錯誤：使用正確的函數名和參數');
}

// 執行分析
if (require.main === module) {
  analyzeFailure().catch(console.error);
}

module.exports = { analyzeFailure };