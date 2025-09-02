// deploy-vrf-gas-fix.js - Deploy VRF contract with corrected gas calculation
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 部署修正後的 VRF 合約...");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");
    
    // BSC VRF 配置
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"; // 正確的 BSC VRF Coordinator 地址
    const SUBSCRIPTION_ID = "2258718217515864835"; // 正確的 uint64 格式
    
    console.log("VRF Coordinator:", VRF_COORDINATOR);
    console.log("訂閱 ID:", SUBSCRIPTION_ID);
    
    // 部署 VRF 合約
    const VRFConsumerV2Plus = await ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfContract = await VRFConsumerV2Plus.deploy(
        SUBSCRIPTION_ID,
        VRF_COORDINATOR
    );
    
    await vrfContract.waitForDeployment();
    const vrfAddress = await vrfContract.getAddress();
    
    console.log("✅ VRF 合約部署成功!");
    console.log("VRF 地址:", vrfAddress);
    
    // 設置 DungeonCore 地址
    const DUNGEON_CORE = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    console.log("設置 DungeonCore 地址:", DUNGEON_CORE);
    
    const tx = await vrfContract.setDungeonCore(DUNGEON_CORE);
    await tx.wait();
    console.log("✅ DungeonCore 設置完成");
    
    // 測試新的動態 Gas 計算
    console.log("\n🧮 測試修正後的動態 Gas 計算:");
    
    try {
        const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEON_CORE);
        const heroAddr = await dungeonCore.heroContractAddress();
        const relicAddr = await dungeonCore.relicContractAddress();
        const dmAddr = await dungeonCore.dungeonMasterAddress();
        const altarAddr = await dungeonCore.altarOfAscensionAddress();
        
        console.log("Hero (qty=1):", (await vrfContract.calculateDynamicGasLimit(heroAddr, 1)).toString(), "gas");
        console.log("Hero (qty=5):", (await vrfContract.calculateDynamicGasLimit(heroAddr, 5)).toString(), "gas");
        console.log("Hero (qty=10):", (await vrfContract.calculateDynamicGasLimit(heroAddr, 10)).toString(), "gas");
        console.log("Relic (qty=1):", (await vrfContract.calculateDynamicGasLimit(relicAddr, 1)).toString(), "gas");
        console.log("DungeonMaster:", (await vrfContract.calculateDynamicGasLimit(dmAddr, 0)).toString(), "gas");
        console.log("Altar:", (await vrfContract.calculateDynamicGasLimit(altarAddr, 0)).toString(), "gas");
        
    } catch (error) {
        console.log("無法測試動態計算 (可能 DungeonCore 設置不完整):", error.message);
    }
    
    console.log("\n📋 部署總結:");
    console.log("VRF 合約地址:", vrfAddress);
    console.log("Gas 計算已修正: Hero/Relic 從 50k+15k*qty 改為 120k+40k*qty");
    console.log("DungeonMaster 從 400k 增加到 500k");
    console.log("Altar 維持 800k");
    
    // 保存部署信息
    const deploymentInfo = {
        vrfAddress,
        subscriptionId: SUBSCRIPTION_ID,
        coordinator: VRF_COORDINATOR,
        dungeonCore: DUNGEON_CORE,
        deployedAt: new Date().toISOString(),
        gasFixApplied: true,
        newFormula: {
            heroRelic: "120k + 40k * quantity",
            dungeonMaster: "500k",
            altar: "800k"
        }
    };
    
    console.log("\n💾 部署信息:", JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });