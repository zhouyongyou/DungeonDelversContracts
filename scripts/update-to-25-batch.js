const hre = require("hardhat");

async function main() {
    console.log("🔄 更新批量鑄造限制到 25...");
    
    // 合約地址
    const contracts = {
        VRFConsumerV2Plus: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
        Hero: "0x3b4e5667CF5Bdc1eF6a6494Bf5A96bB97ea9D8fc",
        Relic: "0x982e25B5B13DC95eFEbCCA5B037e37fD3AF26f68"
    };
    
    console.log("\n⚠️ 警告：此操作將：");
    console.log("1. 設置 callbackGasLimit = 2,500,000");
    console.log("2. 每批次成本增加到 0.015 LINK");
    console.log("3. 需要確保訂閱有足夠 LINK 餘額");
    
    // 更新 VRF Manager 的 gas limit
    console.log("\n📋 更新 VRF Manager...");
    const vrfManager = await hre.ethers.getContractAt(
        "VRFConsumerV2Plus",
        contracts.VRFConsumerV2Plus
    );
    
    // 檢查是否有 setVRFParams 函數
    try {
        const currentGasLimit = await vrfManager.callbackGasLimit();
        console.log("當前 Gas Limit:", currentGasLimit.toString());
        
        // 設置新參數
        const keyHash = "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4";
        const newGasLimit = 2500000;
        const confirmations = 3;
        const numWords = 1;
        
        const tx = await vrfManager.setVRFParams(
            keyHash,
            newGasLimit,
            confirmations,
            numWords
        );
        await tx.wait();
        
        console.log("✅ Gas Limit 更新為:", newGasLimit);
        
    } catch (error) {
        console.log("❌ 無法更新 VRF 參數，可能需要重新部署");
        console.log("錯誤:", error.message);
    }
    
    // 注意：Hero 和 Relic 的限制寫死在合約中，無法動態修改
    console.log("\n⚠️ 注意事項：");
    console.log("1. Hero/Relic 合約的 50 個限制無法修改（需要重新部署）");
    console.log("2. 建議只在前端限制為 25 個");
    console.log("3. 或部署新版本合約");
    
    console.log("\n📊 成本預估：");
    console.log("- 5 個 NFT: 0.003 LINK ($0.021)");
    console.log("- 10 個 NFT: 0.006 LINK ($0.042)");
    console.log("- 25 個 NFT: 0.015 LINK ($0.105)");
    
    console.log("\n✅ 更新完成！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });