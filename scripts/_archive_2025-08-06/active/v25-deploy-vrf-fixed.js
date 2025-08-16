#!/usr/bin/env node

/**
 * V25 VRF 版本部署腳本 - 修復版本
 * 修復接口不一致問題，確保 VRF 系統正常工作
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// BSC Mainnet VRF Coordinator
const VRF_COORDINATOR_BSC = "0xDA3b641406dC4436D054c5399eF5609a7F5115Bf";

// 部署配置
const deployConfig = {
    // 現有合約地址（如果不重新部署）
    existingContracts: {
        SOULSHARD: process.env.SOULSHARD_ADDRESS || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
        ORACLE: process.env.ORACLE_ADDRESS || null, // 將重新部署
    },
    
    // VRF 配置
    vrfConfig: {
        keyHash: "0xba6e730de88d94a5510ae6613898bfb0c3de5d16e609c5b7da808747125506f7", // BSC 500 gwei
        callbackGasLimit: 500000,
        requestConfirmations: 3,
        vrfRequestPrice: hre.ethers.parseEther("0.005") // ~1.5 USD
    }
};

async function main() {
    console.log("🚀 開始部署 V25 VRF 修復版本...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署賬戶:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("賬戶餘額:", hre.ethers.formatEther(balance), "BNB\n");
    
    // 部署記錄
    const deployments = {};
    
    try {
        // 1. 部署 VRFManager（核心）
        console.log("1️⃣ 部署 VRFManager...");
        const VRFManager = await hre.ethers.getContractFactory("VRFManager");
        const vrfManager = await VRFManager.deploy(VRF_COORDINATOR_BSC);
        await vrfManager.waitForDeployment();
        deployments.VRFMANAGER = await vrfManager.getAddress();
        console.log("✅ VRFManager 部署於:", deployments.VRFMANAGER);
        
        // 配置 VRF 參數
        await vrfManager.updateVRFConfig(
            deployConfig.vrfConfig.keyHash,
            deployConfig.vrfConfig.callbackGasLimit,
            deployConfig.vrfConfig.requestConfirmations,
            deployConfig.vrfConfig.vrfRequestPrice
        );
        console.log("✅ VRFManager 配置完成");
        
        // 2. 使用現有 SoulShard 或部署新的
        if (deployConfig.existingContracts.SOULSHARD) {
            deployments.SOULSHARD = deployConfig.existingContracts.SOULSHARD;
            console.log("2️⃣ 使用現有 SoulShard:", deployments.SOULSHARD);
        } else {
            console.log("2️⃣ 部署新 SoulShard...");
            const SoulShard = await hre.ethers.getContractFactory("Test_SoulShard");
            const soulShard = await SoulShard.deploy("SoulShard", "SOUL");
            await soulShard.waitForDeployment();
            deployments.SOULSHARD = await soulShard.getAddress();
            console.log("✅ 新 SoulShard 部署於:", deployments.SOULSHARD);
        }
        
        // 3. 部署 Oracle（總是重新部署）
        console.log("\n3️⃣ 部署 Oracle...");
        const Oracle = await hre.ethers.getContractFactory("Oracle");
        const oracle = await Oracle.deploy();
        await oracle.waitForDeployment();
        deployments.ORACLE = await oracle.getAddress();
        console.log("✅ Oracle 部署於:", deployments.ORACLE);
        
        // 4. 部署 DungeonCore
        console.log("\n4️⃣ 部署 DungeonCore...");
        const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
        const dungeonCore = await DungeonCore.deploy();
        await dungeonCore.waitForDeployment();
        deployments.DUNGEONCORE = await dungeonCore.getAddress();
        console.log("✅ DungeonCore 部署於:", deployments.DUNGEONCORE);
        
        // 5. 部署 Hero（VRF 版本）
        console.log("\n5️⃣ 部署 Hero (帶 VRF 支援)...");
        const Hero = await hre.ethers.getContractFactory("Hero");
        const hero = await Hero.deploy(deployer.address);
        await hero.waitForDeployment();
        deployments.HERO = await hero.getAddress();
        console.log("✅ Hero 部署於:", deployments.HERO);
        
        // 6. 部署 Relic（VRF 版本）
        console.log("\n6️⃣ 部署 Relic (帶 VRF 支援)...");
        const Relic = await hre.ethers.getContractFactory("Relic");
        const relic = await Relic.deploy(deployer.address);
        await relic.waitForDeployment();
        deployments.RELIC = await relic.getAddress();
        console.log("✅ Relic 部署於:", deployments.RELIC);
        
        // 7. 部署其他合約
        console.log("\n7️⃣ 部署其他核心合約...");
        
        // Party
        const Party = await hre.ethers.getContractFactory("Party");
        const party = await Party.deploy("DungeonDelversParty", "PARTY");
        await party.waitForDeployment();
        deployments.PARTY = await party.getAddress();
        console.log("✅ Party 部署於:", deployments.PARTY);
        
        // PlayerVault
        const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
        const playerVault = await PlayerVault.deploy();
        await playerVault.waitForDeployment();
        deployments.PLAYERVAULT = await playerVault.getAddress();
        console.log("✅ PlayerVault 部署於:", deployments.PLAYERVAULT);
        
        // DungeonStorage
        const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
        const dungeonStorage = await DungeonStorage.deploy();
        await dungeonStorage.waitForDeployment();
        deployments.DUNGEONSTORAGE = await dungeonStorage.getAddress();
        console.log("✅ DungeonStorage 部署於:", deployments.DUNGEONSTORAGE);
        
        // DungeonMaster
        const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = await DungeonMaster.deploy(deployer.address);
        await dungeonMaster.waitForDeployment();
        deployments.DUNGEONMASTER = await dungeonMaster.getAddress();
        console.log("✅ DungeonMaster 部署於:", deployments.DUNGEONMASTER);
        
        // VIPStaking
        const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
        const vipStaking = await VIPStaking.deploy();
        await vipStaking.waitForDeployment();
        deployments.VIPSTAKING = await vipStaking.getAddress();
        console.log("✅ VIPStaking 部署於:", deployments.VIPSTAKING);
        
        // PlayerProfile
        const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
        const playerProfile = await PlayerProfile.deploy();
        await playerProfile.waitForDeployment();
        deployments.PLAYERPROFILE = await playerProfile.getAddress();
        console.log("✅ PlayerProfile 部署於:", deployments.PLAYERPROFILE);
        
        // AltarOfAscension
        const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
        const altarOfAscension = await AltarOfAscension.deploy(deployer.address);
        await altarOfAscension.waitForDeployment();
        deployments.ALTAROFASCENSION = await altarOfAscension.getAddress();
        console.log("✅ AltarOfAscension 部署於:", deployments.ALTAROFASCENSION);
        
        // 8. 設置 VRF 連接
        console.log("\n8️⃣ 設置 VRF 連接...");
        
        // 授權合約使用 VRF
        const vrfManagerContract = await hre.ethers.getContractAt("VRFManager", deployments.VRFMANAGER);
        
        await vrfManagerContract.authorizeContract(deployments.HERO);
        console.log("✅ Hero 授權使用 VRF");
        
        await vrfManagerContract.authorizeContract(deployments.RELIC);
        console.log("✅ Relic 授權使用 VRF");
        
        await vrfManagerContract.authorizeContract(deployments.ALTAROFASCENSION);
        console.log("✅ AltarOfAscension 授權使用 VRF");
        
        await vrfManagerContract.authorizeContract(deployments.DUNGEONMASTER);
        console.log("✅ DungeonMaster 授權使用 VRF");
        
        // 設置合約中的 VRF Manager 地址
        const heroContract = await hre.ethers.getContractAt("Hero", deployments.HERO);
        await heroContract.setVRFManager(deployments.VRFMANAGER);
        console.log("✅ Hero 設置 VRF Manager");
        
        const relicContract = await hre.ethers.getContractAt("Relic", deployments.RELIC);
        await relicContract.setVRFManager(deployments.VRFMANAGER);
        console.log("✅ Relic 設置 VRF Manager");
        
        const altarContract = await hre.ethers.getContractAt("AltarOfAscension", deployments.ALTAROFASCENSION);
        await altarContract.setVRFManager(deployments.VRFMANAGER);
        console.log("✅ AltarOfAscension 設置 VRF Manager");
        
        const dungeonMasterContract = await hre.ethers.getContractAt("DungeonMaster", deployments.DUNGEONMASTER);
        await dungeonMasterContract.setVRFManager(deployments.VRFMANAGER);
        console.log("✅ DungeonMaster 設置 VRF Manager");
        
        // 9. 為 VRFManager 充值 BNB
        console.log("\n9️⃣ 為 VRFManager 充值 BNB...");
        const fundingAmount = hre.ethers.parseEther("0.1"); // 0.1 BNB
        await deployer.sendTransaction({
            to: deployments.VRFMANAGER,
            value: fundingAmount
        });
        console.log(`✅ 已向 VRFManager 充值 ${hre.ethers.formatEther(fundingAmount)} BNB`);
        
        // 10. 保存部署信息
        const deploymentInfo = {
            network: hre.network.name,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            vrfCoordinator: VRF_COORDINATOR_BSC,
            contracts: deployments,
            vrfConfig: deployConfig.vrfConfig,
            blockNumber: await hre.ethers.provider.getBlockNumber(),
            vrfEnabled: true
        };
        
        const deploymentPath = path.join(__dirname, '../../deployments', `v25-vrf-fixed-${Date.now()}.json`);
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\n✅ 部署信息已保存到:", deploymentPath);
        
        // 11. 更新 master-config.json
        const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
        if (fs.existsSync(masterConfigPath)) {
            const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
            
            // 更新地址
            Object.keys(deployments).forEach(key => {
                masterConfig[key] = deployments[key];
            });
            
            // 添加 VRF 配置
            masterConfig.VRF_ENABLED = true;
            masterConfig.VRF_COORDINATOR = VRF_COORDINATOR_BSC;
            masterConfig.VRF_REQUEST_PRICE = deployConfig.vrfConfig.vrfRequestPrice.toString();
            
            fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
            console.log("✅ master-config.json 已更新");
        }
        
        console.log("\n🎉 V25 VRF 修復版本部署完成！");
        console.log("\n📋 部署摘要:");
        console.log("================");
        Object.entries(deployments).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
        });
        
        console.log("\n⚠️ 後續步驟:");
        console.log("1. 運行設置腳本: node scripts/active/v25-setup-connections.js");
        console.log("2. 同步配置: cd scripts/active/sync-system && node index.js");
        console.log("3. 測試 VRF 功能: node scripts/active/test-vrf-mint.js");
        console.log("4. 驗證合約: node scripts/verify/verify-all-v25.js");
        
    } catch (error) {
        console.error("\n❌ 部署失敗:", error);
        console.error("Error stack:", error.stack);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });