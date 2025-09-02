// verify-v25-2-2-connections.js
// V25.2.2 合約連接驗證腳本

const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 V25.2.2 合約連接狀態驗證");
    console.log("=".repeat(60));
    
    // V25.2.2 合約地址
    const contractAddresses = {
        DUNGEONCORE: "0x5b64a5939735ff762493d9b9666b3e13118c5722",
        ORACLE: "0xee322eff70320759487f67875113c062ac1f4cfb",
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
    
    const results = {
        correct: [],
        incorrect: [],
        errors: []
    };
    
    console.log("\n📋 檢查 DungeonCore 註冊狀態");
    console.log("-".repeat(60));
    
    try {
        const dungeonCore = await ethers.getContractAt("DungeonCore", contractAddresses.DUNGEONCORE);
        
        // 檢查各個合約地址
        const checks = [
            { name: "Hero", method: "heroContractAddress", expected: contractAddresses.HERO },
            { name: "Relic", method: "relicContractAddress", expected: contractAddresses.RELIC },
            { name: "Party", method: "partyContractAddress", expected: contractAddresses.PARTY },
            { name: "PlayerProfile", method: "playerProfileAddress", expected: contractAddresses.PLAYERPROFILE },
            { name: "VIPStaking", method: "vipStakingAddress", expected: contractAddresses.VIPSTAKING },
            { name: "DungeonMaster", method: "dungeonMasterAddress", expected: contractAddresses.DUNGEONMASTER },
            { name: "AltarOfAscension", method: "altarOfAscensionAddress", expected: contractAddresses.ALTAROFASCENSION },
            { name: "PlayerVault", method: "playerVaultAddress", expected: contractAddresses.PLAYERVAULT },
            { name: "VRF Manager", method: "getVRFManager", expected: contractAddresses.VRFCONSUMERV2PLUS }
        ];
        
        for (const check of checks) {
            try {
                const actual = await dungeonCore[check.method]();
                const actualLower = actual.toLowerCase();
                const expectedLower = check.expected.toLowerCase();
                
                if (actualLower === expectedLower) {
                    console.log(`✅ ${check.name}: ${actual}`);
                    results.correct.push(`DungeonCore → ${check.name}`);
                } else {
                    console.log(`❌ ${check.name}: 預期 ${check.expected}, 實際 ${actual}`);
                    results.incorrect.push(`DungeonCore → ${check.name}`);
                }
            } catch (error) {
                console.log(`⚠️ ${check.name}: 無法讀取 (${error.message})`);
                results.errors.push(`DungeonCore → ${check.name}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log("❌ 無法連接到 DungeonCore:", error.message);
        results.errors.push(`DungeonCore: ${error.message}`);
    }
    
    console.log("\n📋 檢查各合約的 DungeonCore 連接");
    console.log("-".repeat(60));
    
    // 檢查各個合約是否正確設置了 DungeonCore
    const contractsToCheck = [
        { name: "Hero", address: contractAddresses.HERO, abi: "Hero" },
        { name: "Relic", address: contractAddresses.RELIC, abi: "Relic" },
        { name: "Party", address: contractAddresses.PARTY, abi: "Party" },
        { name: "PlayerProfile", address: contractAddresses.PLAYERPROFILE, abi: "PlayerProfile" },
        { name: "VIPStaking", address: contractAddresses.VIPSTAKING, abi: "VIPStaking" },
        { name: "DungeonMaster", address: contractAddresses.DUNGEONMASTER, abi: "DungeonMaster" },
        { name: "AltarOfAscension", address: contractAddresses.ALTAROFASCENSION, abi: "AltarOfAscension" },
        { name: "PlayerVault", address: contractAddresses.PLAYERVAULT, abi: "PlayerVault" }
    ];
    
    for (const contract of contractsToCheck) {
        try {
            const instance = await ethers.getContractAt(contract.abi, contract.address);
            const dungeonCoreAddress = await instance.dungeonCore();
            const actualLower = dungeonCoreAddress.toLowerCase();
            const expectedLower = contractAddresses.DUNGEONCORE.toLowerCase();
            
            if (actualLower === expectedLower) {
                console.log(`✅ ${contract.name} → DungeonCore: ${dungeonCoreAddress}`);
                results.correct.push(`${contract.name} → DungeonCore`);
            } else {
                console.log(`❌ ${contract.name} → DungeonCore: 預期 ${contractAddresses.DUNGEONCORE}, 實際 ${dungeonCoreAddress}`);
                results.incorrect.push(`${contract.name} → DungeonCore`);
            }
        } catch (error) {
            console.log(`⚠️ ${contract.name}: 無法讀取 DungeonCore (${error.message})`);
            results.errors.push(`${contract.name}: ${error.message}`);
        }
    }
    
    console.log("\n📋 檢查 VRF Manager 設置");
    console.log("-".repeat(60));
    
    try {
        const vrfConsumer = await ethers.getContractAt("VRFConsumerV2Plus", contractAddresses.VRFCONSUMERV2PLUS);
        
        // 檢查 VRF Manager 的 DungeonCore
        const vrfDungeonCore = await vrfConsumer.dungeonCore();
        const vrfDCLower = vrfDungeonCore.toLowerCase();
        const expectedDCLower = contractAddresses.DUNGEONCORE.toLowerCase();
        
        if (vrfDCLower === expectedDCLower) {
            console.log(`✅ VRF Manager → DungeonCore: ${vrfDungeonCore}`);
            results.correct.push("VRF Manager → DungeonCore");
        } else {
            console.log(`❌ VRF Manager → DungeonCore: 預期 ${contractAddresses.DUNGEONCORE}, 實際 ${vrfDungeonCore}`);
            results.incorrect.push("VRF Manager → DungeonCore");
        }
        
        // 檢查授權狀態
        console.log("\n🔑 VRF 授權狀態:");
        const contractsToAuthorize = [
            { name: "Hero", address: contractAddresses.HERO },
            { name: "Relic", address: contractAddresses.RELIC },
            { name: "DungeonMaster", address: contractAddresses.DUNGEONMASTER },
            { name: "AltarOfAscension", address: contractAddresses.ALTAROFASCENSION }
        ];
        
        for (const contract of contractsToAuthorize) {
            try {
                const isAuthorized = await vrfConsumer.authorized(contract.address);
                if (isAuthorized) {
                    console.log(`  ✅ ${contract.name} 已授權`);
                    results.correct.push(`VRF → ${contract.name} 授權`);
                } else {
                    console.log(`  ❌ ${contract.name} 未授權`);
                    results.incorrect.push(`VRF → ${contract.name} 授權`);
                }
            } catch (error) {
                console.log(`  ⚠️ 無法檢查 ${contract.name} 授權狀態`);
                results.errors.push(`VRF → ${contract.name} 授權檢查失敗`);
            }
        }
        
    } catch (error) {
        console.log("❌ 無法連接到 VRF Manager:", error.message);
        results.errors.push(`VRF Manager: ${error.message}`);
    }
    
    console.log("\n📋 檢查 DungeonMaster → DungeonStorage 連接");
    console.log("-".repeat(60));
    
    try {
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", contractAddresses.DUNGEONMASTER);
        const dungeonStorage = await dungeonMaster.dungeonStorage();
        const actualDSLower = dungeonStorage.toLowerCase();
        const expectedDSLower = contractAddresses.DUNGEONSTORAGE.toLowerCase();
        
        if (actualDSLower === expectedDSLower) {
            console.log(`✅ DungeonMaster → DungeonStorage: ${dungeonStorage}`);
            results.correct.push("DungeonMaster → DungeonStorage");
        } else {
            console.log(`❌ DungeonMaster → DungeonStorage: 預期 ${contractAddresses.DUNGEONSTORAGE}, 實際 ${dungeonStorage}`);
            results.incorrect.push("DungeonMaster → DungeonStorage");
        }
    } catch (error) {
        console.log(`⚠️ DungeonMaster → DungeonStorage: 無法讀取 (${error.message})`);
        results.errors.push(`DungeonMaster → DungeonStorage: ${error.message}`);
    }
    
    // 總結報告
    console.log("\n" + "=".repeat(60));
    console.log("📊 V25.2.2 連接驗證總結");
    console.log("=".repeat(60));
    
    console.log(`\n✅ 正確連接: ${results.correct.length} 個`);
    if (results.correct.length > 0) {
        results.correct.forEach(item => console.log(`  - ${item}`));
    }
    
    console.log(`\n❌ 錯誤連接: ${results.incorrect.length} 個`);
    if (results.incorrect.length > 0) {
        results.incorrect.forEach(item => console.log(`  - ${item}`));
    }
    
    console.log(`\n⚠️ 無法驗證: ${results.errors.length} 個`);
    if (results.errors.length > 0) {
        results.errors.forEach(item => console.log(`  - ${item}`));
    }
    
    // 最終判定
    if (results.incorrect.length === 0 && results.errors.length === 0) {
        console.log("\n🎉 所有連接都已正確設置！");
    } else {
        console.log("\n⚠️ 有些連接需要修復，請檢查上述錯誤信息。");
    }
    
    // 功能測試建議
    console.log("\n📝 建議的功能測試:");
    console.log("1. Hero NFT 鑄造測試");
    console.log("2. Relic NFT 鑄造測試");
    console.log("3. 地城探索測試");
    console.log("4. VRF 隨機數生成測試");
    console.log("5. 升星功能測試");
    
    return results;
}

// 錯誤處理
main()
    .then((results) => {
        console.log("\n✅ 驗證完成");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 驗證失敗:");
        console.error(error);
        process.exit(1);
    });