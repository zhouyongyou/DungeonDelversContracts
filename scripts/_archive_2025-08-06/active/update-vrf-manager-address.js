// update-vrf-manager-address.js - 更新所有合約的 VRFManager 地址
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    // 新的 VRFManagerWrapperV2 地址
    const NEW_VRF_MANAGER = '0x113e986F80D3C5f63f321F1dbaDd6cAC6c9DCF90';
    
    console.log("🔧 更新所有合約的 VRFManager 地址...\n");
    console.log("新 VRFManager 地址:", NEW_VRF_MANAGER);

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

    // 設定 VRFManager 的 ABI（注意：函數名是 setVRFManager，不是 setVrfManager）
    const setVrfManagerABI = [
        'function setVRFManager(address _vrfManager) external',
        'function vrfManager() external view returns (address)'
    ];

    try {
        const feeData = await provider.getFeeData();
        const gasOptions = { gasPrice: feeData.gasPrice, gasLimit: 100000 };

        for (const [name, address] of Object.entries(contracts)) {
            console.log(`🔄 更新 ${name} 合約...`);
            console.log(`  地址: ${address}`);
            
            const contract = new ethers.Contract(address, setVrfManagerABI, wallet);
            
            // 檢查當前的 VRFManager
            try {
                const currentVrfManager = await contract.vrfManager();
                console.log(`  當前 VRFManager: ${currentVrfManager}`);
                
                if (currentVrfManager.toLowerCase() === NEW_VRF_MANAGER.toLowerCase()) {
                    console.log(`  ✅ ${name} 已經使用新的 VRFManager\n`);
                    continue;
                }
            } catch (e) {
                console.log(`  ⚠️ 無法讀取當前 VRFManager`);
            }
            
            // 更新 VRFManager
            try {
                console.log(`  🔧 設定新的 VRFManager...`);
                const tx = await contract.setVRFManager(NEW_VRF_MANAGER, gasOptions);
                console.log(`  交易哈希: ${tx.hash}`);
                await tx.wait();
                console.log(`  ✅ ${name} VRFManager 已更新\n`);
            } catch (error) {
                console.log(`  ❌ ${name} 更新失敗:`, error.message, "\n");
            }
        }

        console.log("🎉 所有合約更新完成！");
        
        // 驗證更新結果
        console.log("\n📋 驗證更新結果：");
        for (const [name, address] of Object.entries(contracts)) {
            const contract = new ethers.Contract(address, setVrfManagerABI, provider);
            try {
                const vrfManager = await contract.vrfManager();
                const isCorrect = vrfManager.toLowerCase() === NEW_VRF_MANAGER.toLowerCase();
                console.log(`${name}: ${vrfManager} ${isCorrect ? '✅' : '❌'}`);
            } catch (e) {
                console.log(`${name}: 無法讀取 ❌`);
            }
        }

    } catch (error) {
        console.error("❌ 更新過程中發生錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => {
        console.log("\n✅ VRFManager 地址更新完成！");
        console.log("現在可以測試鑄造功能了。");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });