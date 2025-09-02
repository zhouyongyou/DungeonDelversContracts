// 修正 VRF Manager 的 gas limit 設定
const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 修正 VRF Manager Gas Limit");
    console.log("=============================");
    
    const VRF_MANAGER_ADDRESS = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    
    const vrfManagerABI = [
        "function callbackGasLimit() view returns (uint32)",
        "function setCallbackGasLimit(uint32) external",
        "function owner() view returns (address)"
    ];
    
    const [deployer] = await ethers.getSigners();
    console.log("操作者地址:", deployer.address);
    
    const vrfManager = await ethers.getContractAt(vrfManagerABI, VRF_MANAGER_ADDRESS);
    
    try {
        // 檢查當前設定
        const currentGasLimit = await vrfManager.callbackGasLimit();
        console.log("目前的 callbackGasLimit:", currentGasLimit.toString());
        
        // 檢查 owner
        const owner = await vrfManager.owner();
        console.log("合約 Owner:", owner);
        console.log("當前操作者:", deployer.address);
        
        // 設定新的 gas limit - 基於實際需求分析
        // 從失敗交易看到需要 186,084 gas，設定 300,000 作為安全值
        const NEW_GAS_LIMIT = 300000;
        console.log("\n🔄 設定新的 gas limit:", NEW_GAS_LIMIT);
        
        const tx = await vrfManager.setCallbackGasLimit(NEW_GAS_LIMIT);
        console.log("交易已發送:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ 交易確認，區塊:", receipt.blockNumber);
        
        // 驗證設定
        const newGasLimit = await vrfManager.callbackGasLimit();
        console.log("✅ 新的 callbackGasLimit:", newGasLimit.toString());
        
        console.log("\n📊 設定完成總結:");
        console.log("- 舊值:", currentGasLimit.toString());
        console.log("- 新值:", newGasLimit.toString());
        console.log("- 增加:", (newGasLimit - currentGasLimit).toString());
        
    } catch (error) {
        console.error("❌ 操作失敗:", error.message);
        
        if (error.message.includes("Ownable")) {
            console.log("\n💡 可能的解決方案:");
            console.log("1. 確認使用正確的 owner 私鑰");
            console.log("2. 檢查合約的 owner 地址");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });