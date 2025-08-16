// scripts/check-party-contract.ts
// 檢查 DungeonCore 的 Party 合約設定

import { ethers } from "hardhat";

async function main() {
    console.log("🔍 檢查 Party 合約設定...");
    
    const DUNGEON_CORE_ADDRESS = "0xd1F14243c42AF58E69ea7eA58570DC2d9A908D21";
    const PARTY_ADDRESS = "0xddCFa681Cee80D3a0F23834cC07D371792207C85";
    
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEON_CORE_ADDRESS);
    
    console.log("檢查 DungeonCore 中的 Party 合約地址...");
    const partyAddress = await dungeonCore.partyContractAddress();
    console.log(`Party 合約地址: ${partyAddress}`);
    console.log(`預期地址: ${PARTY_ADDRESS}`);
    console.log(`地址匹配: ${partyAddress.toLowerCase() === PARTY_ADDRESS.toLowerCase()}`);
    
    if (partyAddress === ethers.ZeroAddress) {
        console.error("❌ Party 合約地址未設定！");
        console.log("\n執行以下命令修復:");
        console.log(`await dungeonCore.setPartyContract("${PARTY_ADDRESS}")`);
    } else if (partyAddress.toLowerCase() !== PARTY_ADDRESS.toLowerCase()) {
        console.error("❌ Party 合約地址不正確！");
        console.log(`當前: ${partyAddress}`);
        console.log(`應該: ${PARTY_ADDRESS}`);
    } else {
        console.log("✅ Party 合約地址設定正確");
        
        // 測試調用
        console.log("\n測試 Party 合約調用...");
        const party = await ethers.getContractAt("Party", partyAddress);
        try {
            const name = await party.name();
            console.log(`✅ Party 合約可正常調用，名稱: ${name}`);
        } catch (error) {
            console.error("❌ Party 合約調用失敗:", error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });