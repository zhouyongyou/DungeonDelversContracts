// scripts/fix-dungeonmaster-simple.ts
import { ethers } from "hardhat";

// 手動填入你的合約地址
const ADDRESSES = {
    Party: "0x45E5DbC9c88F088f982102ba9D2e3901eDb01720",
    DungeonCore: "0xA42Fc29A730c60DF38b87f1fE628f3Bb7793543a",
    DungeonStorage: "0xF38b2a6FE8aB87264Eed93Fc8b9381Cc8eEc78dD",
    DungeonMaster: "0xaBb93f09ac6669803c9D87d5f86c67B87e3beb6d", // 舊的
    SoulShard: "0x3c57476B17525692de5d1322c749e2fb6013Cad0"
};

async function main() {
    console.log("開始修復 DungeonMaster 戰力讀取問題...\n");

    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);

    // 檢查隊伍數據
    console.log("\n檢查隊伍 #1 數據:");
    const party = await ethers.getContractAt("Party", ADDRESSES.Party);
    try {
        // 使用 getPartyComposition 方法
        const [totalPower, totalCapacity] = await party.getPartyComposition(1);
        console.log(`✅ 實際戰力: ${totalPower}`);
        console.log(`✅ 實際容量: ${totalCapacity}`);
    } catch (error) {
        console.error("讀取隊伍數據失敗:", error);
        return;
    }

    // 部署修復版本的 DungeonMaster
    console.log("\n部署修復版本的 DungeonMaster...");
    const DungeonMasterFixed = await ethers.getContractFactory("DungeonMasterFixed");
    const dungeonMasterFixed = await DungeonMasterFixed.deploy(deployer.address);
    await dungeonMasterFixed.waitForDeployment();
    const newDungeonMasterAddress = await dungeonMasterFixed.getAddress();
    console.log("✅ 新 DungeonMaster 部署在:", newDungeonMasterAddress);

    // 設定新 DungeonMaster 的合約連接
    console.log("\n設定新 DungeonMaster 的合約連接...");
    let tx = await dungeonMasterFixed.setDungeonCore(ADDRESSES.DungeonCore);
    await tx.wait();
    console.log("✅ DungeonCore 已連接");

    tx = await dungeonMasterFixed.setDungeonStorage(ADDRESSES.DungeonStorage);
    await tx.wait();
    console.log("✅ DungeonStorage 已連接");

    tx = await dungeonMasterFixed.setSoulShardToken(ADDRESSES.SoulShard);
    await tx.wait();
    console.log("✅ SoulShard 已連接");

    // 在 DungeonCore 中更新 DungeonMaster 地址
    console.log("\n在 DungeonCore 中更新 DungeonMaster 地址...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", ADDRESSES.DungeonCore);
    tx = await dungeonCore.setDungeonMaster(newDungeonMasterAddress);
    await tx.wait();
    console.log("✅ DungeonCore 已更新");

    // 在 DungeonStorage 中授權新的 DungeonMaster
    console.log("\n在 DungeonStorage 中授權新的 DungeonMaster...");
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", ADDRESSES.DungeonStorage);
    tx = await dungeonStorage.setAuthorizedContract(newDungeonMasterAddress, true);
    await tx.wait();
    console.log("✅ DungeonStorage 授權完成");

    // 設定地下城數據
    console.log("\n設定地下城數據...");
    const dungeonConfigs = [
        { id: 1, power: 500, reward: 5, successRate: 90 },
        { id: 2, power: 1000, reward: 12, successRate: 85 },
        { id: 3, power: 1500, reward: 20, successRate: 80 },
        { id: 4, power: 2000, reward: 30, successRate: 75 },
        { id: 5, power: 2500, reward: 42, successRate: 70 },
        { id: 6, power: 3000, reward: 56, successRate: 65 },
        { id: 7, power: 3500, reward: 72, successRate: 60 },
        { id: 8, power: 4000, reward: 90, successRate: 55 },
        { id: 9, power: 4500, reward: 110, successRate: 50 },
        { id: 10, power: 5000, reward: 132, successRate: 45 }
    ];

    for (const config of dungeonConfigs) {
        tx = await dungeonMasterFixed.adminSetDungeon(
            config.id,
            config.power,
            config.reward,
            config.successRate
        );
        await tx.wait();
        console.log(`✅ 地下城 #${config.id} 設定完成 (需求戰力: ${config.power})`);
    }

    // 測試新合約
    console.log("\n測試新合約的出征功能...");
    console.log("嘗試讓隊伍 #1 出征地下城 #7...");
    
    try {
        tx = await dungeonMasterFixed.requestExpedition(1, 7, {
            value: ethers.parseEther("0.0015")
        });
        console.log("出征交易已發送:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ 出征成功！Gas 使用:", receipt.gasUsed.toString());

        // 檢查是否有獎勵
        const partyStatus = await dungeonStorage.getPartyStatus(1);
        console.log(`\n隊伍狀態:`);
        console.log(`- 未領取獎勵: ${ethers.formatUnits(partyStatus.unclaimedRewards, 18)} SOUL`);
        console.log(`- 冷卻結束時間: ${new Date(Number(partyStatus.cooldownEndsAt) * 1000).toLocaleString()}`);
    } catch (error: any) {
        console.error("❌ 出征失敗:", error.message);
    }

    console.log("\n🎉 修復完成！");
    console.log("新的 DungeonMaster 地址:", newDungeonMasterAddress);
    console.log("\n請記得更新你的部署記錄！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });