const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 部署新的 VRF Manager with 正確的訂閱 ID");
    console.log("================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    // 正確的訂閱 ID
    const CORRECT_SUBSCRIPTION_ID = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"; // BSC Mainnet VRF Coordinator (正確地址)
    
    // 現有合約地址
    const DUNGEONCORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    const OLD_VRF_MANAGER = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    
    console.log("\n📋 配置:");
    console.log("正確的訂閱 ID:", CORRECT_SUBSCRIPTION_ID);
    console.log("VRF Coordinator:", VRF_COORDINATOR);
    console.log("舊 VRF Manager:", OLD_VRF_MANAGER);
    
    // Step 1: 部署新的 VRF Manager (VRFConsumerV2Plus)
    console.log("\n📝 Step 1: 部署新的 VRF Manager...");
    const VRFConsumerV2Plus = await ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfManager = await VRFConsumerV2Plus.deploy(
        CORRECT_SUBSCRIPTION_ID,
        VRF_COORDINATOR
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
    console.log("\n🔍 驗證設定...");
    
    // 驗證訂閱 ID
    const subId = await vrfManager.s_subscriptionId();
    console.log("訂閱 ID 正確:", subId.toString() === CORRECT_SUBSCRIPTION_ID ? "✅" : "❌");
    
    // 驗證 DungeonCore 連接
    const vrfDungeonCore = await vrfManager.dungeonCore();
    console.log("VRF → DungeonCore:", vrfDungeonCore === DUNGEONCORE_ADDRESS ? "✅" : "❌");
    
    // 驗證 DungeonCore 的 VRF
    const coreVRF = await dungeonCore.getVRFManager();
    console.log("DungeonCore → VRF:", coreVRF === vrfManagerAddress ? "✅" : "❌");
    
    // 輸出總結
    console.log("\n📋 部署總結:");
    console.log("====================");
    console.log("新 VRF Manager 地址:", vrfManagerAddress);
    console.log("正確的訂閱 ID:", CORRECT_SUBSCRIPTION_ID);
    console.log("\n⚠️ 重要提醒:");
    console.log("1. 請確保訂閱 ID", CORRECT_SUBSCRIPTION_ID, "有足夠的 LINK 或 BNB 餘額");
    console.log("2. 請確保新 VRF Manager", vrfManagerAddress, "已添加為訂閱的消費者");
    console.log("3. 可以在 https://vrf.chain.link/bsc/" + CORRECT_SUBSCRIPTION_ID + " 管理訂閱");
    
    // 保存部署結果
    const fs = require('fs');
    const deploymentData = {
        timestamp: new Date().toISOString(),
        network: "BSC Mainnet",
        contracts: {
            VRFManager: vrfManagerAddress,
            DungeonCore: DUNGEONCORE_ADDRESS
        },
        config: {
            subscriptionId: CORRECT_SUBSCRIPTION_ID,
            vrfCoordinator: VRF_COORDINATOR
        },
        oldContracts: {
            VRFManager: OLD_VRF_MANAGER
        }
    };
    
    const filename = `deployments/vrf-manager-fix-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
    console.log("\n💾 部署記錄已保存:", filename);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });