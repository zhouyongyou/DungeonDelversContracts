// scripts/set-logic-contract.ts
// 設置 DungeonStorage 的邏輯合約為新的 DungeonMasterV3

import { ethers } from "hardhat";

async function main() {
    console.log("🔑 設置 DungeonStorage 的邏輯合約...");
    
    const [signer] = await ethers.getSigners();
    console.log(`執行帳號: ${signer.address}`);
    
    const DUNGEON_STORAGE_ADDRESS = "0x6FF605478fea3C3270f2eeD550129c58Dea81403";
    const NEW_DUNGEON_MASTER = "0x84eD128634F9334Bd63a929824066901a74a0E71";
    
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", DUNGEON_STORAGE_ADDRESS);
    
    // 檢查當前邏輯合約
    console.log("\n檢查當前邏輯合約...");
    const currentLogic = await dungeonStorage.logicContract();
    console.log(`當前邏輯合約: ${currentLogic}`);
    console.log(`新邏輯合約: ${NEW_DUNGEON_MASTER}`);
    
    if (currentLogic.toLowerCase() === NEW_DUNGEON_MASTER.toLowerCase()) {
        console.log("✅ 邏輯合約已經是正確的地址！");
        return;
    }
    
    // 設置新的邏輯合約
    console.log("\n設置新的邏輯合約...");
    const tx = await dungeonStorage.setLogicContract(NEW_DUNGEON_MASTER);
    console.log(`交易發送: ${tx.hash}`);
    await tx.wait();
    
    // 驗證更新
    const newLogic = await dungeonStorage.logicContract();
    console.log(`\n✅ 邏輯合約更新成功！`);
    console.log(`新邏輯合約: ${newLogic}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });