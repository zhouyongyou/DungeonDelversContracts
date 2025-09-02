// setup-v25-2-2-connections.js
// V25.2.2 專用互連設置腳本 - 設置所有必要連接

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔗 開始 V25.2.2 合約互連設置");
    console.log("=" + "=".repeat(60));
    
    const [signer] = await ethers.getSigners();
    console.log("👤 設置操作者:", signer.address);
    console.log("💰 操作者餘額:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "BNB");
    
    // V25.2.2 合約地址（2025-08-28 部署）
    const contractAddresses = {
        // 核心合約（保持穩定）
        DUNGEONCORE: "0x5b64a5939735ff762493d9b9666b3e13118c5722",
        ORACLE: "0xee322eff70320759487f67875113c062ac1f4cfb",
        
        // V25.2.2 新部署的9個合約
        HERO: "0x3052ab6c5b307478d943beba63efcdd97aecb526",
        RELIC: "0x5b967d67c7cbbcba140820757c670c99c61ee530",
        PARTY: "0x3cfed1ac185f66830342a9a796cb5bb4ef611fe6",
        DUNGEONMASTER: "0x0256aecec4d93ef13e14237ab5c63d2dd3eee2be",
        DUNGEONSTORAGE: "0x474ee307d9cd81670a4773e4e9a124853fa51db0",
        ALTAROFASCENSION: "0x3146e1026c134f098caf15c4e3c2b751a357d77c",
        PLAYERVAULT: "0x6a3fb49538c58cbeb537daf12c276cbc97c6e8ec",
        PLAYERPROFILE: "0xc869e2dcc64f76149e8392a0735b76bcfe79669a",
        VIPSTAKING: "0xacce5647880211c07d17eeae49364bb7db36aa3c",
        VRFCONSUMERV2PLUS: "0x934c8cd6c4f39673ca44c9e88a54cbe2f71782b9"
    };
    
    console.log("\n📋 V25.2.2 合約地址清單:");
    Object.entries(contractAddresses).forEach(([name, address]) => {
        console.log(`  ${name}:`, address);
    });
    
    // 獲取合約實例
    const contracts = {};
    
    console.log("\n🏭 創建合約實例...");
    
    // DungeonCore - 核心中樞
    contracts.dungeonCore = await ethers.getContractAt("DungeonCore", contractAddresses.DUNGEONCORE);
    console.log("✅ DungeonCore 實例已創建");
    
    // VRF Consumer
    contracts.vrfConsumer = await ethers.getContractAt("VRFConsumerV2Plus", contractAddresses.VRFCONSUMERV2PLUS);
    console.log("✅ VRFConsumerV2Plus 實例已創建");
    
    // NFT 合約
    contracts.hero = await ethers.getContractAt("Hero", contractAddresses.HERO);
    console.log("✅ Hero 實例已創建");
    
    contracts.relic = await ethers.getContractAt("Relic", contractAddresses.RELIC);
    console.log("✅ Relic 實例已創建");
    
    contracts.party = await ethers.getContractAt("Party", contractAddresses.PARTY);
    console.log("✅ Party 實例已創建");
    
    contracts.playerProfile = await ethers.getContractAt("PlayerProfile", contractAddresses.PLAYERPROFILE);
    console.log("✅ PlayerProfile 實例已創建");
    
    contracts.vipStaking = await ethers.getContractAt("VIPStaking", contractAddresses.VIPSTAKING);
    console.log("✅ VIPStaking 實例已創建");
    
    // 遊戲邏輯合約
    contracts.dungeonMaster = await ethers.getContractAt("DungeonMaster", contractAddresses.DUNGEONMASTER);
    console.log("✅ DungeonMaster 實例已創建");
    
    contracts.dungeonStorage = await ethers.getContractAt("DungeonStorage", contractAddresses.DUNGEONSTORAGE);
    console.log("✅ DungeonStorage 實例已創建");
    
    contracts.altar = await ethers.getContractAt("AltarOfAscension", contractAddresses.ALTAROFASCENSION);
    console.log("✅ AltarOfAscension 實例已創建");
    
    contracts.playerVault = await ethers.getContractAt("PlayerVault", contractAddresses.PLAYERVAULT);
    console.log("✅ PlayerVault 實例已創建");
    
    // === 開始設置互連 ===
    console.log("\n" + "=".repeat(60));
    console.log("🔗 開始設置合約互連");
    console.log("=".repeat(60));
    
    const results = {
        successful: [],
        failed: [],
        skipped: []
    };
    
    // Helper function for safe transaction execution
    async function safeExecute(description, contractMethod, ...args) {
        try {
            console.log(`\n🔄 ${description}...`);
            
            const tx = await contractMethod(...args);
            console.log(`   交易已發送: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`   Gas 使用: ${receipt.gasUsed.toString()}`);
            console.log(`✅ ${description} 完成`);
            
            results.successful.push(description);
            
        } catch (error) {
            if (error.message.includes("already set") || 
                error.message.includes("Same address") || 
                error.message.includes("Already authorized")) {
                console.log(`ℹ️  ${description} 已設置，跳過`);
                results.skipped.push(description);
            } else {
                console.error(`❌ ${description} 失敗: ${error.message}`);
                results.failed.push(`${description}: ${error.message}`);
            }
        }
    }
    
    // === Phase 1: 設置 DungeonCore 中的合約地址 ===
    console.log("\n📍 Phase 1: 配置 DungeonCore 合約註冊");
    
    // 檢查當前註冊狀態
    console.log("\n🔍 檢查當前 DungeonCore 註冊狀態...");
    
    try {
        const currentHero = await contracts.dungeonCore.heroContractAddress();
        const currentRelic = await contracts.dungeonCore.relicContractAddress();
        const currentParty = await contracts.dungeonCore.partyContractAddress();
        const currentProfile = await contracts.dungeonCore.playerProfileAddress();
        const currentVIP = await contracts.dungeonCore.vipStakingAddress();
        const currentDM = await contracts.dungeonCore.dungeonMasterAddress();
        const currentAltar = await contracts.dungeonCore.altarOfAscensionAddress();
        const currentVault = await contracts.dungeonCore.playerVaultAddress();
        const currentVRF = await contracts.dungeonCore.getVRFManager();
        
        console.log("  Hero:", currentHero);
        console.log("  Relic:", currentRelic);
        console.log("  Party:", currentParty);
        console.log("  Profile:", currentProfile);
        console.log("  VIP:", currentVIP);
        console.log("  DungeonMaster:", currentDM);
        console.log("  Altar:", currentAltar);
        console.log("  Vault:", currentVault);
        console.log("  VRF Manager:", currentVRF);
    } catch (error) {
        console.log("  某些地址尚未設置，將進行設置...");
    }
    
    // 設置各個合約地址
    await safeExecute(
        "DungeonCore → Hero 註冊",
        contracts.dungeonCore.setHeroContract,
        contractAddresses.HERO
    );
    
    await safeExecute(
        "DungeonCore → Relic 註冊",
        contracts.dungeonCore.setRelicContract,
        contractAddresses.RELIC
    );
    
    await safeExecute(
        "DungeonCore → Party 註冊",
        contracts.dungeonCore.setPartyContract,
        contractAddresses.PARTY
    );
    
    await safeExecute(
        "DungeonCore → PlayerProfile 註冊",
        contracts.dungeonCore.setPlayerProfile,
        contractAddresses.PLAYERPROFILE
    );
    
    await safeExecute(
        "DungeonCore → VIPStaking 註冊",
        contracts.dungeonCore.setVipStaking,
        contractAddresses.VIPSTAKING
    );
    
    await safeExecute(
        "DungeonCore → DungeonMaster 註冊",
        contracts.dungeonCore.setDungeonMaster,
        contractAddresses.DUNGEONMASTER
    );
    
    await safeExecute(
        "DungeonCore → AltarOfAscension 註冊",
        contracts.dungeonCore.setAltarOfAscension,
        contractAddresses.ALTAROFASCENSION
    );
    
    await safeExecute(
        "DungeonCore → PlayerVault 註冊",
        contracts.dungeonCore.setPlayerVault,
        contractAddresses.PLAYERVAULT
    );
    
    await safeExecute(
        "DungeonCore → VRF Manager 註冊",
        contracts.dungeonCore.setVRFManager,
        contractAddresses.VRFCONSUMERV2PLUS
    );
    
    // === Phase 2: 各合約設置 DungeonCore 連接 ===
    console.log("\n📍 Phase 2: 各合約連接到 DungeonCore");
    
    await safeExecute(
        "Hero → DungeonCore 連接",
        contracts.hero.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    await safeExecute(
        "Relic → DungeonCore 連接",
        contracts.relic.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    await safeExecute(
        "Party → DungeonCore 連接",
        contracts.party.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    await safeExecute(
        "PlayerProfile → DungeonCore 連接",
        contracts.playerProfile.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    await safeExecute(
        "VIPStaking → DungeonCore 連接",
        contracts.vipStaking.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    await safeExecute(
        "DungeonMaster → DungeonCore 連接",
        contracts.dungeonMaster.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    await safeExecute(
        "AltarOfAscension → DungeonCore 連接",
        contracts.altar.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    await safeExecute(
        "PlayerVault → DungeonCore 連接",
        contracts.playerVault.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    // === Phase 3: DungeonMaster 設置 DungeonStorage ===
    console.log("\n📍 Phase 3: DungeonMaster 設置 DungeonStorage");
    
    await safeExecute(
        "DungeonMaster → DungeonStorage 連接",
        contracts.dungeonMaster.setDungeonStorageContract,
        contractAddresses.DUNGEONSTORAGE
    );
    
    // === Phase 4: VRF Manager 設置 ===
    console.log("\n📍 Phase 4: VRF Manager 設置");
    
    await safeExecute(
        "VRF Manager → DungeonCore 連接",
        contracts.vrfConsumer.setDungeonCore,
        contractAddresses.DUNGEONCORE
    );
    
    // VRF Manager 授權 Hero 和 Relic 合約
    await safeExecute(
        "VRF Manager 授權 Hero",
        contracts.vrfConsumer.authorize,
        contractAddresses.HERO
    );
    
    await safeExecute(
        "VRF Manager 授權 Relic",
        contracts.vrfConsumer.authorize,
        contractAddresses.RELIC
    );
    
    await safeExecute(
        "VRF Manager 授權 DungeonMaster",
        contracts.vrfConsumer.authorize,
        contractAddresses.DUNGEONMASTER
    );
    
    await safeExecute(
        "VRF Manager 授權 AltarOfAscension",
        contracts.vrfConsumer.authorize,
        contractAddresses.ALTAROFASCENSION
    );
    
    // === 最終驗證 ===
    console.log("\n📍 最終驗證合約連接狀態");
    
    try {
        // 驗證 DungeonCore 註冊
        const finalHero = await contracts.dungeonCore.heroContractAddress();
        const finalRelic = await contracts.dungeonCore.relicContractAddress();
        const finalParty = await contracts.dungeonCore.partyContractAddress();
        const finalVRF = await contracts.dungeonCore.getVRFManager();
        
        console.log("\n✅ DungeonCore 註冊驗證:");
        console.log("  Hero:", finalHero === contractAddresses.HERO ? "✅" : "❌");
        console.log("  Relic:", finalRelic === contractAddresses.RELIC ? "✅" : "❌");
        console.log("  Party:", finalParty === contractAddresses.PARTY ? "✅" : "❌");
        console.log("  VRF:", finalVRF === contractAddresses.VRFCONSUMERV2PLUS ? "✅" : "❌");
        
        // 驗證各合約的 DungeonCore 連接
        const heroDC = await contracts.hero.dungeonCore();
        const relicDC = await contracts.relic.dungeonCore();
        const partyDC = await contracts.party.dungeonCore();
        
        console.log("\n✅ 合約 → DungeonCore 連接驗證:");
        console.log("  Hero → DC:", heroDC === contractAddresses.DUNGEONCORE ? "✅" : "❌");
        console.log("  Relic → DC:", relicDC === contractAddresses.DUNGEONCORE ? "✅" : "❌");
        console.log("  Party → DC:", partyDC === contractAddresses.DUNGEONCORE ? "✅" : "❌");
        
        // 驗證 DungeonMaster 的 DungeonStorage
        const dmStorage = await contracts.dungeonMaster.dungeonStorage();
        console.log("\n✅ DungeonMaster → DungeonStorage:", dmStorage === contractAddresses.DUNGEONSTORAGE ? "✅" : "❌");
        
        // 驗證 VRF 授權
        const heroAuthorized = await contracts.vrfConsumer.authorized(contractAddresses.HERO);
        const relicAuthorized = await contracts.vrfConsumer.authorized(contractAddresses.RELIC);
        
        console.log("\n✅ VRF Manager 授權驗證:");
        console.log("  Hero 授權:", heroAuthorized ? "✅" : "❌");
        console.log("  Relic 授權:", relicAuthorized ? "✅" : "❌");
        
    } catch (error) {
        console.log("\n⚠️ 驗證時發生錯誤:", error.message);
    }
    
    // === 設置總結 ===
    console.log("\n" + "=".repeat(60));
    console.log("📊 互連設置完成總結");
    console.log("=".repeat(60));
    
    console.log(`✅ 成功設置: ${results.successful.length} 個連接`);
    console.log(`ℹ️  跳過設置: ${results.skipped.length} 個連接`);
    console.log(`❌ 設置失敗: ${results.failed.length} 個連接`);
    
    if (results.successful.length > 0) {
        console.log("\n✅ 成功設置的連接:");
        results.successful.forEach(item => console.log(`  - ${item}`));
    }
    
    if (results.skipped.length > 0) {
        console.log("\n⏭️  跳過的連接:");
        results.skipped.forEach(item => console.log(`  - ${item}`));
    }
    
    if (results.failed.length > 0) {
        console.log("\n❌ 失敗的連接:");
        results.failed.forEach(item => console.log(`  - ${item}`));
    }
    
    // 保存設置記錄
    const setupRecord = {
        version: "V25.2.2",
        timestamp: new Date().toISOString(),
        network: "BSC Mainnet",
        chainId: "56",
        signer: signer.address,
        contractAddresses,
        results,
        startBlock: 59164304
    };
    
    const recordPath = path.join(__dirname, `../deployments/v25-2-2-interconnection-${Date.now()}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(setupRecord, null, 2));
    console.log("\n💾 設置記錄已保存:", recordPath);
    
    if (results.failed.length === 0) {
        console.log("\n🎉 V25.2.2 所有互連設置完成！系統已準備就緒。");
    } else {
        console.log("\n⚠️  部分設置失敗，請檢查錯誤信息並手動修復。");
    }
}

// 錯誤處理
main()
    .then(() => {
        console.log("\n✅ 互連設置腳本執行完成");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 互連設置流程失敗:");
        console.error(error);
        process.exit(1);
    });