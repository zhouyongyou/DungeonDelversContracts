// 重新部署極致安全版本的三個核心合約
// VRFConsumerV2Plus, Hero, Relic
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 開始重新部署極致安全版本合約...");
    console.log("=====================================");

    // 獲取部署者
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("📋 部署者地址:", deployerAddress);

    // 檢查餘額
    const balance = await ethers.provider.getBalance(deployerAddress);
    console.log("💰 部署者餘額:", ethers.formatEther(balance), "BNB");
    
    if (balance < ethers.parseEther("0.1")) {
        throw new Error("❌ 餘額不足 0.1 BNB，無法進行部署");
    }

    // 從 .env 讀取當前配置
    const dungeonCoreAddress = process.env.VITE_DUNGEONCORE_ADDRESS;
    const vrfSubscriptionId = process.env.VITE_VRF_SUBSCRIPTION_ID;
    const vrfCoordinator = process.env.VITE_VRF_COORDINATOR;
    
    console.log("📝 當前配置:");
    console.log("   DungeonCore:", dungeonCoreAddress);
    console.log("   VRF Subscription:", vrfSubscriptionId);
    console.log("   VRF Coordinator:", vrfCoordinator);

    const deploymentResults = {};

    try {
        // ==================== 1. 部署 VRFConsumerV2Plus ====================
        console.log("\n🎯 第1步: 部署 VRFConsumerV2Plus (極致安全版)");
        console.log("================================================");
        
        const VRFConsumerV2Plus = await ethers.getContractFactory("VRFConsumerV2Plus");
        console.log("⏳ 正在部署 VRFConsumerV2Plus...");
        
        const vrfManager = await VRFConsumerV2Plus.deploy(
            vrfSubscriptionId,
            vrfCoordinator
        );
        await vrfManager.waitForDeployment();
        const vrfManagerAddress = await vrfManager.getAddress();
        
        console.log("✅ VRFConsumerV2Plus 部署成功!");
        console.log("📍 地址:", vrfManagerAddress);
        console.log("⛽ 交易:", vrfManager.deploymentTransaction().hash);
        
        deploymentResults.vrfManager = {
            address: vrfManagerAddress,
            txHash: vrfManager.deploymentTransaction().hash
        };

        // ==================== 2. 部署 Hero ====================
        console.log("\n🎯 第2步: 部署 Hero NFT 合約");
        console.log("===========================");
        
        const Hero = await ethers.getContractFactory("Hero");
        console.log("⏳ 正在部署 Hero...");
        
        const hero = await Hero.deploy();
        await hero.waitForDeployment();
        const heroAddress = await hero.getAddress();
        
        console.log("✅ Hero 部署成功!");
        console.log("📍 地址:", heroAddress);
        console.log("⛽ 交易:", hero.deploymentTransaction().hash);
        
        deploymentResults.hero = {
            address: heroAddress,
            txHash: hero.deploymentTransaction().hash
        };

        // ==================== 3. 部署 Relic ====================
        console.log("\n🎯 第3步: 部署 Relic NFT 合約");
        console.log("============================");
        
        const Relic = await ethers.getContractFactory("Relic");
        console.log("⏳ 正在部署 Relic...");
        
        const relic = await Relic.deploy();
        await relic.waitForDeployment();
        const relicAddress = await relic.getAddress();
        
        console.log("✅ Relic 部署成功!");
        console.log("📍 地址:", relicAddress);
        console.log("⛽ 交易:", relic.deploymentTransaction().hash);
        
        deploymentResults.relic = {
            address: relicAddress,
            txHash: relic.deploymentTransaction().hash
        };

        // ==================== 部署總結 ====================
        console.log("\n🎉 部署完成總結");
        console.log("================");
        console.log("✅ VRFConsumerV2Plus:", deploymentResults.vrfManager.address);
        console.log("✅ Hero:", deploymentResults.hero.address);
        console.log("✅ Relic:", deploymentResults.relic.address);

        // ==================== 生成配置更新 ====================
        console.log("\n📝 需要更新的環境變數:");
        console.log("====================");
        console.log(`VITE_VRF_MANAGER_V2PLUS_ADDRESS=${deploymentResults.vrfManager.address}`);
        console.log(`VITE_HERO_ADDRESS=${deploymentResults.hero.address}`);
        console.log(`VITE_RELIC_ADDRESS=${deploymentResults.relic.address}`);

        // ==================== 保存部署記錄 ====================
        const deploymentRecord = {
            timestamp: new Date().toISOString(),
            deployer: deployerAddress,
            network: "BSC Mainnet",
            version: "V26-EXTREME-SAFE",
            contracts: {
                vrfManager: {
                    name: "VRFConsumerV2Plus",
                    address: deploymentResults.vrfManager.address,
                    txHash: deploymentResults.vrfManager.txHash,
                    features: ["極致安全Gas公式", "280k+41k*qty", "最大54NFT支援", "37.9%安全餘量"]
                },
                hero: {
                    name: "Hero",
                    address: deploymentResults.hero.address,
                    txHash: deploymentResults.hero.txHash,
                    vrfManager: deploymentResults.vrfManager.address
                },
                relic: {
                    name: "Relic", 
                    address: deploymentResults.relic.address,
                    txHash: deploymentResults.relic.txHash,
                    vrfManager: deploymentResults.vrfManager.address
                }
            }
        };

        // 保存到文件
        const fs = require('fs');
        const recordPath = `deployments/v26-extreme-safe-${new Date().toISOString().slice(0,10)}.json`;
        fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
        console.log("📄 部署記錄已保存:", recordPath);

        console.log("\n⚡ 下一步操作:");
        console.log("==============");
        console.log("1. 更新 .env 文件中的合約地址");
        console.log("2. 執行合約關聯設置腳本");
        console.log("3. 驗證合約代碼到 BSCScan");
        console.log("4. 更新前端和子圖配置");

        return deploymentResults;

    } catch (error) {
        console.error("❌ 部署過程中出現錯誤:", error);
        
        // 如果有部分成功的部署，也要記錄
        if (Object.keys(deploymentResults).length > 0) {
            console.log("\n⚠️ 部分合約已成功部署:");
            Object.entries(deploymentResults).forEach(([name, result]) => {
                console.log(`✅ ${name}:`, result.address);
            });
        }
        
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