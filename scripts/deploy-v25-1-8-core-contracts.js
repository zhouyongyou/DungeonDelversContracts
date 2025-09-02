// deploy-v25-1-8-core-contracts.js - V25.1.8 核心合約重新部署
// 重新部署: HERO, RELIC, PLAYERVAULT
// 日期: 2025-08-25
// 版本: V25.1.8
// 子圖: v4.1.2
// 起始區塊: 58744463

const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 開始部署 V25.1.8 核心合約");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");
    
    // 固定地址 (不需重新部署的合約)
    const FIXED_ADDRESSES = {
        SOULSHARD: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
        DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
        VRF_MANAGER: "0x90Ec740CEe2C8fbd012fEb050a602E9de208A9c0",
        ORACLE: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
        PARTY: "0x68AA71bab4fca9Bca2f5c299C2d99F0dd974422B",
        DUNGEONMASTER: "0xF7E3112cC6b1039Ab63B9370C6a107fE453b2AAD",
        ALTAROFASCENSION: "0xB2680EB761096F5599955F36Db59202c503dF5bC"
    };
    
    console.log("📋 固定地址 (不重新部署):");
    Object.entries(FIXED_ADDRESSES).forEach(([name, address]) => {
        console.log(`${name}: ${address}`);
    });
    
    const deployedContracts = {};
    const gasUsed = {};
    
    console.log("\n🏗️ 開始部署新合約...");
    
    // 1. 部署 Hero
    console.log("\n1️⃣ 部署 Hero 合約...");
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy();
    await hero.waitForDeployment();
    deployedContracts.HERO = await hero.getAddress();
    
    const heroReceipt = await hero.deploymentTransaction().wait();
    gasUsed.HERO = heroReceipt.gasUsed;
    console.log(`✅ Hero 部署成功: ${deployedContracts.HERO}`);
    console.log(`   Gas 使用: ${gasUsed.HERO.toString()}`);
    
    // 2. 部署 Relic
    console.log("\n2️⃣ 部署 Relic 合約...");
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy();
    await relic.waitForDeployment();
    deployedContracts.RELIC = await relic.getAddress();
    
    const relicReceipt = await relic.deploymentTransaction().wait();
    gasUsed.RELIC = relicReceipt.gasUsed;
    console.log(`✅ Relic 部署成功: ${deployedContracts.RELIC}`);
    console.log(`   Gas 使用: ${gasUsed.RELIC.toString()}`);
    
    // 3. 部署 PlayerVault
    console.log("\n3️⃣ 部署 PlayerVault 合約...");
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy();
    await playerVault.waitForDeployment();
    deployedContracts.PLAYERVAULT = await playerVault.getAddress();
    
    const vaultReceipt = await playerVault.deploymentTransaction().wait();
    gasUsed.PLAYERVAULT = vaultReceipt.gasUsed;
    console.log(`✅ PlayerVault 部署成功: ${deployedContracts.PLAYERVAULT}`);
    console.log(`   Gas 使用: ${gasUsed.PLAYERVAULT.toString()}`);
    
    // 4. 設定合約連接
    console.log("\n🔗 設定合約連接...");
    
    // Hero 設定
    console.log("設定 Hero 合約...");
    await hero.setDungeonCore(FIXED_ADDRESSES.DUNGEONCORE);
    console.log("✅ Hero → DungeonCore 連接已設定");
    
    // Relic 設定  
    console.log("設定 Relic 合約...");
    await relic.setDungeonCore(FIXED_ADDRESSES.DUNGEONCORE);
    console.log("✅ Relic → DungeonCore 連接已設定");
    
    // PlayerVault 設定
    console.log("設定 PlayerVault 合約...");
    await playerVault.setDungeonCore(FIXED_ADDRESSES.DUNGEONCORE);
    console.log("✅ PlayerVault → DungeonCore 連接已設定");
    
    // 5. 生成部署報告
    console.log("\n📊 V25.1.8 部署報告");
    console.log("=".repeat(60));
    console.log("🎯 版本: V25.1.8");
    console.log("📅 日期:", new Date().toISOString());
    console.log("🌐 網路: BSC Mainnet");
    console.log("👤 部署者:", deployer.address);
    console.log("📍 起始區塊: 58744463 (預設)");
    console.log("🔄 子圖版本: v4.1.2");
    
    console.log("\n🆕 新部署的合約地址:");
    Object.entries(deployedContracts).forEach(([name, address]) => {
        console.log(`${name}: ${address}`);
    });
    
    console.log("\n⛽ Gas 使用統計:");
    let totalGas = BigInt(0);
    Object.entries(gasUsed).forEach(([name, gas]) => {
        console.log(`${name}: ${gas.toString()}`);
        totalGas += gas;
    });
    console.log(`總計: ${totalGas.toString()}`);
    
    // 6. 生成環境變數更新指令
    console.log("\n🔧 環境變數更新指令:");
    console.log("=".repeat(60));
    console.log("# 更新 .env 檔案中的以下地址:");
    Object.entries(deployedContracts).forEach(([name, address]) => {
        console.log(`VITE_${name}_ADDRESS=${address}`);
    });
    
    console.log("\n⚠️  重要提醒:");
    console.log("1. 更新 DungeonCore 中的合約地址連接");
    console.log("2. 驗證合約在 BSCScan 上開源");
    console.log("3. 更新子圖配置到 v4.1.2");
    console.log("4. 同步前端、後端配置");
    console.log("5. 測試合約功能");
    
    // 7. 保存部署記錄
    const deploymentRecord = {
        version: "V25.1.8",
        date: new Date().toISOString(),
        network: "BSC Mainnet",
        deployer: deployer.address,
        startBlock: 58744463,
        subgraphVersion: "v4.1.2",
        contracts: {
            ...deployedContracts,
            ...FIXED_ADDRESSES
        },
        gasUsed: Object.fromEntries(
            Object.entries(gasUsed).map(([k, v]) => [k, v.toString()])
        )
    };
    
    console.log("\n💾 部署記錄:");
    console.log(JSON.stringify(deploymentRecord, null, 2));
    
    console.log("\n🎉 V25.1.8 部署完成！");
    console.log("📋 下一步: 執行連接設定和驗證流程");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });