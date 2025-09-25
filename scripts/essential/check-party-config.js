// check-party-config.js - 檢查 Party 合約的 DungeonCore 配置
const { ethers } = require("hardhat");

const DUNGEONCORE_ADDRESS = "0x6c900a1cf182aa5960493bf4646c9efc8eaed16b";
const PARTY_ADDRESS = "0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129";

async function checkPartyConfig() {
    console.log("🔍 檢查 Party 合約的 DungeonCore 配置");
    console.log("=".repeat(50));
    
    try {
        const party = await ethers.getContractAt("Party", PARTY_ADDRESS);
        
        // 檢查合約的 ABI 中有哪些函數
        console.log("📋 Party 合約可用函數:");
        const fragment = party.interface.fragments.filter(f => f.type === 'function');
        fragment.forEach(f => {
            if (f.name.includes('dungeon') || f.name.includes('Core')) {
                console.log(`  - ${f.name}(${f.inputs.map(i => i.type).join(', ')})`);
            }
        });
        
        // 嘗試讀取當前的 DungeonCore 設置
        try {
            // Party 合約可能使用 dungeonCoreContract 變量
            const currentCore = await party.dungeonCoreContract();
            console.log(`\\n📍 當前 DungeonCore 設置: ${currentCore}`);
            
            const isCorrect = currentCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase();
            console.log(`✅ 配置狀態: ${isCorrect ? '正確' : '需要更新'}`);
            
            if (!isCorrect) {
                console.log(`\\n⚠️ 需要執行: party.setDungeonCore("${DUNGEONCORE_ADDRESS}")`);
            }
            
        } catch (error) {
            console.log(`⚠️ 無法讀取當前配置: ${error.message}`);
        }
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
    }
}

checkPartyConfig().catch(console.error);