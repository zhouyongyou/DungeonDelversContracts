// 分析舊 VRF Manager 的邏輯差異
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 分析舊 VRF Manager 邏輯");
    console.log("=========================");
    
    const OLD_VRF_MANAGER = "0xa94555C309Dd83d9fB0531852d209c46Fa50637f";
    const CURRENT_VRF_MANAGER = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    const HERO_ADDRESS = "0x27E3A73a4d7DDD8Dea6cBF9e152173CcC04b7505";
    
    const vrfABI = [
        "function callbackGasLimit() view returns (uint32)",
        "function calculateDynamicGasLimit(address, uint256) view returns (uint32)",
        "function MIN_CALLBACK_GAS_LIMIT() view returns (uint32)",
        "function MAX_CALLBACK_GAS_LIMIT() view returns (uint32)",
        "function s_subscriptionId() view returns (uint256)",
        "function keyHash() view returns (bytes32)",
        "function requestConfirmations() view returns (uint16)"
    ];
    
    const oldVRF = await ethers.getContractAt(vrfABI, OLD_VRF_MANAGER);
    const currentVRF = await ethers.getContractAt(vrfABI, CURRENT_VRF_MANAGER);
    
    try {
        console.log("📊 兩個合約的詳細對比:");
        console.log("====================");
        
        // 基本設定對比
        console.log("\\n🔧 基本設定:");
        
        const oldGasLimit = await oldVRF.callbackGasLimit();
        const currentGasLimit = await currentVRF.callbackGasLimit();
        console.log("callbackGasLimit    :");
        console.log("  舊合約:", oldGasLimit.toString());
        console.log("  新合約:", currentGasLimit.toString());
        console.log("  相同:", oldGasLimit.toString() === currentGasLimit.toString() ? "✅" : "❌");
        
        const oldSubscription = await oldVRF.s_subscriptionId();
        const currentSubscription = await currentVRF.s_subscriptionId();
        console.log("\\ns_subscriptionId    :");
        console.log("  舊合約:", oldSubscription.toString());
        console.log("  新合約:", currentSubscription.toString());
        console.log("  相同:", oldSubscription.toString() === currentSubscription.toString() ? "✅" : "❌");
        
        // 動態計算對比
        console.log("\\n🧮 動態 Gas 計算對比:");
        console.log("====================");
        
        const testQuantities = [1, 5, 10];
        
        for (const quantity of testQuantities) {
            console.log(`\\n${quantity} NFT(s):`);
            
            try {
                const oldDynamic = await oldVRF.calculateDynamicGasLimit(HERO_ADDRESS, quantity);
                console.log("  舊合約:", oldDynamic.toString());
            } catch (e) {
                console.log("  舊合約: 讀取失敗 -", e.message);
            }
            
            try {
                const currentDynamic = await currentVRF.calculateDynamicGasLimit(HERO_ADDRESS, quantity);
                console.log("  新合約:", currentDynamic.toString());
            } catch (e) {
                console.log("  新合約: 讀取失敗 -", e.message);
            }
        }
        
        // 檢查是否有其他可能影響 gas 的函數
        console.log("\\n🔍 檢查其他可能的 Gas 設定:");
        console.log("===========================");
        
        // 嘗試檢查一些可能存在的特殊函數
        const specialABI = [
            "function getCallbackGasLimit() view returns (uint32)",
            "function defaultCallbackGasLimit() view returns (uint32)", 
            "function baseCallbackGasLimit() view returns (uint32)"
        ];
        
        for (const functionSig of specialABI) {
            try {
                const specialContract = await ethers.getContractAt([functionSig], OLD_VRF_MANAGER);
                const functionName = functionSig.split('(')[0].replace('function ', '');
                const result = await specialContract[functionName]();
                console.log(`${functionName}():`, result.toString());
                
                if (result.toString() === "65000") {
                    console.log("🎯 找到了！這個函數返回 65000");
                }
            } catch (e) {
                // 函數不存在，忽略
            }
        }
        
        console.log("\\n⚠️ 關鍵問題分析:");
        console.log("================");
        console.log("失敗交易顯示的 callbackGasLimit = 65000");
        console.log("但舊合約讀取的 callbackGasLimit =", oldGasLimit.toString());
        console.log("\\n可能的解釋:");
        console.log("1. 舊合約的動態計算邏輯返回了 65000");
        console.log("2. 舊合約在發送 VRF 請求時使用了硬編碼的 65000");
        console.log("3. 有其他邏輯覆蓋了動態計算結果");
        
        console.log("\\n💡 建議措施:");
        console.log("============");
        console.log("1. 檢查 DungeonCore 是否仍指向舊 VRF Manager");
        console.log("2. 確保所有合約都使用新的 VRF Manager");
        console.log("3. 清理舊的 VRF 請求或等待其過期");
        
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