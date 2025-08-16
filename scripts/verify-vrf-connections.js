const hre = require("hardhat");

async function main() {
    console.log("🔍 驗證 VRF 連接設置...");
    
    // 替換為實際部署的 VRF Manager 地址
    const VRF_MANAGER_ADDRESS = process.env.NEW_VRF_MANAGER || "YOUR_NEW_VRF_MANAGER_ADDRESS";
    
    const CONTRACTS = {
        DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
        Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
        Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
        AltarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"
    };
    
    console.log("\n📋 VRF Manager 地址:", VRF_MANAGER_ADDRESS);
    
    // 獲取 VRF Manager 合約
    const vrfManager = await hre.ethers.getContractAt("VRFConsumerV2Plus", VRF_MANAGER_ADDRESS);
    
    // 檢查 VRF Manager 配置
    console.log("\n🔧 VRF Manager 配置:");
    console.log("- Subscription ID:", await vrfManager.s_subscriptionId());
    console.log("- Key Hash:", await vrfManager.keyHash());
    console.log("- Callback Gas Limit:", (await vrfManager.callbackGasLimit()).toString());
    console.log("- Min Gas Limit:", (await vrfManager.MIN_CALLBACK_GAS_LIMIT()).toString());
    console.log("- Max Gas Limit:", (await vrfManager.MAX_CALLBACK_GAS_LIMIT()).toString());
    
    // 檢查授權狀態
    console.log("\n🔐 授權狀態:");
    for (const [name, address] of Object.entries(CONTRACTS)) {
        const isAuthorized = await vrfManager.authorized(address);
        console.log(`${name}: ${isAuthorized ? "✅ 已授權" : "❌ 未授權"}`);
    }
    
    // 檢查各合約的 VRF Manager 設置
    console.log("\n🔄 反向驗證（各合約的 VRF Manager 設置）:");
    
    // Hero
    try {
        const hero = await hre.ethers.getContractAt("Hero", CONTRACTS.Hero);
        const vrfAddr = await hero.vrfManager();
        const match = vrfAddr.toLowerCase() === VRF_MANAGER_ADDRESS.toLowerCase();
        console.log(`Hero VRF Manager: ${vrfAddr} ${match ? "✅" : "❌"}`);
    } catch (error) {
        console.log("Hero: 無法讀取 VRF Manager（可能函數名不同）");
    }
    
    // Relic
    try {
        const relic = await hre.ethers.getContractAt("Relic", CONTRACTS.Relic);
        const vrfAddr = await relic.vrfManager();
        const match = vrfAddr.toLowerCase() === VRF_MANAGER_ADDRESS.toLowerCase();
        console.log(`Relic VRF Manager: ${vrfAddr} ${match ? "✅" : "❌"}`);
    } catch (error) {
        console.log("Relic: 無法讀取 VRF Manager（可能函數名不同）");
    }
    
    // DungeonMaster
    try {
        const dm = await hre.ethers.getContractAt("DungeonMaster", CONTRACTS.DungeonMaster);
        // DungeonMaster 可能使用不同的變量名
        let vrfAddr;
        try {
            vrfAddr = await dm.vrfManager();
        } catch {
            vrfAddr = await dm.VRFManager();
        }
        const match = vrfAddr.toLowerCase() === VRF_MANAGER_ADDRESS.toLowerCase();
        console.log(`DungeonMaster VRF Manager: ${vrfAddr} ${match ? "✅" : "❌"}`);
    } catch (error) {
        console.log("DungeonMaster: 無法讀取 VRF Manager（可能函數名不同）");
    }
    
    // AltarOfAscension
    try {
        const altar = await hre.ethers.getContractAt("AltarOfAscension", CONTRACTS.AltarOfAscension);
        const vrfAddr = await altar.vrfManager();
        const match = vrfAddr.toLowerCase() === VRF_MANAGER_ADDRESS.toLowerCase();
        console.log(`AltarOfAscension VRF Manager: ${vrfAddr} ${match ? "✅" : "❌"}`);
    } catch (error) {
        console.log("AltarOfAscension: 無法讀取 VRF Manager（可能函數名不同）");
    }
    
    // 估算成本
    console.log("\n💰 成本估算:");
    try {
        const cost1 = await vrfManager.estimateRequestCost(1);
        const cost5 = await vrfManager.estimateRequestCost(5);
        const cost25 = await vrfManager.estimateRequestCost(25);
        
        console.log(`- 1 個 NFT: ${hre.ethers.utils.formatEther(cost1)} LINK`);
        console.log(`- 5 個 NFT: ${hre.ethers.utils.formatEther(cost5)} LINK`);
        console.log(`- 25 個 NFT: ${hre.ethers.utils.formatEther(cost25)} LINK`);
    } catch (error) {
        console.log("無法估算成本（函數可能不存在）");
    }
    
    console.log("\n✅ 驗證完成！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });