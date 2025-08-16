#!/usr/bin/env node

/**
 * 授權新部署的合約訪問 VRF Manager
 */

require('dotenv').config();
const { ethers } = require('ethers');

const masterConfig = require('../config/master-config.json');

// 使用主配置中的合約地址
const contracts = masterConfig.contracts.mainnet;
const NEW_CONTRACTS = {
  HERO: contracts.HERO_ADDRESS,
  RELIC: contracts.RELIC_ADDRESS,
  DUNGEONMASTER: contracts.DUNGEONMASTER_ADDRESS,
  ALTAROFASCENSION: contracts.ALTAROFASCENSION_ADDRESS
};

const VRF_MANAGER_ADDRESS = contracts.VRFMANAGER_ADDRESS;

// VRF Manager 簡化 ABI
const VRF_MANAGER_ABI = [
  "function authorizeContract(address contract_) external",
  "function isAuthorizedContract(address contract_) external view returns (bool)",
  "function owner() external view returns (address)"
];

async function main() {
  console.log('🔐 授權新合約訪問 VRF Manager');
  console.log('=================================\n');

  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  console.log(`📋 執行者地址: ${signer.address}\n`);
  
  // 連接 VRF Manager 合約
  const vrfManager = new ethers.Contract(VRF_MANAGER_ADDRESS, VRF_MANAGER_ABI, signer);
  
  // 檢查當前 owner
  try {
    const owner = await vrfManager.owner();
    console.log(`🏛️  VRF Manager Owner: ${owner}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error(`❌ 當前簽名者不是 VRF Manager 的 Owner`);
      console.error(`   預期: ${owner}`);
      console.error(`   實際: ${signer.address}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 無法檢查 VRF Manager Owner:', error.message);
    process.exit(1);
  }

  // 授權每個新合約
  for (const [name, address] of Object.entries(NEW_CONTRACTS)) {
    console.log(`\n🔧 授權 ${name}: ${address}`);
    
    try {
      // 檢查是否已授權
      const isAuthorized = await vrfManager.isAuthorizedContract(address);
      
      if (isAuthorized) {
        console.log(`   ✅ ${name} 已經被授權`);
        continue;
      }
      
      // 執行授權
      console.log(`   📝 發送授權交易...`);
      const tx = await vrfManager.authorizeContract(address, {
        gasLimit: 100000
      });
      
      console.log(`   🔗 交易 hash: ${tx.hash}`);
      console.log(`   ⏳ 等待確認...`);
      
      await tx.wait();
      
      // 再次檢查授權狀態
      const isNowAuthorized = await vrfManager.isAuthorizedContract(address);
      
      if (isNowAuthorized) {
        console.log(`   ✅ ${name} 授權成功`);
      } else {
        console.log(`   ❌ ${name} 授權失敗`);
      }
      
    } catch (error) {
      console.error(`   ❌ ${name} 授權過程中出錯:`, error.message);
    }
  }
  
  console.log('\n🎉 VRF 授權完成！');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}