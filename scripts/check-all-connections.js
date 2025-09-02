const hre = require("hardhat");

async function main() {
    console.log("🔍 檢查所有合約互連狀態...\n");
    
    // V25.0.4 合約地址
    const CONTRACTS = {
        // 核心合約
        DungeonCore: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
        Oracle: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
        
        // NFT 合約
        Hero: "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19",
        Relic: "0x91Bf924E9CEF490F7C999C1F083eE1636595220D",
        Party: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
        
        // 遊戲合約
        DungeonMaster: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
        DungeonStorage: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
        AltarOfAscension: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
        PlayerVault: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
        PlayerProfile: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
        VIPStaking: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661",
        
        // Token 合約
        SoulShard: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
        USD: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
        
        // VRF Manager
        VRFManager: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f"
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
        "function heroContractAddress() view returns (address)",
        "function relicContractAddress() view returns (address)",
        "function partyContractAddress() view returns (address)",
        "function dungeonMasterAddress() view returns (address)",
        "function altarOfAscensionAddress() view returns (address)",
        "function playerVaultAddress() view returns (address)",
        "function playerProfileAddress() view returns (address)",
        "function vipStakingAddress() view returns (address)",
        "function oracleAddress() view returns (address)",
        "function soulShardTokenAddress() view returns (address)"
    ];
    
    try {
        const dungeonCore = new hre.ethers.Contract(CONTRACTS.DungeonCore, dungeonCoreABI, signer);
        
        const modules = [
            { name: "Hero", getter: "heroContractAddress" },
            { name: "Relic", getter: "relicContractAddress" },
            { name: "Party", getter: "partyContractAddress" },
            { name: "DungeonMaster", getter: "dungeonMasterAddress" },
            { name: "AltarOfAscension", getter: "altarOfAscensionAddress" },
            { name: "PlayerVault", getter: "playerVaultAddress" },
            { name: "PlayerProfile", getter: "playerProfileAddress" },
            { name: "VIPStaking", getter: "vipStakingAddress" },
            { name: "Oracle", getter: "oracleAddress" },
            { name: "SoulShard", getter: "soulShardTokenAddress" }
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
        "function dungeonCore() view returns (address)",
        "function core() view returns (address)"
    ];
    
    for (const name of contractsWithCore) {
        try {
            const contract = new hre.ethers.Contract(CONTRACTS[name], coreCheckABI, signer);
            let coreAddress;
            
            try {
                coreAddress = await contract.dungeonCore();
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
        "function dungeonStorage() view returns (address)"
    ];
    
    try {
        const dm = new hre.ethers.Contract(CONTRACTS.DungeonMaster, dmStorageABI, signer);
        const storageAddress = await dm.dungeonStorage();
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
        "function soulShardToken() view returns (address)",
        "function usdToken() view returns (address)"
    ];
    
    try {
        const oracle = new hre.ethers.Contract(CONTRACTS.Oracle, oracleABI, signer);
        
        const soulShardAddress = await oracle.soulShardToken();
        const usdAddress = await oracle.usdToken();
        
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