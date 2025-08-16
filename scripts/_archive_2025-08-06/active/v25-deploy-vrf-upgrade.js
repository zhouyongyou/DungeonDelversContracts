#!/usr/bin/env node

/**
 * V25 VRF 升級部署腳本
 * 
 * 只部署需要 VRF 支援的合約，重用其他已部署合約
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-deploy-vrf-upgrade.js --network bsc
 */

const hre = require("hardhat");
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

// ======================== 配置區域 ========================

// 已部署的合約（8/3 部署的 V25）- 這些將被重用
const EXISTING_CONTRACTS = {
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VRFMANAGER: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD"
};

// 需要重新部署的合約（支援 VRF）
const CONTRACTS_TO_DEPLOY = [
  'DungeonCore',
  'DungeonStorage',
  'DungeonMaster',
  'Hero',
  'Relic',
  'Party',
  'AltarOfAscension'
];

// 外部地址
const EXTERNAL_ADDRESSES = {
  USDT: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"
};

// ======================== 主部署函數 ========================

async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║              🚀 V25 VRF 升級部署腳本                         ║");
  console.log("║              部署支援 VRF 的合約版本                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}\n`);

  const [deployer] = await hre.ethers.getSigners();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log(`${colors.blue}[部署資訊]${colors.reset}`);
  console.log(`部署者地址: ${deployer.address}`);
  console.log(`部署者餘額: ${hre.ethers.formatEther(deployerBalance)} BNB`);
  console.log(`VRFManager: ${EXISTING_CONTRACTS.VRFMANAGER}`);
  console.log("");

  if (deployerBalance < hre.ethers.parseEther("0.3")) {
    console.log(`${colors.red}[ERROR] 餘額不足，建議至少 0.3 BNB${colors.reset}`);
    process.exit(1);
  }

  const deployedContracts = { ...EXISTING_CONTRACTS };
  const startTime = Date.now();

  try {
    // ============ 階段 1: 顯示重用合約 ============
    console.log(`\n${colors.cyan}══════ 階段 1: 重用現有合約 ══════${colors.reset}\n`);
    
    Object.entries(EXISTING_CONTRACTS).forEach(([name, address]) => {
      console.log(`${colors.green}[使用現有]${colors.reset} ${name}: ${address}`);
    });

    // ============ 階段 2: 部署新合約 ============
    console.log(`\n${colors.cyan}══════ 階段 2: 部署 VRF 版本合約 ══════${colors.reset}\n`);

    for (const contractName of CONTRACTS_TO_DEPLOY) {
      console.log(`\n${colors.blue}[部署]${colors.reset} ${contractName}...`);
      
      let contract;
      let address;

      switch (contractName) {
        case 'DungeonCore':
          const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
          contract = await DungeonCore.deploy(
            deployer.address,
            EXTERNAL_ADDRESSES.USDT,
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

        case 'Party':
          const Party = await hre.ethers.getContractFactory("Party");
          contract = await Party.deploy("DungeonDelversParty", "PARTY");
          break;

        case 'AltarOfAscension':
          const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
          contract = await AltarOfAscension.deploy(deployer.address);
          break;
      }

      await contract.waitForDeployment();
      address = await contract.getAddress();
      deployedContracts[contractName.toUpperCase()] = address;
      
      console.log(`${colors.green}[✓]${colors.reset} ${contractName} 部署於: ${address}`);
    }

    // ============ 階段 3: VRF 設置 ============
    console.log(`\n${colors.cyan}══════ 階段 3: VRF 設置 ══════${colors.reset}\n`);
    
    const vrfManager = await hre.ethers.getContractAt("VRFManager", EXISTING_CONTRACTS.VRFMANAGER);
    
    // 授權合約使用 VRF
    const contractsToAuthorize = [
      { name: 'Hero', address: deployedContracts.HERO },
      { name: 'Relic', address: deployedContracts.RELIC },
      { name: 'AltarOfAscension', address: deployedContracts.ALTAROFASCENSION },
      { name: 'DungeonMaster', address: deployedContracts.DUNGEONMASTER }
    ];
    
    for (const { name, address } of contractsToAuthorize) {
      try {
        console.log(`授權 ${name}...`);
        const tx = await vrfManager.authorizeContract(address);
        await tx.wait();
        console.log(`${colors.green}[✓]${colors.reset} ${name} 已授權使用 VRF`);
      } catch (error) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} ${name} 授權失敗: ${error.message}`);
      }
    }
    
    // 設置 VRFManager 地址
    console.log("\n設置 VRFManager 地址...");
    
    const hero = await hre.ethers.getContractAt("Hero", deployedContracts.HERO);
    await (await hero.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log(`${colors.green}[✓]${colors.reset} Hero 設置 VRFManager`);
    
    const relic = await hre.ethers.getContractAt("Relic", deployedContracts.RELIC);
    await (await relic.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log(`${colors.green}[✓]${colors.reset} Relic 設置 VRFManager`);
    
    const altar = await hre.ethers.getContractAt("AltarOfAscension", deployedContracts.ALTAROFASCENSION);
    await (await altar.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log(`${colors.green}[✓]${colors.reset} AltarOfAscension 設置 VRFManager`);
    
    const dungeonMaster = await hre.ethers.getContractAt("DungeonMaster", deployedContracts.DUNGEONMASTER);
    await (await dungeonMaster.setVRFManager(EXISTING_CONTRACTS.VRFMANAGER)).wait();
    console.log(`${colors.green}[✓]${colors.reset} DungeonMaster 設置 VRFManager`);

    // ============ 階段 4: 設置合約連接 ============
    console.log(`\n${colors.cyan}══════ 階段 4: 設置合約連接 ══════${colors.reset}\n`);
    
    // DungeonCore 設置
    const dungeonCore = await hre.ethers.getContractAt("DungeonCore", deployedContracts.DUNGEONCORE);
    
    console.log("設置 DungeonCore 模組...");
    await (await dungeonCore.setOracle(deployedContracts.ORACLE)).wait();
    await (await dungeonCore.setPlayerVault(deployedContracts.PLAYERVAULT)).wait();
    await (await dungeonCore.setPlayerProfile(deployedContracts.PLAYERPROFILE)).wait();
    await (await dungeonCore.setVipStaking(deployedContracts.VIPSTAKING)).wait();
    await (await dungeonCore.setDungeonMaster(deployedContracts.DUNGEONMASTER)).wait();
    await (await dungeonCore.setAltarOfAscension(deployedContracts.ALTAROFASCENSION)).wait();
    await (await dungeonCore.setHeroContract(deployedContracts.HERO)).wait();
    await (await dungeonCore.setRelicContract(deployedContracts.RELIC)).wait();
    await (await dungeonCore.setPartyContract(deployedContracts.PARTYV3)).wait();
    console.log(`${colors.green}[✓]${colors.reset} DungeonCore 模組設置完成`);
    
    // 設置其他合約的 DungeonCore
    console.log("\n設置各模組的 DungeonCore...");
    
    const playerVault = await hre.ethers.getContractAt("PlayerVault", deployedContracts.PLAYERVAULT);
    await (await playerVault.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    const playerProfile = await hre.ethers.getContractAt("PlayerProfile", deployedContracts.PLAYERPROFILE);
    await (await playerProfile.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    const vipStaking = await hre.ethers.getContractAt("VIPStaking", deployedContracts.VIPSTAKING);
    await (await vipStaking.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    await (await dungeonMaster.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await altar.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await hero.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    await (await relic.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    const party = await hre.ethers.getContractAt("Party", deployedContracts.PARTYV3);
    await (await party.setDungeonCore(deployedContracts.DUNGEONCORE)).wait();
    
    console.log(`${colors.green}[✓]${colors.reset} 所有模組 DungeonCore 設置完成`);
    
    // DungeonMaster & DungeonStorage 連接
    const dungeonStorage = await hre.ethers.getContractAt("DungeonStorage", deployedContracts.DUNGEONSTORAGE);
    await (await dungeonMaster.setDungeonStorage(deployedContracts.DUNGEONSTORAGE)).wait();
    await (await dungeonStorage.setLogicContract(deployedContracts.DUNGEONMASTER)).wait();
    console.log(`${colors.green}[✓]${colors.reset} DungeonMaster <-> DungeonStorage 連接完成`);

    // ============ 階段 5: 保存配置 ============
    console.log(`\n${colors.cyan}══════ 階段 5: 保存配置 ══════${colors.reset}\n`);
    
    const deploymentInfo = {
      version: 'V25-VRF',
      network: 'BSC Mainnet',
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      vrfEnabled: true,
      contracts: deployedContracts,
      deploymentTime: `${(Date.now() - startTime) / 1000} seconds`
    };
    
    // 保存部署信息
    const deploymentPath = path.join(__dirname, '../../deployments', `v25-vrf-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(deploymentPath))) {
      fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    }
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`${colors.green}[✓]${colors.reset} 部署資訊已保存`);
    
    // 更新 master-config.json
    const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
    const masterConfig = {
      version: 'V25-VRF',
      lastUpdated: new Date().toISOString(),
      contracts: {
        mainnet: Object.entries(deployedContracts).reduce((acc, [key, value]) => {
          acc[`${key}_ADDRESS`] = value;
          return acc;
        }, {})
      },
      vrfEnabled: true
    };
    fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
    console.log(`${colors.green}[✓]${colors.reset} master-config.json 已更新`);

    // ============ 完成 ============
    console.log(`\n${colors.green}${colors.bright}`);
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║                    🎉 VRF 升級部署完成！                     ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log(`${colors.reset}\n`);
    
    console.log("📋 部署摘要:");
    console.log("================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      const isNew = CONTRACTS_TO_DEPLOY.map(c => c.toUpperCase()).includes(name) || name === 'PARTYV3';
      console.log(`${name}: ${address} ${isNew ? '(新)' : '(現有)'}`);
    });
    
    console.log("\n⚠️ 重要後續步驟:");
    console.log("1. 初始化地城資料: node scripts/active/v25-setup-remaining-dungeons.js");
    console.log("2. 同步子圖 v3.6.1:");
    console.log("   cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
    console.log("   npm run codegen && npm run build");
    console.log("   npm run deploy:studio -- --version-label v3.6.1");
    console.log("3. 同步後端配置:");
    console.log("   cd /Users/sotadic/Documents/dungeon-delvers-metadata-server");
    console.log("   更新 .env 文件中的合約地址");
    console.log("4. 同步前端配置:");
    console.log("   cd /Users/sotadic/Documents/GitHub/DungeonDelvers");
    console.log("   更新 src/config/contracts.ts");
    console.log("5. 驗證合約: node scripts/verify/verify-all-v25.js");

  } catch (error) {
    console.log(`\n${colors.red}[ERROR] 部署失敗:${colors.reset}`, error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });