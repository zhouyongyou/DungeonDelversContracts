// scripts/verify-dungeonmaster-v3.ts
// 驗證 DungeonMasterV3 合約到 BSCScan

import { run } from "hardhat";

async function main() {
    console.log("🔍 驗證 DungeonMasterV3 合約...");
    
    const DUNGEON_MASTER_V3 = "0x84eD128634F9334Bd63a929824066901a74a0E71";
    const DEPLOYER = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    try {
        await run("verify:verify", {
            address: DUNGEON_MASTER_V3,
            constructorArguments: [DEPLOYER],
            contract: "contracts/DungeonMasterV3.sol:DungeonMasterV3"
        });
        console.log("✅ 合約驗證成功！");
    } catch (error: any) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ 合約已經驗證過了");
        } else {
            console.error("❌ 驗證失敗:", error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });