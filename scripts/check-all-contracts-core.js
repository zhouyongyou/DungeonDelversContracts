#!/usr/bin/env node

/**
 * 檢查所有合約的 DungeonCore 設置狀態
 * V25.0.4 版本
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 檢查所有合約的 DungeonCore 設置\n");
  
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
  
  // V25.0.4 合約地址
  const contracts = {
    DungeonCore: '0x5B64A5939735Ff762493D9B9666b3e13118c5722',
    Oracle: '0xEE322Eff70320759487f67875113C062AC1F4cfB',
    DungeonMaster: '0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF',
    DungeonStorage: '0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec',
    Hero: '0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19',
    Relic: '0x91Bf924E9CEF490F7C999C1F083eE1636595220D',
    Party: '0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9',
    AltarOfAscension: '0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3',
    PlayerVault: '0x446a82f2003484Bdc83f29e094fcb66D01094db0',
    PlayerProfile: '0x3509d0f0cD6f7b518860f945128205ac4F426090',
    VIPStaking: '0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661',
    VRFManagerV2Plus: '0xa94555C309Dd83d9fB0531852d209c46Fa50637f'
  };
  
  // 需要檢查 DungeonCore 的合約及其 getter 函數名稱
  const contractsToCheck = [
    { name: 'Oracle', getter: 'dungeonCore' },
    { name: 'DungeonMaster', getter: 'dungeonCore' },
    { name: 'DungeonStorage', getter: 'dungeonCore' },
    { name: 'Hero', getter: 'dungeonCore' },
    { name: 'Relic', getter: 'dungeonCore' },
    { name: 'Party', getter: 'dungeonCoreContract' }, // Party 使用不同的函數名
    { name: 'AltarOfAscension', getter: 'dungeonCore' },
    { name: 'PlayerVault', getter: 'dungeonCore' },
    { name: 'PlayerProfile', getter: 'dungeonCore' },
    { name: 'VIPStaking', getter: 'dungeonCore' },
    { name: 'VRFManagerV2Plus', getter: 'dungeonCore' }
  ];
  
  const results = {
    correct: [],
    wrong: [],
    notSet: [],
    errors: []
  };
  
  for (const contractInfo of contractsToCheck) {
    const { name, getter } = contractInfo;
    const address = contracts[name];
    
    try {
      // 創建合約實例
      const abi = [`function ${getter}() view returns (address)`];
      const contract = new ethers.Contract(address, abi, provider);
      
      // 讀取 DungeonCore 地址
      const dungeonCoreAddress = await contract[getter]();
      
      console.log(`📍 ${name}:`);
      console.log(`   地址: ${address}`);
      console.log(`   DungeonCore: ${dungeonCoreAddress}`);
      
      if (dungeonCoreAddress === ethers.ZeroAddress) {
        console.log(`   ❌ 未設置 DungeonCore！`);
        results.notSet.push(name);
      } else if (dungeonCoreAddress.toLowerCase() === contracts.DungeonCore.toLowerCase()) {
        console.log(`   ✅ 正確設置`);
        results.correct.push(name);
      } else {
        console.log(`   ⚠️ 錯誤的 DungeonCore 地址！`);
        console.log(`   應該是: ${contracts.DungeonCore}`);
        results.wrong.push(name);
      }
      
    } catch (error) {
      console.log(`📍 ${name}:`);
      console.log(`   地址: ${address}`);
      console.log(`   ❌ 錯誤: ${error.reason || error.message}`);
      results.errors.push({ name, error: error.reason || error.message });
    }
    
    console.log();
  }
  
  // 總結
  console.log("================================");
  console.log("📊 檢查總結");
  console.log("================================");
  console.log(`✅ 正確設置: ${results.correct.length} 個`);
  if (results.correct.length > 0) {
    console.log(`   ${results.correct.join(', ')}`);
  }
  
  console.log(`❌ 未設置: ${results.notSet.length} 個`);
  if (results.notSet.length > 0) {
    console.log(`   ${results.notSet.join(', ')}`);
  }
  
  console.log(`⚠️ 錯誤地址: ${results.wrong.length} 個`);
  if (results.wrong.length > 0) {
    console.log(`   ${results.wrong.join(', ')}`);
  }
  
  console.log(`💥 讀取錯誤: ${results.errors.length} 個`);
  if (results.errors.length > 0) {
    results.errors.forEach(e => {
      console.log(`   ${e.name}: ${e.error}`);
    });
  }
  
  // 如果有問題，提供修復建議
  if (results.notSet.length > 0 || results.wrong.length > 0) {
    console.log("\n🔧 修復建議:");
    console.log("執行修復腳本: npx hardhat run scripts/fix-all-dungeoncore.js --network bsc");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });