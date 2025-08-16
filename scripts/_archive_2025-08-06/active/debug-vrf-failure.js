// debug-vrf-failure.js - 調試 VRF 鑄造失敗問題
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔍 調試 VRF 鑄造失敗問題...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("調試者地址:", wallet.address);
    
    // 合約地址
    const addresses = {
        VRFMANAGER: '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD',
        HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af'  // 從交易中獲取
    };

    try {
        // VRFManager ABI
        const vrfManagerABI = [
            'function s_requestCount() external view returns (uint256)',
            'function s_requests(uint256) external view returns (bool fulfilled, address requester, uint256[] randomWords)',
            'function COORDINATOR() external view returns (address)',
            'function s_keyHash() external view returns (bytes32)',
            'function s_callbackGasLimit() external view returns (uint32)',
            'function s_requestConfirmations() external view returns (uint16)',
            'function s_subscriptionId() external view returns (uint64)',
            'function owner() external view returns (address)',
            'function paused() external view returns (bool)'
        ];
        
        // Hero ABI  
        const heroABI = [
            'function vrfManager() external view returns (address)',
            'function platformFeeRate() external view returns (uint256)',
            'function platformFeeReceiver() external view returns (address)',
            'function paused() external view returns (bool)'
        ];

        console.log("🔧 檢查 VRFManager 狀態...");
        const vrfManager = new ethers.Contract(addresses.VRFMANAGER, vrfManagerABI, provider);
        
        const coordinator = await vrfManager.COORDINATOR();
        const keyHash = await vrfManager.s_keyHash();
        const callbackGasLimit = await vrfManager.s_callbackGasLimit();
        const requestConfirmations = await vrfManager.s_requestConfirmations();
        const subscriptionId = await vrfManager.s_subscriptionId();
        const vrfOwner = await vrfManager.owner();
        const vrfPaused = await vrfManager.paused();
        const requestCount = await vrfManager.s_requestCount();

        console.log("VRFManager 配置:");
        console.log("  Coordinator:", coordinator);
        console.log("  KeyHash:", keyHash);
        console.log("  CallbackGasLimit:", callbackGasLimit.toString());
        console.log("  RequestConfirmations:", requestConfirmations.toString());
        console.log("  SubscriptionId:", subscriptionId.toString());
        console.log("  Owner:", vrfOwner);
        console.log("  Paused:", vrfPaused);
        console.log("  RequestCount:", requestCount.toString());

        console.log("\n🔧 檢查 Hero 合約狀態...");
        const hero = new ethers.Contract(addresses.HERO, heroABI, provider);
        
        const heroVrfManager = await hero.vrfManager();
        const platformFeeRate = await hero.platformFeeRate();
        const platformFeeReceiver = await hero.platformFeeReceiver();
        const heroPaused = await hero.paused();

        console.log("Hero 合約配置:");
        console.log("  VRFManager:", heroVrfManager);
        console.log("  PlatformFeeRate:", platformFeeRate.toString());
        console.log("  PlatformFeeReceiver:", platformFeeReceiver);
        console.log("  Paused:", heroPaused);

        console.log("\n🚨 潛在問題檢查:");
        
        // 檢查地址匹配
        if (heroVrfManager.toLowerCase() !== addresses.VRFMANAGER.toLowerCase()) {
            console.log("❌ Hero 合約中的 VRFManager 地址不匹配!");
            console.log(`   Hero: ${heroVrfManager}`);
            console.log(`   實際: ${addresses.VRFMANAGER}`);
        } else {
            console.log("✅ Hero 合約中的 VRFManager 地址正確");
        }

        // 檢查暫停狀態
        if (vrfPaused) {
            console.log("❌ VRFManager 已暫停!");
        } else {
            console.log("✅ VRFManager 未暫停");
        }

        if (heroPaused) {
            console.log("❌ Hero 合約已暫停!");
        } else {
            console.log("✅ Hero 合約未暫停");
        }

        // 檢查 Subscription ID
        if (subscriptionId.toString() === '0') {
            console.log("❌ VRF Subscription ID 未設定!");
        } else {
            console.log("✅ VRF Subscription ID 已設定:", subscriptionId.toString());
        }

        // 檢查失敗的交易
        console.log("\n🔍 分析失敗交易：");
        const failedTxHash = "0xf7a713bf6135ef23c67a862a30d64b4921047b22531019053388ab97b979e80b";
        try {
            const receipt = await provider.getTransactionReceipt(failedTxHash);
            console.log("交易狀態:", receipt.status === 1 ? "成功" : "失敗");
            console.log("Gas 使用:", receipt.gasUsed.toString());
            console.log("事件數量:", receipt.logs.length);
            
            // 嘗試解析失敗原因
            if (receipt.status === 0) {
                try {
                    const tx = await provider.getTransaction(failedTxHash);
                    const result = await provider.call(tx, tx.blockNumber);
                    console.log("失敗原因:", result);
                } catch (callError) {
                    console.log("無法獲取詳細失敗原因:", callError.message);
                }
            }
        } catch (txError) {
            console.log("獲取交易詳情失敗:", txError.message);
        }

    } catch (error) {
        console.error("❌ 調試過程中發生錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });