// update-vrf-to-v2plus.js - 更新所有合約到 VRFManagerV2Plus
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    // 新的 VRFManagerV2Plus 地址
    const NEW_VRF_MANAGER = process.argv[2] || '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
    
    console.log("🔧 更新所有合約到 VRFManagerV2Plus...\n");
    console.log("新 VRFManagerV2Plus 地址:", NEW_VRF_MANAGER);
    console.log("=".repeat(60));

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("操作者地址:", wallet.address, "\n");
    
    // 需要更新的合約
    const contracts = {
        HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
        RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
        ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
        DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253'
    };

    // 設定 VRFManager 的 ABI（注意：函數名是 setVRFManager）
    const setVrfManagerABI = [
        'function setVRFManager(address _vrfManager) external',
        'function vrfManager() external view returns (address)'
    ];

    try {
        const feeData = await provider.getFeeData();
        const gasOptions = { gasPrice: feeData.gasPrice, gasLimit: 100000 };

        console.log("📝 開始更新合約...\n");
        const updateResults = [];

        for (const [name, address] of Object.entries(contracts)) {
            console.log(`🔄 更新 ${name} 合約...`);
            console.log(`  地址: ${address}`);
            
            const contract = new ethers.Contract(address, setVrfManagerABI, wallet);
            
            // 檢查當前的 VRFManager
            let currentVrfManager;
            try {
                currentVrfManager = await contract.vrfManager();
                console.log(`  當前 VRFManager: ${currentVrfManager}`);
                
                if (currentVrfManager.toLowerCase() === NEW_VRF_MANAGER.toLowerCase()) {
                    console.log(`  ✅ ${name} 已經使用新的 VRFManagerV2Plus\n`);
                    updateResults.push({ name, status: 'already_updated', address: currentVrfManager });
                    continue;
                }
            } catch (e) {
                console.log(`  ⚠️ 無法讀取當前 VRFManager`);
                currentVrfManager = 'unknown';
            }
            
            // 更新 VRFManager
            try {
                console.log(`  🔧 設定新的 VRFManagerV2Plus...`);
                const tx = await contract.setVRFManager(NEW_VRF_MANAGER, gasOptions);
                console.log(`  交易哈希: ${tx.hash}`);
                await tx.wait();
                console.log(`  ✅ ${name} VRFManager 已更新\n`);
                updateResults.push({ 
                    name, 
                    status: 'updated', 
                    oldAddress: currentVrfManager,
                    newAddress: NEW_VRF_MANAGER,
                    txHash: tx.hash 
                });
            } catch (error) {
                console.log(`  ❌ ${name} 更新失敗:`, error.message, "\n");
                updateResults.push({ name, status: 'failed', error: error.message });
            }
        }

        console.log("=".repeat(60));
        console.log("📋 更新總結");
        console.log("=".repeat(60));
        
        // 驗證更新結果
        console.log("\n🔍 驗證最終狀態：\n");
        for (const [name, address] of Object.entries(contracts)) {
            const contract = new ethers.Contract(address, setVrfManagerABI, provider);
            try {
                const vrfManager = await contract.vrfManager();
                const isCorrect = vrfManager.toLowerCase() === NEW_VRF_MANAGER.toLowerCase();
                console.log(`${name.padEnd(20)} ${vrfManager} ${isCorrect ? '✅' : '❌'}`);
            } catch (e) {
                console.log(`${name.padEnd(20)} 無法讀取 ❌`);
            }
        }
        
        // 顯示歷史 VRFManager 版本
        console.log("\n📚 VRFManager 版本歷史：");
        console.log("=".repeat(60));
        console.log("1. VRFManager (原始版本)");
        console.log("   地址: 0xD062785C376560A392e1a5F1b25ffb35dB5b67bD");
        console.log("   狀態: ❌ 錯誤實現 - 直接調用 Coordinator");
        console.log("\n2. VRFManagerWrapperV2");
        console.log("   地址: 0x113e986F80D3C5f63f321F1dbaDd6cAC6c9DCF90");
        console.log("   狀態: ⚠️ 可用但介面不完整");
        console.log("\n3. VRFManagerV2Plus (當前版本)");
        console.log(`   地址: ${NEW_VRF_MANAGER}`);
        console.log("   狀態: ✅ 完整實現 - 符合 Chainlink VRF V2.5 標準");
        console.log("=".repeat(60));

    } catch (error) {
        console.error("❌ 更新過程中發生錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => {
        console.log("\n✅ VRFManagerV2Plus 更新完成！");
        console.log("\n🎯 現在可以進行以下操作：");
        console.log("1. 測試鑄造功能 - 前端應該能正常鑄造 NFT");
        console.log("2. 監控 VRF 回調 - 確認隨機數正確生成");
        console.log("3. 驗證合約 - 在 BSCScan 上驗證新合約");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });