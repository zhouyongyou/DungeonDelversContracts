const hre = require("hardhat");

async function main() {
    console.log("🔄 更新 VRF 連接...");
    
    // 新的 VRF Manager 地址（部署後替換）
    const NEW_VRF_MANAGER = "0x... // 替換為新部署的地址";
    
    // 需要更新的合約
    const contracts = {
        Hero: "0x3b4e5667CF5Bdc1eF6a6494Bf5A96bB97ea9D8fc",
        Relic: "0x982e25B5B13DC95eFEbCCA5B037e37fD3AF26f68",
        AltarOfAscension: "0x0DD4C719985EB19b087db7A0Efcc2036Dd387EE5",
        DungeonMaster: "0x7CA9C616c08E0e96Bd30Bb8eF256aB10e936F0aD"
    };
    
    console.log("\n📋 授權合約到新 VRF Manager:");
    
    const vrfManager = await hre.ethers.getContractAt(
        "VRFConsumerV2Plus_Optimized",
        NEW_VRF_MANAGER
    );
    
    for (const [name, address] of Object.entries(contracts)) {
        try {
            console.log(`\n${name}:`);
            
            // 1. 授權合約使用 VRF
            await vrfManager.setAuthorizedContract(address, true);
            console.log("  ✅ 已授權到 VRF Manager");
            
            // 2. 更新合約中的 VRF Manager 地址
            const contract = await hre.ethers.getContractAt(name, address);
            
            // 檢查是否有 setVrfManager 函數
            if (contract.setVrfManager) {
                await contract.setVrfManager(NEW_VRF_MANAGER);
                console.log("  ✅ 已更新 VRF Manager 地址");
            } else if (contract.setVRFManager) {
                await contract.setVRFManager(NEW_VRF_MANAGER);
                console.log("  ✅ 已更新 VRF Manager 地址");
            } else {
                console.log("  ⚠️ 合約沒有 setVrfManager 函數");
            }
            
        } catch (error) {
            console.log(`  ❌ 錯誤: ${error.message}`);
        }
    }
    
    console.log("\n✅ 更新完成！");
    console.log("\n⚠️ 記得:");
    console.log("1. 在 VRF 訂閱頁面添加新合約地址為消費者");
    console.log("2. 測試鑄造功能確保 VRF 正常工作");
    console.log("3. 移除舊 VRF Manager 的消費者權限");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });