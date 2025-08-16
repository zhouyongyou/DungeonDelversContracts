#!/usr/bin/env node

/**
 * V25 VRF 設置腳本 - 只配置 VRF 相關設置
 * 
 * 用於設置已部署合約的 VRF 支援
 * 
 * 使用方式：
 * node scripts/active/v25-setup-vrf-only.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

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

// 已部署的合約地址 (8/3 部署的 V25)
const DEPLOYED_CONTRACTS = {
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  DUNGEONCORE: "0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a",
  DUNGEONSTORAGE: "0x1Fd33E7883FdAC36a49f497440a4E2e95C6fcC77",
  DUNGEONMASTER: "0xd06470d4C6F62F6747cf02bD2b2De0981489034F",
  HERO: "0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db",
  RELIC: "0xcfB83d8545D68b796a236290b3C1bc7e4A140B11",
  PARTY: "0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  ALTAROFASCENSION: "0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686",
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
};

// VRFManager 地址
const VRFMANAGER_ADDRESS = "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD";

async function main() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║              📋 V25 VRF 設置腳本                             ║");
  console.log("║              設置已部署合約的 VRF 支援                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}\n`);

  // 設置 Provider 和 Wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org/"
  );
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`${colors.blue}[INFO]${colors.reset} 執行者地址: ${wallet.address}`);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`${colors.blue}[INFO]${colors.reset} 餘額: ${ethers.formatEther(balance)} BNB`);
  
  if (balance < ethers.parseEther("0.05")) {
    console.log(`${colors.red}[ERROR]${colors.reset} BNB 餘額不足`);
    process.exit(1);
  }

  console.log(`\n${colors.cyan}══════ 檢查合約 VRF 支援 ══════${colors.reset}\n`);
  
  // 檢查合約是否支援 VRF
  const vrfCheckABI = ["function vrfManager() view returns (address)"];
  const needsVRFSupport = ["HERO", "RELIC", "DUNGEONMASTER", "ALTAROFASCENSION"];
  const noVRFSupport = [];
  
  for (const contractName of needsVRFSupport) {
    try {
      const contract = new ethers.Contract(
        DEPLOYED_CONTRACTS[contractName],
        vrfCheckABI,
        provider
      );
      const vrfManager = await contract.vrfManager();
      console.log(`${colors.green}[✓]${colors.reset} ${contractName} 支援 VRF (當前: ${vrfManager})`);
    } catch (e) {
      console.log(`${colors.red}[✗]${colors.reset} ${contractName} 不支援 VRF`);
      noVRFSupport.push(contractName);
    }
  }
  
  if (noVRFSupport.length > 0) {
    console.log(`\n${colors.yellow}[WARNING]${colors.reset} 以下合約不支援 VRF，需要重新部署：`);
    noVRFSupport.forEach(name => console.log(`  - ${name}`));
    console.log(`\n建議執行: npx hardhat run scripts/active/v25-deploy-vrf-contracts.js --network bsc`);
    process.exit(1);
  }

  console.log(`\n${colors.cyan}══════ 設置 VRF Manager ══════${colors.reset}\n`);
  
  // 設置 VRF Manager
  const setVRFABI = [
    "function setVRFManager(address) external",
    "function vrfManager() view returns (address)"
  ];
  
  for (const contractName of needsVRFSupport) {
    try {
      const contract = new ethers.Contract(
        DEPLOYED_CONTRACTS[contractName],
        setVRFABI,
        wallet
      );
      
      const currentVRF = await contract.vrfManager();
      if (currentVRF.toLowerCase() === VRFMANAGER_ADDRESS.toLowerCase()) {
        console.log(`${colors.green}[✓]${colors.reset} ${contractName} VRFManager 已正確設置`);
        continue;
      }
      
      console.log(`${colors.blue}[設置]${colors.reset} ${contractName}.setVRFManager...`);
      const tx = await contract.setVRFManager(VRFMANAGER_ADDRESS);
      await tx.wait();
      console.log(`${colors.green}[✓]${colors.reset} ${contractName} VRFManager 設置成功`);
      
    } catch (error) {
      console.log(`${colors.red}[ERROR]${colors.reset} ${contractName} 設置失敗: ${error.message}`);
    }
  }

  console.log(`\n${colors.cyan}══════ 授權合約使用 VRF ══════${colors.reset}\n`);
  
  // VRFManager 授權
  const vrfManagerABI = [
    "function authorizeContract(address) external",
    "function authorizedContracts(address) view returns (bool)"
  ];
  
  const vrfManager = new ethers.Contract(VRFMANAGER_ADDRESS, vrfManagerABI, wallet);
  
  for (const contractName of needsVRFSupport) {
    try {
      const isAuthorized = await vrfManager.authorizedContracts(DEPLOYED_CONTRACTS[contractName]);
      if (isAuthorized) {
        console.log(`${colors.green}[✓]${colors.reset} ${contractName} 已授權`);
        continue;
      }
      
      console.log(`${colors.blue}[授權]${colors.reset} ${contractName}...`);
      const tx = await vrfManager.authorizeContract(DEPLOYED_CONTRACTS[contractName]);
      await tx.wait();
      console.log(`${colors.green}[✓]${colors.reset} ${contractName} 授權成功`);
      
    } catch (error) {
      console.log(`${colors.red}[ERROR]${colors.reset} ${contractName} 授權失敗: ${error.message}`);
    }
  }

  console.log(`\n${colors.cyan}══════ 更新配置文件 ══════${colors.reset}\n`);
  
  // 更新 master-config.json
  const masterConfigPath = path.join(__dirname, "../../config/master-config.json");
  const masterConfig = {
    version: "V25-VRF",
    lastUpdated: new Date().toISOString(),
    contracts: {
      mainnet: {
        ...Object.entries(DEPLOYED_CONTRACTS).reduce((acc, [key, value]) => {
          acc[`${key}_ADDRESS`] = value;
          return acc;
        }, {}),
        VRFMANAGER_ADDRESS: VRFMANAGER_ADDRESS
      }
    },
    vrfEnabled: true
  };
  
  fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
  console.log(`${colors.green}[✓]${colors.reset} master-config.json 已更新`);

  console.log(`\n${colors.green}${colors.bright}`);
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ VRF 設置完成！                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}\n`);

  console.log("📋 後續步驟：");
  console.log("1. 同步子圖: cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
  console.log("   npm run codegen && npm run build && npm run deploy:studio -- --version-label v3.6.1");
  console.log("2. 同步後端: cd /Users/sotadic/Documents/dungeon-delvers-metadata-server");
  console.log("   更新 .env 文件中的合約地址");
  console.log("3. 同步前端: cd /Users/sotadic/Documents/GitHub/DungeonDelvers");
  console.log("   更新 src/config/contracts.ts");
  console.log("\n⚠️ 注意：如果合約不支援 VRF，需要重新部署！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });