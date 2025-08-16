// scripts/deploy-party-fix.ts - 部署修正後的 Party 合約
import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

async function main() {
    log("🚀 正在部署修正後的 Party 合約...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);

    // 部署新的 Party 合約
    log("步驟 1: 部署 Party 合約...");
    const PartyFactory = await ethers.getContractFactory("Party");
    const party = await PartyFactory.deploy(deployer.address);
    await party.waitForDeployment();
    const partyAddress = await party.getAddress();
    
    logSuccess(`✅ Party 合約已部署至: ${partyAddress}`);

    // 獲取其他合約地址
    const heroAddress = process.env.VITE_MAINNET_HERO_ADDRESS || "0x5EEa0b978f6DbE7735125C4C757458B0F5B48A65";
    const relicAddress = process.env.VITE_MAINNET_RELIC_ADDRESS || "0x82A680344C09C10455F5A6397f6F7a38cf3ebe8A";
    const dungeonCoreAddress = process.env.VITE_MAINNET_DUNGEONCORE_ADDRESS || "0x70Dce1dE6Eb73B66c26D49279bB6846947282952";

    // 設定依賴
    log("步驟 2: 設定合約依賴...");
    await (await party.setDungeonCore(dungeonCoreAddress)).wait();
    logInfo("✅ DungeonCore 已設定");

    await (await party.setHeroContract(heroAddress)).wait();
    logInfo("✅ Hero 合約已設定");

    await (await party.setRelicContract(relicAddress)).wait();
    logInfo("✅ Relic 合約已設定");

    // 設定 BaseURI
    const baseURI = "https://dungeon-delvers-metadata-server.onrender.com/api/party/";
    await (await party.setBaseURI(baseURI)).wait();
    logInfo(`✅ BaseURI 已設定: ${baseURI}`);

    // 設定 Collection URI
    const collectionURI = "https://dungeon-delvers-metadata-server.onrender.com/api/party/1";
    await (await party.setContractURI(collectionURI)).wait();
    logInfo(`✅ Collection URI 已設定: ${collectionURI}`);

    // 設定平台費用
    await (await party.setPlatformFee(ethers.parseEther("0.001"))).wait();
    logInfo("✅ 平台費用已設定: 0.001 BNB");

    // 更新 DungeonCore 的 Party 地址
    log("步驟 3: 更新 DungeonCore 的 Party 合約地址...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    await (await dungeonCore.setPartyContract(partyAddress)).wait();
    logSuccess("✅ DungeonCore 已更新 Party 合約地址");

    // 驗證合約
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 4: 驗證合約...");
        logInfo("等待 30 秒，以確保合約資訊已在區塊鏈瀏覽器上同步...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            await run("verify:verify", {
                address: partyAddress,
                constructorArguments: [deployer.address],
            });
            logSuccess("✅ Party 合約驗證成功！");
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                logInfo("Party 合約已驗證。");
            } else {
                logError(`❌ Party 合約驗證失敗: ${e.message}`);
            }
        }
    }

    // 轉移所有權（如果需要）
    const finalOwner = process.env.FINAL_OWNER_ADDRESS || deployer.address;
    if (finalOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        log("步驟 5: 轉移合約所有權...");
        await (await party.transferOwnership(finalOwner)).wait();
        logSuccess(`✅ Party 合約所有權已轉移至: ${finalOwner}`);
    }

    log("🎉 Party 合約部署完成！");
    log("\n📋 部署總結:");
    logInfo(`Party 合約地址: ${partyAddress}`);
    logInfo(`BSCScan: https://bscscan.com/address/${partyAddress}#code`);
    
    log("\n⚠️  重要：請更新以下配置:");
    logInfo("1. 前端 .env 文件的 VITE_MAINNET_PARTY_ADDRESS");
    logInfo("2. 後端 .env 文件的 party 地址");
    logInfo("3. 子圖 subgraph.yaml 的 Party 合約地址");
    logInfo("4. 重新部署前端和子圖");
}

main().catch((error) => {
    console.error("❌ 部署過程中發生致命錯誤:", error);
    process.exitCode = 1;
});