// 深度調試已部署的 VRF 合約
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 調試已部署的 VRF 合約");
    console.log("========================");
    
    const VRF_MANAGER_ADDRESS = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    const HERO_ADDRESS = "0x27E3A73a4d7DDD8Dea6cBF9e152173CcC04b7505";
    
    try {
        // 1. 檢查合約基本資訊
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
        const code = await provider.getCode(VRF_MANAGER_ADDRESS);
        console.log("合約代碼長度:", code.length, "bytes");
        
        // 2. 嘗試讀取合約的所有公開函數
        const vrfManagerABI = [
            "function callbackGasLimit() view returns (uint32)",
            "function MIN_CALLBACK_GAS_LIMIT() view returns (uint32)",
            "function MAX_CALLBACK_GAS_LIMIT() view returns (uint32)",
            "function calculateDynamicGasLimit(address, uint256) view returns (uint32)",
            "function s_subscriptionId() view returns (uint256)",
            "function keyHash() view returns (bytes32)",
            "function requestConfirmations() view returns (uint16)"
        ];
        
        const vrfManager = await ethers.getContractAt(vrfManagerABI, VRF_MANAGER_ADDRESS);
        
        console.log("\\n📊 當前合約設定:");
        console.log("================");
        
        const callbackGasLimit = await vrfManager.callbackGasLimit();
        console.log("callbackGasLimit:", callbackGasLimit.toString());
        
        const minGasLimit = await vrfManager.MIN_CALLBACK_GAS_LIMIT();
        console.log("MIN_CALLBACK_GAS_LIMIT:", minGasLimit.toString());
        
        const maxGasLimit = await vrfManager.MAX_CALLBACK_GAS_LIMIT();
        console.log("MAX_CALLBACK_GAS_LIMIT:", maxGasLimit.toString());
        
        const subscriptionId = await vrfManager.s_subscriptionId();
        console.log("s_subscriptionId:", subscriptionId.toString());
        
        try {
            const keyHash = await vrfManager.keyHash();
            console.log("keyHash:", keyHash);
        } catch (e) {
            console.log("keyHash: 無法讀取");
        }
        
        try {
            const confirmations = await vrfManager.requestConfirmations();
            console.log("requestConfirmations:", confirmations.toString());
        } catch (e) {
            console.log("requestConfirmations: 無法讀取");
        }
        
        // 3. 測試動態 gas 計算
        console.log("\\n🧮 動態 Gas 計算測試:");
        console.log("====================");
        
        try {
            const gas1 = await vrfManager.calculateDynamicGasLimit(HERO_ADDRESS, 1);
            console.log("Hero 1 NFT gas:", gas1.toString());
            
            const gas5 = await vrfManager.calculateDynamicGasLimit(HERO_ADDRESS, 5);
            console.log("Hero 5 NFT gas:", gas5.toString());
            
            const gas10 = await vrfManager.calculateDynamicGasLimit(HERO_ADDRESS, 10);
            console.log("Hero 10 NFT gas:", gas10.toString());
            
        } catch (gasError) {
            console.log("❌ 動態計算失敗:", gasError.message);
        }
        
        // 4. 檢查是否有其他影響 gas limit 的函數
        console.log("\\n🔍 檢查可能的 Gas Limit 覆蓋:");
        console.log("==============================");
        
        // 嘗試調用一些可能存在的管理函數
        const managementABI = [
            "function owner() view returns (address)",
            "function paused() view returns (bool)"
        ];
        
        try {
            const managementContract = await ethers.getContractAt(managementABI, VRF_MANAGER_ADDRESS);
            const owner = await managementContract.owner();
            console.log("合約 Owner:", owner);
            
            try {
                const paused = await managementContract.paused();
                console.log("暫停狀態:", paused);
            } catch (e) {
                console.log("暫停狀態: 無法讀取");
            }
        } catch (ownerError) {
            console.log("Owner: 無法讀取");
        }
        
        console.log("\\n⚠️ 關鍵問題分析:");
        console.log("================");
        console.log("🔴 交易中顯示 callbackGasLimit = 65000");
        console.log("🔵 合約中讀取 callbackGasLimit =", callbackGasLimit.toString());
        
        if (callbackGasLimit.toString() !== "65000") {
            console.log("\\n❗ 發現不一致！");
            console.log("這表示問題可能在於:");
            console.log("1. 實際調用時使用的是不同的參數");
            console.log("2. 有其他邏輯覆蓋了動態計算");
            console.log("3. Chainlink VRF 系統內部限制");
        }
        
    } catch (error) {
        console.error("❌ 調試失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });