#!/usr/bin/env node

/**
 * 修復 DungeonCore 為正確的 V25 地址
 */

require('dotenv').config();
const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  console.log('🔧 修復 DungeonCore 為正確的 V25 地址...\n');

  const [deployer] = await ethers.getSigners();
  console.log(`部署者地址: ${deployer.address}`);

  // 正確的 V25 地址
  const DUNGEONCORE_ADDRESS = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const CORRECT_DUNGEONMASTER_ADDRESS = "0xE391261741Fad5FCC2D298d00e8c684767021253";

  console.log(`🏛️ DungeonCore: ${DUNGEONCORE_ADDRESS}`);
  console.log(`🎯 正確的 DungeonMaster: ${CORRECT_DUNGEONMASTER_ADDRESS}\n`);

  // 連接到 DungeonCore 合約
  const DungeonCore = await ethers.getContractFactory('DungeonCore');
  const dungeonCore = DungeonCore.attach(DUNGEONCORE_ADDRESS);

  // 檢查當前配置
  console.log('📋 檢查當前配置...');
  const currentDungeonMaster = await dungeonCore.dungeonMasterAddress();
  console.log(`當前 DungeonMaster: ${currentDungeonMaster}`);
  
  if (currentDungeonMaster.toLowerCase() === CORRECT_DUNGEONMASTER_ADDRESS.toLowerCase()) {
    console.log('✅ DungeonMaster 地址已經正確');
    return;
  }

  // 更新為正確的 V25 DungeonMaster 地址
  console.log('🔄 更新 DungeonMaster 地址...');
  const tx = await dungeonCore.setDungeonMaster(CORRECT_DUNGEONMASTER_ADDRESS);
  console.log(`交易哈希: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log('✅ DungeonMaster 地址更新成功！');

  // 驗證
  const newDungeonMaster = await dungeonCore.dungeonMasterAddress();
  console.log(`✅ 驗證成功: ${newDungeonMaster}`);

  console.log('\n🎉 DungeonCore 已更新為正確的 V25 配置！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });