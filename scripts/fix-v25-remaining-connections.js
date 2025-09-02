const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.v25' });

const ADDRESSES = {
    // V25 更新的合約
    DUNGEONSTORAGE: "0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542",
    DUNGEONMASTER: "0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0",
    HERO: "0xe90d442458931690C057D5ad819EBF94A4eD7c8c",
    RELIC: "0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B",
    ALTAROFASCENSION: "0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1",
    PARTY: "0x629B386D8CfdD13F27164a01fCaE83CB07628FB9",
    
    // 複用的合約
    DUNGEONCORE: "0x26BDBCB8Fd349F313c74B691B878f10585c7813E",
    PLAYERVAULT: "0xb2AfF26dc59ef41A22963D037C29550ed113b060",
    PLAYERPROFILE: "0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1",
    VIPSTAKING: "0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28",
    ORACLE: "0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8",
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    VRF_MANAGER: "0xdd14eD07598BA1001cf2888077FE0721941d06A8"
};

const failedTransactions = [];
const successfulTransactions = [];

async function executeTransaction(description, contract, functionName, ...args) {
    try {
        console.log(`\n🔧 ${description}...`);
        
        // 檢查函數是否存在
        if (!contract[functionName]) {
            console.log(`   ⚠️ 函數 ${functionName} 不存在，跳過`);
            return;
        }
        
        const tx = await contract[functionName](...args);
        console.log(`   📝 交易哈希: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`   ✅ 成功！Gas 使用: ${receipt.gasUsed.toString()}`);
        successfulTransactions.push(description);
    } catch (error) {
        console.log(`   ❌ 失敗: ${error.message}`);
        failedTransactions.push({
            description,
            error: error.message
        });
    }
}

async function main() {
    console.log("=== V25 修復剩餘連接設置腳本 ===");
    console.log("版本: V25");
    console.log("部署時間: 2025-08-17 pm8");
    console.log("===============================\n");
    
    // 獲取 signer
    const [signer] = await ethers.getSigners();
    console.log("執行地址:", signer.address);
    console.log("網路:", hre.network.name);
    
    // 載入合約
    console.log("\n📋 載入合約...");
    
    // 只載入需要修復的合約
    const party = await ethers.getContractAt(
        "Party",
        ADDRESSES.PARTY,
        signer
    );
    
    const altarOfAscension = await ethers.getContractAt(
        "AltarOfAscension",
        ADDRESSES.ALTAROFASCENSION,
        signer
    );
    
    console.log("✅ 合約載入完成");
    
    // =========================================
    // 修復失敗的連接
    // =========================================
    console.log("\n=== 修復失敗的連接 ===");
    
    // Party 設置 DungeonCore (之前失敗)
    const PartyABI = [
        "function setDungeonCore(address _dungeonCore) external",
        "function dungeonCoreContract() external view returns (address)"
    ];
    
    const partyContract = new ethers.Contract(ADDRESSES.PARTY, PartyABI, signer);
    
    try {
        const currentDungeonCore = await partyContract.dungeonCoreContract();
        console.log("\n📊 Party 當前 DungeonCore:", currentDungeonCore);
        
        if (currentDungeonCore.toLowerCase() !== ADDRESSES.DUNGEONCORE.toLowerCase()) {
            await executeTransaction(
                "Party 設置 DungeonCore",
                partyContract,
                "setDungeonCore",
                ADDRESSES.DUNGEONCORE
            );
        } else {
            console.log("   ✅ Party DungeonCore 已正確設置");
        }
    } catch (error) {
        console.log("   ⚠️ 無法檢查 Party DungeonCore:", error.message);
    }
    
    // AltarOfAscension 設置 DungeonCore (之前失敗)
    const AltarABI = [
        "function setDungeonCore(address _dungeonCore) external",
        "function dungeonCore() external view returns (address)"
    ];
    
    const altarContract = new ethers.Contract(ADDRESSES.ALTAROFASCENSION, AltarABI, signer);
    
    try {
        const currentDungeonCore = await altarContract.dungeonCore();
        console.log("\n📊 Altar 當前 DungeonCore:", currentDungeonCore);
        
        if (currentDungeonCore.toLowerCase() !== ADDRESSES.DUNGEONCORE.toLowerCase()) {
            await executeTransaction(
                "AltarOfAscension 設置 DungeonCore",
                altarContract,
                "setDungeonCore",
                ADDRESSES.DUNGEONCORE
            );
        } else {
            console.log("   ✅ Altar DungeonCore 已正確設置");
        }
    } catch (error) {
        console.log("   ⚠️ 無法檢查 Altar DungeonCore:", error.message);
    }
    
    // =========================================
    // 執行總結
    // =========================================
    console.log("\n===============================");
    console.log("=== 執行總結 ===");
    console.log(`✅ 成功: ${successfulTransactions.length} 筆交易`);
    console.log(`❌ 失敗: ${failedTransactions.length} 筆交易`);
    
    if (failedTransactions.length > 0) {
        console.log("\n失敗的交易:");
        failedTransactions.forEach((tx, index) => {
            console.log(`${index + 1}. ${tx.description}`);
            console.log(`   錯誤: ${tx.error}`);
        });
    }
    
    // =========================================
    // 驗證最終狀態
    // =========================================
    console.log("\n=== 驗證最終狀態 ===");
    
    try {
        // 驗證 Party 的 DungeonCore
        const partyDungeonCore = await partyContract.dungeonCoreContract();
        console.log(`Party -> DungeonCore: ${partyDungeonCore === ADDRESSES.DUNGEONCORE ? '✅' : '❌'} ${partyDungeonCore}`);
        
        // 驗證 Altar 的 DungeonCore
        const altarDungeonCore = await altarContract.dungeonCore();
        console.log(`Altar -> DungeonCore: ${altarDungeonCore === ADDRESSES.DUNGEONCORE ? '✅' : '❌'} ${altarDungeonCore}`);
        
    } catch (error) {
        console.log("驗證過程中發生錯誤:", error.message);
    }
    
    console.log("\n===============================");
    console.log("V25 修復完成");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("執行失敗:", error);
        process.exit(1);
    });