#!/usr/bin/env node

/**
 * V25 VRF 版本部署腳本
 * 使用 Chainlink VRF V2 Direct Funding
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// BSC Mainnet VRF Coordinator
const VRF_COORDINATOR_BSC = "0xDA3b641406dC4436D054c5399eF5609a7F5115Bf";

// 部署配置
const deployConfig = {
    Hero: {
        name: "DungeonDelversHero",
        symbol: "HERO",
        useVRF: true
    },
    Relic: {
        name: "DungeonDelversRelic", 
        symbol: "RELIC",
        useVRF: true
    },
    // 其他合約保持原版
    Party: {
        name: "DungeonDelversParty",
        symbol: "PARTY",
        useVRF: false  // Party 暫不使用 VRF
    }
};

async function main() {
    console.log("🚀 開始部署 V25 VRF 版本...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署賬戶:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("賬戶餘額:", hre.ethers.formatEther(balance), "BNB\n");
    
    // 部署記錄
    const deployments = {};
    
    try {
        // 1. 部署 Oracle（不變）
        console.log("1️⃣ 部署 Oracle...");
        const Oracle = await hre.ethers.getContractFactory("Oracle");
        const oracle = await Oracle.deploy();
        await oracle.waitForDeployment();
        deployments.ORACLE = await oracle.getAddress();
        console.log("✅ Oracle 部署於:", deployments.ORACLE);
        
        // 2. 部署 SoulShard（不變）
        console.log("\n2️⃣ 部署 SoulShard Token...");
        const SoulShard = await hre.ethers.getContractFactory("SoulShardToken");
        const soulShard = await SoulShard.deploy("SoulShard", "SOUL");
        await soulShard.waitForDeployment();
        deployments.SOULSHARD = await soulShard.getAddress();
        console.log("✅ SoulShard 部署於:", deployments.SOULSHARD);
        
        // 3. 部署 Hero VRF 版本
        console.log("\n3️⃣ 部署 Hero (VRF 版本)...");
        const HeroVRF = await hre.ethers.getContractFactory("HeroVRF");
        const hero = await HeroVRF.deploy(
            deployConfig.Hero.name,
            deployConfig.Hero.symbol,
            VRF_COORDINATOR_BSC
        );
        await hero.waitForDeployment();
        deployments.HERO = await hero.getAddress();
        console.log("✅ Hero VRF 部署於:", deployments.HERO);
        
        // 4. 部署 Relic VRF 版本
        console.log("\n4️⃣ 部署 Relic (VRF 版本)...");
        const RelicVRF = await hre.ethers.getContractFactory("RelicVRF");
        const relic = await RelicVRF.deploy(
            deployConfig.Relic.name,
            deployConfig.Relic.symbol,
            VRF_COORDINATOR_BSC
        );
        await relic.waitForDeployment();
        deployments.RELIC = await relic.getAddress();
        console.log("✅ Relic VRF 部署於:", deployments.RELIC);
        
        // 5. 部署其他合約（保持原版）
        console.log("\n5️⃣ 部署其他核心合約...");
        
        // Party（使用原版）
        const Party = await hre.ethers.getContractFactory("Party");
        const party = await Party.deploy(
            deployConfig.Party.name,
            deployConfig.Party.symbol
        );
        await party.waitForDeployment();
        deployments.PARTY = await party.getAddress();
        console.log("✅ Party 部署於:", deployments.PARTY);
        
        // DungeonCore（不變）
        const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
        const dungeonCore = await DungeonCore.deploy();
        await dungeonCore.waitForDeployment();
        deployments.DUNGEONCORE = await dungeonCore.getAddress();
        console.log("✅ DungeonCore 部署於:", deployments.DUNGEONCORE);
        
        // 其他合約繼續部署...
        // DungeonStorage, DungeonMaster, PlayerVault, etc.
        
        // 6. 設置 VRF 參數
        console.log("\n6️⃣ 配置 VRF 參數...");
        
        const heroContract = await hre.ethers.getContractAt("HeroVRF", deployments.HERO);
        const relicContract = await hre.ethers.getContractAt("RelicVRF", deployments.RELIC);
        
        // 設置 VRF 配置（可根據需要調整）
        const vrfConfig = {
            keyHash: "0xba6e730de88d94a5510ae6613898bfb0c3de5d16e609c5b7da808747125506f7", // BSC 500 gwei
            callbackGasLimit: 500000,
            requestConfirmations: 3,
            vrfRequestPrice: hre.ethers.parseEther("0.005") // ~1.5 USD
        };
        
        await heroContract.setVRFConfig(
            vrfConfig.keyHash,
            vrfConfig.callbackGasLimit,
            vrfConfig.requestConfirmations,
            vrfConfig.vrfRequestPrice
        );
        console.log("✅ Hero VRF 配置完成");
        
        await relicContract.setVRFConfig(
            vrfConfig.keyHash,
            vrfConfig.callbackGasLimit,
            vrfConfig.requestConfirmations,
            vrfConfig.vrfRequestPrice
        );
        console.log("✅ Relic VRF 配置完成");
        
        // 7. 保存部署信息
        const deploymentInfo = {
            network: hre.network.name,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            vrfCoordinator: VRF_COORDINATOR_BSC,
            contracts: deployments,
            vrfConfig: vrfConfig,
            blockNumber: await hre.ethers.provider.getBlockNumber()
        };
        
        const deploymentPath = path.join(__dirname, '../deployments', `v25-vrf-${Date.now()}.json`);
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\n✅ 部署信息已保存到:", deploymentPath);
        
        // 8. 更新 master-config.json
        const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
        if (fs.existsSync(masterConfigPath)) {
            const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
            
            // 更新地址
            Object.keys(deployments).forEach(key => {
                masterConfig[key] = deployments[key];
            });
            
            // 添加 VRF 標記
            masterConfig.VRF_ENABLED = true;
            masterConfig.VRF_COORDINATOR = VRF_COORDINATOR_BSC;
            
            fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
            console.log("✅ master-config.json 已更新");
        }
        
        console.log("\n🎉 V25 VRF 版本部署完成！");
        console.log("\n📋 部署摘要:");
        console.log("================");
        Object.entries(deployments).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
        });
        
        console.log("\n⚠️ 後續步驟:");
        console.log("1. 為 Hero 和 Relic 合約充值 BNB（用於 VRF Direct Funding）");
        console.log("2. 運行設置腳本: node scripts/active/v25-setup-connections.js");
        console.log("3. 同步配置: cd sync-system && node index.js");
        console.log("4. 驗證合約: node scripts/active/v25-verify-vrf.js");
        
    } catch (error) {
        console.error("\n❌ 部署失敗:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });