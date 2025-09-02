// 深度分析 VRF Gas Limit 問題
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 深度分析 VRF Gas Limit 問題");
    console.log("===============================");
    
    const VRF_MANAGER_ADDRESS = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    const HERO_ADDRESS = "0x27E3A73a4d7DDD8Dea6cBF9e152173CcC04b7505";
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    
    // VRF Manager ABI
    const vrfManagerABI = [
        "function callbackGasLimit() view returns (uint32)",
        "function calculateDynamicGasLimit(address, uint256) view returns (uint32)",
        "function s_subscriptionId() view returns (uint256)",
        "function dungeonCore() view returns (address)"
    ];
    
    // VRF Coordinator ABI (基本功能)
    const coordinatorABI = [
        "function getSubscription(uint256) view returns (uint96, uint96, uint64, address)"
    ];
    
    const vrfManager = await ethers.getContractAt(vrfManagerABI, VRF_MANAGER_ADDRESS);
    const coordinator = await ethers.getContractAt(coordinatorABI, VRF_COORDINATOR);
    
    try {
        console.log("📊 基本設定檢查:");
        
        // 1. 檢查合約設定
        const callbackGasLimit = await vrfManager.callbackGasLimit();
        console.log("VRF Manager callbackGasLimit:", callbackGasLimit.toString());
        
        // 2. 檢查動態計算
        const dynamicGas1 = await vrfManager.calculateDynamicGasLimit(HERO_ADDRESS, 1);
        const dynamicGas10 = await vrfManager.calculateDynamicGasLimit(HERO_ADDRESS, 10);
        console.log("動態計算 1 NFT:", dynamicGas1.toString());
        console.log("動態計算 10 NFT:", dynamicGas10.toString());
        
        // 3. 檢查訂閱 ID
        const subscriptionId = await vrfManager.s_subscriptionId();
        console.log("訂閱 ID:", subscriptionId.toString());
        
        // 4. 檢查訂閱詳情
        try {
            const subscription = await coordinator.getSubscription(subscriptionId);
            console.log("\\n📋 訂閱詳情:");
            console.log("餘額:", ethers.formatEther(subscription[0]), "LINK");
            console.log("Native 餘額:", ethers.formatEther(subscription[1]), "BNB");
            console.log("消費者數量:", subscription[2].toString());
            console.log("Owner:", subscription[3]);
        } catch (subError) {
            console.log("❌ 無法讀取訂閱詳情:", subError.message);
        }
        
        console.log("\\n🔍 Gas 計算分析:");
        console.log("━".repeat(50));
        
        // 預計的 gas 組成分析
        const baseGas = 30000;
        const perNFTGas = 49200;
        
        console.log("基礎 Gas 消耗:", baseGas);
        console.log("每個 NFT 額外 Gas:", perNFTGas);
        console.log("1 NFT 預計 Gas:", baseGas + perNFTGas);
        console.log("實際失敗交易 Gas: 65,000");
        
        // 分析差異
        const predictedGas = baseGas + perNFTGas;
        const actualGas = 65000;
        const difference = predictedGas - actualGas;
        
        console.log("\\n⚠️ 問題分析:");
        if (difference > 0) {
            console.log(`❌ 預計需要 ${predictedGas} gas，但只有 ${actualGas} gas`);
            console.log(`差異: ${difference} gas (${Math.round(difference/predictedGas*100)}%)`);
        }
        
        console.log("\\n💡 可能的原因:");
        console.log("1. Chainlink VRF 系統限制了實際的 callbackGasLimit");
        console.log("2. 訂閱配置問題");
        console.log("3. 動態計算沒有被正確使用");
        console.log("4. 網路層面的 gas limit 限制");
        
        console.log("\\n🔧 建議解決方案:");
        console.log("1. 檢查 Chainlink VRF 訂閱管理介面的設定");
        console.log("2. 測試直接設定更高的固定 callbackGasLimit");
        console.log("3. 優化回調函數，減少 gas 消耗");
        
    } catch (error) {
        console.error("❌ 分析失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });