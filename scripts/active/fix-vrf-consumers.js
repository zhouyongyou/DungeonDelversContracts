#!/usr/bin/env node

/**
 * 修復 VRF Manager 的 Consumer 授權
 * 將必要的合約加入 Consumer 列表
 */

require('dotenv').config();
const { ethers } = require('ethers');
const chalk = require('chalk');

// 從主配置載入地址
const masterConfig = require('../../config/master-config.json');

async function main() {
  console.log(chalk.bold.cyan('\n🔧 ========== VRF Consumer 授權修復 ==========\n'));

  // 設置 provider 和 signer
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error(chalk.red('❌ 請在 .env 文件中設置 PRIVATE_KEY'));
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  console.log(`執行者地址: ${signer.address}`);

  const contracts = masterConfig.contracts.mainnet;
  
  const VRF_MANAGER_ADDRESS = contracts.VRFMANAGER_ADDRESS;
  const HERO_ADDRESS = contracts.HERO_ADDRESS;
  const RELIC_ADDRESS = contracts.RELIC_ADDRESS;
  const ALTAROFASCENSION_ADDRESS = contracts.ALTAROFASCENSION_ADDRESS;
  const DUNGEONMASTER_ADDRESS = contracts.DUNGEONMASTER_ADDRESS;

  console.log(chalk.yellow('\n📋 目標合約地址:'));
  console.log(`   VRF Manager: ${VRF_MANAGER_ADDRESS}`);
  console.log(`   Hero: ${HERO_ADDRESS}`);
  console.log(`   Relic: ${RELIC_ADDRESS}`);
  console.log(`   AltarOfAscension: ${ALTAROFASCENSION_ADDRESS}`);
  console.log(`   DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);

  try {
    // 創建 VRF Manager 合約實例
    const vrfManagerABI = [
      'function authorizedContracts(address) view returns (bool)',
      'function owner() view returns (address)',
      'function authorizeContract(address) external',
      'function setAuthorizedContract(address, bool) external'
    ];
    
    const vrfManager = new ethers.Contract(VRF_MANAGER_ADDRESS, vrfManagerABI, signer);

    // 檢查當前執行者是否為 owner
    try {
      const owner = await vrfManager.owner();
      console.log(`\nVRF Manager Owner: ${owner}`);
      
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(chalk.red('❌ 當前執行者不是 VRF Manager 的 owner'));
        console.log(chalk.yellow('💡 請使用 owner 地址執行此腳本'));
        return;
      }
      console.log(chalk.green('✅ 權限驗證通過'));
    } catch (error) {
      console.log(chalk.yellow('⚠️ 無法驗證 owner 權限，繼續執行...'));
    }

    // 需要授權的合約列表
    const consumersToAuthorize = [
      { name: 'Hero', address: HERO_ADDRESS },
      { name: 'Relic', address: RELIC_ADDRESS },
      { name: 'AltarOfAscension', address: ALTAROFASCENSION_ADDRESS },
      { name: 'DungeonMaster', address: DUNGEONMASTER_ADDRESS }
    ];

    console.log(chalk.cyan('\n🔧 開始授權 Consumers...\n'));

    const successfulAuthorizations = [];
    const failedAuthorizations = [];

    for (const consumer of consumersToAuthorize) {
      try {
        console.log(chalk.gray(`處理 ${consumer.name}...`));
        
        // 先檢查是否已經授權
        let isAlreadyAuthorized = false;
        try {
          isAlreadyAuthorized = await vrfManager.authorizedContracts(consumer.address);
        } catch (error) {
          console.log(chalk.gray(`   無法檢查現有授權狀態，繼續執行授權...`));
        }

        if (isAlreadyAuthorized) {
          console.log(chalk.blue(`   ℹ️ ${consumer.name}: 已經授權，跳過`));
          successfulAuthorizations.push(consumer);
          continue;
        }

        // 嘗試授權
        let tx;
        let success = false;

        try {
          console.log(chalk.gray(`   嘗試使用 authorizeContract()...`));
          tx = await vrfManager.authorizeContract(consumer.address);
          console.log(`   交易哈希: ${tx.hash}`);
          await tx.wait();
          console.log(chalk.green(`   ✅ ${consumer.name}: 授權成功`));
          successfulAuthorizations.push(consumer);
          success = true;
        } catch (error) {
          console.log(chalk.gray(`   authorizeContract() 失敗: ${error.message}`));
          
          // 嘗試 setAuthorizedContract
          try {
            console.log(chalk.gray(`   嘗試使用 setAuthorizedContract()...`));
            tx = await vrfManager.setAuthorizedContract(consumer.address, true);
            console.log(`   交易哈希: ${tx.hash}`);
            await tx.wait();
            console.log(chalk.green(`   ✅ ${consumer.name}: 授權成功`));
            successfulAuthorizations.push(consumer);
            success = true;
          } catch (error2) {
            console.log(chalk.red(`   setAuthorizedContract() 也失敗: ${error2.message}`));
          }
        }

        if (!success) {
          console.log(chalk.red(`   ❌ ${consumer.name}: 所有授權方法都失敗`));
          failedAuthorizations.push({
            ...consumer,
            error: '找不到有效的授權函數'
          });
        }

      } catch (error) {
        console.log(chalk.red(`   ❌ ${consumer.name}: ${error.message}`));
        failedAuthorizations.push({
          ...consumer,
          error: error.message
        });
      }
    }

    // 顯示結果摘要
    console.log(chalk.bold.cyan('\n📊 ========== 授權結果摘要 ==========\n'));
    
    console.log(chalk.green(`✅ 成功授權: ${successfulAuthorizations.length}`));
    successfulAuthorizations.forEach(consumer => {
      console.log(chalk.green(`   • ${consumer.name} (${consumer.address})`));
    });
    
    if (failedAuthorizations.length > 0) {
      console.log(chalk.red(`\n❌ 授權失敗: ${failedAuthorizations.length}`));
      failedAuthorizations.forEach(consumer => {
        console.log(chalk.red(`   • ${consumer.name}: ${consumer.error}`));
      });

      console.log(chalk.yellow('\n💡 故障排除建議:'));
      console.log('   1. 檢查 VRF Manager 合約的 ABI 是否正確');
      console.log('   2. 確認當前執行者有足夠的權限');
      console.log('   3. 檢查合約是否已暫停或有其他限制');
      console.log('   4. 手動檢查合約文檔確認正確的函數名');
    } else {
      console.log(chalk.bold.green('\n🎉 所有 Consumer 都已成功授權！'));
    }

    // 驗證授權結果
    console.log(chalk.cyan('\n🔍 驗證授權結果...'));
    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒讓交易確認
      
      for (const consumer of successfulAuthorizations) {
        try {
          const isAuthorized = await vrfManager.authorizedContracts(consumer.address);
          
          if (isAuthorized) {
            console.log(chalk.green(`   ✅ ${consumer.name}: 驗證通過`));
          } else {
            console.log(chalk.red(`   ❌ ${consumer.name}: 驗證失敗`));
          }
        } catch (error) {
          console.log(chalk.gray(`   ⚠️ ${consumer.name}: 無法驗證狀態`));
        }
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ 驗證過程出錯，但授權可能已經成功'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 修復過程發生錯誤:'), error.message);
  }

  console.log(chalk.bold.cyan('\n🔧 VRF Consumer 授權修復完成！\n'));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });