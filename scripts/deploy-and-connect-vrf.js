const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 部署新的 VRFConsumerV2Plus 並串接所有合約...");
    
    // ============================================
    // 1. 配置
    // ============================================
    
    // BSC 主網 VRF 配置
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    const SUBSCRIPTION_ID = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
    
    // 需要連接的合約地址
    const CONTRACTS = {
        DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
        Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
        Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
        AltarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"
    };
    
    // ============================================
    // 2. 部署新的 VRFConsumerV2Plus
    // ============================================
    
    console.log("\n📋 部署 VRFConsumerV2Plus...");
    console.log("- VRF Coordinator:", VRF_COORDINATOR);
    console.log("- Subscription ID:", SUBSCRIPTION_ID);
    
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfConsumer = await VRFConsumerV2Plus.deploy(
        SUBSCRIPTION_ID,
        VRF_COORDINATOR
    );
    
    await vrfConsumer.waitForDeployment();
    const vrfAddress = await vrfConsumer.getAddress();
    console.log("✅ VRFConsumerV2Plus 部署於:", vrfAddress);
    
    // 等待區塊確認
    console.log("⏳ 等待 5 個區塊確認...");
    const receipt = await vrfConsumer.deploymentTransaction().wait(5);
    
    // ============================================
    // 3. 顯示當前配置
    // ============================================
    
    console.log("\n📊 合約配置:");
    console.log("- Subscription ID:", await vrfConsumer.s_subscriptionId());
    console.log("- Key Hash:", await vrfConsumer.keyHash());
    console.log("- Callback Gas Limit:", await vrfConsumer.callbackGasLimit());
    console.log("- Request Confirmations:", await vrfConsumer.requestConfirmations());
    
    // ============================================
    // 4. 授權所有相關合約
    // ============================================
    
    console.log("\n🔐 授權合約使用 VRF Manager...");
    
    for (const [name, address] of Object.entries(CONTRACTS)) {
        try {
            console.log(`\n授權 ${name} (${address})...`);
            const tx = await vrfConsumer.setAuthorizedContract(address, true);
            await tx.wait(1);
            console.log(`✅ ${name} 已授權`);
        } catch (error) {
            console.log(`❌ ${name} 授權失敗:`, error.message);
        }
    }
    
    // ============================================
    // 5. 更新各合約的 VRF Manager 地址
    // ============================================
    
    console.log("\n🔄 更新各合約的 VRF Manager 地址...");
    
    // Hero 合約
    try {
        console.log("\n更新 Hero 合約...");
        const Hero = await hre.ethers.getContractFactory("Hero");
        const hero = Hero.attach(CONTRACTS.Hero);
        
        // 檢查是否有 setVrfManager 函數
        const tx = await hero.setVrfManager(vrfConsumer.address);
        await tx.wait(1);
        console.log("✅ Hero VRF Manager 已更新");
    } catch (error) {
        console.log("⚠️ Hero 更新失敗（可能需要手動設置）:", error.message);
    }
    
    // Relic 合約
    try {
        console.log("\n更新 Relic 合約...");
        const Relic = await hre.ethers.getContractFactory("Relic");
        const relic = Relic.attach(CONTRACTS.Relic);
        
        const tx = await relic.setVrfManager(vrfConsumer.address);
        await tx.wait(1);
        console.log("✅ Relic VRF Manager 已更新");
    } catch (error) {
        console.log("⚠️ Relic 更新失敗（可能需要手動設置）:", error.message);
    }
    
    // DungeonMaster 合約
    try {
        console.log("\n更新 DungeonMaster 合約...");
        const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = DungeonMaster.attach(CONTRACTS.DungeonMaster);
        
        // DungeonMaster 可能使用不同的函數名
        try {
            const tx = await dungeonMaster.setVRFManager(vrfConsumer.address);
            await tx.wait(1);
            console.log("✅ DungeonMaster VRF Manager 已更新");
        } catch {
            // 嘗試另一個函數名
            const tx = await dungeonMaster.setVrfManager(vrfConsumer.address);
            await tx.wait(1);
            console.log("✅ DungeonMaster VRF Manager 已更新");
        }
    } catch (error) {
        console.log("⚠️ DungeonMaster 更新失敗（可能需要手動設置）:", error.message);
    }
    
    // AltarOfAscension 合約
    try {
        console.log("\n更新 AltarOfAscension 合約...");
        const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
        const altar = AltarOfAscension.attach(CONTRACTS.AltarOfAscension);
        
        const tx = await altar.setVrfManager(vrfConsumer.address);
        await tx.wait(1);
        console.log("✅ AltarOfAscension VRF Manager 已更新");
    } catch (error) {
        console.log("⚠️ AltarOfAscension 更新失敗（可能需要手動設置）:", error.message);
    }
    
    // ============================================
    // 6. 驗證合約（可選）
    // ============================================
    
    console.log("\n🔍 驗證合約...");
    try {
        await hre.run("verify:verify", {
            address: vrfAddress,
            constructorArguments: [
                SUBSCRIPTION_ID,
                VRF_COORDINATOR
            ],
        });
        console.log("✅ 合約驗證成功");
    } catch (error) {
        console.log("⚠️ 驗證失敗（可能已經驗證或需要稍後重試）:", error.message);
    }
    
    // ============================================
    // 7. 保存部署信息
    // ============================================
    
    const deploymentInfo = {
        network: "BSC Mainnet",
        timestamp: new Date().toISOString(),
        vrfConsumerV2Plus: vrfAddress,
        vrfCoordinator: VRF_COORDINATOR,
        subscriptionId: SUBSCRIPTION_ID,
        keyHash: await vrfConsumer.keyHash(),
        callbackGasLimit: (await vrfConsumer.callbackGasLimit()).toString(),
        authorizedContracts: CONTRACTS,
        configuration: {
            maxBatchSize: 25,
            gasPerNFT: "~97,000",
            totalGasLimit: "2,500,000",
            estimatedCostPerBatch: "0.015 LINK"
        }
    };
    
    const filename = `./deployments/vrf-deployment-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 部署信息已保存到: ${filename}`);
    
    // ============================================
    // 8. 重要提醒
    // ============================================
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 部署完成！");
    console.log("=".repeat(60));
    
    console.log("\n⚠️ 重要：請手動完成以下步驟：");
    console.log("\n1. 📍 添加 VRF Consumer 到訂閱:");
    console.log(`   - 前往: https://vrf.chain.link/bsc/${SUBSCRIPTION_ID}`);
    console.log(`   - 添加消費者地址: ${vrfAddress}`);
    console.log(`   - 確保訂閱有足夠的 LINK（建議 100+ LINK）`);
    
    console.log("\n2. 🔄 更新前端配置:");
    console.log(`   - 更新 VRF_MANAGER_ADDRESS = "${vrfAddress}"`);
    
    console.log("\n3. 📊 更新子圖配置（如果需要）:");
    console.log(`   - 更新 networks.json 中的 VRFConsumerV2Plus 地址`);
    
    console.log("\n4. 🧪 測試鑄造功能:");
    console.log("   - 嘗試鑄造 1 個 NFT（測試基本功能）");
    console.log("   - 嘗試鑄造 5 個 NFT（測試批量）");
    console.log("   - 嘗試鑄造 25 個 NFT（測試上限）");
    
    console.log("\n" + "=".repeat(60));
    console.log("📋 合約地址總結:");
    console.log("=".repeat(60));
    console.log("VRFConsumerV2Plus:", vrfAddress);
    console.log("=".repeat(60));
    
    return vrfAddress;
}

// 執行部署
main()
    .then((address) => {
        console.log("\n✅ 腳本執行成功！");
        console.log("新 VRF Manager 地址:", address);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ 部署失敗:", error);
        process.exit(1);
    });