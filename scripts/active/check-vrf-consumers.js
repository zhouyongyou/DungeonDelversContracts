#!/usr/bin/env node

/**
 * 檢查 VRF Manager 的 Consumer 授權狀態
 * 驗證各合約是否有權限請求 VRF 隨機數
 */

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');

// 從主配置載入地址
const masterConfig = require('../../config/master-config.json');

async function main() {
  console.log(chalk.bold.cyan('\n🔍 ========== VRF Consumer 授權檢查 ==========\n'));

  // 設置 provider
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  const contracts = masterConfig.contracts.mainnet;
  
  const VRF_MANAGER_ADDRESS = contracts.VRFMANAGER_ADDRESS;
  const HERO_ADDRESS = contracts.HERO_ADDRESS;
  const RELIC_ADDRESS = contracts.RELIC_ADDRESS;
  const ALTAROFASCENSION_ADDRESS = contracts.ALTAROFASCENSION_ADDRESS;
  const DUNGEONMASTER_ADDRESS = contracts.DUNGEONMASTER_ADDRESS;

  console.log(chalk.yellow('📋 檢查的合約地址:'));
  console.log(`   VRF Manager: ${VRF_MANAGER_ADDRESS}`);
  console.log(`   Hero: ${HERO_ADDRESS}`);
  console.log(`   Relic: ${RELIC_ADDRESS}`);
  console.log(`   AltarOfAscension: ${ALTAROFASCENSION_ADDRESS}`);
  console.log(`   DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);

  try {
    // 創建基本的合約實例用於檢查
    // 基於實際合約的接口
    const vrfManagerABI = [
      'function authorizedContracts(address) view returns (bool)',
      'function owner() view returns (address)',
      'function callbackGasLimit() view returns (uint32)',
      'function requestConfirmations() view returns (uint16)',
      'function platformFee() view returns (uint256)',
      'function vrfRequestPrice() view returns (uint256)'
    ];
    
    const vrfManager = new ethers.Contract(VRF_MANAGER_ADDRESS, vrfManagerABI, provider);

    console.log(chalk.cyan('\n🔍 檢查 Consumer 授權狀態...\n'));

    // 需要檢查的合約列表
    const consumersToCheck = [
      { name: 'Hero', address: HERO_ADDRESS },
      { name: 'Relic', address: RELIC_ADDRESS },
      { name: 'AltarOfAscension', address: ALTAROFASCENSION_ADDRESS },
      { name: 'DungeonMaster', address: DUNGEONMASTER_ADDRESS }
    ];

    const unauthorizedConsumers = [];
    const authorizedConsumers = [];

    // 檢查每個合約的授權狀態
    for (const consumer of consumersToCheck) {
      try {
        console.log(chalk.gray(`檢查 ${consumer.name}...`));
        
        // 檢查合約授權狀態
        let isAuthorized = false;
        
        try {
          isAuthorized = await vrfManager.authorizedContracts(consumer.address);
        } catch (error) {
          console.log(chalk.red(`   ❌ ${consumer.name}: 無法檢查授權狀態 (${error.message})`));
          continue;
        }
        
        if (isAuthorized) {
          console.log(chalk.green(`   ✅ ${consumer.name}: 已授權`));
          authorizedConsumers.push(consumer);
        } else {
          console.log(chalk.red(`   ❌ ${consumer.name}: 未授權`));
          unauthorizedConsumers.push(consumer);
        }
      } catch (error) {
        console.log(chalk.red(`   ❌ ${consumer.name}: 檢查失敗 - ${error.message}`));
        unauthorizedConsumers.push(consumer);
      }
    }

    // 顯示摘要
    console.log(chalk.bold.cyan('\n📊 ========== 檢查結果摘要 ==========\n'));
    
    console.log(chalk.green(`✅ 已授權的合約: ${authorizedConsumers.length}`));
    authorizedConsumers.forEach(consumer => {
      console.log(chalk.green(`   • ${consumer.name} (${consumer.address})`));
    });
    
    console.log(chalk.red(`\n❌ 未授權的合約: ${unauthorizedConsumers.length}`));
    unauthorizedConsumers.forEach(consumer => {
      console.log(chalk.red(`   • ${consumer.name} (${consumer.address})`));
    });

    // 檢查 VRF Manager 的基本資訊
    console.log(chalk.cyan('\n🏗️ VRF Manager 基本資訊:'));
    try {
      const owner = await vrfManager.owner();
      console.log(`   Owner: ${owner}`);
      
      const callbackGasLimit = await vrfManager.callbackGasLimit();
      console.log(`   Callback Gas Limit: ${callbackGasLimit}`);
      
      const requestConfirmations = await vrfManager.requestConfirmations();
      console.log(`   Request Confirmations: ${requestConfirmations}`);
      
      const platformFee = await vrfManager.platformFee();
      console.log(`   Platform Fee: ${ethers.formatEther(platformFee)} ETH`);
      
      const vrfRequestPrice = await vrfManager.vrfRequestPrice();
      console.log(`   VRF Request Price: ${ethers.formatEther(vrfRequestPrice)} ETH`);
      
    } catch (error) {
      console.log(chalk.gray(`   無法獲取 VRF Manager 詳細資訊: ${error.message}`));
    }

    // 提供建議
    if (unauthorizedConsumers.length > 0) {
      console.log(chalk.yellow('\n💡 建議:'));
      console.log('   需要將以下合約加入 VRF Manager 的 Consumer 授權列表:');
      unauthorizedConsumers.forEach(consumer => {
        console.log(chalk.yellow(`   • ${consumer.name}: ${consumer.address}`));
      });
      console.log('\n   可能需要執行的操作:');
      console.log('   1. 調用 VRF Manager 的 addConsumer() 函數');
      console.log('   2. 或調用 setAuthorized() 函數');
      console.log('   3. 確認只有合約 owner 才能執行此操作');
      
      // 生成修復腳本建議
      console.log(chalk.cyan('\n🔧 修復腳本範例:'));
      console.log('```javascript');
      console.log('// 連接到 VRF Manager');
      console.log(`const vrfManager = await ethers.getContractAt('VRFManagerV2Plus', '${VRF_MANAGER_ADDRESS}');`);
      console.log('// 為每個未授權的合約添加授權');
      unauthorizedConsumers.forEach(consumer => {
        console.log(`await vrfManager.addConsumer('${consumer.address}'); // ${consumer.name}`);
      });
      console.log('```');
    } else {
      console.log(chalk.bold.green('\n🎉 所有合約都已正確授權！'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 檢查過程發生錯誤:'), error.message);
    console.log(chalk.yellow('\n💡 可能的原因:'));
    console.log('   1. VRF Manager 合約地址不正確');
    console.log('   2. VRF Manager 合約的 ABI 不匹配');
    console.log('   3. 網路連接問題');
    console.log('   4. 合約函數名稱不同');
  }

  console.log(chalk.bold.cyan('\n🔍 VRF Consumer 檢查完成！\n'));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });