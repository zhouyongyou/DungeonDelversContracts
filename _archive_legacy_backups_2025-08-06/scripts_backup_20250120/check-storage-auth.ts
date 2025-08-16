import { ethers } from "hardhat";

async function main() {
    const DUNGEON_STORAGE_ADDRESS = "0x40D0DFA394707e26247a1EFfAe0f9C1b248Fff10";
    const DUNGEON_MASTER_ADDRESS = "0xff99a6319Ed8D9832c8Bdc89eB5fc6Cb652F71b1";
    
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", DUNGEON_STORAGE_ADDRESS);
    const currentLogicContract = await dungeonStorage.logicContract();
    
    console.log("當前 DungeonStorage 的邏輯合約:", currentLogicContract);
    console.log("新的 DungeonMaster 地址:", DUNGEON_MASTER_ADDRESS);
    console.log("是否匹配:", currentLogicContract.toLowerCase() === DUNGEON_MASTER_ADDRESS.toLowerCase());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });