const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC_URL = "https://bsc-dataseed1.binance.org/";

// 創建 provider 和 wallet
const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// 新部署的合約地址
const CONTRACTS = {
    VRFManager: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
    Hero: "0xcaF37D9D8356eE18938466F4590A69Bf84C35E15",
    Relic: "0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A",
    DungeonMaster: "0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816",
    AltarOfAscension: "0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1",
    DungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13"
};

async function main() {
    console.log("🔍 驗證 VRF 設置狀態");
    
    try {
        // 載入合約 ABI
        const heroJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "nft", "Hero.sol", "Hero.json"));
        const relicJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "nft", "Relic.sol", "Relic.json"));
        const dungeonMasterJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "DungeonMaster.sol", "DungeonMaster.json"));
        const altarJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "AltarOfAscension.sol", "AltarOfAscension.json"));
        const vrfManagerJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "VRFManager.sol", "VRFManager.json"));
        const dungeonCoreJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "DungeonCore.sol", "DungeonCore.json"));
        
        const hero = new ethers.Contract(CONTRACTS.Hero, heroJson.abi, provider);
        const relic = new ethers.Contract(CONTRACTS.Relic, relicJson.abi, provider);
        const dungeonMaster = new ethers.Contract(CONTRACTS.DungeonMaster, dungeonMasterJson.abi, provider);
        const altar = new ethers.Contract(CONTRACTS.AltarOfAscension, altarJson.abi, provider);
        const vrfManager = new ethers.Contract(CONTRACTS.VRFManager, vrfManagerJson.abi, provider);
        const dungeonCore = new ethers.Contract(CONTRACTS.DungeonCore, dungeonCoreJson.abi, provider);
        
        console.log("\n========== VRF Manager 設置狀態 ==========");
        
        // 檢查各合約的 VRF Manager 設置
        const heroVRF = await hero.vrfManager();
        console.log(`Hero VRF Manager: ${heroVRF}`);
        console.log(`  狀態: ${heroVRF === CONTRACTS.VRFManager ? "✅ 正確" : "❌ 錯誤"}`);
        
        const relicVRF = await relic.vrfManager();
        console.log(`Relic VRF Manager: ${relicVRF}`);
        console.log(`  狀態: ${relicVRF === CONTRACTS.VRFManager ? "✅ 正確" : "❌ 錯誤"}`);
        
        const dungeonMasterVRF = await dungeonMaster.vrfManager();
        console.log(`DungeonMaster VRF Manager: ${dungeonMasterVRF}`);
        console.log(`  狀態: ${dungeonMasterVRF === CONTRACTS.VRFManager ? "✅ 正確" : "❌ 錯誤"}`);
        
        const altarVRF = await altar.vrfManager();
        console.log(`AltarOfAscension VRF Manager: ${altarVRF}`);
        console.log(`  狀態: ${altarVRF === CONTRACTS.VRFManager ? "✅ 正確" : "❌ 錯誤"}`);
        
        console.log("\n========== VRF Manager 授權狀態 ==========");
        
        // 檢查授權狀態
        const heroAuthorized = await vrfManager.authorizedContracts(CONTRACTS.Hero);
        console.log(`Hero 授權: ${heroAuthorized ? "✅" : "❌"}`);
        
        const relicAuthorized = await vrfManager.authorizedContracts(CONTRACTS.Relic);
        console.log(`Relic 授權: ${relicAuthorized ? "✅" : "❌"}`);
        
        const dungeonMasterAuthorized = await vrfManager.authorizedContracts(CONTRACTS.DungeonMaster);
        console.log(`DungeonMaster 授權: ${dungeonMasterAuthorized ? "✅" : "❌"}`);
        
        const altarAuthorized = await vrfManager.authorizedContracts(CONTRACTS.AltarOfAscension);
        console.log(`AltarOfAscension 授權: ${altarAuthorized ? "✅" : "❌"}`);
        
        console.log("\n========== DungeonCore 模組地址 ==========");
        
        // 檢查 DungeonCore 中的模組地址
        const coreHero = await dungeonCore.heroContractAddress();
        console.log(`DungeonCore Hero: ${coreHero}`);
        console.log(`  狀態: ${coreHero === CONTRACTS.Hero ? "✅ 正確" : "❌ 錯誤"}`);
        
        const coreRelic = await dungeonCore.relicContractAddress();
        console.log(`DungeonCore Relic: ${coreRelic}`);
        console.log(`  狀態: ${coreRelic === CONTRACTS.Relic ? "✅ 正確" : "❌ 錯誤"}`);
        
        const coreDungeonMaster = await dungeonCore.dungeonMasterAddress();
        console.log(`DungeonCore DungeonMaster: ${coreDungeonMaster}`);
        console.log(`  狀態: ${coreDungeonMaster === CONTRACTS.DungeonMaster ? "✅ 正確" : "❌ 錯誤"}`);
        
        const coreAltar = await dungeonCore.altarOfAscensionAddress();
        console.log(`DungeonCore AltarOfAscension: ${coreAltar}`);
        console.log(`  狀態: ${coreAltar === CONTRACTS.AltarOfAscension ? "✅ 正確" : "❌ 錯誤"}`);
        
        console.log("\n========== VRF Manager 配置 ==========");
        
        // 檢查 VRF Manager 配置
        const vrfCoordinator = await vrfManager.vrfCoordinator();
        console.log(`VRF Coordinator: ${vrfCoordinator}`);
        
        const keyHash = await vrfManager.keyHash();
        console.log(`Key Hash: ${keyHash}`);
        
        const vrfRequestPrice = await vrfManager.getVrfRequestPrice();
        console.log(`VRF Request Price: ${ethers.formatEther(vrfRequestPrice)} BNB`);
        
        console.log("\n========== 總結 ==========");
        
        const allVRFSet = (
            heroVRF === CONTRACTS.VRFManager &&
            relicVRF === CONTRACTS.VRFManager &&
            dungeonMasterVRF === CONTRACTS.VRFManager &&
            altarVRF === CONTRACTS.VRFManager
        );
        
        const allAuthorized = (
            heroAuthorized &&
            relicAuthorized &&
            dungeonMasterAuthorized &&
            altarAuthorized
        );
        
        const allCoreSet = (
            coreHero === CONTRACTS.Hero &&
            coreRelic === CONTRACTS.Relic &&
            coreDungeonMaster === CONTRACTS.DungeonMaster &&
            coreAltar === CONTRACTS.AltarOfAscension
        );
        
        if (allVRFSet && allAuthorized && allCoreSet) {
            console.log("✅ 所有 VRF 設置已完成！系統可以正常使用。");
        } else {
            console.log("⚠️ 部分設置未完成：");
            if (!allVRFSet) console.log("  - VRF Manager 地址設置不完整");
            if (!allAuthorized) console.log("  - VRF Manager 授權不完整");
            if (!allCoreSet) console.log("  - DungeonCore 模組地址不完整");
        }
        
    } catch (error) {
        console.error("\n❌ 驗證失敗:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });