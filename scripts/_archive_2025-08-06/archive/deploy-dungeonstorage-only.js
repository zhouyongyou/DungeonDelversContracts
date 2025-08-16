#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// DungeonMaster 地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

async function deployDungeonStorage() {
  console.log('🚀 部署新的 DungeonStorage 合約...\n');
  
  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ 錯誤: BNB 餘額不足 (需要至少 0.01 BNB)');
    process.exit(1);
  }

  try {
    // 讀取 DungeonStorage 編譯文件
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'current', 'core', 'DungeonStorage.sol', 'DungeonStorage.json');
    
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ 找不到 DungeonStorage 編譯文件');
      console.log('   請先執行: npx hardhat compile');
      process.exit(1);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    
    console.log('📊 部署 DungeonStorage...');
    console.log(`   初始 Owner: ${deployer.address}`);
    console.log(`   DungeonMaster 將在部署後設置`);
    
    const contract = await factory.deploy(
      deployer.address      // initialOwner
    );
    
    console.log('   ⏳ 等待交易確認...');
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`   ✅ DungeonStorage 部署成功: ${address}`);
    
    // 保存部署結果
    const deploymentResult = {
      contract: 'DungeonStorage',
      address: address,
      timestamp: new Date().toISOString(),
      network: 'bsc-mainnet',
      deployer: deployer.address,
      constructorArgs: [deployer.address]
    };
    
    const outputPath = path.join(__dirname, '..', `deployment-dungeonstorage-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(deploymentResult, null, 2));
    
    console.log(`\n📄 部署結果已保存到: ${outputPath}`);
    console.log('\n📌 下一步：');
    console.log(`1. 更新 v22-config.js 中的 DUNGEONSTORAGE 地址為: ${address}`);
    console.log(`2. 在 DungeonStorage 中設置 LogicContract 為 DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);
    console.log(`3. 在 DungeonMaster 中設置新的 DungeonStorage 地址`);
    console.log(`4. 執行地城參數初始化`);
    
    return address;
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error);
    process.exit(1);
  }
}

// 執行部署
deployDungeonStorage().catch(console.error);