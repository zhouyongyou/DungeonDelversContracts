// verify-complete-config.js - 驗證完整的雙向配置
const { ethers } = require("hardhat");

const DUNGEONCORE_ADDRESS = "0x6c900a1cf182aa5960493bf4646c9efc8eaed16b";
const NEW_ADDRESSES = {
    DungeonStorage: "0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791",
    VRFConsumerV2Plus: "0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c", 
    PlayerVault: "0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0",
    Hero: "0xc09b6613c32a505bf05f97ed2f567b4959914396",
    Relic: "0xf4ae79568a34af621bbea06b716e8fb84b5b41b6", 
    Party: "0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129",
    PlayerProfile: "0xea827e472937abd1117f0d4104a76e173724a061",
    VIPStaking: "0x0440634aa6e4028efAFEFe7683B39E3a7BEC0EBC",
    AltarOfAscension: "0x3dfd80271eb96c3be8d1e841643746954ffda11d", 
    DungeonMaster: "0xa573ccf8332a5b1e830ea04a87856a28c99d9b53"
};

async function main() {
    console.log("🔍 驗證雙向配置完整性");
    console.log("=".repeat(50));
    
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEONCORE_ADDRESS);
    
    // 檢查 DungeonCore → 其他合約 配置
    console.log("\\n📋 DungeonCore → 其他合約:");
    const coreConfig = {
        dungeonStorageAddress: await dungeonCore.dungeonStorageAddress(),
        vrfManager: await dungeonCore.getVRFManager(),
        playerVaultAddress: await dungeonCore.playerVaultAddress(),
        heroContractAddress: await dungeonCore.heroContractAddress(),
        relicContractAddress: await dungeonCore.relicContractAddress(),
        partyContractAddress: await dungeonCore.partyContractAddress(),
        playerProfileAddress: await dungeonCore.playerProfileAddress(),
        vipStakingAddress: await dungeonCore.vipStakingAddress(),
        dungeonMasterAddress: await dungeonCore.dungeonMasterAddress(),
        altarOfAscensionAddress: await dungeonCore.altarOfAscensionAddress()
    };
    
    Object.entries(coreConfig).forEach(([name, addr]) => {
        const expected = Object.values(NEW_ADDRESSES).find(newAddr => 
            newAddr.toLowerCase() === addr.toLowerCase()
        );
        console.log(`${name.padEnd(25)}: ${addr} ${expected ? '✅' : '❌'}`);
    });
    
    // 檢查 其他合約 → DungeonCore 配置
    console.log("\\n📋 其他合約 → DungeonCore:");
    const reverseConfigs = [
        "DungeonStorage", "PlayerVault", "Hero", "Relic", "Party", 
        "PlayerProfile", "VIPStaking", "AltarOfAscension", "DungeonMaster"
    ];
    
    for (const contractName of reverseConfigs) {
        const contractAddr = NEW_ADDRESSES[contractName];
        if (!contractAddr) continue;
        
        try {
            const contract = await ethers.getContractAt(contractName, contractAddr);
            const currentCore = await contract.dungeonCore();
            const match = currentCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase();
            console.log(`${contractName.padEnd(20)}: ${currentCore} ${match ? '✅' : '❌'}`);
        } catch (error) {
            console.log(`${contractName.padEnd(20)}: ⚠️ 檢查失敗 - ${error.message.slice(0,50)}`);
        }
    }
    
    console.log("\\n🎯 配置驗證完成");
}

main().catch(console.error);