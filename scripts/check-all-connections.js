const hre = require("hardhat");

async function main() {
    console.log("🔍 檢查所有合約互連狀態...\n");
    
    // 合約地址
    const CONTRACTS = {
        // 主要合約
        DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
        Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
        Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
        AltarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
        Party: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
        
        // 複用合約
        DungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
        PlayerVault: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
        PlayerProfile: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
        VIPStaking: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
        Oracle: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
        
        // Token 合約
        SoulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
        USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
        
        // VRF Manager
        VRFManager: "0x84b1ffc7b0839906ba1ecf510ed3a74481b8438e",
        
        // Storage
        DungeonStorage: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468"
    };
    
    const [signer] = await hre.ethers.getSigners();
    console.log("執行地址:", signer.address);
    console.log("=" .repeat(60));
    
    // ============================================
    // 1. 檢查 VRF Manager 連接
    // ============================================
    console.log("\n📡 VRF Manager 連接狀態:");
    console.log("-".repeat(60));
    
    const vrfManagerABI = [
        "function authorized(address) view returns (bool)"
    ];
    
    try {
        const vrfManager = new hre.ethers.Contract(CONTRACTS.VRFManager, vrfManagerABI, signer);
        
        const vrfClients = ["DungeonMaster", "Hero", "Relic", "AltarOfAscension"];
        for (const name of vrfClients) {
            const isAuthorized = await vrfManager.authorized(CONTRACTS[name]);
            console.log(`${name}: ${isAuthorized ? "✅ 已授權" : "❌ 未授權"}`);
        }
    } catch (error) {
        console.log("❌ 無法讀取 VRF Manager 授權狀態");
    }
    
    // ============================================
    // 2. 檢查 DungeonCore 連接
    // ============================================
    console.log("\n🏛️ DungeonCore 模組設置:");
    console.log("-".repeat(60));
    
    const dungeonCoreABI = [
        "function heroAddress() view returns (address)",
        "function relicAddress() view returns (address)",
        "function partyAddress() view returns (address)",
        "function dungeonMasterAddress() view returns (address)",
        "function altarOfAscensionAddress() view returns (address)",
        "function playerVaultAddress() view returns (address)",
        "function playerProfileAddress() view returns (address)",
        "function vipStakingAddress() view returns (address)",
        "function oracleAddress() view returns (address)",
        "function soulShardAddress() view returns (address)"
    ];
    
    try {
        const dungeonCore = new hre.ethers.Contract(CONTRACTS.DungeonCore, dungeonCoreABI, signer);
        
        const modules = [
            { name: "Hero", getter: "heroAddress" },
            { name: "Relic", getter: "relicAddress" },
            { name: "Party", getter: "partyAddress" },
            { name: "DungeonMaster", getter: "dungeonMasterAddress" },
            { name: "AltarOfAscension", getter: "altarOfAscensionAddress" },
            { name: "PlayerVault", getter: "playerVaultAddress" },
            { name: "PlayerProfile", getter: "playerProfileAddress" },
            { name: "VIPStaking", getter: "vipStakingAddress" },
            { name: "Oracle", getter: "oracleAddress" },
            { name: "SoulShard", getter: "soulShardAddress" }
        ];
        
        for (const module of modules) {
            try {
                const address = await dungeonCore[module.getter]();
                const expected = CONTRACTS[module.name];
                const match = address.toLowerCase() === expected.toLowerCase();
                console.log(`${module.name}: ${address.slice(0, 8)}... ${match ? "✅" : "❌ 期望: " + expected.slice(0, 8) + "..."}`);
            } catch (e) {
                console.log(`${module.name}: ⚠️ 無法讀取`);
            }
        }
    } catch (error) {
        console.log("❌ 無法讀取 DungeonCore 設置");
    }
    
    // ============================================
    // 3. 檢查各合約的 DungeonCore 設置
    // ============================================
    console.log("\n🔄 各合約的 DungeonCore 設置:");
    console.log("-".repeat(60));
    
    const contractsWithCore = [
        "Hero", "Relic", "Party", "DungeonMaster", 
        "PlayerVault", "PlayerProfile", "VIPStaking"
    ];
    
    const coreCheckABI = [
        "function dungeonCoreAddress() view returns (address)",
        "function core() view returns (address)"
    ];
    
    for (const name of contractsWithCore) {
        try {
            const contract = new hre.ethers.Contract(CONTRACTS[name], coreCheckABI, signer);
            let coreAddress;
            
            try {
                coreAddress = await contract.dungeonCoreAddress();
            } catch {
                try {
                    coreAddress = await contract.core();
                } catch {
                    coreAddress = "無法讀取";
                }
            }
            
            if (coreAddress !== "無法讀取") {
                const match = coreAddress.toLowerCase() === CONTRACTS.DungeonCore.toLowerCase();
                console.log(`${name}: ${coreAddress.slice(0, 8)}... ${match ? "✅" : "❌"}`);
            } else {
                console.log(`${name}: ⚠️ 無法讀取 DungeonCore 地址`);
            }
        } catch (error) {
            console.log(`${name}: ❌ 錯誤`);
        }
    }
    
    // ============================================
    // 4. 檢查 DungeonMaster 和 DungeonStorage 連接
    // ============================================
    console.log("\n🗄️ DungeonMaster <-> DungeonStorage 連接:");
    console.log("-".repeat(60));
    
    const dmStorageABI = [
        "function dungeonStorageAddress() view returns (address)"
    ];
    
    try {
        const dm = new hre.ethers.Contract(CONTRACTS.DungeonMaster, dmStorageABI, signer);
        const storageAddress = await dm.dungeonStorageAddress();
        const match = storageAddress.toLowerCase() === CONTRACTS.DungeonStorage.toLowerCase();
        console.log(`DungeonMaster -> Storage: ${storageAddress.slice(0, 8)}... ${match ? "✅" : "❌"}`);
    } catch (error) {
        console.log("DungeonMaster -> Storage: ❌ 無法讀取");
    }
    
    // ============================================
    // 5. 檢查 Oracle 設置
    // ============================================
    console.log("\n💰 Oracle 價格源設置:");
    console.log("-".repeat(60));
    
    const oracleABI = [
        "function soulShardAddress() view returns (address)",
        "function usdAddress() view returns (address)"
    ];
    
    try {
        const oracle = new hre.ethers.Contract(CONTRACTS.Oracle, oracleABI, signer);
        
        const soulShardAddress = await oracle.soulShardAddress();
        const usdAddress = await oracle.usdAddress();
        
        console.log(`SoulShard: ${soulShardAddress.slice(0, 8)}... ${soulShardAddress.toLowerCase() === CONTRACTS.SoulShard.toLowerCase() ? "✅" : "❌"}`);
        console.log(`USD: ${usdAddress.slice(0, 8)}... ${usdAddress.toLowerCase() === CONTRACTS.USD.toLowerCase() ? "✅" : "❌"}`);
    } catch (error) {
        console.log("❌ 無法讀取 Oracle 設置");
    }
    
    // ============================================
    // 總結
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 連接狀態總結");
    console.log("=".repeat(60));
    
    console.log("\n關鍵連接:");
    console.log("1. VRF Manager -> 各合約: 檢查上方");
    console.log("2. DungeonCore -> 各模組: 檢查上方");
    console.log("3. 各合約 -> DungeonCore: 檢查上方");
    console.log("4. DungeonMaster -> DungeonStorage: 檢查上方");
    
    console.log("\n如果有 ❌ 標記，需要手動設置相應的連接。");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });