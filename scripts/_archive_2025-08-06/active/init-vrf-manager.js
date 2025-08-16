// init-vrf-manager.js - 初始化 VRFManager 合約
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔧 初始化 VRFManager 合約...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("操作者地址:", wallet.address);
    
    // 合約地址
    const VRFMANAGER = '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD';
    const HERO = '0xD48867dbac5f1c1351421726B6544f847D9486af';

    try {
        const feeData = await provider.getFeeData();
        const gasOptions = { gasPrice: feeData.gasPrice, gasLimit: 200000 };

        // VRFManager 完整 ABI
        const vrfManagerABI = [
            'function owner() external view returns (address)',
            'function authorizedContracts(address) external view returns (bool)',
            'function setAuthorizedContract(address _contract, bool _authorized) external',
            'function vrfRequestPrice() external view returns (uint256)',
            'function setVrfRequestPrice(uint256 _price) external'
        ];
        
        const vrfManager = new ethers.Contract(VRFMANAGER, vrfManagerABI, wallet);

        console.log("🔍 檢查當前狀態...");
        
        // 檢查授權狀態
        const isHeroAuthorized = await vrfManager.authorizedContracts(HERO);
        console.log("Hero 合約授權狀態:", isHeroAuthorized);
        
        // 檢查 VRF 價格
        try {
            const vrfPrice = await vrfManager.vrfRequestPrice();
            console.log("VRF 請求價格:", ethers.formatEther(vrfPrice), "BNB");
        } catch (e) {
            console.log("❌ 無法獲取 VRF 價格:", e.message);
        }

        // 1. 授權 Hero 合約
        if (!isHeroAuthorized) {
            console.log("\n🔧 授權 Hero 合約...");
            let tx = await vrfManager.setAuthorizedContract(HERO, true, gasOptions);
            await tx.wait();
            console.log("✅ Hero 合約已授權");
        } else {
            console.log("✅ Hero 合約已授權");
        }

        // 2. 設定 VRF 價格（如果需要）
        try {
            const currentPrice = await vrfManager.vrfRequestPrice();
            const targetPrice = ethers.parseEther("0.005");
            
            if (currentPrice !== targetPrice) {
                console.log("\n🔧 設定 VRF 價格...");
                let tx = await vrfManager.setVrfRequestPrice(targetPrice, gasOptions);
                await tx.wait();
                console.log("✅ VRF 價格已設定為 0.005 BNB");
            } else {
                console.log("✅ VRF 價格已正確設定");
            }
        } catch (e) {
            console.log("⚠️  VRF 價格設定問題:", e.message);
        }

        // 3. 檢查其他需要授權的合約地址
        const otherContracts = {
            RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
            ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
            DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253'
        };

        console.log("\n🔧 檢查並授權其他合約...");
        for (const [name, address] of Object.entries(otherContracts)) {
            try {
                const isAuthorized = await vrfManager.authorizedContracts(address);
                if (!isAuthorized) {
                    console.log(`授權 ${name} 合約: ${address}`);
                    let tx = await vrfManager.setAuthorizedContract(address, true, gasOptions);
                    await tx.wait();
                    console.log(`✅ ${name} 合約已授權`);
                } else {
                    console.log(`✅ ${name} 合約已授權`);
                }
            } catch (e) {
                console.log(`❌ ${name} 授權失敗:`, e.message);
            }
        }

        console.log("\n🎉 VRFManager 初始化完成！");

        // 最終狀態驗證
        console.log("\n📋 最終狀態驗證：");
        console.log("Hero 授權狀態:", await vrfManager.authorizedContracts(HERO));
        
    } catch (error) {
        console.error("❌ 初始化過程中發生錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });