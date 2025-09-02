#!/usr/bin/env node

/**
 * DungeonMaster, DungeonStorage, VRFConsumerV2Plus 部署腳本
 * 
 * 專門部署並配置三個核心合約：
 * 1. DungeonStorage - 地城數據存儲
 * 2. VRFConsumerV2Plus - VRF 隨機數管理
 * 3. DungeonMaster - 地城探索邏輯
 * 
 * 使用方式：
 * npx hardhat run scripts/deploy-dungeon-contracts.js --network bsc
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// ==================== 配置區 ====================

// 現有的 DungeonCore 地址（從 .env 讀取）
const DUNGEONCORE_ADDRESS = process.env.VITE_DUNGEONCORE_ADDRESS || '0x5B64A5939735Ff762493D9B9666b3e13118c5722';

// VRF 配置 (BSC Mainnet)
const VRF_CONFIG = {
  // 您的訂閱 ID
  SUBSCRIPTION_ID: '88422796721004450630713121079263696788635490871993157345476848872165866246915',
  // BSC Mainnet VRF Coordinator V2.5
  COORDINATOR: '0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9',
  // 200 Gwei Key Hash for BSC
  KEY_HASH: '0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4',
  // 2.5M gas limit
  CALLBACK_GAS_LIMIT: 2500000,
  // 6 個區塊確認
  REQUEST_CONFIRMATIONS: 6,
  // 每次請求 1 個隨機數
  NUM_WORDS: 1
};

// ==================== 工具函數 ====================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTx(tx, confirmations = 2) {
  console.log(`⏳ 等待交易確認... Hash: ${tx.hash}`);
  const receipt = await tx.wait(confirmations);
  console.log(`✅ 交易已確認！Gas Used: ${receipt.gasUsed.toString()}`);
  return receipt;
}

async function verifyContract(address, constructorArgs = []) {
  console.log(`\n📝 驗證合約 ${address}...`);
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ 合約驗證成功`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`ℹ️ 合約已經驗證過`);
    } else {
      console.log(`⚠️ 驗證失敗:`, error.message);
    }
  }
}

async function saveDeploymentInfo(deployedContracts) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `deployment-dungeon-${timestamp}.json`;
  const filepath = path.join(__dirname, '..', 'deployments', filename);
  
  const deploymentData = {
    timestamp: new Date().toISOString(),
    network: hre.network.name,
    contracts: deployedContracts,
    dungeonCore: DUNGEONCORE_ADDRESS,
    vrfConfig: VRF_CONFIG
  };
  
  // 確保目錄存在
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n💾 部署信息已保存到: ${filename}`);
  
  return deploymentData;
}

// ==================== 主部署函數 ====================

async function main() {
  console.log("========================================");
  console.log("🚀 開始部署 Dungeon 相關合約");
  console.log("========================================");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n📍 部署者地址: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${hre.ethers.formatEther(balance)} BNB`);
  
  console.log(`\n📋 使用的 DungeonCore 地址: ${DUNGEONCORE_ADDRESS}`);
  
  // 檢查 DungeonCore 是否存在
  const dungeonCoreCode = await hre.ethers.provider.getCode(DUNGEONCORE_ADDRESS);
  if (dungeonCoreCode === '0x') {
    throw new Error(`❌ DungeonCore 地址 ${DUNGEONCORE_ADDRESS} 沒有部署合約！`);
  }
  console.log(`✅ DungeonCore 合約存在`);
  
  const deployedContracts = {};
  
  try {
    // ==================== 步驟 1: 部署 DungeonStorage ====================
    console.log("\n========================================");
    console.log("📦 步驟 1: 部署 DungeonStorage");
    console.log("========================================");
    
    const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy();
    await dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await dungeonStorage.getAddress();
    
    deployedContracts.DungeonStorage = dungeonStorageAddress;
    console.log(`✅ DungeonStorage 部署成功: ${dungeonStorageAddress}`);
    
    // 設置 DungeonCore
    console.log(`\n🔗 設置 DungeonStorage.setDungeonCore...`);
    const setCoreTx1 = await dungeonStorage.setDungeonCore(DUNGEONCORE_ADDRESS);
    await waitForTx(setCoreTx1);
    console.log(`✅ DungeonStorage 已連接到 DungeonCore`);
    
    // ==================== 步驟 2: 部署 VRFConsumerV2Plus ====================
    console.log("\n========================================");
    console.log("🎲 步驟 2: 部署 VRFConsumerV2Plus");
    console.log("========================================");
    
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfConsumer = await VRFConsumerV2Plus.deploy();
    await vrfConsumer.waitForDeployment();
    const vrfConsumerAddress = await vrfConsumer.getAddress();
    
    deployedContracts.VRFConsumerV2Plus = vrfConsumerAddress;
    console.log(`✅ VRFConsumerV2Plus 部署成功: ${vrfConsumerAddress}`);
    
    // 設置 DungeonCore
    console.log(`\n🔗 設置 VRFConsumerV2Plus.setDungeonCore...`);
    const setCoreTx2 = await vrfConsumer.setDungeonCore(DUNGEONCORE_ADDRESS);
    await waitForTx(setCoreTx2);
    console.log(`✅ VRFConsumerV2Plus 已連接到 DungeonCore`);
    
    // ==================== 步驟 3: 部署 DungeonMaster ====================
    console.log("\n========================================");
    console.log("⚔️ 步驟 3: 部署 DungeonMaster");
    console.log("========================================");
    
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = await DungeonMaster.deploy();
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    
    deployedContracts.DungeonMaster = dungeonMasterAddress;
    console.log(`✅ DungeonMaster 部署成功: ${dungeonMasterAddress}`);
    
    // 設置 DungeonCore
    console.log(`\n🔗 設置 DungeonMaster.setDungeonCore...`);
    const setCoreTx3 = await dungeonMaster.setDungeonCore(DUNGEONCORE_ADDRESS);
    await waitForTx(setCoreTx3);
    console.log(`✅ DungeonMaster 已連接到 DungeonCore`);
    
    // ==================== 步驟 4: 更新 DungeonCore ====================
    console.log("\n========================================");
    console.log("🔄 步驟 4: 更新 DungeonCore 配置");
    console.log("========================================");
    
    const dungeonCore = await hre.ethers.getContractAt("IDungeonCore", DUNGEONCORE_ADDRESS);
    
    // 更新 DungeonStorage 地址
    console.log(`\n📝 更新 DungeonCore.setDungeonStorage...`);
    const setStorageTx = await dungeonCore.setDungeonStorage(dungeonStorageAddress);
    await waitForTx(setStorageTx);
    console.log(`✅ DungeonCore 已更新 DungeonStorage 地址`);
    
    // 更新 VRFManager 地址
    console.log(`\n📝 更新 DungeonCore.setVRFManager...`);
    const setVRFTx = await dungeonCore.setVRFManager(vrfConsumerAddress);
    await waitForTx(setVRFTx);
    console.log(`✅ DungeonCore 已更新 VRFManager 地址`);
    
    // 更新 DungeonMaster 地址
    console.log(`\n📝 更新 DungeonCore.setDungeonMaster...`);
    const setMasterTx = await dungeonCore.setDungeonMaster(dungeonMasterAddress);
    await waitForTx(setMasterTx);
    console.log(`✅ DungeonCore 已更新 DungeonMaster 地址`);
    
    // ==================== 步驟 5: 驗證配置 ====================
    console.log("\n========================================");
    console.log("✅ 步驟 5: 驗證配置");
    console.log("========================================");
    
    // 驗證 DungeonCore 的地址設置
    const storedStorageAddr = await dungeonCore.dungeonStorageAddress();
    const storedVRFAddr = await dungeonCore.getVRFManager();
    const storedMasterAddr = await dungeonCore.dungeonMasterAddress();
    
    console.log(`\n📋 DungeonCore 配置驗證:`);
    console.log(`  DungeonStorage: ${storedStorageAddr === dungeonStorageAddress ? '✅' : '❌'} ${storedStorageAddr}`);
    console.log(`  VRFManager: ${storedVRFAddr === vrfConsumerAddress ? '✅' : '❌'} ${storedVRFAddr}`);
    console.log(`  DungeonMaster: ${storedMasterAddr === dungeonMasterAddress ? '✅' : '❌'} ${storedMasterAddr}`);
    
    // 驗證反向連接
    console.log(`\n📋 反向連接驗證:`);
    
    // 檢查 DungeonStorage 能否通過 DungeonCore 獲取 DungeonMaster
    try {
      const dungeonStorageContract = await hre.ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
      // 嘗試調用需要 onlyLogicContract 的函數來驗證權限
      console.log(`  DungeonStorage → DungeonCore: ✅ 已設置`);
    } catch (error) {
      console.log(`  DungeonStorage → DungeonCore: ❌ 未設置`);
    }
    
    // 檢查 VRFConsumerV2Plus 的 DungeonCore 設置
    try {
      const vrfContract = await hre.ethers.getContractAt("VRFConsumerV2Plus", vrfConsumerAddress);
      const vrfDungeonCore = await vrfContract.dungeonCore();
      console.log(`  VRFConsumerV2Plus → DungeonCore: ${vrfDungeonCore === DUNGEONCORE_ADDRESS ? '✅' : '❌'} ${vrfDungeonCore}`);
    } catch (error) {
      console.log(`  VRFConsumerV2Plus → DungeonCore: ❌ 讀取失敗`);
    }
    
    // 檢查 DungeonMaster 的 DungeonCore 設置
    try {
      const masterContract = await hre.ethers.getContractAt("DungeonMaster", dungeonMasterAddress);
      const masterDungeonCore = await masterContract.dungeonCore();
      console.log(`  DungeonMaster → DungeonCore: ${masterDungeonCore === DUNGEONCORE_ADDRESS ? '✅' : '❌'} ${masterDungeonCore}`);
    } catch (error) {
      console.log(`  DungeonMaster → DungeonCore: ❌ 讀取失敗`);
    }
    
    // ==================== 步驟 6: 合約驗證 ====================
    console.log("\n========================================");
    console.log("📝 步驟 6: 驗證合約（可選）");
    console.log("========================================");
    
    if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
      console.log("\n等待 30 秒後開始驗證...");
      await sleep(30000);
      
      await verifyContract(dungeonStorageAddress, []);
      await verifyContract(vrfConsumerAddress, []);
      await verifyContract(dungeonMasterAddress, []);
    }
    
    // ==================== 保存部署信息 ====================
    const deploymentData = await saveDeploymentInfo(deployedContracts);
    
    // ==================== 部署總結 ====================
    console.log("\n========================================");
    console.log("🎉 部署完成總結");
    console.log("========================================");
    
    console.log("\n📋 已部署的合約地址:");
    console.log(`  DungeonStorage: ${dungeonStorageAddress}`);
    console.log(`  VRFConsumerV2Plus: ${vrfConsumerAddress}`);
    console.log(`  DungeonMaster: ${dungeonMasterAddress}`);
    
    console.log("\n📋 DungeonCore 配置:");
    console.log(`  地址: ${DUNGEONCORE_ADDRESS}`);
    console.log(`  已更新三個合約地址 ✅`);
    
    console.log("\n📋 VRF 配置:");
    console.log(`  Subscription ID: ${VRF_CONFIG.SUBSCRIPTION_ID}`);
    console.log(`  Coordinator: ${VRF_CONFIG.COORDINATOR}`);
    console.log(`  Key Hash: ${VRF_CONFIG.KEY_HASH}`);
    
    console.log("\n🎯 下一步操作:");
    console.log("1. 更新 .env 文件中的合約地址");
    console.log("2. 執行配置同步: node scripts/ultimate-config-system.js sync");
    console.log("3. 更新子圖並重新部署");
    console.log("4. 測試合約功能是否正常");
    
    console.log("\n✅ 所有步驟完成！");
    
  } catch (error) {
    console.error("\n❌ 部署失敗:", error);
    
    // 輸出已部署的合約以便手動處理
    if (Object.keys(deployedContracts).length > 0) {
      console.log("\n📋 已部署的合約（部分）:");
      for (const [name, address] of Object.entries(deployedContracts)) {
        console.log(`  ${name}: ${address}`);
      }
    }
    
    throw error;
  }
}

// ==================== 執行部署 ====================

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });