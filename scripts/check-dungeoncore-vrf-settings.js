// 檢查 DungeonCore 和各合約的 VRF Manager 設定
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 檢查 DungeonCore 和各合約的 VRF 設定");
    console.log("=====================================");
    
    // 合約地址
    const DUNGEONCORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    const HERO_ADDRESS = "0x27E3A73a4d7DDD8Dea6cBF9e152173CcC04b7505";
    const RELIC_ADDRESS = "0x8676174F82A9e5006B33976430D91d752fa90E3e";
    
    const CURRENT_VRF_MANAGER = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    const OLD_VRF_MANAGER = "0xa94555C309Dd83d9fB0531852d209c46Fa50637f";
    
    // ABI
    const dungeonCoreABI = [
        "function getVRFManager() view returns (address)",
        "function heroContractAddress() view returns (address)",
        "function relicContractAddress() view returns (address)"
    ];
    
    const nftABI = [
        "function dungeonCore() view returns (address)"
    ];
    
    const dungeonCore = await ethers.getContractAt(dungeonCoreABI, DUNGEONCORE_ADDRESS);
    const hero = await ethers.getContractAt(nftABI, HERO_ADDRESS);
    const relic = await ethers.getContractAt(nftABI, RELIC_ADDRESS);
    
    try {
        console.log("📋 當前設定檢查:");
        console.log("================");
        
        // 1. 檢查 DungeonCore 的 VRF Manager
        const coreVRFManager = await dungeonCore.getVRFManager();
        console.log("DungeonCore VRF Manager:", coreVRFManager);
        console.log("是否為當前版本:", coreVRFManager === CURRENT_VRF_MANAGER ? "✅ 是" : "❌ 否");
        console.log("是否為舊版本:", coreVRFManager === OLD_VRF_MANAGER ? "⚠️ 是" : "✅ 否");
        
        // 2. 檢查 Hero 合約的 DungeonCore
        const heroDungeonCore = await hero.dungeonCore();
        console.log("\\nHero DungeonCore:", heroDungeonCore);
        console.log("是否正確:", heroDungeonCore === DUNGEONCORE_ADDRESS ? "✅ 是" : "❌ 否");
        
        // 3. 檢查 Relic 合約的 DungeonCore  
        const relicDungeonCore = await relic.dungeonCore();
        console.log("\\nRelic DungeonCore:", relicDungeonCore);
        console.log("是否正確:", relicDungeonCore === DUNGEONCORE_ADDRESS ? "✅ 是" : "❌ 否");
        
        // 4. 檢查 DungeonCore 記錄的 NFT 地址
        const coreHeroAddress = await dungeonCore.heroContractAddress();
        const coreRelicAddress = await dungeonCore.relicContractAddress();
        
        console.log("\\nDungeonCore 記錄的地址:");
        console.log("Hero 地址:", coreHeroAddress);
        console.log("Hero 正確:", coreHeroAddress === HERO_ADDRESS ? "✅ 是" : "❌ 否");
        console.log("Relic 地址:", coreRelicAddress);
        console.log("Relic 正確:", coreRelicAddress === RELIC_ADDRESS ? "✅ 是" : "❌ 否");
        
        console.log("\\n🔍 問題診斷:");
        console.log("============");
        
        if (coreVRFManager === OLD_VRF_MANAGER) {
            console.log("🔴 **發現主要問題**：DungeonCore 仍指向舊的 VRF Manager！");
            console.log("\\n原因分析:");
            console.log("- Hero/Relic 合約通過 DungeonCore 獲取 VRF Manager 地址");
            console.log("- DungeonCore 返回舊的 VRF Manager 地址");
            console.log("- 舊 VRF Manager 的動態計算返回 65000 gas");
            console.log("- 65000 gas 不足以處理回調，導致失敗");
            
            console.log("\\n✅ **解決方案**：");
            console.log("需要調用 DungeonCore.setGlobalVRFManager() 更新為新地址");
            console.log("新地址:", CURRENT_VRF_MANAGER);
            
        } else if (coreVRFManager === CURRENT_VRF_MANAGER) {
            console.log("✅ DungeonCore VRF Manager 設定正確");
            console.log("\\n問題可能是:");
            console.log("1. 失敗交易來自更早的請求（使用舊設定）");
            console.log("2. 有其他合約仍在使用舊 VRF Manager");
            console.log("3. 需要等待舊請求處理完畢");
            
        } else {
            console.log("❓ DungeonCore 指向未知的 VRF Manager");
            console.log("當前設定:", coreVRFManager);
            console.log("需要檢查這個地址的來源");
        }
        
        console.log("\\n📋 環境變數檢查:");
        console.log("================");
        const envVRF = process.env.VITE_VRF_MANAGER_V2PLUS_ADDRESS || "未設定";
        console.log("環境變數 VRF Manager:", envVRF);
        console.log("與 DungeonCore 一致:", envVRF === coreVRFManager ? "✅ 是" : "❌ 否");
        console.log("與當前版本一致:", envVRF === CURRENT_VRF_MANAGER ? "✅ 是" : "❌ 否");
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });