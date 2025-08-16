#!/usr/bin/env node

/**
 * 修復 DungeonCore 合約配置
 * 更新 DungeonMaster 地址到正確的 VRF 版本
 */

require('dotenv').config();
const hre = require('hardhat');
const { ethers } = hre;

// 從主配置載入地址
const masterConfig = require('../../config/master-config.json');

async function main() {
  console.log('🔧 修復 DungeonCore 合約配置...\n');

  const [deployer] = await ethers.getSigners();
  console.log(`部署者地址: ${deployer.address}`);
  console.log(`部署者餘額: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} BNB\n`);

  // 從主配置獲取地址
  const contracts = masterConfig.contracts.mainnet;
  const DUNGEONCORE_ADDRESS = contracts.DUNGEONCORE_ADDRESS;
  const NEW_DUNGEONMASTER_ADDRESS = contracts.DUNGEONMASTER_ADDRESS;

  console.log(`🏛️ DungeonCore 地址: ${DUNGEONCORE_ADDRESS}`);
  console.log(`🎯 新的 DungeonMaster 地址: ${NEW_DUNGEONMASTER_ADDRESS}\n`);

  // 連接到 DungeonCore 合約
  const DungeonCore = await ethers.getContractFactory('DungeonCore');
  const dungeonCore = DungeonCore.attach(DUNGEONCORE_ADDRESS);

  // 檢查當前配置
  console.log('📋 檢查當前配置...');
  try {
    const currentDungeonMaster = await dungeonCore.dungeonMasterAddress();
    const currentPlayerProfile = await dungeonCore.playerProfileAddress();
    
    console.log(`當前 DungeonMaster: ${currentDungeonMaster}`);
    console.log(`當前 PlayerProfile: ${currentPlayerProfile}`);
    
    if (currentDungeonMaster.toLowerCase() === NEW_DUNGEONMASTER_ADDRESS.toLowerCase()) {
      console.log('✅ DungeonMaster 地址已經正確，無需更新');
      return;
    }
    
    console.log('❌ DungeonMaster 地址需要更新\n');
    
  } catch (error) {
    console.log(`⚠️ 無法讀取當前配置: ${error.message}\n`);
  }

  // 更新 DungeonMaster 地址
  console.log('🔄 更新 DungeonMaster 地址...');
  try {
    const tx = await dungeonCore.setDungeonMaster(NEW_DUNGEONMASTER_ADDRESS);
    console.log(`交易哈希: ${tx.hash}`);
    
    console.log('等待交易確認...');
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ DungeonMaster 地址更新成功！');
      console.log(`Gas 使用: ${receipt.gasUsed.toString()}`);
    } else {
      console.log('❌ 交易失敗');
      return;
    }
    
  } catch (error) {
    console.log(`❌ 更新失敗: ${error.message}`);
    
    // 檢查是否是權限問題
    if (error.message.includes('Ownable: caller is not the owner') || 
        error.message.includes('OwnableUnauthorizedAccount')) {
      console.log('\n🚨 權限錯誤：請確保使用合約 owner 的私鑰');
      
      try {
        const owner = await dungeonCore.owner();
        console.log(`合約 Owner: ${owner}`);
        console.log(`當前地址: ${deployer.address}`);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.log('❌ 當前地址不是合約 owner');
        }
      } catch (ownerError) {
        console.log('無法查詢合約 owner');
      }
    }
    
    return;
  }

  // 驗證更新結果
  console.log('\n🔍 驗證更新結果...');
  try {
    const newDungeonMaster = await dungeonCore.dungeonMasterAddress();
    console.log(`更新後 DungeonMaster: ${newDungeonMaster}`);
    
    if (newDungeonMaster.toLowerCase() === NEW_DUNGEONMASTER_ADDRESS.toLowerCase()) {
      console.log('✅ 驗證成功：DungeonMaster 地址已正確更新');
    } else {
      console.log('❌ 驗證失敗：地址未正確更新');
    }
    
  } catch (error) {
    console.log(`⚠️ 驗證失敗: ${error.message}`);
  }

  console.log('\n🎉 DungeonCore 配置修復完成！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });