const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 檢查 DungeonDelvers 合約部署狀態...\n");
    
    // 從環境變數或直接指定地址
    const addresses = {
        dungeonCore: process.env.DUNGEONCORE_ADDRESS || "0xA75e7928970517dcccf14b30a866b59AB3d13939",
        dungeonMaster: process.env.DUNGEONMASTER_ADDRESS || "0xF31C19771B20025E967Db7b5db2D1663C3623eA2",
        dungeonStorage: process.env.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647", // 注意：CLAUDE.md 中標記為 DUNGEONMASTERWALLET_ADDRESS
        hero: process.env.HERO_ADDRESS || "0x929a4187A462314FCC480Ff547019fA122a283F0",
        relic: process.env.RELIC_ADDRESS || "0x1067295025d21F59c8ACb5e777E42F3866a6d2ff",
        party: process.env.PARTY_ADDRESS || "0x8e8a8226C95417d249680e9809aa9Dd99D05Ef17",
        soulShard: process.env.SOULSHARD_ADDRESS || "0x9FbEc5f0d73D86B1d1C72D97e8973E476cA0E7Be",
        playerVault: process.env.PLAYERVAULT_ADDRESS || "0x5A0f6B1a0EA1a3E43a03703055b14786Ce1EeEe9",
        altar: process.env.ALTAROFASCENSION_ADDRESS || "0xB8B7d8AEc10d7F4927fC7220d350F8fF09D00F38",
    };
    
    const issues = [];
    
    try {
        // 1. 檢查 DungeonCore 設置
        console.log("1️⃣ 檢查 DungeonCore 設置:");
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        
        const soulShardInCore = await dungeonCore.soulShardTokenAddress();
        console.log(`   SoulShard: ${soulShardInCore} ${soulShardInCore.toLowerCase() === addresses.soulShard.toLowerCase() ? '✅' : '❌'}`);
        
        const dungeonMasterInCore = await dungeonCore.dungeonMasterAddress();
        console.log(`   DungeonMaster: ${dungeonMasterInCore} ${dungeonMasterInCore.toLowerCase() === addresses.dungeonMaster.toLowerCase() ? '✅' : '❌'}`);
        
        const heroInCore = await dungeonCore.heroContractAddress();
        console.log(`   Hero: ${heroInCore} ${heroInCore.toLowerCase() === addresses.hero.toLowerCase() ? '✅' : '❌'}`);
        
        const relicInCore = await dungeonCore.relicContractAddress();
        console.log(`   Relic: ${relicInCore} ${relicInCore.toLowerCase() === addresses.relic.toLowerCase() ? '✅' : '❌'}`);
        
        const partyInCore = await dungeonCore.partyContractAddress();
        console.log(`   Party: ${partyInCore} ${partyInCore.toLowerCase() === addresses.party.toLowerCase() ? '✅' : '❌'}`);
        
        const playerVaultInCore = await dungeonCore.playerVaultAddress();
        console.log(`   PlayerVault: ${playerVaultInCore} ${playerVaultInCore.toLowerCase() === addresses.playerVault.toLowerCase() ? '✅' : '❌'}`);
        
        const altarInCore = await dungeonCore.altarOfAscensionAddress();
        console.log(`   Altar: ${altarInCore} ${altarInCore.toLowerCase() === addresses.altar.toLowerCase() ? '✅' : '❌'}`);
        
        // 2. 檢查 DungeonMaster 設置
        console.log("\n2️⃣ 檢查 DungeonMaster 設置:");
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        
        const coreInMaster = await dungeonMaster.dungeonCore();
        console.log(`   DungeonCore: ${coreInMaster} ${coreInMaster.toLowerCase() === addresses.dungeonCore.toLowerCase() ? '✅' : '❌'}`);
        if (coreInMaster === "0x0000000000000000000000000000000000000000") {
            issues.push("DungeonCore 未在 DungeonMaster 中設置");
        }
        
        const storageInMaster = await dungeonMaster.dungeonStorage();
        console.log(`   DungeonStorage: ${storageInMaster} ${storageInMaster !== "0x0000000000000000000000000000000000000000" ? '✅' : '❌'}`);
        if (storageInMaster === "0x0000000000000000000000000000000000000000") {
            issues.push("DungeonStorage 未在 DungeonMaster 中設置");
        }
        
        // 3. 檢查 DungeonStorage 設置（如果地址正確）
        if (storageInMaster !== "0x0000000000000000000000000000000000000000") {
            console.log("\n3️⃣ 檢查 DungeonStorage 設置:");
            const dungeonStorage = await ethers.getContractAt("DungeonStorage", storageInMaster);
            
            const logicContract = await dungeonStorage.logicContract();
            console.log(`   LogicContract: ${logicContract} ${logicContract.toLowerCase() === addresses.dungeonMaster.toLowerCase() ? '✅' : '❌'}`);
            if (logicContract.toLowerCase() !== addresses.dungeonMaster.toLowerCase()) {
                issues.push("DungeonMaster 未被設為 DungeonStorage 的 logicContract");
            }
            
            // 檢查地下城是否已初始化
            console.log("\n   地下城初始化狀態:");
            for (let i = 1; i <= 10; i++) {
                const dungeon = await dungeonStorage.getDungeon(i);
                console.log(`   地下城 ${i}: ${dungeon.isInitialized ? '✅ 已初始化' : '❌ 未初始化'} (戰力要求: ${dungeon.requiredPower})`);
            }
        }
        
        // 4. 檢查 NFT 合約的 DungeonCore 設置
        console.log("\n4️⃣ 檢查 NFT 合約的 DungeonCore 設置:");
        const hero = await ethers.getContractAt("Hero", addresses.hero);
        const heroCore = await hero.dungeonCore();
        console.log(`   Hero -> DungeonCore: ${heroCore} ${heroCore.toLowerCase() === addresses.dungeonCore.toLowerCase() ? '✅' : '❌'}`);
        
        const relic = await ethers.getContractAt("Relic", addresses.relic);
        const relicCore = await relic.dungeonCore();
        console.log(`   Relic -> DungeonCore: ${relicCore} ${relicCore.toLowerCase() === addresses.dungeonCore.toLowerCase() ? '✅' : '❌'}`);
        
        const party = await ethers.getContractAt("Party", addresses.party);
        const partyCore = await party.dungeonCoreContract();
        console.log(`   Party -> DungeonCore: ${partyCore} ${partyCore.toLowerCase() === addresses.dungeonCore.toLowerCase() ? '✅' : '❌'}`);
        
        // 5. 檢查 Altar 設置
        console.log("\n5️⃣ 檢查 AltarOfAscension 設置:");
        const altar = await ethers.getContractAt("AltarOfAscension", addresses.altar);
        
        const altarCore = await altar.dungeonCore();
        console.log(`   DungeonCore: ${altarCore} ${altarCore.toLowerCase() === addresses.dungeonCore.toLowerCase() ? '✅' : '❌'}`);
        
        const altarHero = await altar.heroContract();
        console.log(`   Hero: ${altarHero} ${altarHero.toLowerCase() === addresses.hero.toLowerCase() ? '✅' : '❌'}`);
        
        const altarRelic = await altar.relicContract();
        console.log(`   Relic: ${altarRelic} ${altarRelic.toLowerCase() === addresses.relic.toLowerCase() ? '✅' : '❌'}`);
        
        // 檢查 NFT 合約是否設置了 Altar 地址
        const heroAltar = await hero.ascensionAltarAddress();
        console.log(`   Hero -> Altar: ${heroAltar} ${heroAltar.toLowerCase() === addresses.altar.toLowerCase() ? '✅' : '❌'}`);
        
        const relicAltar = await relic.ascensionAltarAddress();
        console.log(`   Relic -> Altar: ${relicAltar} ${relicAltar.toLowerCase() === addresses.altar.toLowerCase() ? '✅' : '❌'}`);
        
        // 總結
        console.log("\n📋 檢查總結:");
        if (issues.length === 0) {
            console.log("✅ 所有合約連接正常！");
        } else {
            console.log("❌ 發現以下問題:");
            issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
            
            console.log("\n🔧 修復建議:");
            if (issues.includes("DungeonCore 未在 DungeonMaster 中設置")) {
                console.log("   執行: DungeonMaster.setDungeonCore(dungeonCoreAddress)");
            }
            if (issues.includes("DungeonStorage 未在 DungeonMaster 中設置")) {
                console.log("   執行: DungeonMaster.setDungeonStorage(dungeonStorageAddress)");
            }
            if (issues.includes("DungeonMaster 未被設為 DungeonStorage 的 logicContract")) {
                console.log("   執行: DungeonStorage.setLogicContract(dungeonMasterAddress)");
            }
        }
        
    } catch (error) {
        console.error("\n❌ 檢查過程中發生錯誤:");
        console.error(error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });