// scripts/fix-dungeonmaster-power.ts
import { ethers } from "hardhat";
import { readDeployments, writeDeployments } from "../utils/deployment-utils";

async function main() {
    console.log("開始修復 DungeonMaster 戰力讀取問題...\n");

    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);

    // 讀取當前部署地址
    const deployments = readDeployments();
    const partyAddress = deployments.Party;
    const dungeonCoreAddress = deployments.DungeonCore;
    const dungeonStorageAddress = deployments.DungeonStorage;
    const soulShardAddress = deployments.SoulShard;
    const oldDungeonMasterAddress = deployments.DungeonMaster;

    console.log("\n當前部署地址:");
    console.log("Party:", partyAddress);
    console.log("DungeonCore:", dungeonCoreAddress);
    console.log("DungeonStorage:", dungeonStorageAddress);
    console.log("SoulShard:", soulShardAddress);
    console.log("舊 DungeonMaster:", oldDungeonMasterAddress);

    // 檢查隊伍數據
    console.log("\n檢查隊伍 #1 數據:");
    const party = await ethers.getContractAt("Party", partyAddress);
    try {
        // 使用 getPartyComposition 方法
        const [totalPower, totalCapacity] = await party.getPartyComposition(1);
        console.log(`使用 getPartyComposition: 戰力 = ${totalPower}, 容量 = ${totalCapacity}`);

        // 使用 partyCompositions 方法
        const comp = await party.partyCompositions(1);
        console.log(`使用 partyCompositions: 戰力 = ${comp.totalPower}, 容量 = ${comp.totalCapacity}`);
        console.log(`英雄數量: ${comp.heroIds.length}`);
        console.log(`聖物數量: ${comp.relicIds.length}`);
    } catch (error) {
        console.error("讀取隊伍數據失敗:", error);
    }

    // 部署修復版本的 DungeonMaster
    console.log("\n部署修復版本的 DungeonMaster...");
    const DungeonMasterFixed = await ethers.getContractFactory("DungeonMasterFixed");
    const dungeonMasterFixed = await DungeonMasterFixed.deploy(deployer.address);
    await dungeonMasterFixed.waitForDeployment();
    const newDungeonMasterAddress = await dungeonMasterFixed.getAddress();
    console.log("新 DungeonMaster 部署在:", newDungeonMasterAddress);

    // 設定新 DungeonMaster 的合約連接
    console.log("\n設定新 DungeonMaster 的合約連接...");
    await dungeonMasterFixed.setDungeonCore(dungeonCoreAddress);
    await dungeonMasterFixed.setDungeonStorage(dungeonStorageAddress);
    await dungeonMasterFixed.setSoulShardToken(soulShardAddress);
    console.log("✅ 合約連接設定完成");

    // 在 DungeonCore 中更新 DungeonMaster 地址
    console.log("\n在 DungeonCore 中更新 DungeonMaster 地址...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    await dungeonCore.setDungeonMaster(newDungeonMasterAddress);
    console.log("✅ DungeonCore 已更新");

    // 在 DungeonStorage 中授權新的 DungeonMaster
    console.log("\n在 DungeonStorage 中授權新的 DungeonMaster...");
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
    await dungeonStorage.setAuthorizedContract(newDungeonMasterAddress, true);
    console.log("✅ DungeonStorage 授權完成");

    // 設定地下城數據（從舊合約複製）
    console.log("\n設定地下城數據...");
    for (let i = 1; i <= 10; i++) {
        try {
            const dungeon = await dungeonStorage.getDungeon(i);
            if (dungeon.isInitialized) {
                await dungeonMasterFixed.adminSetDungeon(
                    i,
                    dungeon.requiredPower,
                    dungeon.rewardAmountUSD / 1e18, // 轉換回原始數值
                    dungeon.baseSuccessRate
                );
                console.log(`✅ 地下城 #${i} 設定完成 (需求戰力: ${dungeon.requiredPower})`);
            }
        } catch (error) {
            console.log(`地下城 #${i} 未初始化，跳過`);
        }
    }

    // 更新部署記錄
    deployments.DungeonMaster = newDungeonMasterAddress;
    deployments.DungeonMasterOld = oldDungeonMasterAddress;
    writeDeployments(deployments);
    console.log("\n✅ 部署記錄已更新");

    // 測試新合約
    console.log("\n測試新合約的出征功能...");
    try {
        // 先確保有足夠的 BNB
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`部署者 BNB 餘額: ${ethers.formatEther(balance)} BNB`);

        // 嘗試出征地下城 7
        const tx = await dungeonMasterFixed.requestExpedition(1, 7, {
            value: ethers.parseEther("0.0015")
        });
        console.log("出征交易已發送:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ 出征成功！Gas 使用:", receipt.gasUsed.toString());

        // 解析事件
        const events = receipt.logs;
        for (const event of events) {
            try {
                const parsed = dungeonMasterFixed.interface.parseLog({
                    topics: event.topics as string[],
                    data: event.data
                });
                if (parsed && parsed.name === "ExpeditionFulfilled") {
                    console.log("\n出征結果:");
                    console.log(`- 成功: ${parsed.args.success}`);
                    console.log(`- 獎勵: ${parsed.args.reward}`);
                    console.log(`- 經驗: ${parsed.args.expGained}`);
                }
            } catch {}
        }
    } catch (error: any) {
        console.error("出征測試失敗:", error.message);
    }

    console.log("\n🎉 修復完成！");
    console.log("新的 DungeonMaster 地址:", newDungeonMasterAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });