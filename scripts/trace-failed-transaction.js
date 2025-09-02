// 追蹤失敗交易的來源
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 追蹤失敗交易來源");
    console.log("==================");
    
    // 失敗交易的具體資訊
    const FAILED_TX_HASH = "0xd4c21493647390a00f9bb71bc17d363bbe8e758ea0281a115a5b4dc82be519a2";
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    const CURRENT_VRF_MANAGER = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    
    // 從交易數據中的資訊
    const SENDER_FROM_TX = "0xa94555C309Dd83d9fB0531852d209c46Fa50637f"; // rcs.sender
    const CALLBACK_GAS_LIMIT = 65000; // rcs.callbackGasLimit
    const SUB_ID = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
    
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    
    try {
        console.log("📋 失敗交易分析:");
        console.log("================");
        console.log("交易哈希:", FAILED_TX_HASH);
        console.log("發送者 (rcs.sender):", SENDER_FROM_TX);
        console.log("Gas Limit:", CALLBACK_GAS_LIMIT);
        console.log("訂閱 ID:", SUB_ID);
        
        // 檢查發送者合約
        console.log("\\n🔍 檢查發送者合約:");
        const senderCode = await provider.getCode(SENDER_FROM_TX);
        console.log("發送者代碼長度:", senderCode.length, "bytes");
        
        if (senderCode === "0x") {
            console.log("❌ 發送者不是合約，可能是 EOA 地址");
        } else {
            console.log("✅ 發送者是合約地址");
            
            // 嘗試識別合約類型
            const contractABI = [
                "function callbackGasLimit() view returns (uint32)",
                "function calculateDynamicGasLimit(address, uint256) view returns (uint32)"
            ];
            
            try {
                const senderContract = await ethers.getContractAt(contractABI, SENDER_FROM_TX);
                const gasLimit = await senderContract.callbackGasLimit();
                console.log("發送者合約的 callbackGasLimit:", gasLimit.toString());
                
                if (gasLimit.toString() === "65000") {
                    console.log("🎯 找到了！這個合約的 gas limit 就是 65000");
                }
            } catch (e) {
                console.log("⚠️ 無法讀取發送者合約的 gas limit:", e.message);
            }
        }
        
        // 檢查是否是我們已知的合約
        console.log("\\n📍 合約地址對比:");
        console.log("================");
        console.log("失敗交易發送者    :", SENDER_FROM_TX);
        console.log("當前 VRF Manager  :", CURRENT_VRF_MANAGER);
        console.log("是否相同          :", SENDER_FROM_TX === CURRENT_VRF_MANAGER ? "✅ 是" : "❌ 否");
        
        if (SENDER_FROM_TX !== CURRENT_VRF_MANAGER) {
            console.log("\\n🔴 重要發現：失敗交易來自不同的合約！");
            console.log("這說明:");
            console.log("1. 可能有舊版本的 VRF Manager 仍在使用");
            console.log("2. 或者其他合約發送了 VRF 請求");
            console.log("3. 這個 65000 gas limit 設定在舊合約中");
        }
        
        // 搜尋可能的舊版本合約
        console.log("\\n🔍 搜尋專案中的 VRF Manager 地址:");
        console.log("================================");
        
        // 檢查環境變數中的地址
        const envVRF = process.env.VITE_VRF_MANAGER_V2PLUS_ADDRESS || "未設定";
        console.log("環境變數 VRF Manager:", envVRF);
        console.log("與失敗交易發送者相同:", envVRF === SENDER_FROM_TX ? "✅ 是" : "❌ 否");
        
    } catch (error) {
        console.error("❌ 追蹤失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });