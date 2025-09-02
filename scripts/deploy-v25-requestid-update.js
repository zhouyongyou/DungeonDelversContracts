// V25 RequestId 更新部署腳本
// 部署四個修改過的合約：Hero, Relic, AltarOfAscension, DungeonMaster
// 新管理員地址：0xEbCF4A36Ad1485A9737025e9d72186b604487274

const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 開始 V25 RequestId 更新部署");
    console.log("📍 部署者地址:", deployer.address);
    
    // 檢查餘額
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 BNB 餘額:", ethers.formatEther(balance), "BNB");
    
    // 獲取當前區塊號作為起始區塊
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log("📊 當前區塊號:", currentBlock);
    
    const deploymentResults = {};
    const gasUsed = {};
    
    try {
        // 1. 部署 Hero 合約
        console.log("\n=== 部署 Hero 合約 ===");
        const Hero = await ethers.getContractFactory("Hero");
        const hero = await Hero.deploy();
        await hero.waitForDeployment();
        const heroAddress = await hero.getAddress();
        deploymentResults.Hero = heroAddress;
        console.log("✅ Hero 部署成功:", heroAddress);
        
        // 記錄 gas 使用
        const heroReceipt = await ethers.provider.getTransactionReceipt(hero.deploymentTransaction().hash);
        gasUsed.Hero = heroReceipt.gasUsed;
        
        // 2. 部署 Relic 合約
        console.log("\n=== 部署 Relic 合約 ===");
        const Relic = await ethers.getContractFactory("Relic");
        const relic = await Relic.deploy();
        await relic.waitForDeployment();
        const relicAddress = await relic.getAddress();
        deploymentResults.Relic = relicAddress;
        console.log("✅ Relic 部署成功:", relicAddress);
        
        const relicReceipt = await ethers.provider.getTransactionReceipt(relic.deploymentTransaction().hash);
        gasUsed.Relic = relicReceipt.gasUsed;
        
        // 3. 部署 AltarOfAscension 合約
        console.log("\n=== 部署 AltarOfAscension 合約 ===");
        const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
        const altar = await AltarOfAscension.deploy();
        await altar.waitForDeployment();
        const altarAddress = await altar.getAddress();
        deploymentResults.AltarOfAscension = altarAddress;
        console.log("✅ AltarOfAscension 部署成功:", altarAddress);
        
        const altarReceipt = await ethers.provider.getTransactionReceipt(altar.deploymentTransaction().hash);
        gasUsed.AltarOfAscension = altarReceipt.gasUsed;
        
        // 4. 部署 DungeonMaster 合約
        console.log("\n=== 部署 DungeonMaster 合約 ===");
        const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = await DungeonMaster.deploy();
        await dungeonMaster.waitForDeployment();
        const dungeonMasterAddress = await dungeonMaster.getAddress();
        deploymentResults.DungeonMaster = dungeonMasterAddress;
        console.log("✅ DungeonMaster 部署成功:", dungeonMasterAddress);
        
        const dmReceipt = await ethers.provider.getTransactionReceipt(dungeonMaster.deploymentTransaction().hash);
        gasUsed.DungeonMaster = dmReceipt.gasUsed;
        
        // 計算總 gas 使用量
        const totalGasUsed = Object.values(gasUsed).reduce((sum, gas) => sum + gas, BigInt(0));
        
        console.log("\n🎉 === 部署完成摘要 ===");
        console.log("📅 部署時間:", new Date().toISOString());
        console.log("📍 部署者:", deployer.address);
        console.log("📊 起始區塊:", currentBlock);
        
        console.log("\n📋 新合約地址:");
        Object.entries(deploymentResults).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });
        
        console.log("\n⛽ Gas 使用統計:");
        Object.entries(gasUsed).forEach(([name, gas]) => {
            console.log(`  ${name}: ${gas.toString()} gas`);
        });
        console.log(`  總計: ${totalGasUsed.toString()} gas`);
        
        // 檢查剩餘餘額
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        const costInBNB = balance - finalBalance;
        console.log("\n💰 成本統計:");
        console.log("  部署前餘額:", ethers.formatEther(balance), "BNB");
        console.log("  部署後餘額:", ethers.formatEther(finalBalance), "BNB");
        console.log("  實際成本:", ethers.formatEther(costInBNB), "BNB");
        
        // 生成配置更新腳本
        console.log("\n📝 === 配置更新指令 ===");
        console.log("請更新 .env 檔案中的以下地址:");
        console.log(`VITE_HERO_ADDRESS=${deploymentResults.Hero}`);
        console.log(`VITE_RELIC_ADDRESS=${deploymentResults.Relic}`);
        console.log(`VITE_ALTAROFASCENSION_ADDRESS=${deploymentResults.AltarOfAscension}`);
        console.log(`VITE_DUNGEONMASTER_ADDRESS=${deploymentResults.DungeonMaster}`);
        console.log(`VITE_START_BLOCK=${currentBlock + 1}`);
        
        console.log("\n🔄 下一步操作:");
        console.log("1. 更新 .env 配置文件中的合約地址");
        console.log("2. 執行統一配置管理系統同步");
        console.log("3. 重新部署子圖到 The Graph");
        console.log("4. 測試新的 requestId 匹配功能");
        
        return deploymentResults;
        
    } catch (error) {
        console.error("❌ 部署失敗:", error);
        throw error;
    }
}

main()
    .then((results) => {
        console.log("\n✅ 部署腳本執行成功");
        console.log("結果:", results);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 部署腳本執行失敗:", error);
        process.exit(1);
    });