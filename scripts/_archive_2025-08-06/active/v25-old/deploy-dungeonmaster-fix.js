#!/usr/bin/env node

// 部署修復版的 DungeonMasterV2

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// 讀取編譯後的合約
const contractPath = path.join(__dirname, '../../artifacts/contracts/current/core/DungeonMasterV2_Fixed.sol/DungeonMasterV2_Fixed.json');

async function deployDungeonMasterFix() {
  console.log('🚀 部署修復版 DungeonMasterV2...\n');

  if (!fs.existsSync(contractPath)) {
    console.error('❌ 錯誤: 找不到編譯後的合約文件');
    console.log('請先執行: npx hardhat compile');
    process.exit(1);
  }

  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const abi = contractJson.abi;
  const bytecode = contractJson.bytecode;

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB\n`);

  // 1. 部署新的 DungeonMaster
  console.log('📋 部署 DungeonMasterV2_Fixed...');
  
  const DungeonMaster = new ethers.ContractFactory(abi, bytecode, deployer);
  const dungeonMaster = await DungeonMaster.deploy(deployer.address);
  
  console.log(`交易哈希: ${dungeonMaster.deploymentTransaction().hash}`);
  console.log('等待確認...');
  
  await dungeonMaster.waitForDeployment();
  const newAddress = await dungeonMaster.getAddress();
  
  console.log(`✅ 部署成功！地址: ${newAddress}\n`);

  // 2. 設置必要的連接
  console.log('🔗 設置合約連接...');
  
  // 設置 DungeonCore
  try {
    console.log('設置 DungeonCore...');
    const tx1 = await dungeonMaster.setDungeonCore(v22Config.contracts.DUNGEONCORE.address);
    await tx1.wait();
    console.log('✅ DungeonCore 設置成功');
  } catch (error) {
    console.log(`❌ 設置 DungeonCore 失敗: ${error.message}`);
  }

  // 設置 DungeonStorage
  try {
    console.log('設置 DungeonStorage...');
    const tx2 = await dungeonMaster.setDungeonStorage(v22Config.contracts.DUNGEONSTORAGE.address);
    await tx2.wait();
    console.log('✅ DungeonStorage 設置成功');
  } catch (error) {
    console.log(`❌ 設置 DungeonStorage 失敗: ${error.message}`);
  }

  // 設置 SoulShard Token
  try {
    console.log('設置 SoulShard Token...');
    const tx3 = await dungeonMaster.setSoulShardToken(v22Config.contracts.SOULSHARD.address);
    await tx3.wait();
    console.log('✅ SoulShard Token 設置成功');
  } catch (error) {
    console.log(`❌ 設置 SoulShard Token 失敗: ${error.message}`);
  }

  // 3. 更新 DungeonCore 指向新的 DungeonMaster
  console.log('\n🔗 更新 DungeonCore 的 DungeonMaster 地址...');
  
  const dungeonCoreAbi = ['function setDungeonMaster(address _newAddress) external'];
  const dungeonCore = new ethers.Contract(
    v22Config.contracts.DUNGEONCORE.address,
    dungeonCoreAbi,
    deployer
  );
  
  try {
    const tx4 = await dungeonCore.setDungeonMaster(newAddress);
    await tx4.wait();
    console.log('✅ DungeonCore 更新成功');
  } catch (error) {
    console.log(`❌ 更新 DungeonCore 失敗: ${error.message}`);
  }

  // 4. 更新 DungeonStorage 的邏輯合約
  console.log('\n🔗 更新 DungeonStorage 的邏輯合約地址...');
  
  const storageAbi = ['function setLogicContract(address _logicContract) external'];
  const storage = new ethers.Contract(
    v22Config.contracts.DUNGEONSTORAGE.address,
    storageAbi,
    deployer
  );
  
  try {
    const tx5 = await storage.setLogicContract(newAddress);
    await tx5.wait();
    console.log('✅ DungeonStorage 更新成功');
  } catch (error) {
    console.log(`❌ 更新 DungeonStorage 失敗: ${error.message}`);
  }

  // 5. 保存新配置
  console.log('\n💾 保存部署信息...');
  
  const deploymentInfo = {
    network: 'bsc-mainnet',
    deployedAt: new Date().toISOString(),
    oldAddress: v22Config.contracts.DUNGEONMASTER.address,
    newAddress: newAddress,
    deployer: deployer.address,
    version: 'V2_Fixed',
    description: '修復 PartyStatus 結構不匹配問題'
  };
  
  const deploymentPath = path.join(__dirname, '../../deployments', `dungeonmaster-fix-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n✅ 部署完成！`);
  console.log(`新的 DungeonMaster 地址: ${newAddress}`);
  console.log(`\n⚠️  請更新 v22-config.js 中的 DUNGEONMASTER 地址為: ${newAddress}`);
  console.log(`\n下一步：`);
  console.log(`1. 更新 v22-config.js`);
  console.log(`2. 同步前端配置`);
  console.log(`3. 測試地城探索功能`);
}

// 執行部署
if (require.main === module) {
  deployDungeonMasterFix().catch(console.error);
}

module.exports = { deployDungeonMasterFix };