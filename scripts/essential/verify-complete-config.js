// verify-complete-config.js - 驗證完整的雙向配置
const { ethers } = require("hardhat");

const DUNGEONCORE_ADDRESS = "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f";
const NEW_ADDRESSES = {
    DungeonStorage: "0x063A9De0daC8B68C03C9D77f41FE8B20A2fe7683",
    VRFConsumerV2Plus: "0xFC88901B6BB94d677884EDC1dad143c2Add2a1C5", 
    PlayerVault: "0x72205a7DCA3Dbd7A8656107797B0B0604E781413",
    Hero: "0x6d4393AD1507012039A6f1364f70B8De3AfCB3Bd",
    Relic: "0x3bCB4Af9d94B343B1F154a253a6047b707Ba74BD", 
    Party: "0x0D93b2c10d5FF944b3BB47c75b52fca75c92A4CC",
    PlayerProfile: "0xa7AAB98223268F8049430Bdba6d1ba36CBEF424A",
    VIPStaking: "0x0440634aa6e4028efAFEFe7683B39E3a7BEC0EBC",
    AltarOfAscension: "0xda7Fb30CB2a2311cA3326aD2a4f826dcdAC8BD7b", 
    DungeonMaster: "0x35A765D767d3FC2dFd6968e6faA7fFe7a303A77e"
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