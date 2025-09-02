const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 修復 VRF Manager 訂閱 ID");
    console.log("================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("執行者地址:", deployer.address);
    
    // 正確的訂閱 ID
    const CORRECT_SUBSCRIPTION_ID = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
    const VRF_MANAGER_ADDRESS = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    
    console.log("\n📋 配置:");
    console.log("VRF Manager 地址:", VRF_MANAGER_ADDRESS);
    console.log("正確的訂閱 ID:", CORRECT_SUBSCRIPTION_ID);
    
    // 獲取 VRF Manager 合約
    const vrfABI = [
        "function s_subscriptionId() view returns (uint256)",
        "function setSubscriptionId(uint256)",
        "function owner() view returns (address)"
    ];
    
    const vrfManager = await ethers.getContractAt(vrfABI, VRF_MANAGER_ADDRESS);
    
    // Step 1: 檢查當前訂閱 ID
    console.log("\n📝 Step 1: 檢查當前訂閱 ID...");
    const currentSubId = await vrfManager.s_subscriptionId();
    console.log("當前訂閱 ID:", currentSubId.toString());
    
    if (currentSubId.toString() === CORRECT_SUBSCRIPTION_ID) {
        console.log("✅ 訂閱 ID 已經正確，無需更新");
        return;
    }
    
    // Step 2: 檢查 owner
    console.log("\n📝 Step 2: 檢查合約擁有者...");
    const owner = await vrfManager.owner();
    console.log("合約 Owner:", owner);
    console.log("當前錢包:", deployer.address);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("❌ 當前錢包不是合約 Owner，無法更新");
        return;
    }
    
    // Step 3: 更新訂閱 ID
    console.log("\n📝 Step 3: 更新訂閱 ID...");
    const tx = await vrfManager.setSubscriptionId(CORRECT_SUBSCRIPTION_ID);
    console.log("交易已發送:", tx.hash);
    await tx.wait();
    console.log("✅ 訂閱 ID 更新成功");
    
    // Step 4: 驗證更新
    console.log("\n📝 Step 4: 驗證更新...");
    const newSubId = await vrfManager.s_subscriptionId();
    console.log("新的訂閱 ID:", newSubId.toString());
    console.log("更新成功:", newSubId.toString() === CORRECT_SUBSCRIPTION_ID ? "✅" : "❌");
    
    // 輸出總結
    console.log("\n📋 更新總結:");
    console.log("====================");
    console.log("VRF Manager:", VRF_MANAGER_ADDRESS);
    console.log("舊訂閱 ID:", currentSubId.toString());
    console.log("新訂閱 ID:", CORRECT_SUBSCRIPTION_ID);
    console.log("\n⚠️ 重要提醒:");
    console.log("1. 請確保訂閱 ID", CORRECT_SUBSCRIPTION_ID, "有足夠的 LINK 或 BNB 餘額");
    console.log("2. 請確保 VRF Manager", VRF_MANAGER_ADDRESS, "已添加為訂閱的消費者");
    console.log("3. 可以在 https://vrf.chain.link/bsc/" + CORRECT_SUBSCRIPTION_ID + " 管理訂閱");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });