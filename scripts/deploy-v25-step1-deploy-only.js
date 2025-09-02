// deploy-v25-step1-deploy-only.js - V25.2.2 第一階段：純部署和驗證
// 只進行9個合約的部署和BSCScan驗證，不進行任何互連設置

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 V25.2.2 階段1：純部署和驗證\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 部署錢包:", deployer.address);
    console.log("💰 BNB 餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
    
    // 檢查餘額
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const minBalance = hre.ethers.parseEther("0.1");
    if (balance < minBalance) {
        throw new Error(`❌ BNB 餘額不足！需要至少 0.1 BNB，當前: ${hre.ethers.formatEther(balance)} BNB`);
    }
    
    console.log("=".repeat(60));
    console.log("📋 階段1任務：");
    console.log("✅ 任務 1.1: 部署9個指定合約");
    console.log("✅ 任務 1.2: BSCScan驗證開源");
    console.log("❌ 不進行: 互連設置、VRF配置、系統同步");
    console.log("=".repeat(60));
    
    console.log("\n📦 要部署的合約清單:");
    const contractsToDeploy = [
        "AltarOfAscension",
        "DungeonMaster", 
        "DungeonStorage",
        "Relic",
        "Hero", 
        "PlayerProfile",
        "VIPStaking",
        "Party",
        "PlayerVault"
    ];
    
    contractsToDeploy.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
    });
    
    console.log("\n⚠️ 即將開始純部署，預估需要 2-3 分鐘（0.11 gwei）");
    console.log("按 Ctrl+C 取消，或等待 3 秒開始部署...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const deployedContracts = {};
    const verifyQueue = [];
    
    // Gas配置 - 作為overrides使用
    const gasOverrides = {
        gasLimit: 5000000,  // 足夠的gas limit
        gasPrice: hre.ethers.parseUnits("0.11", "gwei")  // 堅持使用0.11 gwei
    };
    
    try {
        console.log("\n" + "=".repeat(50));
        console.log("📦 開始部署合約");
        console.log("=".repeat(50));
        
        // 1. AltarOfAscension
        console.log("\n⛩️ [1/9] 部署 AltarOfAscension...");
        const AltarFactory = await hre.ethers.getContractFactory("AltarOfAscension");
        const altar = await AltarFactory.deploy(gasOverrides);
        await altar.waitForDeployment();
        deployedContracts.AltarOfAscension = await altar.getAddress();
        verifyQueue.push({ name: "AltarOfAscension", address: deployedContracts.AltarOfAscension, constructorArgs: [] });
        console.log("   ✅", deployedContracts.AltarOfAscension);
        
        // 2. DungeonMaster
        console.log("\n🧙 [2/9] 部署 DungeonMaster...");
        const DungeonMasterFactory = await hre.ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = await DungeonMasterFactory.deploy(gasOverrides);
        await dungeonMaster.waitForDeployment();
        deployedContracts.DungeonMaster = await dungeonMaster.getAddress();
        verifyQueue.push({ name: "DungeonMaster", address: deployedContracts.DungeonMaster, constructorArgs: [] });
        console.log("   ✅", deployedContracts.DungeonMaster);
        
        // 3. DungeonStorage
        console.log("\n🗄️ [3/9] 部署 DungeonStorage...");
        const DungeonStorageFactory = await hre.ethers.getContractFactory("DungeonStorage");
        const dungeonStorage = await DungeonStorageFactory.deploy(gasOverrides);
        await dungeonStorage.waitForDeployment();
        deployedContracts.DungeonStorage = await dungeonStorage.getAddress();
        verifyQueue.push({ name: "DungeonStorage", address: deployedContracts.DungeonStorage, constructorArgs: [] });
        console.log("   ✅", deployedContracts.DungeonStorage);
        
        // 4. Relic
        console.log("\n💎 [4/9] 部署 Relic...");
        const RelicFactory = await hre.ethers.getContractFactory("Relic");
        const relic = await RelicFactory.deploy(gasOverrides);
        await relic.waitForDeployment();
        deployedContracts.Relic = await relic.getAddress();
        verifyQueue.push({ name: "Relic", address: deployedContracts.Relic, constructorArgs: [] });
        console.log("   ✅", deployedContracts.Relic);
        
        // 5. Hero
        console.log("\n⚔️ [5/9] 部署 Hero...");
        const HeroFactory = await hre.ethers.getContractFactory("Hero");
        const hero = await HeroFactory.deploy(gasOverrides);
        await hero.waitForDeployment();
        deployedContracts.Hero = await hero.getAddress();
        verifyQueue.push({ name: "Hero", address: deployedContracts.Hero, constructorArgs: [] });
        console.log("   ✅", deployedContracts.Hero);
        
        // 6. PlayerProfile
        console.log("\n👤 [6/9] 部署 PlayerProfile...");
        const PlayerProfileFactory = await hre.ethers.getContractFactory("PlayerProfile");
        const playerProfile = await PlayerProfileFactory.deploy(gasOverrides);
        await playerProfile.waitForDeployment();
        deployedContracts.PlayerProfile = await playerProfile.getAddress();
        verifyQueue.push({ name: "PlayerProfile", address: deployedContracts.PlayerProfile, constructorArgs: [] });
        console.log("   ✅", deployedContracts.PlayerProfile);
        
        // 7. VIPStaking
        console.log("\n💎 [7/9] 部署 VIPStaking...");
        const VIPStakingFactory = await hre.ethers.getContractFactory("VIPStaking");
        const vipStaking = await VIPStakingFactory.deploy(gasOverrides);
        await vipStaking.waitForDeployment();
        deployedContracts.VIPStaking = await vipStaking.getAddress();
        verifyQueue.push({ name: "VIPStaking", address: deployedContracts.VIPStaking, constructorArgs: [] });
        console.log("   ✅", deployedContracts.VIPStaking);
        
        // 8. Party
        console.log("\n👥 [8/9] 部署 Party...");
        const PartyFactory = await hre.ethers.getContractFactory("Party");
        const party = await PartyFactory.deploy(gasOverrides);
        await party.waitForDeployment();
        deployedContracts.Party = await party.getAddress();
        verifyQueue.push({ name: "Party", address: deployedContracts.Party, constructorArgs: [] });
        console.log("   ✅", deployedContracts.Party);
        
        // 9. PlayerVault
        console.log("\n💰 [9/9] 部署 PlayerVault...");
        const PlayerVaultFactory = await hre.ethers.getContractFactory("PlayerVault");
        const playerVault = await PlayerVaultFactory.deploy(gasOverrides);
        await playerVault.waitForDeployment();
        deployedContracts.PlayerVault = await playerVault.getAddress();
        verifyQueue.push({ name: "PlayerVault", address: deployedContracts.PlayerVault, constructorArgs: [] });
        console.log("   ✅", deployedContracts.PlayerVault);
        
        console.log("\n" + "=".repeat(50));
        console.log("🎉 所有合約部署完成！");
        console.log("=".repeat(50));
        
        // 顯示部署結果
        console.log("\n📋 部署結果清單:");
        for (const [name, address] of Object.entries(deployedContracts)) {
            console.log(`${name}: ${address}`);
        }
        
        // 等待幾個區塊確認後再開始驗證
        console.log("\n⏳ 等待 3 個區塊確認後開始驗證...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log("\n" + "=".repeat(50));
        console.log("🔍 開始 BSCScan 驗證");
        console.log("=".repeat(50));
        
        const verificationResults = {};
        
        for (let i = 0; i < verifyQueue.length; i++) {
            const contract = verifyQueue[i];
            console.log(`\n📋 [${i + 1}/${verifyQueue.length}] 驗證 ${contract.name}...`);
            console.log(`   地址: ${contract.address}`);
            
            try {
                await hre.run("verify:verify", {
                    address: contract.address,
                    constructorArguments: contract.constructorArgs,
                });
                console.log(`   ✅ ${contract.name} 驗證成功`);
                verificationResults[contract.name] = "成功";
            } catch (error) {
                if (error.message.includes("already verified")) {
                    console.log(`   ✅ ${contract.name} 已驗證過`);
                    verificationResults[contract.name] = "已驗證";
                } else {
                    console.log(`   ❌ ${contract.name} 驗證失敗:`, error.message);
                    verificationResults[contract.name] = `失敗: ${error.message}`;
                }
            }
            
            // 防止API限制
            if (i < verifyQueue.length - 1) {
                console.log("   ⏳ 等待 3 秒避免API限制...");
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        // 保存階段1結果
        const stage1Result = {
            stage: "1 - 部署和驗證",
            version: "V25.2.2",
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            blockNumber: await hre.ethers.provider.getBlockNumber(),
            gasConfiguration: {
                gasPrice: "0.11 gwei",
                gasLimit: "3,000,000"
            },
            deployedContracts: deployedContracts,
            verificationResults: verificationResults,
            nextSteps: [
                "步驟2.1: DungeonCore 合約地址更新",
                "步驟2.2: 各合約設定 DungeonCore 引用"
            ]
        };
        
        // 保存結果文件
        const deploymentDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const resultFile = path.join(deploymentDir, `v25-stage1-result-${timestamp}.json`);
        fs.writeFileSync(resultFile, JSON.stringify(stage1Result, null, 2));
        
        console.log("\n" + "=".repeat(60));
        console.log("🎉 階段1完成 - 部署和驗證成功！");
        console.log("=".repeat(60));
        
        console.log("\n📊 階段1統計:");
        console.log(`✅ 成功部署: ${Object.keys(deployedContracts).length} 個合約`);
        console.log(`🔍 驗證狀態:`);
        for (const [name, result] of Object.entries(verificationResults)) {
            const icon = result === "成功" || result === "已驗證" ? "✅" : "❌";
            console.log(`   ${icon} ${name}: ${result}`);
        }
        console.log(`💾 結果文件: v25-stage1-result-${timestamp}.json`);
        console.log(`📦 當前區塊: ${await hre.ethers.provider.getBlockNumber()}`);
        
        console.log("\n🚀 下一階段指令:");
        console.log("node scripts/deploy-v25-step2-interconnect.js");
        console.log("\n✨ 階段1：部署和驗證 - 完成！");
        
    } catch (error) {
        console.error("\n❌ 階段1執行失敗:");
        console.error(error.message);
        
        // 保存錯誤報告
        const errorReport = {
            stage: "1 - 部署和驗證",
            error: error.message,
            stack: error.stack,
            deployedContracts: deployedContracts,
            timestamp: new Date().toISOString()
        };
        
        const errorFile = path.join(__dirname, `../deployments/v25-stage1-error-${Date.now()}.json`);
        fs.writeFileSync(errorFile, JSON.stringify(errorReport, null, 2));
        console.log(`💾 錯誤記錄: ${path.basename(errorFile)}`);
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });