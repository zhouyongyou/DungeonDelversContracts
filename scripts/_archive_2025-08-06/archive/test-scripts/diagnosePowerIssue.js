// diagnosePowerIssue.js - 診斷 Party 戰力讀取問題
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 診斷 Party 戰力讀取問題...\n");
    
    // 合約地址（請根據實際部署地址修改）
    const PARTY_ADDRESS = "0xcB580B4F444D72853800e6e4A3e01BD919271179";
    const HERO_ADDRESS = "0x33d94b7F5E32aAdEf1BD40C529c8552f0bB6d1CB";
    const DUNGEON_MASTER_ADDRESS = "YOUR_DUNGEON_MASTER_ADDRESS";
    
    // 獲取合約實例
    const Party = await ethers.getContractAt("Party", PARTY_ADDRESS);
    const Hero = await ethers.getContractAt("Hero", HERO_ADDRESS);
    const DungeonMaster = await ethers.getContractAt("DungeonMasterV5", DUNGEON_MASTER_ADDRESS);
    
    // 測試的 Party ID
    const testPartyId = 1; // 請修改為實際的 Party ID
    
    try {
        console.log(`📋 測試 Party #${testPartyId}`);
        
        // 1. 從 Party 合約讀取組成
        console.log("\n1️⃣ 從 Party 合約讀取資料:");
        const composition = await Party.getFullPartyComposition(testPartyId);
        console.log("   英雄 IDs:", composition.heroIds);
        console.log("   聖物 IDs:", composition.relicIds);
        console.log("   總戰力:", composition.totalPower.toString());
        console.log("   總容量:", composition.totalCapacity.toString());
        console.log("   稀有度:", composition.partyRarity);
        
        // 2. 使用 getPartyComposition 函數
        console.log("\n2️⃣ 使用 getPartyComposition 函數:");
        const [power, capacity] = await Party.getPartyComposition(testPartyId);
        console.log("   戰力:", power.toString());
        console.log("   容量:", capacity.toString());
        
        // 3. 手動計算英雄戰力總和
        console.log("\n3️⃣ 手動驗證英雄戰力:");
        let calculatedPower = 0;
        for (const heroId of composition.heroIds) {
            const [rarity, heroPower] = await Hero.getHeroProperties(heroId);
            console.log(`   英雄 #${heroId}: 稀有度=${rarity}, 戰力=${heroPower}`);
            calculatedPower += Number(heroPower);
        }
        console.log(`   計算總戰力: ${calculatedPower}`);
        
        // 4. 從 DungeonMaster 讀取
        if (DUNGEON_MASTER_ADDRESS !== "YOUR_DUNGEON_MASTER_ADDRESS") {
            console.log("\n4️⃣ 從 DungeonMaster 讀取:");
            const [dmPower, dmCapacity] = await DungeonMaster.getPartyPower(testPartyId);
            console.log("   DM 讀取戰力:", dmPower.toString());
            console.log("   DM 讀取容量:", dmCapacity.toString());
        }
        
        // 5. 診斷結果
        console.log("\n📊 診斷結果:");
        console.log("   儲存的戰力:", composition.totalPower.toString());
        console.log("   計算的戰力:", calculatedPower);
        console.log("   差異:", Number(composition.totalPower) - calculatedPower);
        
        if (Number(composition.totalPower) !== calculatedPower) {
            console.log("\n⚠️  警告: 儲存的戰力與實際計算不符!");
            console.log("   可能原因:");
            console.log("   1. 英雄升級後未更新 Party 戰力");
            console.log("   2. 創建 Party 時計算錯誤");
            console.log("   3. 資料儲存時發生覆蓋");
        } else {
            console.log("\n✅ 戰力資料一致!");
        }
        
        // 6. 檢查儲存結構
        console.log("\n6️⃣ 檢查儲存結構:");
        const partyData = await Party.partyCompositions(testPartyId);
        console.log("   原始資料:", partyData);
        
    } catch (error) {
        console.error("\n❌ 診斷過程中發生錯誤:");
        console.error(error);
    }
}

// 輔助函數：檢查多個 Party
async function checkMultipleParties(partyIds) {
    console.log("\n🔍 批量檢查 Party 戰力...");
    
    const Party = await ethers.getContractAt("Party", PARTY_ADDRESS);
    const issues = [];
    
    for (const id of partyIds) {
        try {
            const [power, capacity] = await Party.getPartyComposition(id);
            console.log(`Party #${id}: 戰力=${power}, 容量=${capacity}`);
            
            if (Number(power) < 100) {
                issues.push({ id, power: Number(power), issue: "戰力異常低" });
            }
        } catch (error) {
            issues.push({ id, issue: "讀取失敗", error: error.message });
        }
    }
    
    if (issues.length > 0) {
        console.log("\n⚠️  發現問題:");
        issues.forEach(issue => {
            console.log(`   Party #${issue.id}: ${issue.issue}`);
        });
    }
    
    return issues;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });