// deploy-batch-mint.js - 部署批量鑄造防撞庫版本合約
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 開始部署批量鑄造防撞庫版本合約...");
    
    // 獲取部署者帳戶
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

    // 檢查網路
    const network = await ethers.provider.getNetwork();
    console.log("網路:", network.name, "Chain ID:", network.chainId);
    
    if (network.chainId !== 56n && network.chainId !== 97n) {
        throw new Error("請使用 BSC 主網 (56) 或測試網 (97)");
    }

    // 部署新的Hero合約
    console.log("\n📦 部署 Hero 批量鑄造合約...");
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployer.address);
    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    console.log("✅ Hero 合約部署完成:", heroAddress);

    // 部署新的Relic合約
    console.log("\n📦 部署 Relic 批量鑄造合約...");
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployer.address);
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    console.log("✅ Relic 合約部署完成:", relicAddress);

    // 驗證批量階層設定
    console.log("\n🔍 驗證批量階層設定...");
    
    try {
        const heroTiers = await hero.getAllBatchTiers();
        console.log("Hero 批量階層:", heroTiers.length, "個");
        
        for (let i = 0; i < heroTiers.length; i++) {
            const tier = heroTiers[i];
            console.log(`  階層 ${i}: ${tier.tierName} - 最少 ${tier.minQuantity} 個 - 最高 ${tier.maxRarity}★`);
        }

        const relicTiers = await relic.getAllBatchTiers();
        console.log("Relic 批量階層:", relicTiers.length, "個");
        
        for (let i = 0; i < relicTiers.length; i++) {
            const tier = relicTiers[i];
            console.log(`  階層 ${i}: ${tier.tierName} - 最少 ${tier.minQuantity} 個 - 最高 ${tier.maxRarity}★`);
        }
    } catch (error) {
        console.error("❌ 驗證批量階層失敗:", error.message);
    }

    // 測試批量階層查詢功能
    console.log("\n🧪 測試批量階層查詢功能...");
    
    const testQuantities = [5, 10, 20, 50, 100];
    
    for (const quantity of testQuantities) {
        try {
            const [maxRarity, tierName] = await hero.getMaxRarityForQuantity(quantity);
            console.log(`  ${quantity} 個 -> ${tierName} (最高 ${maxRarity}★)`);
        } catch (error) {
            console.log(`  ${quantity} 個 -> ❌ ${error.message}`);
        }
    }

    // 如果有現有的DungeonCore地址，設定連接
    const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
    const soulShardAddress = process.env.SOULSHARD_ADDRESS;
    
    if (dungeonCoreAddress && soulShardAddress) {
        console.log("\n🔗 設定合約連接...");
        
        try {
            // 設定DungeonCore連接
            const tx1 = await hero.setDungeonCore(dungeonCoreAddress);
            await tx1.wait();
            console.log("✅ Hero -> DungeonCore 連接設定完成");

            const tx2 = await relic.setDungeonCore(dungeonCoreAddress);
            await tx2.wait();
            console.log("✅ Relic -> DungeonCore 連接設定完成");

            // 設定SoulShard代幣連接
            const tx3 = await hero.setSoulShardToken(soulShardAddress);
            await tx3.wait();
            console.log("✅ Hero -> SoulShard 連接設定完成");

            const tx4 = await relic.setSoulShardToken(soulShardAddress);
            await tx4.wait();
            console.log("✅ Relic -> SoulShard 連接設定完成");

        } catch (error) {
            console.error("❌ 設定合約連接失敗:", error.message);
        }
    } else {
        console.log("\n⚠️  跳過合約連接設定 (請手動設定 DungeonCore 和 SoulShard 地址)");
    }

    // 設定元數據基礎URI (如果有提供)
    const heroBaseURI = process.env.HERO_BASE_URI;
    const relicBaseURI = process.env.RELIC_BASE_URI;
    
    if (heroBaseURI) {
        console.log("\n🖼️  設定 Hero 元數據 URI...");
        const tx = await hero.setBaseURI(heroBaseURI);
        await tx.wait();
        console.log("✅ Hero BaseURI 設定完成:", heroBaseURI);
    }
    
    if (relicBaseURI) {
        console.log("\n🖼️  設定 Relic 元數據 URI...");
        const tx = await relic.setBaseURI(relicBaseURI);
        await tx.wait();
        console.log("✅ Relic BaseURI 設定完成:", relicBaseURI);
    }

    // 輸出部署摘要
    console.log("\n" + "=".repeat(60));
    console.log("🎉 批量鑄造防撞庫版本部署完成!");
    console.log("=".repeat(60));
    console.log("Hero 合約地址:  ", heroAddress);
    console.log("Relic 合約地址: ", relicAddress);
    console.log("部署者地址:     ", deployer.address);
    console.log("部署網路:       ", network.name, "(Chain ID:", network.chainId.toString() + ")");
    console.log("區塊時間:       ", new Date().toISOString());
    
    // 生成環境變數配置
    console.log("\n📝 環境變數配置:");
    console.log(`HERO_BATCH_ADDRESS=${heroAddress}`);
    console.log(`RELIC_BATCH_ADDRESS=${relicAddress}`);
    
    // 生成驗證指令
    if (network.chainId === 56n) {
        console.log("\n🔍 BSCScan 驗證指令:");
        console.log(`npx hardhat verify --network bsc ${heroAddress} "${deployer.address}"`);
        console.log(`npx hardhat verify --network bsc ${relicAddress} "${deployer.address}"`);
    }

    // 檢查 gas 使用量
    const deploymentCost = await deployer.provider.getBalance(deployer.address);
    console.log("\n💰 部署成本:", ethers.formatEther(deploymentCost), "BNB");

    // 後續步驟提醒
    console.log("\n📋 後續步驟:");
    console.log("1. 驗證合約原始碼 (如上方指令)");
    console.log("2. 在 DungeonCore 中註冊新的 Hero 和 Relic 地址");
    console.log("3. 更新前端配置中的合約地址");
    console.log("4. 更新子圖配置以監聽新事件");
    console.log("5. 測試完整的鑄造流程");
    console.log("6. 準備用戶公告和教育材料");
    
    console.log("\n⚠️  重要提醒:");
    console.log("- 請務必在測試網完整測試後再部署到主網");
    console.log("- 確保所有相關系統都已更新以支援新的批量鑄造機制");
    console.log("- 考慮逐步遷移用戶，而非一次性切換");
}

// 錯誤處理
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });