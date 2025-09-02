// 檢查當前 VRF Manager 的 gas limit 設定
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 檢查 VRF Manager Gas Limit 設定");
    console.log("=================================");
    
    const VRF_MANAGER_ADDRESS = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    
    const vrfManagerABI = [
        "function callbackGasLimit() view returns (uint32)",
        "function calculateDynamicGasLimit(address, uint256) view returns (uint32)",
        "function MIN_CALLBACK_GAS_LIMIT() view returns (uint32)",
        "function MAX_CALLBACK_GAS_LIMIT() view returns (uint32)"
    ];
    
    const vrfManager = await ethers.getContractAt(vrfManagerABI, VRF_MANAGER_ADDRESS);
    
    try {
        const currentGasLimit = await vrfManager.callbackGasLimit();
        const minGasLimit = await vrfManager.MIN_CALLBACK_GAS_LIMIT();
        const maxGasLimit = await vrfManager.MAX_CALLBACK_GAS_LIMIT();
        
        console.log("📊 當前設定:");
        console.log("目前的 callbackGasLimit:", currentGasLimit.toString());
        console.log("最小允許值:", minGasLimit.toString());
        console.log("最大允許值:", maxGasLimit.toString());
        
        // 測試動態計算 (1個 NFT)
        const dynamicGas1 = await vrfManager.calculateDynamicGasLimit(
            ethers.ZeroAddress, // placeholder address
            1
        );
        console.log("\n🧮 動態計算測試:");
        console.log("1 個 NFT 計算的 gas:", dynamicGas1.toString());
        
        // 測試動態計算 (10個 NFT)
        const dynamicGas10 = await vrfManager.calculateDynamicGasLimit(
            ethers.ZeroAddress,
            10
        );
        console.log("10 個 NFT 計算的 gas:", dynamicGas10.toString());
        
        // 測試動態計算 (50個 NFT)
        const dynamicGas50 = await vrfManager.calculateDynamicGasLimit(
            ethers.ZeroAddress,
            50
        );
        console.log("50 個 NFT 計算的 gas:", dynamicGas50.toString());
        
        console.log("\n⚠️ 問題分析:");
        if (currentGasLimit < 200000) {
            console.log("❌ callbackGasLimit 設定過低！");
            console.log("建議設定至少 250,000 以上");
        } else {
            console.log("✅ callbackGasLimit 設定看起來合理");
        }
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });