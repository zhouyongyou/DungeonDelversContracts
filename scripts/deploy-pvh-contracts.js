// deploy-pvh-contracts.js
// 部署 PlayerVault(P)、Hero(H)、Relic(R) 三個核心合約

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 開始部署 PlayerVault、Hero、Relic 合約");
    console.log("=".repeat(60));

    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");
    
    // 獲取當前 DungeonCore 地址
    const DUNGEONCORE_ADDRESS = process.env.VITE_DUNGEONCORE_ADDRESS;
    console.log("DungeonCore 地址:", DUNGEONCORE_ADDRESS);
    
    if (!DUNGEONCORE_ADDRESS) {
        throw new Error("❌ DungeonCore 地址未設定，請檢查 .env 文件");
    }

    const deployedContracts = {};
    const deploymentTime = Date.now();
    
    try {
        // 1. 部署 PlayerVault
        console.log("\n📋 1. 部署 PlayerVault...");
        const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
        const playerVault = await PlayerVault.deploy();
        await playerVault.waitForDeployment();
        const playerVaultAddress = await playerVault.getAddress();
        
        deployedContracts.PlayerVault = {
            address: playerVaultAddress,
            constructorArgs: [],
            deploymentTx: playerVault.deploymentTransaction().hash
        };
        
        console.log("✅ PlayerVault 部署成功:", playerVaultAddress);
        console.log("   部署交易:", playerVault.deploymentTransaction().hash);

        // 2. 部署 Hero
        console.log("\n⚔️ 2. 部署 Hero...");
        const Hero = await hre.ethers.getContractFactory("Hero");
        const hero = await Hero.deploy();
        await hero.waitForDeployment();
        const heroAddress = await hero.getAddress();
        
        deployedContracts.Hero = {
            address: heroAddress,
            constructorArgs: [],
            deploymentTx: hero.deploymentTransaction().hash
        };
        
        console.log("✅ Hero 部署成功:", heroAddress);
        console.log("   部署交易:", hero.deploymentTransaction().hash);

        // 3. 部署 Relic  
        console.log("\n💎 3. 部署 Relic...");
        const Relic = await hre.ethers.getContractFactory("Relic");
        const relic = await Relic.deploy();
        await relic.waitForDeployment();
        const relicAddress = await relic.getAddress();
        
        deployedContracts.Relic = {
            address: relicAddress,
            constructorArgs: [],
            deploymentTx: relic.deploymentTransaction().hash
        };
        
        console.log("✅ Relic 部署成功:", relicAddress);
        console.log("   部署交易:", relic.deploymentTransaction().hash);

        // 4. 保存部署記錄
        console.log("\n📝 4. 保存部署記錄...");
        
        const deploymentRecord = {
            timestamp: deploymentTime,
            date: new Date().toISOString(),
            deployer: deployer.address,
            chainId: (await deployer.provider.getNetwork()).chainId,
            contracts: deployedContracts,
            dungeonCore: DUNGEONCORE_ADDRESS,
            notes: "PlayerVault (with Username system), Hero, Relic 重新部署"
        };

        // 保存到 deployments 目錄
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `pvh-deployment-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentRecord, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        , 2));
        
        console.log("✅ 部署記錄已保存:", filepath);

        // 5. 顯示摘要
        console.log("\n" + "=" * 60);
        console.log("🎉 部署完成摘要");
        console.log("=".repeat(60));
        console.log("PlayerVault:", playerVaultAddress);
        console.log("Hero:       ", heroAddress);
        console.log("Relic:      ", relicAddress);
        console.log("\n⚠️ 重要提醒:");
        console.log("1. 請執行驗證腳本: npm run verify-pvh");
        console.log("2. 請執行連接腳本: npm run connect-pvh");
        console.log("3. 請更新配置文件中的地址");

        return deployedContracts;
        
    } catch (error) {
        console.error("❌ 部署失敗:", error);
        
        // 保存錯誤記錄
        const errorRecord = {
            timestamp: deploymentTime,
            date: new Date().toISOString(),
            deployer: deployer.address,
            error: error.message,
            deployedContracts, // 保存已經成功部署的合約
            notes: "部署過程中發生錯誤"
        };
        
        const errorFilename = `pvh-deployment-error-${new Date().toISOString().split('T')[0]}.json`;
        const errorFilepath = path.join(__dirname, '../deployments', errorFilename);
        fs.writeFileSync(errorFilepath, JSON.stringify(errorRecord, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        , 2));
        
        throw error;
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

module.exports = main;