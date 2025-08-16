#!/usr/bin/env node

/**
 * V25 VRF 版本完整部署腳本
 * 
 * 包含 VRF 系統整合的完整部署流程
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-deploy-vrf-complete.js --network bsc
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

// ======================== VRF 配置區域 ========================

// 已部署的 VRFManager 地址
const VRFMANAGER_ADDRESS = "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD";

// ======================== 部署配置區域 ========================

const DEPLOYMENT_CONFIG = {
  // 是否部署新的 Token 合約
  deployNewTokens: false,
  
  // 現有合約地址（如果不部署新的）
  existingContracts: {
    SOULSHARD: process.env.SOULSHARD_ADDRESS || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    ORACLE: process.env.ORACLE_ADDRESS || '0x67989939163bCFC57302767722E1988FFac46d64', // V25 已部署的 Oracle
    VRFMANAGER: VRFMANAGER_ADDRESS, // 使用已部署的 VRFManager
    UNISWAP_POOL: process.env.UNISWAP_POOL || '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
  },
  
  // 外部地址
  externalAddresses: {
    USDT: process.env.USDT_ADDRESS || '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE', // BSC USDT
  },
  
  // 部署選項
  options: {
    useVRF: true,            // 啟用 VRF
    autoVerify: true,        // 自動驗證合約
    setupConnections: true,  // 自動設置合約連接
    initializeParams: true,  // 自動初始化參數
    deployMarketplace: false,// 是否部署市場合約
    generateDocs: true,      // 生成部署文檔
  }
};

// 合約部署順序（包含 VRF 考慮）
const DEPLOYMENT_ORDER = [
  // 代幣合約
  ...(DEPLOYMENT_CONFIG.deployNewTokens ? ['Test_SoulShard'] : []),
  // 'Oracle_V22_Adaptive', // 使用現有的 Oracle
  
  // 核心合約
  'PlayerVault',
  'DungeonCore',
  'DungeonStorage',
  'DungeonMaster', // 使用支援 VRF 的版本
  
  // NFT 合約（支援 VRF）
  'Hero',        // 使用支援 VRF 的版本
  'Relic',       // 使用支援 VRF 的版本
  'PartyV3',
  
  // 功能合約
  'VIPStaking',
  'PlayerProfile',
  'AltarOfAscension'  // 使用支援 VRF 的版本
];

// 合約名稱映射
const CONTRACT_NAME_MAP = {
  'Oracle_V22_Adaptive': 'ORACLE',
  'Test_SoulShard': 'SOULSHARD',
  'PlayerVault': 'PLAYERVAULT',
  'DungeonCore': 'DUNGEONCORE',
  'DungeonStorage': 'DUNGEONSTORAGE',
  'DungeonMaster': 'DUNGEONMASTER',
  'Hero': 'HERO',
  'Relic': 'RELIC',
  'PartyV3': 'PARTY',
  'VIPStaking': 'VIPSTAKING',
  'PlayerProfile': 'PLAYERPROFILE',
  'AltarOfAscension': 'ALTAROFASCENSION'
};

// 遊戲參數配置
const GAME_PARAMS = {
  // NFT 鑄造價格（USD）
  mintPriceUSD: 2,
  
  // 平台費用
  platformFee: ethers.parseEther("0.0003"),
  
  // DungeonMaster 探索費用
  explorationFee: ethers.parseEther("0.0015"),
  
  // VIPStaking 設定
  unstakeCooldown: 15, // 測試用 15 秒，生產環境建議 7-14 天
  
  // Oracle 價格 (初始設置)
  initialBNBPrice: 350 * 1e8, // $350 USD
  initialSoulShardPrice: 1 * 1e7, // $0.10 USD
};

// ======================== 部署邏輯 ========================

async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║              🚀 V25 VRF 完整部署腳本                          ║");
  console.log("║              包含 Chainlink VRF V2.5 整合                     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}\n`);

  const [deployer] = await hre.ethers.getSigners();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log(`${colors.blue}[部署資訊]${colors.reset}`);
  console.log(`部署者地址: ${deployer.address}`);
  console.log(`部署者餘額: ${ethers.formatEther(deployerBalance)} BNB`);
  console.log(`VRFManager: ${VRFMANAGER_ADDRESS}`);
  console.log(`使用 VRF: ${DEPLOYMENT_CONFIG.options.useVRF ? '✅' : '❌'}`);
  console.log("");

  // 檢查餘額
  if (deployerBalance < ethers.parseEther("0.2")) {
    console.log(`${colors.red}[ERROR] 餘額不足，至少需要 0.2 BNB${colors.reset}`);
    process.exit(1);
  }

  const deployedContracts = {};
  const deploymentStartTime = Date.now();

  try {
    // ============ 階段 1: 使用現有合約 ============
    console.log(`\n${colors.cyan}══════ 階段 1: 使用現有合約 ══════${colors.reset}\n`);
    
    if (!DEPLOYMENT_CONFIG.deployNewTokens && DEPLOYMENT_CONFIG.existingContracts.SOULSHARD) {
      deployedContracts.SOULSHARD = DEPLOYMENT_CONFIG.existingContracts.SOULSHARD;
      console.log(`${colors.green}[使用現有]${colors.reset} SoulShard: ${deployedContracts.SOULSHARD}`);
    }
    
    deployedContracts.ORACLE = DEPLOYMENT_CONFIG.existingContracts.ORACLE;
    console.log(`${colors.green}[使用現有]${colors.reset} Oracle: ${deployedContracts.ORACLE}`);
    
    deployedContracts.VRFMANAGER = VRFMANAGER_ADDRESS;
    console.log(`${colors.green}[使用現有]${colors.reset} VRFManager: ${deployedContracts.VRFMANAGER}`);

    // ============ 階段 2: 部署合約 ============
    console.log(`\n${colors.cyan}══════ 階段 2: 部署合約 ══════${colors.reset}\n`);

    for (const contractName of DEPLOYMENT_ORDER) {
      if (contractName === 'Test_SoulShard' && !DEPLOYMENT_CONFIG.deployNewTokens) {
        continue; // 跳過 SoulShard
      }

      console.log(`\n${colors.blue}[部署]${colors.reset} ${contractName}...`);
      
      let contract;
      let address;

      switch (contractName) {
        case 'Test_SoulShard':
          const SoulShard = await hre.ethers.getContractFactory("Test_SoulShard");
          contract = await SoulShard.deploy("SoulShard", "SOUL");
          break;

        case 'Oracle_V22_Adaptive':
          const Oracle = await hre.ethers.getContractFactory("Oracle_V22_Adaptive");
          // Oracle 需要 pool, soulShard 和 USD token 地址
          const poolAddress = DEPLOYMENT_CONFIG.existingContracts.UNISWAP_POOL;
          const soulShardAddress = deployedContracts.SOULSHARD || DEPLOYMENT_CONFIG.existingContracts.SOULSHARD;
          const usdAddress = DEPLOYMENT_CONFIG.externalAddresses.USDT;
          contract = await Oracle.deploy(poolAddress, soulShardAddress, usdAddress);
          break;

        case 'PlayerVault':
          const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
          contract = await PlayerVault.deploy(deployer.address);
          break;

        case 'DungeonCore':
          const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
          // DungeonCore 需要 owner, USDT 和 SoulShard 地址
          contract = await DungeonCore.deploy(
            deployer.address,
            DEPLOYMENT_CONFIG.externalAddresses.USDT,
            deployedContracts.SOULSHARD
          );
          break;

        case 'DungeonStorage':
          const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
          contract = await DungeonStorage.deploy(deployer.address);
          break;

        case 'DungeonMaster':
          const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
          contract = await DungeonMaster.deploy(deployer.address);
          break;

        case 'Hero':
          const Hero = await hre.ethers.getContractFactory("Hero");
          contract = await Hero.deploy(deployer.address);
          break;

        case 'Relic':
          const Relic = await hre.ethers.getContractFactory("Relic");
          contract = await Relic.deploy(deployer.address);
          break;

        case 'PartyV3':
          const Party = await hre.ethers.getContractFactory("PartyV3");
          contract = await Party.deploy("DungeonDelversParty", "PARTY");
          break;

        case 'VIPStaking':
          const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
          contract = await VIPStaking.deploy(deployer.address);
          break;

        case 'PlayerProfile':
          const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
          contract = await PlayerProfile.deploy(deployer.address);
          break;

        case 'AltarOfAscension':
          const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
          contract = await AltarOfAscension.deploy(deployer.address);
          break;

        default:
          console.log(`${colors.yellow}[WARNING] 未知合約: ${contractName}${colors.reset}`);
          continue;
      }

      await contract.waitForDeployment();
      address = await contract.getAddress();
      
      const mappedName = CONTRACT_NAME_MAP[contractName];
      deployedContracts[mappedName] = address;
      
      console.log(`${colors.green}[✓]${colors.reset} ${contractName} 部署於: ${address}`);
    }

    // ============ 階段 3: VRF 設置 ============
    if (DEPLOYMENT_CONFIG.options.useVRF) {
      console.log(`\n${colors.cyan}══════ 階段 3: VRF 設置 ══════${colors.reset}\n`);
      
      const vrfManager = await hre.ethers.getContractAt("VRFManager", VRFMANAGER_ADDRESS);
      
      // 授權合約使用 VRF
      console.log("授權合約使用 VRF...");
      
      const contractsToAuthorize = [
        { name: 'Hero', address: deployedContracts.HERO },
        { name: 'Relic', address: deployedContracts.RELIC },
        { name: 'AltarOfAscension', address: deployedContracts.ALTAROFASCENSION },
        { name: 'DungeonMaster', address: deployedContracts.DUNGEONMASTER }
      ];
      
      for (const { name, address } of contractsToAuthorize) {
        try {
          const tx = await vrfManager.authorizeContract(address);
          await tx.wait();
          console.log(`${colors.green}[✓]${colors.reset} ${name} 已授權使用 VRF`);
        } catch (error) {
          console.log(`${colors.yellow}[WARNING]${colors.reset} ${name} 授權失敗: ${error.message}`);
        }
      }
      
      // 在各合約中設置 VRFManager
      console.log("\n設置 VRFManager 地址...");
      
      const hero = await hre.ethers.getContractAt("Hero", deployedContracts.HERO);
      await (await hero.setVRFManager(VRFMANAGER_ADDRESS)).wait();
      console.log(`${colors.green}[✓]${colors.reset} Hero 設置 VRFManager`);
      
      const relic = await hre.ethers.getContractAt("Relic", deployedContracts.RELIC);
      await (await relic.setVRFManager(VRFMANAGER_ADDRESS)).wait();
      console.log(`${colors.green}[✓]${colors.reset} Relic 設置 VRFManager`);
      
      const altar = await hre.ethers.getContractAt("AltarOfAscension", deployedContracts.ALTAROFASCENSION);
      await (await altar.setVRFManager(VRFMANAGER_ADDRESS)).wait();
      console.log(`${colors.green}[✓]${colors.reset} AltarOfAscension 設置 VRFManager`);
      
      const dungeonMaster = await hre.ethers.getContractAt("DungeonMaster", deployedContracts.DUNGEONMASTER);
      await (await dungeonMaster.setVRFManager(VRFMANAGER_ADDRESS)).wait();
      console.log(`${colors.green}[✓]${colors.reset} DungeonMaster 設置 VRFManager`);
    }

    // ============ 階段 4: 設置合約連接 ============
    console.log(`\n${colors.cyan}══════ 階段 4: 設置合約連接 ══════${colors.reset}\n`);
    
    // 設置 DungeonCore 連接
    const dungeonCore = await hre.ethers.getContractAt("DungeonCore", deployedContracts.DUNGEONCORE);
    
    console.log("設置 DungeonCore 模組地址...");
    await (await dungeonCore.setPartyContract(deployedContracts.PARTY)).wait();
    await (await dungeonCore.setPlayerVault(deployedContracts.PLAYERVAULT)).wait();
    await (await dungeonCore.setPlayerProfile(deployedContracts.PLAYERPROFILE)).wait();
    await (await dungeonCore.setVIPStaking(deployedContracts.VIPSTAKING)).wait();
    await (await dungeonCore.setOracle(deployedContracts.ORACLE)).wait();
    await (await dungeonCore.setDungeonMaster(deployedContracts.DUNGEONMASTER)).wait();
    await (await dungeonCore.setAltarOfAscension(deployedContracts.ALTAROFASCENSION)).wait();
    await (await dungeonCore.setHeroContract(deployedContracts.HERO)).wait();
    await (await dungeonCore.setRelicContract(deployedContracts.RELIC)).wait();
    await (await dungeonCore.setSoulShardToken(deployedContracts.SOULSHARD)).wait();
    console.log(`${colors.green}[✓]${colors.reset} DungeonCore 模組設置完成`);
    
    // 設置其他合約的 DungeonCore
    console.log("\n設置各模組的 DungeonCore 地址...");
    
    const playerVault = await hre.ethers.getContractAt("PlayerVault", deployedContracts.PLAYERVAULT);
    await (await playerVault.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    const playerProfile = await hre.ethers.getContractAt("PlayerProfile", deployedContracts.PLAYERPROFILE);
    await (await playerProfile.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    const vipStaking = await hre.ethers.getContractAt("VIPStaking", deployedContracts.VIPSTAKING);
    await (await vipStaking.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    await (await dungeonMaster.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await altar.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    await (await hero.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await hero.setSoulShardToken(deployedContracts.SOULSHARD)).wait();
    await (await hero.setAscensionAltarAddress(deployedContracts.ALTAROFASCENSION)).wait();
    
    await (await relic.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await relic.setSoulShardToken(deployedContracts.SOULSHARD)).wait();
    await (await relic.setAscensionAltarAddress(deployedContracts.ALTAROFASCENSION)).wait();
    
    const party = await hre.ethers.getContractAt("PartyV3", deployedContracts.PARTY);
    await (await party.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    console.log(`${colors.green}[✓]${colors.reset} 所有模組 DungeonCore 設置完成`);
    
    // 設置 DungeonMaster 和 DungeonStorage
    const dungeonStorage = await hre.ethers.getContractAt("DungeonStorage", deployedContracts.DUNGEONSTORAGE);
    await (await dungeonMaster.setDungeonStorage(deployedContracts.DUNGEONSTORAGE)).wait();
    await (await dungeonStorage.setDungeonMaster(deployedContracts.DUNGEONMASTER)).wait();
    console.log(`${colors.green}[✓]${colors.reset} DungeonMaster <-> DungeonStorage 連接完成`);

    // ============ 階段 5: 保存部署資訊 ============
    console.log(`\n${colors.cyan}══════ 階段 5: 保存部署資訊 ══════${colors.reset}\n`);
    
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      blockNumber: await hre.ethers.provider.getBlockNumber(),
      contracts: deployedContracts,
      vrfEnabled: DEPLOYMENT_CONFIG.options.useVRF,
      vrfManager: VRFMANAGER_ADDRESS,
      deploymentTime: `${(Date.now() - deploymentStartTime) / 1000} seconds`
    };
    
    const deploymentPath = path.join(__dirname, '../../deployments', `v25-vrf-${Date.now()}.json`);
    
    if (!fs.existsSync(path.dirname(deploymentPath))) {
      fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`${colors.green}[✓]${colors.reset} 部署資訊已保存到: ${deploymentPath}`);
    
    // 更新 master-config.json
    const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
    if (fs.existsSync(masterConfigPath)) {
      const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      Object.assign(masterConfig, deployedContracts);
      masterConfig.VRF_ENABLED = true;
      masterConfig.VRFMANAGER = VRFMANAGER_ADDRESS;
      fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
      console.log(`${colors.green}[✓]${colors.reset} master-config.json 已更新`);
    }

    // ============ 完成 ============
    console.log(`\n${colors.green}${colors.bright}`);
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║                    🎉 部署完成！                              ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log(`${colors.reset}\n`);
    
    console.log("📋 部署摘要:");
    console.log("================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    console.log(`\nVRFManager: ${VRFMANAGER_ADDRESS}`);
    console.log(`VRF 啟用: ${DEPLOYMENT_CONFIG.options.useVRF ? '✅' : '❌'}`);
    
    console.log("\n⚠️ 後續步驟:");
    console.log("1. 初始化地城資料: node scripts/active/v25-setup-remaining-dungeons.js");
    console.log("2. 設置 Oracle 價格: node scripts/active/v25-set-oracle-prices.js");
    console.log("3. 同步配置: cd scripts/active/sync-system && node index.js");
    console.log("4. 驗證合約: node scripts/verify/verify-all-v25.js");
    console.log("5. 測試 VRF 功能: node scripts/active/test-vrf-mint.js");

  } catch (error) {
    console.log(`\n${colors.red}[ERROR] 部署失敗:${colors.reset}`, error);
    process.exit(1);
  }
}

// 執行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });