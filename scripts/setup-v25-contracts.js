// V25 合約互連設置腳本
// 執行時間：2025-08-07 pm6
// 起始區塊：56757876

const hre = require("hardhat");
const { ethers } = require("hardhat");

// V25 合約地址 (8/7 pm6 部署)
const ADDRESSES = {
    // 新部署的合約
    DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
    DUNGEONMASTER: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    HERO: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    RELIC: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    ALTAROFASCENSION: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
    PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    
    // 重複使用的合約
    DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
    VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    
    // VRF Manager (訂閱模式)
    VRF_MANAGER_V2PLUS: "0x980d224ec4d198d94f34a8af76a19c00dabe2436"
};

// 執行狀態追蹤
let successCount = 0;
let failureCount = 0;
const failedTransactions = [];

async function executeTransaction(description, contract, functionName, ...args) {
    try {
        console.log(`\n🔧 ${description}...`);
        const tx = await contract[functionName](...args, { gasLimit: 500000 });
        console.log(`   📝 交易哈希: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`   ✅ 成功！Gas 使用: ${receipt.gasUsed.toString()}`);
        successCount++;
        return true;
    } catch (error) {
        console.log(`   ❌ 失敗: ${error.message}`);
        failureCount++;
        failedTransactions.push({ description, error: error.message });
        return false;
    }
}

async function main() {
    console.log("=== V25 合約互連設置腳本 ===");
    console.log("版本: V25");
    console.log("部署時間: 2025-08-07 pm6");
    console.log("起始區塊: 56757876");
    console.log("===============================\n");
    
    const [signer] = await ethers.getSigners();
    console.log("執行地址:", signer.address);
    console.log("網路:", hre.network.name);
    
    // 載入合約 ABI
    console.log("\n📋 載入合約...");
    
    // DungeonCore 設置
    const dungeonCore = await ethers.getContractAt(
        "contracts/current/interfaces/interfaces.sol:IDungeonCore",
        ADDRESSES.DUNGEONCORE
    );
    
    // NFT 合約
    const hero = await ethers.getContractAt("Hero", ADDRESSES.HERO);
    const relic = await ethers.getContractAt("Relic", ADDRESSES.RELIC);
    const party = await ethers.getContractAt("contracts/current/interfaces/interfaces.sol:IParty", ADDRESSES.PARTY);
    
    // 遊戲合約
    const dungeonMaster = await ethers.getContractAt(
        "DungeonMaster",
        ADDRESSES.DUNGEONMASTER
    );
    const altarOfAscension = await ethers.getContractAt(
        "contracts/current/interfaces/interfaces.sol:IAltarOfAscension",
        ADDRESSES.ALTAROFASCENSION
    );
    
    // VRF Manager
    const vrfManager = await ethers.getContractAt(
        "VRFConsumerV2Plus",
        ADDRESSES.VRF_MANAGER_V2PLUS
    );
    
    console.log("✅ 合約載入完成");
    
    // =========================================
    // 步驟 1: DungeonCore 設置新合約地址
    // =========================================
    console.log("\n=== 步驟 1: 設置 DungeonCore 連接 ===");
    
    await executeTransaction(
        "設置 Hero 地址",
        dungeonCore,
        "setHeroContract",
        ADDRESSES.HERO
    );
    
    await executeTransaction(
        "設置 Relic 地址",
        dungeonCore,
        "setRelicContract",
        ADDRESSES.RELIC
    );
    
    await executeTransaction(
        "設置 Party 地址",
        dungeonCore,
        "setPartyContract",
        ADDRESSES.PARTY
    );
    
    await executeTransaction(
        "設置 DungeonMaster 地址",
        dungeonCore,
        "setDungeonMaster",
        ADDRESSES.DUNGEONMASTER
    );
    
    await executeTransaction(
        "設置 AltarOfAscension 地址",
        dungeonCore,
        "setAltarOfAscension",
        ADDRESSES.ALTAROFASCENSION
    );
    
    // =========================================
    // 步驟 2: NFT 合約設置 DungeonCore
    // =========================================
    console.log("\n=== 步驟 2: NFT 合約設置 ===");
    
    await executeTransaction(
        "Hero 設置 DungeonCore",
        hero,
        "setDungeonCore",
        ADDRESSES.DUNGEONCORE
    );
    
    await executeTransaction(
        "Hero 設置 SoulShard",
        hero,
        "setSoulShardToken",
        ADDRESSES.SOULSHARD
    );
    
    await executeTransaction(
        "Hero 設置 AltarOfAscension",
        hero,
        "setAscensionAltarAddress",
        ADDRESSES.ALTAROFASCENSION
    );
    
    await executeTransaction(
        "Relic 設置 DungeonCore",
        relic,
        "setDungeonCore",
        ADDRESSES.DUNGEONCORE
    );
    
    await executeTransaction(
        "Relic 設置 SoulShard",
        relic,
        "setSoulShardToken",
        ADDRESSES.SOULSHARD
    );
    
    await executeTransaction(
        "Relic 設置 AltarOfAscension",
        relic,
        "setAscensionAltarAddress",
        ADDRESSES.ALTAROFASCENSION
    );
    
    await executeTransaction(
        "Party 設置 DungeonCore",
        party,
        "setDungeonCore",
        ADDRESSES.DUNGEONCORE
    );
    
    // =========================================
    // 步驟 3: DungeonMaster 設置
    // =========================================
    console.log("\n=== 步驟 3: DungeonMaster 設置 ===");
    
    await executeTransaction(
        "DungeonMaster 設置 DungeonCore",
        dungeonMaster,
        "setDungeonCore",
        ADDRESSES.DUNGEONCORE
    );
    
    await executeTransaction(
        "DungeonMaster 設置 DungeonStorage",
        dungeonMaster,
        "setDungeonStorage",
        ADDRESSES.DUNGEONSTORAGE
    );
    
    await executeTransaction(
        "DungeonMaster 設置 SoulShard",
        dungeonMaster,
        "setSoulShardToken",
        ADDRESSES.SOULSHARD
    );
    
    // =========================================
    // 步驟 4: AltarOfAscension 設置
    // =========================================
    console.log("\n=== 步驟 4: AltarOfAscension 設置 ===");
    
    await executeTransaction(
        "AltarOfAscension 設置 DungeonCore",
        altarOfAscension,
        "setDungeonCore",
        ADDRESSES.DUNGEONCORE
    );
    
    // =========================================
    // 步驟 5: VRF Manager 設置
    // =========================================
    console.log("\n=== 步驟 5: VRF Manager 設置 ===");
    
    // 設置 VRF Manager 授權
    await executeTransaction(
        "VRF 授權 Hero",
        vrfManager,
        "setAuthorizedContract",
        ADDRESSES.HERO,
        true
    );
    
    await executeTransaction(
        "VRF 授權 Relic",
        vrfManager,
        "setAuthorizedContract",
        ADDRESSES.RELIC,
        true
    );
    
    await executeTransaction(
        "VRF 授權 DungeonMaster",
        vrfManager,
        "setAuthorizedContract",
        ADDRESSES.DUNGEONMASTER,
        true
    );
    
    await executeTransaction(
        "VRF 授權 AltarOfAscension",
        vrfManager,
        "setAuthorizedContract",
        ADDRESSES.ALTAROFASCENSION,
        true
    );
    
    // 各合約設置 VRF Manager
    await executeTransaction(
        "Hero 設置 VRF Manager",
        hero,
        "setVRFManager",
        ADDRESSES.VRF_MANAGER_V2PLUS
    );
    
    await executeTransaction(
        "Relic 設置 VRF Manager",
        relic,
        "setVRFManager",
        ADDRESSES.VRF_MANAGER_V2PLUS
    );
    
    await executeTransaction(
        "DungeonMaster 設置 VRF Manager",
        dungeonMaster,
        "setVRFManager",
        ADDRESSES.VRF_MANAGER_V2PLUS
    );
    
    await executeTransaction(
        "AltarOfAscension 設置 VRF Manager",
        altarOfAscension,
        "setVRFManager",
        ADDRESSES.VRF_MANAGER_V2PLUS
    );
    
    // =========================================
    // 執行總結
    // =========================================
    console.log("\n===============================");
    console.log("=== 執行總結 ===");
    console.log(`✅ 成功: ${successCount} 筆交易`);
    console.log(`❌ 失敗: ${failureCount} 筆交易`);
    
    if (failedTransactions.length > 0) {
        console.log("\n失敗的交易:");
        failedTransactions.forEach((tx, index) => {
            console.log(`${index + 1}. ${tx.description}`);
            console.log(`   錯誤: ${tx.error}`);
        });
        
        console.log("\n💡 建議:");
        console.log("1. 檢查執行地址是否為合約 owner");
        console.log("2. 確認合約地址是否正確");
        console.log("3. 檢查網路是否為 BSC 主網");
        console.log("4. 重新執行失敗的交易");
    } else {
        console.log("\n🎉 所有設置完成！");
    }
    
    // =========================================
    // 驗證設置
    // =========================================
    console.log("\n=== 驗證設置 ===");
    
    try {
        // 驗證 DungeonCore 設置
        const heroFromCore = await dungeonCore.heroAddress();
        console.log(`DungeonCore.heroAddress: ${heroFromCore === ADDRESSES.HERO ? "✅" : "❌"} ${heroFromCore}`);
        
        const relicFromCore = await dungeonCore.relicAddress();
        console.log(`DungeonCore.relicAddress: ${relicFromCore === ADDRESSES.RELIC ? "✅" : "❌"} ${relicFromCore}`);
        
        // 驗證 VRF 授權
        const heroAuthorized = await vrfManager.authorized(ADDRESSES.HERO);
        console.log(`VRF Hero 授權: ${heroAuthorized ? "✅" : "❌"}`);
        
        const relicAuthorized = await vrfManager.authorized(ADDRESSES.RELIC);
        console.log(`VRF Relic 授權: ${relicAuthorized ? "✅" : "❌"}`);
        
        // 驗證 NFT 的 VRF Manager
        const heroVrfManager = await hero.vrfManager();
        console.log(`Hero.vrfManager: ${heroVrfManager === ADDRESSES.VRF_MANAGER_V2PLUS ? "✅" : "❌"} ${heroVrfManager}`);
        
        const relicVrfManager = await relic.vrfManager();
        console.log(`Relic.vrfManager: ${relicVrfManager === ADDRESSES.VRF_MANAGER_V2PLUS ? "✅" : "❌"} ${relicVrfManager}`);
        
    } catch (error) {
        console.log("驗證過程中發生錯誤:", error.message);
    }
    
    console.log("\n===============================");
    console.log("V25 合約設置完成");
    console.log("請確認所有設置正確後開始使用");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("腳本執行失敗:", error);
        process.exit(1);
    });