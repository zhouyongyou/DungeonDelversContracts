#!/usr/bin/env node

// V22 完整部署腳本 - 使用正確的地址和 V21 配置系統
// 此腳本從 V21 配置讀取地址，並部署新的合約

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 載入 V21 配置
const config = require('../config/v21-config');

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 從 V21 配置讀取固定地址（這些不會重新部署）
const FIXED_ADDRESSES = {
  // 核心代幣（永不重新部署）
  USD: config.contracts.USD.address,
  SOULSHARD: config.contracts.SOULSHARD.address,
  UNISWAP_POOL: config.contracts.UNISWAP_POOL.address,
  
  // DungeonMaster 錢包（不變）
  DUNGEONMASTERWALLET: config.contracts.DUNGEONMASTERWALLET.address
};

// 需要部署的合約列表
const CONTRACTS_TO_DEPLOY = [
  'ORACLE',          // Oracle 價格預言機
  'HERO',           // Hero NFT
  'RELIC',          // Relic NFT
  'PARTY',          // Party NFT
  'PLAYERVAULT',    // PlayerVault
  'PLAYERPROFILE',  // PlayerProfile
  'VIPSTAKING',     // VIPStaking
  'DUNGEONCORE',    // DungeonCore（核心控制器）
  'DUNGEONSTORAGE', // DungeonStorage
  'DUNGEONMASTER',  // DungeonMaster
  'ALTAROFASCENSION' // AltarOfAscension
];

// 部署順序（考慮依賴關係）
const DEPLOYMENT_ORDER = [
  // 1. 基礎設施
  'ORACLE',
  'PLAYERVAULT',
  'PLAYERPROFILE',
  
  // 2. 核心系統（必須在 NFT 之前）
  'DUNGEONCORE',
  
  // 3. NFT 合約（依賴 DungeonCore）
  'HERO',
  'RELIC',
  'PARTY',
  
  // 4. 遊戲邏輯
  'VIPSTAKING',
  'DUNGEONSTORAGE',
  'DUNGEONMASTER',
  'ALTAROFASCENSION'
];

async function deployV22() {
  console.log('🚀 開始 V22 完整部署...\n');
  console.log('📋 配置信息：');
  console.log(`   版本: ${config.version}`);
  console.log(`   網路: ${config.network}`);
  console.log(`   最後更新: ${config.lastUpdated}\n`);
  
  console.log('📌 固定地址（不重新部署）：');
  console.log(`   USD: ${FIXED_ADDRESSES.USD}`);
  console.log(`   SOULSHARD: ${FIXED_ADDRESSES.SOULSHARD}`);
  console.log(`   UNISWAP_POOL: ${FIXED_ADDRESSES.UNISWAP_POOL}`);
  console.log(`   DUNGEONMASTERWALLET: ${FIXED_ADDRESSES.DUNGEONMASTERWALLET}\n`);
  
  console.log('📦 將部署的合約：');
  DEPLOYMENT_ORDER.forEach(name => {
    console.log(`   - ${name}`);
  });
  console.log('');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  if (balance < ethers.parseEther('0.1')) {
    console.error('❌ 錯誤: BNB 餘額不足 (需要至少 0.1 BNB)');
    process.exit(1);
  }

  // 確認部署
  console.log('⚠️  警告：這將部署全新的合約套件！');
  console.log('   請確認您要繼續嗎？(輸入 yes 繼續)');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    readline.question('繼續部署？ ', resolve);
  });
  readline.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ 部署已取消');
    process.exit(0);
  }

  const deployedContracts = {};
  
  try {
    // ========================================
    // 部署合約
    // ========================================
    
    for (const contractName of DEPLOYMENT_ORDER) {
      console.log(`\n📊 部署 ${contractName}...`);
      
      const contractPath = getContractPath(contractName);
      const artifactPath = getArtifactPath(contractPath);
      
      if (!fs.existsSync(artifactPath)) {
        console.error(`❌ 找不到 ${contractName} 編譯文件`);
        console.log('   請先執行: npx hardhat compile');
        process.exit(1);
      }
      
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
      
      const constructorArgs = getConstructorArgs(contractName, deployedContracts);
      console.log(`   構造參數:`, constructorArgs);
      
      const contract = await factory.deploy(...constructorArgs);
      console.log(`   ⏳ 等待交易確認...`);
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      deployedContracts[contractName] = address;
      
      console.log(`   ✅ ${contractName} 部署成功: ${address}`);
    }
    
    // ========================================
    // 設置合約連接
    // ========================================
    console.log('\n🔗 設置合約連接...');
    
    // TODO: 實現合約連接邏輯
    // 例如：DungeonCore.setHero(), Hero.setDungeonCore() 等
    
    // ========================================
    // 保存部署結果
    // ========================================
    const deploymentResult = {
      version: 'V22',
      timestamp: new Date().toISOString(),
      network: 'bsc-mainnet',
      deployer: deployer.address,
      contracts: {
        ...deployedContracts,
        // 包含固定地址
        USD: FIXED_ADDRESSES.USD,
        SOULSHARD: FIXED_ADDRESSES.SOULSHARD,
        UNISWAP_POOL: FIXED_ADDRESSES.UNISWAP_POOL,
        DUNGEONMASTERWALLET: FIXED_ADDRESSES.DUNGEONMASTERWALLET
      }
    };
    
    const outputPath = path.join(__dirname, '..', `deployment-v22-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(deploymentResult, null, 2));
    
    console.log(`\n✅ 部署完成！`);
    console.log(`📄 部署結果已保存到: ${outputPath}`);
    console.log('\n📌 下一步：');
    console.log('1. 更新 config/v21-config.js 中的合約地址');
    console.log('2. 執行 npm run v21:sync 同步到所有項目');
    console.log('3. 在 BSCScan 驗證合約');
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error);
    process.exit(1);
  }
}

// 獲取合約路徑
function getContractPath(contractName) {
  const contractPaths = {
    ORACLE: 'defi/Oracle.sol:Oracle_Final',
    HERO: 'nft/Hero.sol:Hero',
    RELIC: 'nft/Relic.sol:Relic',
    PARTY: 'nft/Party.sol:Party',
    PLAYERVAULT: 'defi/PlayerVault.sol:PlayerVault',
    PLAYERPROFILE: 'nft/PlayerProfile.sol:PlayerProfile',
    VIPSTAKING: 'nft/VIPStaking.sol:VIPStaking',
    DUNGEONCORE: 'core/DungeonCore.sol:DungeonCore',
    DUNGEONSTORAGE: 'core/DungeonStorage.sol:DungeonStorage',
    DUNGEONMASTER: 'core/DungeonMaster.sol:DungeonMasterV2',
    ALTAROFASCENSION: 'core/AltarOfAscension.sol:AltarOfAscensionV2Fixed'
  };
  
  return contractPaths[contractName];
}

// 獲取編譯文件路徑
function getArtifactPath(contractPath) {
  const [file, contractName] = contractPath.split(':');
  return path.join(__dirname, '..', 'artifacts', 'contracts', 'current', file, `${contractName}.json`);
}

// 獲取構造函數參數
function getConstructorArgs(contractName, deployedContracts) {
  switch (contractName) {
    case 'ORACLE':
      return [
        FIXED_ADDRESSES.UNISWAP_POOL,
        FIXED_ADDRESSES.SOULSHARD,
        FIXED_ADDRESSES.USD
      ];
      
    case 'DUNGEONCORE':
      return [
        deployer.address, // initial owner
        FIXED_ADDRESSES.USD,
        FIXED_ADDRESSES.SOULSHARD
      ];
      
    case 'HERO':
    case 'RELIC':
      return [
        deployer.address, // initial owner
        '', // baseURI (設置為空，稍後更新)
        deployedContracts.DUNGEONCORE
      ];
      
    case 'PARTY':
      return [
        deployer.address, // initial owner
        deployedContracts.DUNGEONCORE
      ];
      
    case 'PLAYERVAULT':
      return [
        deployer.address, // initial owner
        FIXED_ADDRESSES.SOULSHARD,
        deployedContracts.DUNGEONCORE
      ];
      
    case 'PLAYERPROFILE':
    case 'VIPSTAKING':
      return [deployer.address]; // initial owner
      
    case 'DUNGEONSTORAGE':
      return [
        deployer.address, // initial owner
        deployedContracts.DUNGEONMASTER || ethers.ZeroAddress // 如果 DungeonMaster 還沒部署
      ];
      
    case 'DUNGEONMASTER':
      return [deployer.address]; // initial owner
      
    case 'ALTAROFASCENSION':
      return [deployer.address]; // initial owner
      
    default:
      throw new Error(`未知的合約: ${contractName}`);
  }
}

// 執行部署
deployV22().catch(console.error);