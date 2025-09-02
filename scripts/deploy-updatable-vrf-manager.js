// 部署可更新動態 Gas 公式的 VRF Manager
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 部署可更新 VRF Manager");
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");
    
    // 檢查當前系統狀態
    console.log("\n📊 當前系統狀態:");
    const DUNGEONCORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    
    const dungeonCoreABI = [
        "function getVRFManager() view returns (address)",
        "function heroContractAddress() view returns (address)",
        "function relicContractAddress() view returns (address)"
    ];
    
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEONCORE_ADDRESS);
    const [currentVRF, heroAddr, relicAddr] = await Promise.all([
        dungeonCore.getVRFManager(),
        dungeonCore.heroContractAddress(),
        dungeonCore.relicContractAddress()
    ]);
    
    console.log("當前 VRF Manager:", currentVRF);
    console.log("Hero 合約:", heroAddr);
    console.log("Relic 合約:", relicAddr);
    
    // 檢查當前 VRF 的 gas 計算
    if (currentVRF !== ethers.ZeroAddress) {
        try {
            const currentVRFContract = await ethers.getContractAt("VRFConsumerV2Plus", currentVRF);
            const [gas1, gas20] = await Promise.all([
                currentVRFContract.calculateDynamicGasLimit(heroAddr, 1),
                currentVRFContract.calculateDynamicGasLimit(heroAddr, 20)
            ]);
            console.log("當前 1 NFT Gas:", gas1.toString());
            console.log("當前 20 NFT Gas:", gas20.toString());
            console.log("20 NFT 不足量:", (1288905 - Number(gas20.toString())), "gas");
        } catch (error) {
            console.log("無法檢查當前 VRF 狀態:", error.message);
        }
    }
    
    console.log("\n🏗️ 部署新的可更新 VRF Manager...");
    
    // 部署新的 VRF Consumer
    const VRFConsumerUpdatable = await ethers.getContractFactory("VRFConsumerV2PlusUpdatable");
    const vrfConsumer = await VRFConsumerUpdatable.deploy();
    await vrfConsumer.waitForDeployment();
    const vrfAddress = await vrfConsumer.getAddress();
    
    console.log("✅ VRFConsumerV2PlusUpdatable 部署完成:", vrfAddress);
    
    // 設置 DungeonCore 連接
    console.log("\n🔗 設置合約連接...");
    const setDungeonCoreTx = await vrfConsumer.setDungeonCore(DUNGEONCORE_ADDRESS);
    await setDungeonCoreTx.wait();
    console.log("✅ DungeonCore 連接設置完成");
    
    // 檢查新合約的默認公式
    console.log("\n📐 新合約的動態公式測試:");
    const [newGas1, newGas10, newGas20] = await Promise.all([
        vrfConsumer.calculateDynamicGasLimit(heroAddr, 1),
        vrfConsumer.calculateDynamicGasLimit(heroAddr, 10),
        vrfConsumer.calculateDynamicGasLimit(heroAddr, 20)
    ]);
    
    console.log("新公式 1 NFT:", newGas1.toString(), "gas");
    console.log("新公式 10 NFT:", newGas10.toString(), "gas");
    console.log("新公式 20 NFT:", newGas20.toString(), "gas");
    console.log("20 NFT 是否充足:", Number(newGas20.toString()) >= 1288905 ? "✅ 是" : "❌ 否");
    
    // 如果默認公式仍不足，進行調整
    if (Number(newGas20.toString()) < 1288905) {
        console.log("\n🔧 默認公式仍不足，進行調整...");
        
        // 計算需要的參數：350000 + quantity * 47000 應該足夠
        // 20 NFT = 350000 + 20 * 47000 = 1,290,000 (略高於需求的 1,288,905)
        const updateTx = await vrfConsumer.updateDynamicGasFormula(
            ethers.ZeroAddress, // 默認公式
            350000,             // baseCost
            47000,              // perNFTCost  
            2500000             // maxGasLimit
        );
        await updateTx.wait();
        
        console.log("✅ 動態公式已調整");
        
        // 重新測試
        const [adjustedGas20] = await Promise.all([
            vrfConsumer.calculateDynamicGasLimit(heroAddr, 20)
        ]);
        console.log("調整後 20 NFT:", adjustedGas20.toString(), "gas");
        console.log("現在是否充足:", Number(adjustedGas20.toString()) >= 1288905 ? "✅ 是" : "❌ 否");
    }
    
    console.log("\n🎯 部署總結:");
    console.log("=".repeat(60));
    console.log("新 VRF Manager 地址:", vrfAddress);
    console.log("特性:");
    console.log("  ✅ 可在部署後調整動態 Gas 公式");
    console.log("  ✅ 支援合約特定的 Gas 策略");
    console.log("  ✅ Gas 使用歷史追蹤與優化");
    console.log("  ✅ 緊急 Gas Override 功能");
    console.log("  ✅ 自動公式優化建議");
    
    console.log("\n📋 後續步驟:");
    console.log("1. 在 Chainlink VRF 訂閱中將新地址添加為消費者");
    console.log("2. 更新 DungeonCore 的 VRF Manager 地址:");
    console.log(`   dungeonCore.setVRFManager("${vrfAddress}")`);
    console.log("3. 授權 Hero 和 Relic 合約 (通過智能授權自動完成)");
    console.log("4. 測試 20 NFT 批次鑄造");
    console.log("5. 如有需要，使用 updateDynamicGasFormula() 進行微調");
    
    console.log("\n💡 管理指令範例:");
    console.log(`// 調整默認公式`);
    console.log(`vrfConsumer.updateDynamicGasFormula(ethers.ZeroAddress, baseCost, perNFTCost, maxGas);`);
    console.log(`// 為特定合約設置公式`);
    console.log(`vrfConsumer.updateDynamicGasFormula("${heroAddr}", baseCost, perNFTCost, maxGas);`);
    console.log(`// 緊急 Gas 覆蓋`);
    console.log(`vrfConsumer.setEmergencyGasOverride(requestId, gasLimit, "reason");`);
    console.log(`// 自動優化公式`);
    console.log(`vrfConsumer.optimizeGasFormula(ethers.ZeroAddress);`);
    
    console.log("\n🎉 部署完成！新 VRF Manager 已具備動態調整能力。");
    
    // 保存部署信息
    const deploymentInfo = {
        contractName: "VRFConsumerV2PlusUpdatable",
        address: vrfAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        features: [
            "Updatable dynamic gas formula",
            "Contract-specific gas strategies", 
            "Gas usage tracking",
            "Emergency gas override",
            "Automatic formula optimization"
        ],
        defaultGasFormula: {
            baseCost: 350000,
            perNFTCost: 47000,
            maxGasLimit: 2500000
        }
    };
    
    console.log("\n💾 部署信息已記錄:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    return vrfAddress;
}

main()
    .then((address) => {
        console.log(`\n🚀 新 VRF Manager 部署成功: ${address}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });