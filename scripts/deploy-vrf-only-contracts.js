#!/usr/bin/env node

/**
 * VRF-Only 模式合約部署腳本
 * 部署修改後的 Hero, Relic, DungeonMaster, AltarOfAscension 合約
 * 移除了 commit-reveal 機制，純 VRF 實現
 */

const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 現有合約地址（不需要重新部署）
const EXISTING_CONTRACTS = {
  VRF_MANAGER: "0x662F0B22CBCD35f5a2e4Cb01dB9e0707b1AF4546",
  DUNGEON_CORE: "0xCBD7dEC07FdBEf1a5eb86F3e88E66c09B2F3e9b1",
  PARTY_V3: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
  PLAYER_VAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  PLAYER_PROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VIP_STAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C"
};

async function main() {
  console.log(`${colors.cyan}${colors.bright}🚀 VRF-Only 模式合約部署${colors.reset}`);
  console.log('===============================\n');
  
  // 創建原生 ethers provider 和 wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org"
  );
  
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`${colors.blue}部署者地址:${colors.reset}`, deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`${colors.blue}部署者餘額:${colors.reset}`, ethers.formatEther(balance), 'BNB\n');
  
  if (parseFloat(ethers.formatEther(balance)) < 0.2) {
    throw new Error('BNB 餘額不足 (建議至少 0.2 BNB)');
  }
  
  const deployedContracts = {};
  const timestamp = Date.now();
  
  try {
    // 1. 部署 Hero 合約
    console.log(`${colors.yellow}🔨 1. 部署 Hero (VRF-Only)...${colors.reset}`);
    
    const heroArtifact = await hre.artifacts.readArtifact("Hero");
    const heroFactory = new ethers.ContractFactory(
      heroArtifact.abi,
      heroArtifact.bytecode,
      deployer
    );
    
    console.log('   發送部署交易...');
    const heroContract = await heroFactory.deploy(
      deployer.address, // initialOwner
      {
        gasLimit: 6000000
      }
    );
    
    console.log('   交易 hash:', heroContract.deploymentTransaction().hash);
    console.log('   等待確認...');
    await heroContract.waitForDeployment();
    
    const heroAddress = await heroContract.getAddress();
    deployedContracts.HERO = heroAddress;
    console.log(`   ${colors.green}✅ Hero 部署成功: ${heroAddress}${colors.reset}\n`);

    // 2. 部署 Relic 合約
    console.log(`${colors.yellow}🔨 2. 部署 Relic (VRF-Only)...${colors.reset}`);
    
    const relicArtifact = await hre.artifacts.readArtifact("Relic");
    const relicFactory = new ethers.ContractFactory(
      relicArtifact.abi,
      relicArtifact.bytecode,
      deployer
    );
    
    console.log('   發送部署交易...');
    const relicContract = await relicFactory.deploy(
      deployer.address, // initialOwner
      {
        gasLimit: 6000000
      }
    );
    
    console.log('   交易 hash:', relicContract.deploymentTransaction().hash);
    console.log('   等待確認...');
    await relicContract.waitForDeployment();
    
    const relicAddress = await relicContract.getAddress();
    deployedContracts.RELIC = relicAddress;
    console.log(`   ${colors.green}✅ Relic 部署成功: ${relicAddress}${colors.reset}\n`);

    // 3. 部署 DungeonStorage（如果需要）
    console.log(`${colors.yellow}🔨 3. 檢查 DungeonStorage...${colors.reset}`);
    // 使用現有的 DungeonStorage 合約地址
    const DUNGEON_STORAGE = "0x5D5D75a0bEF0Ce708d59749c0D9ba1a59fC24Cbb";
    deployedContracts.DUNGEON_STORAGE = DUNGEON_STORAGE;
    console.log(`   ${colors.green}✅ 使用現有 DungeonStorage: ${DUNGEON_STORAGE}${colors.reset}\n`);

    // 4. 部署 DungeonMaster 合約
    console.log(`${colors.yellow}🔨 4. 部署 DungeonMaster (VRF-Only)...${colors.reset}`);
    
    const dmArtifact = await hre.artifacts.readArtifact("DungeonMaster");
    const dmFactory = new ethers.ContractFactory(
      dmArtifact.abi,
      dmArtifact.bytecode,
      deployer
    );
    
    console.log('   發送部署交易...');
    const dmContract = await dmFactory.deploy(
      deployer.address, // _initialOwner
      {
        gasLimit: 6000000
      }
    );
    
    console.log('   交易 hash:', dmContract.deploymentTransaction().hash);
    console.log('   等待確認...');
    await dmContract.waitForDeployment();
    
    const dmAddress = await dmContract.getAddress();
    deployedContracts.DUNGEON_MASTER = dmAddress;
    console.log(`   ${colors.green}✅ DungeonMaster 部署成功: ${dmAddress}${colors.reset}\n`);

    // 5. 部署 AltarOfAscension 合約
    console.log(`${colors.yellow}🔨 5. 部署 AltarOfAscension (VRF-Only)...${colors.reset}`);
    
    const altarArtifact = await hre.artifacts.readArtifact("AltarOfAscensionVRF");
    const altarFactory = new ethers.ContractFactory(
      altarArtifact.abi,
      altarArtifact.bytecode,
      deployer
    );
    
    console.log('   發送部署交易...');
    const altarContract = await altarFactory.deploy(
      deployer.address, // _initialOwner
      {
        gasLimit: 6000000
      }
    );
    
    console.log('   交易 hash:', altarContract.deploymentTransaction().hash);
    console.log('   等待確認...');
    await altarContract.waitForDeployment();
    
    const altarAddress = await altarContract.getAddress();
    deployedContracts.ALTAR_OF_ASCENSION = altarAddress;
    console.log(`   ${colors.green}✅ AltarOfAscension 部署成功: ${altarAddress}${colors.reset}\n`);

    // 部署完成總結
    console.log(`${colors.green}${colors.bright}🎉 部署完成！${colors.reset}`);
    console.log('==============\n');
    console.log(`${colors.cyan}新部署的合約:${colors.reset}`);
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });
    
    // 保存部署記錄
    const deploymentRecord = {
      timestamp,
      deployer: deployer.address,
      network: 'bsc',
      contracts: {
        ...deployedContracts,
        ...EXISTING_CONTRACTS
      },
      type: 'VRF_ONLY_DEPLOYMENT'
    };
    
    const recordPath = `scripts/deployments/vrf-only-deployment-${timestamp}.json`;
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    console.log(`\n${colors.blue}部署記錄已保存: ${recordPath}${colors.reset}`);
    
    console.log(`\n${colors.yellow}⚠️  下一步: 執行合約互連腳本${colors.reset}`);
    console.log(`   node scripts/setup-v25-contract-connections.js`);
    
  } catch (error) {
    console.error(`${colors.red}❌ 部署失敗:${colors.reset}`, error.message);
    
    // 保存錯誤記錄
    const errorRecord = {
      timestamp,
      error: error.message,
      stack: error.stack,
      deployedContracts
    };
    
    const errorPath = `scripts/deployments/vrf-only-deployment-error-${timestamp}.json`;
    fs.writeFileSync(errorPath, JSON.stringify(errorRecord, null, 2));
    console.log(`\n錯誤記錄已保存: ${errorPath}`);
    
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };