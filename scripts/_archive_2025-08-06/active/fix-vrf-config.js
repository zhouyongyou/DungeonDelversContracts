// fix-vrf-config.js - 修復 VRFManager 配置以匹配 Chainlink Direct Funding
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔧 修復 VRFManager 配置以匹配 Chainlink Direct Funding...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("操作者地址:", wallet.address);
    
    // 合約地址
    const VRFMANAGER = '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD';
    
    // Chainlink 官方配置 (BSC Mainnet)
    const CHAINLINK_CONFIG = {
        VRF_COORDINATOR: '0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9',
        VRF_WRAPPER: '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94',
        KEY_HASH_500_GWEI: '0xeb0f72532fed5c94b4caf7b49caf454b35a729608a441101b9269efb7efe2c6c',
        // Gas 配置
        WRAPPER_GAS_OVERHEAD: 13400,
        COORDINATOR_GAS_OVERHEAD_NATIVE: 99500,
        COORDINATOR_GAS_OVERHEAD_PER_WORD: 435,
        MIN_CONFIRMATIONS: 3,
        MAX_CONFIRMATIONS: 200
    };

    try {
        const feeData = await provider.getFeeData();
        const gasOptions = { gasPrice: feeData.gasPrice, gasLimit: 300000 };

        // VRFManager 配置 ABI
        const vrfManagerABI = [
            'function owner() external view returns (address)',
            'function keyHash() external view returns (bytes32)',
            'function callbackGasLimit() external view returns (uint32)',
            'function requestConfirmations() external view returns (uint16)',
            'function setKeyHash(bytes32 _keyHash) external',
            'function setCallbackGasLimit(uint32 _limit) external',
            'function setRequestConfirmations(uint16 _confirmations) external'
        ];
        
        const vrfManager = new ethers.Contract(VRFMANAGER, vrfManagerABI, wallet);

        console.log("🔍 檢查當前配置...");
        
        // 檢查當前配置
        let currentKeyHash, currentGasLimit, currentConfirmations;
        
        try {
            currentKeyHash = await vrfManager.keyHash();
            console.log("當前 Key Hash:", currentKeyHash);
        } catch (e) {
            console.log("⚠️ 無法獲取當前 Key Hash");
        }
        
        try {
            currentGasLimit = await vrfManager.callbackGasLimit();
            console.log("當前 Callback Gas Limit:", currentGasLimit.toString());
        } catch (e) {
            console.log("⚠️ 無法獲取當前 Gas Limit");
        }
        
        try {
            currentConfirmations = await vrfManager.requestConfirmations();
            console.log("當前 Request Confirmations:", currentConfirmations.toString());
        } catch (e) {
            console.log("⚠️ 無法獲取當前 Confirmations");
        }

        console.log("\n🔧 更新配置...");
        
        // 1. 更新 Key Hash
        if (currentKeyHash !== CHAINLINK_CONFIG.KEY_HASH_500_GWEI) {
            console.log("更新 Key Hash 為 500 gwei 版本...");
            try {
                let tx = await vrfManager.setKeyHash(CHAINLINK_CONFIG.KEY_HASH_500_GWEI, gasOptions);
                await tx.wait();
                console.log("✅ Key Hash 已更新");
            } catch (e) {
                console.log("❌ Key Hash 更新失敗:", e.message);
            }
        } else {
            console.log("✅ Key Hash 已正確");
        }

        // 2. 更新 Callback Gas Limit
        // 計算合理的 gas limit：基礎開銷 + 每個隨機數的開銷
        const recommendedGasLimit = CHAINLINK_CONFIG.COORDINATOR_GAS_OVERHEAD_NATIVE + 
                                   (CHAINLINK_CONFIG.COORDINATOR_GAS_OVERHEAD_PER_WORD * 10) + // 最多 10 個隨機數
                                   100000; // 額外緩衝
        
        if (!currentGasLimit || currentGasLimit < recommendedGasLimit) {
            console.log(`更新 Callback Gas Limit 為 ${recommendedGasLimit}...`);
            try {
                let tx = await vrfManager.setCallbackGasLimit(recommendedGasLimit, gasOptions);
                await tx.wait();
                console.log("✅ Callback Gas Limit 已更新");
            } catch (e) {
                console.log("❌ Callback Gas Limit 更新失敗:", e.message);
            }
        } else {
            console.log("✅ Callback Gas Limit 已足夠");
        }

        // 3. 更新 Request Confirmations
        if (!currentConfirmations || currentConfirmations !== CHAINLINK_CONFIG.MIN_CONFIRMATIONS) {
            console.log(`更新 Request Confirmations 為 ${CHAINLINK_CONFIG.MIN_CONFIRMATIONS}...`);
            try {
                let tx = await vrfManager.setRequestConfirmations(CHAINLINK_CONFIG.MIN_CONFIRMATIONS, gasOptions);
                await tx.wait();
                console.log("✅ Request Confirmations 已更新");
            } catch (e) {
                console.log("❌ Request Confirmations 更新失敗:", e.message);
            }
        } else {
            console.log("✅ Request Confirmations 已正確");
        }

        console.log("\n🎉 VRFManager 配置修復完成！");

        // 最終配置驗證
        console.log("\n📋 最終配置驗證：");
        try {
            console.log("Key Hash:", await vrfManager.keyHash());
            console.log("Callback Gas Limit:", (await vrfManager.callbackGasLimit()).toString());
            console.log("Request Confirmations:", (await vrfManager.requestConfirmations()).toString());
        } catch (e) {
            console.log("驗證時出錯:", e.message);
        }

        console.log("\n⚠️ 重要提醒：");
        console.log("1. VRFManager 應該使用 Direct Funding 模式");
        console.log("2. 每次請求需要發送足夠的 BNB 作為 VRF 費用");
        console.log("3. 如果持續失敗，可能需要考慮使用 VRF Wrapper 合約");
        
    } catch (error) {
        console.error("❌ 修復過程中發生錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });