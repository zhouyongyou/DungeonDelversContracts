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
    
    // 現有合約地址 (V25)
    DungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    DungeonStorage: "0x88EF98E7F9095610d7762C30165854f271525B97",
    SoulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    Party: "0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5",
    Oracle: "0x67989939163bCFC57302767722E1988FFac46d64"
};

async function main() {
    console.log("🚀 開始設置 VRF 合約連接");
    console.log("錢包地址:", wallet.address);
    
    try {
        // 1. 載入 VRFManager ABI
        const vrfManagerJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "VRFManager.sol", "VRFManager.json"));
        const vrfManager = new ethers.Contract(CONTRACTS.VRFManager, vrfManagerJson.abi, wallet);
        
        // 2. 載入其他合約 ABI
        const heroJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "nft", "Hero.sol", "Hero.json"));
        const relicJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "nft", "Relic.sol", "Relic.json"));
        const dungeonMasterJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "DungeonMaster.sol", "DungeonMaster.json"));
        const altarJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "AltarOfAscension.sol", "AltarOfAscension.json"));
        const dungeonCoreJson = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "current", "core", "DungeonCore.sol", "DungeonCore.json"));
        
        const hero = new ethers.Contract(CONTRACTS.Hero, heroJson.abi, wallet);
        const relic = new ethers.Contract(CONTRACTS.Relic, relicJson.abi, wallet);
        const dungeonMaster = new ethers.Contract(CONTRACTS.DungeonMaster, dungeonMasterJson.abi, wallet);
        const altar = new ethers.Contract(CONTRACTS.AltarOfAscension, altarJson.abi, wallet);
        const dungeonCore = new ethers.Contract(CONTRACTS.DungeonCore, dungeonCoreJson.abi, wallet);
        
        // ========== Step 1: VRFManager 授權合約 ==========
        console.log("\n========== Step 1: VRFManager 授權合約 ==========");
        
        console.log("授權 Hero...");
        let tx = await vrfManager.authorizeContract(CONTRACTS.Hero);
        await tx.wait();
        console.log("✅ Hero 已授權");
        
        console.log("授權 Relic...");
        tx = await vrfManager.authorizeContract(CONTRACTS.Relic);
        await tx.wait();
        console.log("✅ Relic 已授權");
        
        console.log("授權 DungeonMaster...");
        tx = await vrfManager.authorizeContract(CONTRACTS.DungeonMaster);
        await tx.wait();
        console.log("✅ DungeonMaster 已授權");
        
        console.log("授權 AltarOfAscension...");
        tx = await vrfManager.authorizeContract(CONTRACTS.AltarOfAscension);
        await tx.wait();
        console.log("✅ AltarOfAscension 已授權");
        
        // ========== Step 2: 在各合約設置 VRFManager ==========
        console.log("\n========== Step 2: 在各合約設置 VRFManager ==========");
        
        console.log("設置 Hero VRFManager...");
        tx = await hero.setVRFManager(CONTRACTS.VRFManager);
        await tx.wait();
        console.log("✅ Hero VRFManager 設置成功");
        
        console.log("設置 Relic VRFManager...");
        tx = await relic.setVRFManager(CONTRACTS.VRFManager);
        await tx.wait();
        console.log("✅ Relic VRFManager 設置成功");
        
        console.log("設置 DungeonMaster VRFManager...");
        tx = await dungeonMaster.setVRFManager(CONTRACTS.VRFManager);
        await tx.wait();
        console.log("✅ DungeonMaster VRFManager 設置成功");
        
        console.log("設置 AltarOfAscension VRFManager...");
        tx = await altar.setVRFManager(CONTRACTS.VRFManager);
        await tx.wait();
        console.log("✅ AltarOfAscension VRFManager 設置成功");
        
        // ========== Step 3: 設置 DungeonCore 連接 ==========
        console.log("\n========== Step 3: 設置 DungeonCore 連接 ==========");
        
        console.log("在 Hero 設置 DungeonCore...");
        tx = await hero.setDungeonCore(CONTRACTS.DungeonCore);
        await tx.wait();
        console.log("✅ Hero DungeonCore 設置成功");
        
        console.log("在 Hero 設置 SoulShard...");
        tx = await hero.setSoulShardToken(CONTRACTS.SoulShard);
        await tx.wait();
        console.log("✅ Hero SoulShard 設置成功");
        
        console.log("在 Relic 設置 DungeonCore...");
        tx = await relic.setDungeonCore(CONTRACTS.DungeonCore);
        await tx.wait();
        console.log("✅ Relic DungeonCore 設置成功");
        
        console.log("在 Relic 設置 SoulShard...");
        tx = await relic.setSoulShardToken(CONTRACTS.SoulShard);
        await tx.wait();
        console.log("✅ Relic SoulShard 設置成功");
        
        console.log("在 DungeonMaster 設置 DungeonCore...");
        tx = await dungeonMaster.setDungeonCore(CONTRACTS.DungeonCore);
        await tx.wait();
        console.log("✅ DungeonMaster DungeonCore 設置成功");
        
        console.log("在 DungeonMaster 設置 DungeonStorage...");
        tx = await dungeonMaster.setDungeonStorage(CONTRACTS.DungeonStorage);
        await tx.wait();
        console.log("✅ DungeonMaster DungeonStorage 設置成功");
        
        console.log("在 AltarOfAscension 設置 DungeonCore...");
        tx = await altar.setDungeonCore(CONTRACTS.DungeonCore);
        await tx.wait();
        console.log("✅ AltarOfAscension DungeonCore 設置成功");
        
        // ========== Step 4: 更新 DungeonCore 模組地址 ==========
        console.log("\n========== Step 4: 更新 DungeonCore 模組地址 ==========");
        
        console.log("更新 DungeonCore 的 Hero 地址...");
        tx = await dungeonCore.setHeroContract(CONTRACTS.Hero);
        await tx.wait();
        console.log("✅ DungeonCore Hero 地址更新成功");
        
        console.log("更新 DungeonCore 的 Relic 地址...");
        tx = await dungeonCore.setRelicContract(CONTRACTS.Relic);
        await tx.wait();
        console.log("✅ DungeonCore Relic 地址更新成功");
        
        console.log("更新 DungeonCore 的 DungeonMaster 地址...");
        tx = await dungeonCore.setDungeonMaster(CONTRACTS.DungeonMaster);
        await tx.wait();
        console.log("✅ DungeonCore DungeonMaster 地址更新成功");
        
        console.log("更新 DungeonCore 的 AltarOfAscension 地址...");
        tx = await dungeonCore.setAltarOfAscension(CONTRACTS.AltarOfAscension);
        await tx.wait();
        console.log("✅ DungeonCore AltarOfAscension 地址更新成功");
        
        // ========== Step 5: 設置 Altar 地址 ==========
        console.log("\n========== Step 5: 設置 Altar 權限 ==========");
        
        console.log("在 Hero 設置 AscensionAltar 地址...");
        tx = await hero.setAscensionAltarAddress(CONTRACTS.AltarOfAscension);
        await tx.wait();
        console.log("✅ Hero AscensionAltar 設置成功");
        
        console.log("在 Relic 設置 AscensionAltar 地址...");
        tx = await relic.setAscensionAltarAddress(CONTRACTS.AltarOfAscension);
        await tx.wait();
        console.log("✅ Relic AscensionAltar 設置成功");
        
        console.log("\n✅ 所有 VRF 合約連接設置完成！");
        console.log("\n📝 最終配置:");
        console.log("VRFManager:", CONTRACTS.VRFManager);
        console.log("Hero:", CONTRACTS.Hero);
        console.log("Relic:", CONTRACTS.Relic);
        console.log("DungeonMaster:", CONTRACTS.DungeonMaster);
        console.log("AltarOfAscension:", CONTRACTS.AltarOfAscension);
        
        // 驗證設置
        console.log("\n========== 驗證設置 ==========");
        
        const heroVRF = await hero.vrfManager();
        console.log("Hero VRFManager:", heroVRF === CONTRACTS.VRFManager ? "✅" : "❌");
        
        const relicVRF = await relic.vrfManager();
        console.log("Relic VRFManager:", relicVRF === CONTRACTS.VRFManager ? "✅" : "❌");
        
        const dungeonMasterVRF = await dungeonMaster.vrfManager();
        console.log("DungeonMaster VRFManager:", dungeonMasterVRF === CONTRACTS.VRFManager ? "✅" : "❌");
        
        const altarVRF = await altar.vrfManager();
        console.log("AltarOfAscension VRFManager:", altarVRF === CONTRACTS.VRFManager ? "✅" : "❌");
        
        console.log("\n🎉 VRF 系統設置完成！可以開始使用 VRF 功能了。");
        
    } catch (error) {
        console.error("\n❌ 設置失敗:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });