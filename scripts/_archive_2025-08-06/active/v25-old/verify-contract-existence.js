#!/usr/bin/env node

// 驗證 V22 配置中的合約是否確實部署在區塊鏈上

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function verifyContractExistence() {
  console.log('🔍 驗證 V22 配置中的合約是否存在於區塊鏈上...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const contracts = v22Config.contracts;
  let existingContracts = 0;
  let totalContracts = 0;
  const issues = [];

  for (const [name, config] of Object.entries(contracts)) {
    if (!config.address || config.type === 'EOA') continue; // 跳過 EOA 地址
    
    totalContracts++;
    console.log(`📋 檢查 ${name}:`);
    console.log(`   地址: ${config.address}`);
    console.log(`   類型: ${config.type}`);
    
    try {
      // 檢查是否有程式碼
      const code = await provider.getCode(config.address);
      const hasCode = code !== '0x';
      
      if (hasCode) {
        console.log(`   ✅ 合約存在 (程式碼長度: ${code.length - 2} 字節)`);
        existingContracts++;
        
        // 嘗試簡單的讀取操作
        try {
          const balance = await provider.getBalance(config.address);
          console.log(`   💰 餘額: ${ethers.formatEther(balance)} BNB`);
        } catch (e) {
          // 忽略餘額讀取錯誤
        }
      } else {
        console.log(`   ❌ 沒有合約程式碼！這可能是 EOA 地址或錯誤地址`);
        issues.push({
          contract: name,
          address: config.address,
          issue: 'No contract code',
          severity: 'HIGH'
        });
      }
    } catch (error) {
      console.log(`   ❌ 檢查失敗: ${error.message}`);
      issues.push({
        contract: name,
        address: config.address,
        issue: `RPC Error: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
    console.log('');
  }

  // 總結報告
  console.log('📊 驗證總結：');
  console.log(`   ✅ 存在的合約: ${existingContracts}/${totalContracts}`);
  console.log(`   ❌ 問題: ${issues.length} 個`);
  
  if (issues.length > 0) {
    console.log('\n🚨 發現的問題：');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.contract} (${issue.severity})`);
      console.log(`      地址: ${issue.address}`);
      console.log(`      問題: ${issue.issue}`);
    });
    
    console.log('\n💡 建議：');
    console.log('1. 檢查配置文件中的地址是否正確');
    console.log('2. 確認合約是否已正確部署');
    console.log('3. 如果是新部署，更新配置文件中的地址');
    console.log('4. 對於關鍵合約，考慮重新部署');
  } else {
    console.log('\n🎉 所有合約都正確部署！');
  }

  // 檢查特定的常用函數
  console.log('\n🔧 檢查關鍵合約的基本函數：');
  
  // 檢查 Oracle
  if (contracts.ORACLE && contracts.ORACLE.address) {
    console.log('🔮 Oracle 函數檢查：');
    try {
      const oracle = new ethers.Contract(
        contracts.ORACLE.address,
        ['function getUsdToSoulTWAP() external view returns (uint256)'],
        provider
      );
      
      const result = await oracle.getUsdToSoulTWAP();
      console.log(`   ✅ getUsdToSoulTWAP(): ${ethers.formatUnits(result, 18)} SOUL per USD`);
    } catch (error) {
      console.log(`   ❌ getUsdToSoulTWAP() 失敗: ${error.message}`);
      
      // 嘗試檢查合約是否有任何函數
      try {
        const code = await provider.getCode(contracts.ORACLE.address);
        if (code.length > 10) {
          console.log(`   ⚠️ 合約存在但函數調用失敗，可能需要初始化或修復`);
        }
      } catch (e) {
        console.log(`   ❌ 完全無法訪問合約`);
      }
    }
  }
  
  // 檢查 Hero 合約
  if (contracts.HERO && contracts.HERO.address) {
    console.log('\n⚔️ Hero 合約檢查：');
    try {
      const hero = new ethers.Contract(
        contracts.HERO.address,
        ['function mintPriceUSD() public view returns (uint256)', 'function totalSupply() public view returns (uint256)'],
        provider
      );
      
      const mintPrice = await hero.mintPriceUSD();
      console.log(`   ✅ mintPriceUSD(): ${ethers.formatUnits(mintPrice, 18)} USD`);
      
      const totalSupply = await hero.totalSupply();
      console.log(`   ✅ totalSupply(): ${totalSupply} heroes`);
    } catch (error) {
      console.log(`   ❌ Hero 合約檢查失敗: ${error.message}`);
    }
  }
  
  // 檢查 DungeonMaster
  if (contracts.DUNGEONMASTER && contracts.DUNGEONMASTER.address) {
    console.log('\n🗡️ DungeonMaster 檢查：');
    try {
      const dm = new ethers.Contract(
        contracts.DUNGEONMASTER.address,
        ['function explorationFee() public view returns (uint256)'],
        provider
      );
      
      const fee = await dm.explorationFee();
      console.log(`   ✅ explorationFee(): ${ethers.formatEther(fee)} BNB`);
    } catch (error) {
      console.log(`   ❌ DungeonMaster 檢查失敗: ${error.message}`);
    }
  }
}

// 執行驗證
if (require.main === module) {
  verifyContractExistence().catch(console.error);
}

module.exports = { verifyContractExistence };