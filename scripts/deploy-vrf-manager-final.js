const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 部署最終版 VRF Manager (V25.1 修復)");
    console.log("================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    // ⚠️ 永久固定的 VRF 配置 - 不要修改！
    const VRF_CONFIG = {
        COORDINATOR: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",  // BSC Mainnet VRF Coordinator V2.5 ✅
        SUBSCRIPTION_ID: "88422796721004450630713121079263696788635490871993157345476848872165866246915", // 固定訂閱 ID ✅
        KEY_HASH: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4" // 200 gwei ✅
    };
    
    // 現有合約地址
    const DUNGEONCORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    const OLD_VRF_MANAGER = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    
    console.log("\n📋 永久固定配置:");
    console.log("VRF Coordinator:", VRF_CONFIG.COORDINATOR);
    console.log("訂閱 ID:", VRF_CONFIG.SUBSCRIPTION_ID);
    console.log("Key Hash:", VRF_CONFIG.KEY_HASH);
    console.log("\n現有合約:");
    console.log("DungeonCore:", DUNGEONCORE_ADDRESS);
    console.log("舊 VRF Manager:", OLD_VRF_MANAGER);
    
    // Step 1: 部署新的 VRF Manager
    console.log("\n📝 Step 1: 部署新的 VRF Manager...");
    const VRFConsumerV2Plus = await ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfManager = await VRFConsumerV2Plus.deploy(
        VRF_CONFIG.SUBSCRIPTION_ID,
        VRF_CONFIG.COORDINATOR
    );
    await vrfManager.waitForDeployment();
    const vrfManagerAddress = await vrfManager.getAddress();
    console.log("✅ 新 VRF Manager 部署完成:", vrfManagerAddress);
    
    // Step 2: 設定 VRF Manager 的 DungeonCore
    console.log("\n📝 Step 2: 設定 VRF Manager 的 DungeonCore...");
    const tx1 = await vrfManager.setDungeonCore(DUNGEONCORE_ADDRESS);
    await tx1.wait();
    console.log("✅ VRF Manager → DungeonCore 設定完成");
    
    // Step 3: 更新 DungeonCore 的 VRF Manager
    console.log("\n📝 Step 3: 更新 DungeonCore 的 VRF Manager...");
    const dungeonCore = await ethers.getContractAt(
        ["function setGlobalVRFManager(address)", "function getVRFManager() view returns (address)"],
        DUNGEONCORE_ADDRESS
    );
    const tx2 = await dungeonCore.setGlobalVRFManager(vrfManagerAddress);
    await tx2.wait();
    console.log("✅ DungeonCore → VRF Manager 更新完成");
    
    // Step 4: 驗證設定
    console.log("\n🔍 驗證所有設定...");
    
    // 驗證 VRF 配置
    const vrfABI = [
        "function s_vrfCoordinator() view returns (address)",
        "function s_subscriptionId() view returns (uint256)",
        "function keyHash() view returns (bytes32)",
        "function dungeonCore() view returns (address)"
    ];
    const vrfContract = await ethers.getContractAt(vrfABI, vrfManagerAddress);
    
    const [coordinator, subId, keyHash, vrfDungeonCore] = await Promise.all([
        vrfContract.s_vrfCoordinator(),
        vrfContract.s_subscriptionId(),
        vrfContract.keyHash(),
        vrfContract.dungeonCore()
    ]);
    
    console.log("\nVRF 配置驗證:");
    console.log("Coordinator 正確:", coordinator.toLowerCase() === VRF_CONFIG.COORDINATOR.toLowerCase() ? "✅" : "❌");
    console.log("訂閱 ID 正確:", subId.toString() === VRF_CONFIG.SUBSCRIPTION_ID ? "✅" : "❌");
    console.log("Key Hash 正確:", keyHash === VRF_CONFIG.KEY_HASH ? "✅" : "❌");
    console.log("DungeonCore 連接:", vrfDungeonCore === DUNGEONCORE_ADDRESS ? "✅" : "❌");
    
    // 驗證 DungeonCore 的 VRF
    const coreVRF = await dungeonCore.getVRFManager();
    console.log("DungeonCore → VRF:", coreVRF === vrfManagerAddress ? "✅" : "❌");
    
    // 輸出總結
    console.log("\n" + "="*60);
    console.log("📋 部署成功總結:");
    console.log("="*60);
    console.log("✅ 新 VRF Manager 地址:", vrfManagerAddress);
    console.log("✅ VRF Coordinator:", VRF_CONFIG.COORDINATOR);
    console.log("✅ 訂閱 ID:", VRF_CONFIG.SUBSCRIPTION_ID);
    console.log("✅ Key Hash:", VRF_CONFIG.KEY_HASH);
    
    console.log("\n⚠️ 重要後續步驟:");
    console.log("1. 將 VRF Manager", vrfManagerAddress, "添加為訂閱消費者");
    console.log("   訪問: https://vrf.chain.link/bsc/" + VRF_CONFIG.SUBSCRIPTION_ID);
    console.log("2. 確保訂閱有足夠的 LINK 或 BNB 餘額");
    console.log("3. 更新配置文件中的 VRF_MANAGER_V2PLUS_ADDRESS");
    
    // 保存部署結果
    const fs = require('fs');
    const deploymentData = {
        timestamp: new Date().toISOString(),
        network: "BSC Mainnet",
        version: "V25.1-final",
        contracts: {
            VRFManager: vrfManagerAddress,
            DungeonCore: DUNGEONCORE_ADDRESS,
            Hero: "0x27E3A73a4d7DDD8Dea6cBF9e152173CcC04b7505",  // 新的 Hero
            Relic: "0x8676174F82A9e5006B33976430D91d752fa90E3e"  // 新的 Relic
        },
        vrfConfig: {
            coordinator: VRF_CONFIG.COORDINATOR,
            subscriptionId: VRF_CONFIG.SUBSCRIPTION_ID,
            keyHash: VRF_CONFIG.KEY_HASH
        },
        oldContracts: {
            VRFManager: OLD_VRF_MANAGER
        }
    };
    
    const filename = `deployments/v25.1-final-vrf-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
    console.log("\n💾 部署記錄已保存:", filename);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });