// scripts/check-party-owner.ts
// 檢查隊伍擁有者

import { ethers } from "hardhat";

async function main() {
    console.log("🔍 檢查隊伍擁有權...");
    
    const [signer] = await ethers.getSigners();
    console.log(`當前帳號: ${signer.address}`);
    
    const PARTY_ADDRESS = "0xddCFa681Cee80D3a0F23834cC07D371792207C85";
    const PARTY_ID = 1n;
    
    const party = await ethers.getContractAt("Party", PARTY_ADDRESS);
    
    try {
        const owner = await party.ownerOf(PARTY_ID);
        console.log(`隊伍 #${PARTY_ID} 的擁有者: ${owner}`);
        console.log(`是否為當前帳號: ${owner.toLowerCase() === signer.address.toLowerCase()}`);
        
        // 檢查隊伍組成
        const composition = await party.partyCompositions(PARTY_ID);
        console.log("\n隊伍組成:");
        console.log(`英雄數量: ${composition[0]}`);
        console.log(`聖物數量: ${composition[1]}`);
        console.log(`最大戰力: ${composition[2]}`);
        console.log(`總容量: ${composition[3]}`);
        console.log(`稀有度: ${composition[4]}`);
        
    } catch (error: any) {
        console.error("❌ 錯誤:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });