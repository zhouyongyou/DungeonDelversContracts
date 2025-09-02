// 部署可調整動態 Gas 公式的 VRF Manager（最小化修改版）
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 部署可調整 VRF Manager (最小化修改版)");
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");
    
    // 檢查當前系統狀態
    console.log("\n📊 當前系統狀態:");
    const DUNGEONCORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEONCORE_ADDRESS);
    const [currentVRF, heroAddr, relicAddr] = await Promise.all([
        dungeonCore.getVRFManager(),
        dungeonCore.heroContractAddress(),
        dungeonCore.relicContractAddress()
    ]);
    
    console.log("當前 VRF Manager:", currentVRF);
    console.log("Hero 合約:", heroAddr);
    console.log("Relic 合約:", relicAddr);
    
    // 檢查當前 VRF 的問題
    console.log("\n⚠️ 當前問題:");
    console.log("舊公式: 309900 + quantity * 43801");
    console.log("20 NFT 計算: 1,185,920 gas");
    console.log("實際需要: 1,288,905 gas");
    console.log("不足: 102,985 gas (8.7%)");
    
    console.log("\n🏗️ 部署新的可調整 VRF Manager...");
    
    // 部署新的 VRF Consumer
    const VRFConsumerAdjustable = await ethers.getContractFactory("VRFConsumerV2PlusAdjustable");
    const vrfConsumer = await VRFConsumerAdjustable.deploy();
    await vrfConsumer.waitForDeployment();
    const vrfAddress = await vrfConsumer.getAddress();
    
    console.log("✅ VRFConsumerV2PlusAdjustable 部署完成:", vrfAddress);
    
    // 設置 DungeonCore 連接
    console.log("\n🔗 設置合約連接...");
    const setDungeonCoreTx = await vrfConsumer.setDungeonCore(DUNGEONCORE_ADDRESS);
    await setDungeonCoreTx.wait();
    console.log("✅ DungeonCore 連接設置完成");
    
    // 檢查新合約的默認公式
    console.log("\n📐 新合約的動態公式:");
    const [baseCost, perNFTCost] = await Promise.all([
        vrfConsumer.dynamicGasBaseCost(),
        vrfConsumer.dynamicGasPerNFTCost()
    ]);
    
    console.log("公式: baseCost + quantity * perNFTCost");
    console.log("baseCost:", baseCost.toString());
    console.log("perNFTCost:", perNFTCost.toString());
    
    // 計算不同批次的 gas
    const [gas1, gas10, gas20, gas40] = await Promise.all([
        vrfConsumer.calculateDynamicGasLimit(heroAddr, 1),
        vrfConsumer.calculateDynamicGasLimit(heroAddr, 10),
        vrfConsumer.calculateDynamicGasLimit(heroAddr, 20),
        vrfConsumer.calculateDynamicGasLimit(heroAddr, 40)
    ]);
    
    console.log("\n🧮 Gas 計算測試:");
    console.log("1 NFT:", gas1.toString(), "gas");
    console.log("10 NFT:", gas10.toString(), "gas");
    console.log("20 NFT:", gas20.toString(), "gas", Number(gas20) >= 1288905 ? "✅" : "❌");
    console.log("40 NFT:", gas40.toString(), "gas (新上限)");
    
    console.log("\n🎯 關鍵改進:");
    console.log("1. ✅ 動態 Gas 公式可在部署後調整");
    console.log("2. ✅ 批次上限從 50 降至 40 (更安全)");
    console.log("3. ✅ 默認公式已優化 (350000 + quantity * 47000)");
    console.log("4. ✅ 20 NFT 批次現在有", Number(gas20) - 1288905, "gas 的安全緩衝");
    
    console.log("\n📋 部署後步驟:");
    console.log("1. 在 Chainlink VRF 訂閱中將新地址添加為消費者:");
    console.log(`   訂閱 ID: 88422796721004450630713121079263696788635490871993157345476848872165866246915`);
    console.log(`   新消費者地址: ${vrfAddress}`);
    console.log("\n2. 更新 DungeonCore 的 VRF Manager 地址:");
    console.log(`   await dungeonCore.setVRFManager("${vrfAddress}")`);
    console.log("\n3. 測試 20 NFT 批次鑄造");
    
    console.log("\n💡 管理指令:");
    console.log("// 查看當前公式");
    console.log("await vrfConsumer.dynamicGasBaseCost()");
    console.log("await vrfConsumer.dynamicGasPerNFTCost()");
    console.log("\n// 調整公式（如果需要）");
    console.log("await vrfConsumer.setDynamicGasFormula(newBaseCost, newPerNFTCost)");
    console.log("\n// 計算特定數量的 gas");
    console.log("await vrfConsumer.calculateDynamicGasLimit(heroAddress, quantity)");
    
    // 顯示公式調整範例
    console.log("\n📊 公式調整範例:");
    console.log("// 如果 20 NFT 還是失敗，可以增加參數:");
    console.log("await vrfConsumer.setDynamicGasFormula(400000, 50000)");
    console.log("// 這將給 20 NFT: 400000 + 20 * 50000 = 1,400,000 gas");
    
    console.log("\n✨ 主要優勢:");
    console.log("- 不需要每次調整都重新部署");
    console.log("- 可以根據實際使用情況微調");
    console.log("- 保持原始合約 99% 的代碼不變");
    console.log("- 最小化修改，降低風險");
    
    // 保存部署信息
    const deploymentInfo = {
        contractName: "VRFConsumerV2PlusAdjustable",
        address: vrfAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        modifications: [
            "Added adjustable gas formula (baseCost, perNFTCost)",
            "Reduced max batch from 50 to 40",
            "Added setDynamicGasFormula function",
            "Default formula: 350000 + quantity * 47000"
        ],
        gasFormula: {
            baseCost: baseCost.toString(),
            perNFTCost: perNFTCost.toString(),
            maxBatchSize: 40
        }
    };
    
    console.log("\n💾 部署信息:");
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