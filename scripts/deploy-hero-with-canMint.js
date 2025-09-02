#!/usr/bin/env node

/**
 * 部署包含 canMint 函數的新版 Hero 合約
 * 
 * 使用方式：
 * PRIVATE_KEY=你的私鑰 npx hardhat run scripts/deploy-hero-with-canMint.js --network bsc
 */

const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("=== 部署新版 Hero 合約（包含 canMint 函數）===\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("部署者餘額:", ethers.formatEther(balance), "BNB\n");
    
    // 當前的合約地址（從 .env.v25）
    const CURRENT_CONFIG = {
        DUNGEONCORE: '0x26BDBCB8Fd349F313c74B691B878f10585c7813E',
        VRF_MANAGER: '0xdd14eD07598BA1001cf2888077FE0721941d06A8',
        OLD_HERO: '0xe90d442458931690C057D5ad819EBF94A4eD7c8c'
    };
    
    try {
        console.log("📦 編譯並部署新的 Hero 合約...");
        console.log("合約路徑: contracts/current/nft/Hero.sol");
        
        // 部署 Hero 合約
        const HeroFactory = await ethers.getContractFactory("Hero");
        console.log("Factory 創建完成，開始部署...");
        
        const hero = await HeroFactory.deploy(deployer.address, {
            gasLimit: 8000000 // 設置充足的 gas
        });
        
        console.log("部署交易已提交，等待確認...");
        await hero.waitForDeployment();
        
        const heroAddress = await hero.getAddress();
        console.log("✅ Hero 部署完成:", heroAddress);
        
        // 配置新合約
        console.log("\n🔧 配置新的 Hero 合約...");
        
        // 設置 DungeonCore
        let tx = await hero.setDungeonCore(CURRENT_CONFIG.DUNGEONCORE);
        await tx.wait();
        console.log("✅ DungeonCore 設定完成:", CURRENT_CONFIG.DUNGEONCORE);
        
        // 設置平台費（從舊合約讀取）
        const oldHero = await ethers.getContractAt("Hero", CURRENT_CONFIG.OLD_HERO);
        const platformFee = await oldHero.platformFee();
        tx = await hero.setPlatformFee(platformFee);
        await tx.wait();
        console.log("✅ 平台費設定完成:", ethers.formatEther(platformFee), "BNB");
        
        // 驗證新功能
        console.log("\n🔍 驗證新功能...");
        
        // 測試 canMint 函數
        const testAddress = deployer.address;
        const canMint = await hero.canMint(testAddress);
        console.log("✅ canMint 函數測試成功，返回:", canMint);
        
        // 測試 getUserRequest 函數
        const userRequest = await hero.getUserRequest(testAddress);
        console.log("✅ getUserRequest 函數測試成功");
        console.log("  - quantity:", userRequest.quantity.toString());
        console.log("  - fulfilled:", userRequest.fulfilled);
        
        // 保存部署結果
        const deploymentInfo = {
            network: "BSC Mainnet",
            deploymentDate: new Date().toISOString(),
            contracts: {
                oldHero: CURRENT_CONFIG.OLD_HERO,
                newHero: heroAddress
            },
            dungeonCore: CURRENT_CONFIG.DUNGEONCORE,
            vrfManager: CURRENT_CONFIG.VRF_MANAGER,
            platformFee: ethers.formatEther(platformFee) + " BNB",
            deployer: deployer.address,
            blockNumber: await ethers.provider.getBlockNumber()
        };
        
        const fs = require('fs');
        const path = require('path');
        const deploymentFile = path.join(__dirname, `hero-deployment-${Date.now()}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ Hero 合約部署成功！");
        console.log("─".repeat(60));
        console.log("舊 Hero 地址:", CURRENT_CONFIG.OLD_HERO);
        console.log("新 Hero 地址:", heroAddress);
        console.log("─".repeat(60));
        console.log("部署信息已保存到:", deploymentFile);
        
        console.log("\n⚠️ 接下來需要手動執行：");
        console.log("1. 在 DungeonCore 更新 Hero 地址");
        console.log("   await dungeonCore.setAddress('Hero', '" + heroAddress + "')");
        console.log("\n2. 更新 .env.v25 文件");
        console.log("   VITE_HERO_ADDRESS=" + heroAddress);
        console.log("\n3. 同步配置到所有項目");
        console.log("   node scripts/ultimate-config-system.js sync");
        console.log("\n4. 驗證合約");
        console.log("   npx hardhat verify --network bsc " + heroAddress + " " + deployer.address);
        
    } catch (error) {
        console.error("\n❌ 部署失敗:", error.message);
        if (error.data) {
            console.error("錯誤數據:", error.data);
        }
        if (error.reason) {
            console.error("錯誤原因:", error.reason);
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("致命錯誤:", error);
        process.exit(1);
    });