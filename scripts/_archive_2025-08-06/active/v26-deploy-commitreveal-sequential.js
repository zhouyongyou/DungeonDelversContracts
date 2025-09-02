#!/usr/bin/env node

/**
 * V26 Commit-Reveal 版本部署腳本 - 順序執行版本
 * 
 * 部署包含 Commit-Reveal 機制的合約版本
 * 
 * 主要變更：
 * - Hero/Relic 合約包含 commit-reveal 鑄造機制
 * - AltarOfAscension 包含延遲燃燒機制
 * - DungeonMaster 包含延遲探索結果機制
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v26-deploy-commitreveal-sequential.js --network bsc
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

// ======================== 配置區域 ========================

// 部署配置
const DEPLOYMENT_CONFIG = {
  // 是否部署新的 Token 合約（生產環境通常設為 false）
  deployNewTokens: false,  // 設為 true 會部署新的 SoulShard
  
  // 現有合約地址（如果不部署新的）
  existingContracts: {
    SOULSHARD: process.env.SOULSHARD_ADDRESS || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    // ORACLE: 現在總是重新部署
    UNISWAP_POOL: process.env.UNISWAP_POOL || '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
  },
  
  // 外部地址
  externalAddresses: {
    USDT: process.env.USDT_ADDRESS || '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE', // BSC USDT
  },
  
  // 部署選項
  options: {
    autoVerify: true,        // 自動驗證合約
    setupConnections: true,  // 自動設置合約連接
    skipWaitForConfirmations: false, // 是否跳過等待確認
    waitConfirmations: 3,    // 等待確認數
    // ⚡ 新增：Commit-Reveal 相關配置
    setupUnrevealedURI: true, // 自動設置未揭示 URI
    unrevealedURIs: {
      hero: "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // 需要替換為實際 IPFS hash
      relic: "ipfs://QmYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY" // 需要替換為實際 IPFS hash
    }
  },
  
  // 遊戲配置
  gameSettings: {
    mintPriceUSD: 2,         // 鑄造價格（USD）
    vipStakeAmount: 100,     // VIP 質押數量
    unstakeCooldown: 15,     // VIP 解質押冷卻期（秒）
    explorationFee: '0.0015', // 探索費用（BNB）
    platformFee: '0.005',     // 平台費用（BNB）
    // ⚡ 新增：Commit-Reveal 參數
    revealBlockDelay: 3,      // 揭示延遲區塊數
    maxRevealWindow: 255      // 最大揭示窗口
  }
};

// 管理地址配置
const MANAGEMENT_ADDRESSES = {
  treasury: process.env.TREASURY_ADDRESS || '0xeC73DcFb8C6C87d6a8C29BE616460d3cccc50cBf',
  dungeonMasterWallet: process.env.DUNGEONMASTER_WALLET || '0xEbCF4A36Ad1485A9737025e9d72186b604487274',
};

// ======================== 工具函數 ========================

// 延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 安全的交易執行
async function safeTransaction(txPromise, description, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`${colors.cyan}📤 執行: ${description}...${colors.reset}`);
      const tx = await txPromise;
      
      if (DEPLOYMENT_CONFIG.options.skipWaitForConfirmations) {
        console.log(`${colors.green}✅ 交易已發送: ${tx.hash}${colors.reset}`);
        return tx;
      }
      
      console.log(`${colors.yellow}⏳ 等待確認...${colors.reset}`);
      const receipt = await tx.wait(DEPLOYMENT_CONFIG.options.waitConfirmations);
      console.log(`${colors.green}✅ 完成: ${description}${colors.reset}`);
      return receipt;
    } catch (error) {
      console.error(`${colors.red}❌ 錯誤 (嘗試 ${i + 1}/${retries}): ${error.message}${colors.reset}`);
      if (i === retries - 1) throw error;
      console.log(`${colors.yellow}⏳ 等待 5 秒後重試...${colors.reset}`);
      await delay(5000);
    }
  }
}

// 部署合約
async function deployContract(contractName, args = [], options = {}) {
  console.log(`\n${colors.blue}📦 部署 ${contractName}...${colors.reset}`);
  
  const Contract = await hre.ethers.getContractFactory(contractName);
  const contract = await Contract.deploy(...args);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`${colors.green}✅ ${contractName} 部署到: ${address}${colors.reset}`);
  
  // 自動驗證
  if (DEPLOYMENT_CONFIG.options.autoVerify && hre.network.name !== "hardhat") {
    await delay(10000); // 等待 10 秒確保合約被索引
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: args,
        ...options
      });
      console.log(`${colors.green}✅ ${contractName} 已驗證${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️ 驗證失敗: ${error.message}${colors.reset}`);
    }
  }
  
  return contract;
}

// ======================== 主部署函數 ========================

async function main() {
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}🚀 V26 Commit-Reveal 版本部署腳本${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  
  // 獲取部署者
  const [deployer] = await hre.ethers.getSigners();
  console.log(`${colors.cyan}👤 部署者地址: ${deployer.address}${colors.reset}`);
  
  // 檢查餘額
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`${colors.cyan}💰 部署者餘額: ${hre.ethers.formatEther(balance)} BNB${colors.reset}\n`);
  
  // 部署結果存儲
  const deploymentResult = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
    transactions: []
  };
  
  try {
    // ============ Phase 1: 基礎合約部署 ============
    console.log(`\n${colors.bright}📋 Phase 1: 部署基礎合約${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
    
    // 1. Token 合約（根據配置決定是否部署）
    let soulShardAddress;
    if (DEPLOYMENT_CONFIG.deployNewTokens) {
      const soulShard = await deployContract("SoulShard", [deployer.address]);
      soulShardAddress = await soulShard.getAddress();
      deploymentResult.contracts.SOULSHARD = soulShardAddress;
    } else {
      soulShardAddress = DEPLOYMENT_CONFIG.existingContracts.SOULSHARD;
      console.log(`${colors.green}📌 使用現有 SoulShard: ${soulShardAddress}${colors.reset}`);
      deploymentResult.contracts.SOULSHARD = soulShardAddress;
    }
    
    // 2. Oracle 合約
    const oracle = await deployContract("Oracle", [
      DEPLOYMENT_CONFIG.externalAddresses.USDT,
      soulShardAddress,
      DEPLOYMENT_CONFIG.existingContracts.UNISWAP_POOL,
      deployer.address
    ]);
    deploymentResult.contracts.ORACLE = await oracle.getAddress();
    
    // 3. DungeonCore
    const dungeonCore = await deployContract("DungeonCore", [deployer.address]);
    deploymentResult.contracts.DUNGEONCORE = await dungeonCore.getAddress();
    
    // ============ Phase 2: 遊戲功能合約 ============
    console.log(`\n${colors.bright}📋 Phase 2: 部署遊戲功能合約${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
    
    // 4. PlayerVault
    const playerVault = await deployContract("PlayerVault", [deployer.address]);
    deploymentResult.contracts.PLAYERVAULT = await playerVault.getAddress();
    
    // 5. PlayerProfile
    const playerProfile = await deployContract("PlayerProfile", [deployer.address]);
    deploymentResult.contracts.PLAYERPROFILE = await playerProfile.getAddress();
    
    // 6. VIPStaking
    const vipStaking = await deployContract("VIPStaking", [deployer.address]);
    deploymentResult.contracts.VIPSTAKING = await vipStaking.getAddress();
    
    // 7. DungeonStorage
    const dungeonStorage = await deployContract("DungeonStorage", [deployer.address]);
    deploymentResult.contracts.DUNGEONSTORAGE = await dungeonStorage.getAddress();
    
    // 8. DungeonMaster (Commit-Reveal 版本)
    const dungeonMaster = await deployContract("DungeonMasterV2_Fixed", [deployer.address]);
    deploymentResult.contracts.DUNGEONMASTER = await dungeonMaster.getAddress();
    
    // ============ Phase 3: NFT 合約 (Commit-Reveal 版本) ============
    console.log(`\n${colors.bright}📋 Phase 3: 部署 NFT 合約 (Commit-Reveal 版本)${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
    
    // 9. Hero (Commit-Reveal 版本)
    const hero = await deployContract("Hero", [deployer.address]);
    deploymentResult.contracts.HERO = await hero.getAddress();
    
    // 10. Relic (Commit-Reveal 版本)
    const relic = await deployContract("Relic", [deployer.address]);
    deploymentResult.contracts.RELIC = await relic.getAddress();
    
    // 11. Party
    const party = await deployContract("Party", [deployer.address]);
    deploymentResult.contracts.PARTY = await party.getAddress();
    
    // 12. AltarOfAscension (Commit-Reveal 版本)
    const altarOfAscension = await deployContract("AltarOfAscension", [deployer.address]);
    deploymentResult.contracts.ALTAROFASCENSION = await altarOfAscension.getAddress();
    
    // ============ Phase 4: 設置合約連接 ============
    if (DEPLOYMENT_CONFIG.options.setupConnections) {
      console.log(`\n${colors.bright}📋 Phase 4: 設置合約連接${colors.reset}`);
      console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
      
      // 設置 DungeonCore 的所有地址
      await safeTransaction(
        dungeonCore.setOracle(deploymentResult.contracts.ORACLE),
        "設置 Oracle 地址"
      );
      
      await safeTransaction(
        dungeonCore.setSoulShard(soulShardAddress),
        "設置 SoulShard 地址"
      );
      
      await safeTransaction(
        dungeonCore.setHero(deploymentResult.contracts.HERO),
        "設置 Hero 地址"
      );
      
      await safeTransaction(
        dungeonCore.setRelic(deploymentResult.contracts.RELIC),
        "設置 Relic 地址"
      );
      
      await safeTransaction(
        dungeonCore.setParty(deploymentResult.contracts.PARTY),
        "設置 Party 地址"
      );
      
      await safeTransaction(
        dungeonCore.setDungeonMaster(deploymentResult.contracts.DUNGEONMASTER),
        "設置 DungeonMaster 地址"
      );
      
      await safeTransaction(
        dungeonCore.setPlayerVault(deploymentResult.contracts.PLAYERVAULT),
        "設置 PlayerVault 地址"
      );
      
      await safeTransaction(
        dungeonCore.setPlayerProfile(deploymentResult.contracts.PLAYERPROFILE),
        "設置 PlayerProfile 地址"
      );
      
      await safeTransaction(
        dungeonCore.setAltarOfAscension(deploymentResult.contracts.ALTAROFASCENSION),
        "設置 AltarOfAscension 地址"
      );
      
      await safeTransaction(
        dungeonCore.setVIPStaking(deploymentResult.contracts.VIPSTAKING),
        "設置 VIPStaking 地址"
      );
      
      // 設置各合約的 DungeonCore 地址
      const contractsToSetCore = [
        { contract: oracle, name: "Oracle" },
        { contract: hero, name: "Hero" },
        { contract: relic, name: "Relic" },
        { contract: party, name: "Party" },
        { contract: dungeonMaster, name: "DungeonMaster" },
        { contract: playerVault, name: "PlayerVault" },
        { contract: playerProfile, name: "PlayerProfile" },
        { contract: altarOfAscension, name: "AltarOfAscension" },
        { contract: vipStaking, name: "VIPStaking" }
      ];
      
      for (const { contract, name } of contractsToSetCore) {
        if (contract.setDungeonCore) {
          await safeTransaction(
            contract.setDungeonCore(deploymentResult.contracts.DUNGEONCORE),
            `設置 ${name} 的 DungeonCore`
          );
        }
      }
      
      // DungeonMaster 特殊設置
      await safeTransaction(
        dungeonMaster.setDungeonStorage(deploymentResult.contracts.DUNGEONSTORAGE),
        "設置 DungeonMaster 的 DungeonStorage"
      );
      
      await safeTransaction(
        dungeonMaster.setSoulShardToken(soulShardAddress),
        "設置 DungeonMaster 的 SoulShard"
      );
      
      // DungeonStorage 設置
      await safeTransaction(
        dungeonStorage.setDungeonMaster(deploymentResult.contracts.DUNGEONMASTER),
        "設置 DungeonStorage 的 DungeonMaster"
      );
      
      // AltarOfAscension 設置
      await safeTransaction(
        altarOfAscension.setContracts(
          deploymentResult.contracts.DUNGEONCORE,
          deploymentResult.contracts.HERO,
          deploymentResult.contracts.RELIC
        ),
        "設置 AltarOfAscension 的合約地址"
      );
    }
    
    // ============ Phase 5: Commit-Reveal 特殊設置 ============
    console.log(`\n${colors.bright}📋 Phase 5: Commit-Reveal 特殊設置${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
    
    // 設置未揭示 URI
    if (DEPLOYMENT_CONFIG.options.setupUnrevealedURI) {
      console.log(`${colors.yellow}⚠️ 注意：請確保已上傳未揭示圖片到 IPFS${colors.reset}`);
      
      if (hero.setUnrevealedURI) {
        await safeTransaction(
          hero.setUnrevealedURI(DEPLOYMENT_CONFIG.options.unrevealedURIs.hero),
          "設置 Hero 未揭示 URI"
        );
      }
      
      if (relic.setUnrevealedURI) {
        await safeTransaction(
          relic.setUnrevealedURI(DEPLOYMENT_CONFIG.options.unrevealedURIs.relic),
          "設置 Relic 未揭示 URI"
        );
      }
    }
    
    // ============ Phase 6: 初始化遊戲設置 ============
    console.log(`\n${colors.bright}📋 Phase 6: 初始化遊戲設置${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
    
    // 設置鑄造價格
    await safeTransaction(
      hero.setMintPriceUSD(DEPLOYMENT_CONFIG.gameSettings.mintPriceUSD),
      `設置 Hero 鑄造價格為 ${DEPLOYMENT_CONFIG.gameSettings.mintPriceUSD} USD`
    );
    
    await safeTransaction(
      relic.setMintPriceUSD(DEPLOYMENT_CONFIG.gameSettings.mintPriceUSD),
      `設置 Relic 鑄造價格為 ${DEPLOYMENT_CONFIG.gameSettings.mintPriceUSD} USD`
    );
    
    // 設置平台費
    await safeTransaction(
      hero.setPlatformFee(hre.ethers.parseEther(DEPLOYMENT_CONFIG.gameSettings.platformFee)),
      `設置 Hero 平台費為 ${DEPLOYMENT_CONFIG.gameSettings.platformFee} BNB`
    );
    
    await safeTransaction(
      relic.setPlatformFee(hre.ethers.parseEther(DEPLOYMENT_CONFIG.gameSettings.platformFee)),
      `設置 Relic 平台費為 ${DEPLOYMENT_CONFIG.gameSettings.platformFee} BNB`
    );
    
    // 設置 VIP 質押
    await safeTransaction(
      vipStaking.setStakeAmount(DEPLOYMENT_CONFIG.gameSettings.vipStakeAmount),
      `設置 VIP 質押數量為 ${DEPLOYMENT_CONFIG.gameSettings.vipStakeAmount}`
    );
    
    await safeTransaction(
      vipStaking.setUnstakeCooldown(DEPLOYMENT_CONFIG.gameSettings.unstakeCooldown),
      `設置 VIP 解質押冷卻期為 ${DEPLOYMENT_CONFIG.gameSettings.unstakeCooldown} 秒`
    );
    
    // 設置探索費用
    await safeTransaction(
      dungeonMaster.setExplorationFee(hre.ethers.parseEther(DEPLOYMENT_CONFIG.gameSettings.explorationFee)),
      `設置探索費用為 ${DEPLOYMENT_CONFIG.gameSettings.explorationFee} BNB`
    );
    
    // ============ Phase 7: 權限設置 ============
    console.log(`\n${colors.bright}📋 Phase 7: 設置權限${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
    
    // 設置 Treasury 地址
    await safeTransaction(
      playerVault.setTreasuryWallet(MANAGEMENT_ADDRESSES.treasury),
      `設置 Treasury 地址為 ${MANAGEMENT_ADDRESSES.treasury}`
    );
    
    // 給 PlayerVault mint 權限
    if (DEPLOYMENT_CONFIG.deployNewTokens) {
      const soulShardContract = await hre.ethers.getContractAt("SoulShard", soulShardAddress);
      await safeTransaction(
        soulShardContract.grantRole(await soulShardContract.MINTER_ROLE(), deploymentResult.contracts.PLAYERVAULT),
        "授予 PlayerVault MINTER 權限"
      );
      
      await safeTransaction(
        soulShardContract.grantRole(await soulShardContract.MINTER_ROLE(), deploymentResult.contracts.DUNGEONMASTER),
        "授予 DungeonMaster MINTER 權限"
      );
    }
    
    // ============ 保存部署結果 ============
    console.log(`\n${colors.bright}📋 保存部署結果${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
    
    const outputDir = path.join(__dirname, '../../deployments');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `deployment-v26-commitreveal-${hre.network.name}-${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(deploymentResult, null, 2));
    
    // 同時更新 .env.deployment
    const envContent = Object.entries(deploymentResult.contracts)
      .map(([key, value]) => `${key}_ADDRESS=${value}`)
      .join('\n');
    fs.writeFileSync('.env.deployment', envContent);
    
    // ============ 部署總結 ============
    console.log(`\n${colors.bright}${colors.green}✨ 部署完成！${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
    console.log('部署地址：');
    Object.entries(deploymentResult.contracts).forEach(([name, address]) => {
      console.log(`${colors.cyan}${name}:${colors.reset} ${address}`);
    });
    console.log(`\n${colors.yellow}部署結果已保存到: ${outputFile}${colors.reset}`);
    console.log(`${colors.yellow}.env.deployment 已更新${colors.reset}`);
    
    // Commit-Reveal 特別提醒
    console.log(`\n${colors.bright}${colors.yellow}⚠️ Commit-Reveal 部署提醒：${colors.reset}`);
    console.log(`${colors.yellow}1. 請確保已上傳未揭示圖片到 IPFS${colors.reset}`);
    console.log(`${colors.yellow}2. 更新前端合約 ABI 文件${colors.reset}`);
    console.log(`${colors.yellow}3. 更新子圖 schema 和 mapping${colors.reset}`);
    console.log(`${colors.yellow}4. BSC 揭示窗口僅 3.19 分鐘（255 區塊 × 0.75 秒）${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ 部署失敗: ${error.message}${colors.reset}`);
    throw error;
  }
}

// 執行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });