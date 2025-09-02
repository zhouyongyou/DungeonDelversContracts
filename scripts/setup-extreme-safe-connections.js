// 設置極致安全版本合約的關聯連接
const { ethers } = require("hardhat");

async function main() {
    console.log("🔗 開始設置極致安全版本合約關聯...");
    console.log("===================================");

    // 獲取部署者
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("📋 操作者地址:", deployerAddress);

    // 從環境變數或參數讀取地址
    const addresses = {
        dungeonCore: process.env.VITE_DUNGEONCORE_ADDRESS,
        vrfManager: process.env.VITE_VRF_MANAGER_V2PLUS_ADDRESS, // 將使用新部署的地址
        hero: process.env.VITE_HERO_ADDRESS, // 將使用新部署的地址  
        relic: process.env.VITE_RELIC_ADDRESS, // 將使用新部署的地址
        vrfSubscriptionId: process.env.VITE_VRF_SUBSCRIPTION_ID
    };

    console.log("📝 合約地址配置:");
    console.log("   DungeonCore:", addresses.dungeonCore);
    console.log("   VRFManager:", addresses.vrfManager);
    console.log("   Hero:", addresses.hero);
    console.log("   Relic:", addresses.relic);
    console.log("   VRF Subscription:", addresses.vrfSubscriptionId);

    // 驗證所有地址都存在
    for (const [name, address] of Object.entries(addresses)) {
        if (!address || address === 'undefined') {
            throw new Error(`❌ ${name} 地址未配置`);
        }
    }

    try {
        // ==================== 1. 設置 VRFManager 授權 ====================
        console.log("\n🎯 第1步: 設置 VRFManager 授權");
        console.log("==============================");
        
        const vrfManager = await ethers.getContractAt("VRFConsumerV2Plus", addresses.vrfManager);
        
        console.log("⏳ 設置 DungeonCore 地址...");
        const setDungeonCoreTx = await vrfManager.setDungeonCore(addresses.dungeonCore);
        await setDungeonCoreTx.wait();
        console.log("✅ DungeonCore 地址已設置");
        console.log("📋 交易:", setDungeonCoreTx.hash);
        
        console.log("⏳ 授權 Hero 合約...");
        const authHeroTx = await vrfManager.setAuthorizedContract(addresses.hero, true);
        await authHeroTx.wait();
        console.log("✅ Hero 合約已授權");
        console.log("📋 交易:", authHeroTx.hash);
        
        console.log("⏳ 授權 Relic 合約...");  
        const authRelicTx = await vrfManager.setAuthorizedContract(addresses.relic, true);
        await authRelicTx.wait();
        console.log("✅ Relic 合約已授權");
        console.log("📋 交易:", authRelicTx.hash);

        // ==================== 2. 更新 DungeonCore 中的地址 ====================
        console.log("\n🎯 第2步: 更新 DungeonCore 合約地址");
        console.log("====================================");
        
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        
        console.log("⏳ 設置新的 VRFManager 地址...");
        const setVRFTx = await dungeonCore.setVRFManager(addresses.vrfManager);
        await setVRFTx.wait();
        console.log("✅ VRFManager 地址已更新");
        console.log("📋 交易:", setVRFTx.hash);
        
        console.log("⏳ 設置新的 Hero 地址...");
        const setHeroTx = await dungeonCore.setHeroContract(addresses.hero);
        await setHeroTx.wait();
        console.log("✅ Hero 地址已更新");
        console.log("📋 交易:", setHeroTx.hash);
        
        console.log("⏳ 設置新的 Relic 地址...");
        const setRelicTx = await dungeonCore.setRelicContract(addresses.relic);
        await setRelicTx.wait();
        console.log("✅ Relic 地址已更新");
        console.log("📋 交易:", setRelicTx.hash);

        // ==================== 3. 設置 Hero 和 Relic 合約的 DungeonCore ====================
        console.log("\n🎯 第3步: 設置 NFT 合約的 DungeonCore 連接");
        console.log("==========================================");
        
        const hero = await ethers.getContractAt("Hero", addresses.hero);
        const relic = await ethers.getContractAt("Relic", addresses.relic);
        
        console.log("⏳ 設置 Hero 合約的 DungeonCore 地址...");
        const setHeroCoresTx = await hero.setDungeonCore(addresses.dungeonCore);
        await setHeroCoresTx.wait();
        console.log("✅ Hero -> DungeonCore 連接已設置");
        console.log("📋 交易:", setHeroCoresTx.hash);
        
        console.log("⏳ 設置 Relic 合約的 DungeonCore 地址...");
        const setRelicCoreTx = await relic.setDungeonCore(addresses.dungeonCore);
        await setRelicCoreTx.wait();
        console.log("✅ Relic -> DungeonCore 連接已設置");
        console.log("📋 交易:", setRelicCoreTx.hash);
        
        // ==================== 4. 驗證連接狀態 ====================
        console.log("\n🎯 第4步: 驗證合約連接");
        console.log("=======================");
        
        console.log("⏳ 檢查 Hero 合約的 DungeonCore 地址...");
        const heroCore = await hero.dungeonCore();
        console.log("📍 Hero -> DungeonCore:", heroCore);
        
        console.log("⏳ 檢查 Relic 合約的 DungeonCore 地址...");  
        const relicCore = await relic.dungeonCore();
        console.log("📍 Relic -> DungeonCore:", relicCore);

        // ==================== 5. 驗證授權狀態 ====================
        console.log("\n🎯 第5步: 驗證授權狀態");
        console.log("=======================");
        
        console.log("⏳ 檢查 Hero 合約是否已授權...");
        const heroAuthorized = await vrfManager.isAuthorized(addresses.hero);
        console.log("✅ Hero 授權狀態:", heroAuthorized ? "已授權" : "❌ 未授權");
        
        console.log("⏳ 檢查 Relic 合約是否已授權...");
        const relicAuthorized = await vrfManager.isAuthorized(addresses.relic);
        console.log("✅ Relic 授權狀態:", relicAuthorized ? "已授權" : "❌ 未授權");

        // ==================== 6. 檢查 VRF 配置 ====================
        console.log("\n🎯 第6步: 檢查 VRF 配置");
        console.log("=======================");
        
        const subscriptionId = await vrfManager.s_subscriptionId();
        const keyHash = await vrfManager.keyHash();
        const callbackGasLimit = await vrfManager.callbackGasLimit();
        const confirmations = await vrfManager.requestConfirmations();
        
        console.log("📋 VRF 配置詳情:");
        console.log("   Subscription ID:", subscriptionId.toString());
        console.log("   Key Hash:", keyHash);
        console.log("   Callback Gas Limit:", callbackGasLimit.toString());
        console.log("   Confirmations:", confirmations.toString());

        // ==================== 7. 測試動態Gas計算 ====================
        console.log("\n🎯 第7步: 測試極致安全Gas公式");
        console.log("=============================");
        
        const testQuantities = [1, 5, 10, 20, 50];
        for (const qty of testQuantities) {
            const gasLimit = await vrfManager.calculateDynamicGasLimit(addresses.hero, qty);
            console.log(`📊 ${qty}個NFT 動態Gas限制:`, gasLimit.toString());
        }

        console.log("\n🎉 合約關聯設置完成!");
        console.log("====================");
        console.log("✅ VRFManager 已授權 Hero 和 Relic");
        console.log("✅ DungeonCore 已更新所有合約地址");
        console.log("✅ 所有合約互連設置完成");
        console.log("✅ 極致安全Gas公式已啟用");
        
        // 生成驗證報告
        const verificationReport = {
            timestamp: new Date().toISOString(),
            operator: deployerAddress,
            contracts: {
                dungeonCore: addresses.dungeonCore,
                vrfManager: addresses.vrfManager,
                hero: addresses.hero,
                relic: addresses.relic
            },
            authorizations: {
                heroAuthorized,
                relicAuthorized
            },
            vrfConfig: {
                subscriptionId: subscriptionId.toString(),
                keyHash,
                callbackGasLimit: callbackGasLimit.toString(),
                confirmations: confirmations.toString()
            },
            gasFormula: "280000 + quantity * 41001 (極致安全版)",
            maxNFTSupport: "54個NFT",
            safetyMargin: "37.9% (50個NFT)"
        };

        // 保存驗證報告
        const fs = require('fs');
        const reportPath = `deployments/connection-report-${new Date().toISOString().slice(0,10)}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
        console.log("📄 連接驗證報告已保存:", reportPath);

        console.log("\n⚡ 下一步建議:");
        console.log("==============");
        console.log("1. 更新前端配置文件");
        console.log("2. 重新部署和同步子圖");
        console.log("3. 驗證合約代碼到 BSCScan");
        console.log("4. 進行完整的系統測試");

    } catch (error) {
        console.error("❌ 設置過程中出現錯誤:", error);
        throw error;
    }
}

// 執行腳本
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;