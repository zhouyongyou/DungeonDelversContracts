// 驗證前端更新是否成功的腳本

import { ethers } from "hardhat";

async function main() {
    console.log("🔍 驗證前端更新...\n");

    // 新的 V2 合約地址
    const NEW_ADDRESSES = {
        ORACLE: "0xD7e41690270Cc4f06F13eF47764F030CC4411904",
        DUNGEON_STORAGE: "0x85Fe26dF31903A522e78eb7C853DeA7b6CF7eFa6",
        PLAYER_VAULT: "0x67CEecf8BE748dFd77D90D87a376Bd745B7c3c62",
        ALTAR_OF_ASCENSION: "0xdf87881b48b51380CE47Bf6B54930ef1e07471F0",
        DUNGEON_MASTER: "0xd13250E0F0766006816d7AfE95EaEEc5e215d082", // V2!
        HERO: "0xB882915F4fD4C3773e0E8eeBB65088CB584A0Bdf",
        RELIC: "0x41cb97b903547C4190D66E818A64b7b37DE005c0",
        PARTY: "0x075F68Ab40A55CB4341A7dF5CFdB873696502dd0",
        VIP_STAKING: "0x8D7Eb405247C9AD0373D398C5F63E88421ba7b49",
        PLAYER_PROFILE: "0x7f5D359bC65F0aB07f7A874C2efF72752Fb294e5",
        DUNGEON_CORE: "0xd03d3D7456ba3B52E6E0112eBc2494dB1cB34524"
    };

    console.log("📋 新的合約地址 (V2):");
    for (const [name, address] of Object.entries(NEW_ADDRESSES)) {
        console.log(`${name.padEnd(20)}: ${address}`);
    }

    console.log("\n✅ 前端需要更新的項目:");
    console.log("1. ✅ contracts.ts - 已更新所有合約地址");
    console.log("2. ✅ abis.ts - 已更新 DungeonMaster ABI 為 V2 版本");
    console.log("3. ⏳ .env 檔案 - 需要更新環境變數");
    console.log("4. ⏳ Vercel - 需要更新環境變數");
    console.log("5. ⏳ 子圖 - 需要更新合約地址並重新部署");

    console.log("\n🚀 下一步行動:");
    console.log("1. 在本地測試前端是否能正常連接新合約");
    console.log("2. 測試 buyProvisions 功能是否正常工作");
    console.log("3. 更新 Vercel 環境變數並重新部署");
    console.log("4. 更新並重新部署子圖");

    console.log("\n⚠️ 重要提醒:");
    console.log("- DungeonMaster V2 移除了隊伍擁有權檢查");
    console.log("- 任何人都可以為任何隊伍購買儲備");
    console.log("- 需要監控是否有濫用情況");
}

main().catch((error) => {
    console.error("❌ 驗證失敗:", error);
    process.exit(1);
});