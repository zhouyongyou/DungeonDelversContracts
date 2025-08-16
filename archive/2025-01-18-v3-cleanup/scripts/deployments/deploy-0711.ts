// scripts/deploy-final.ts (最終修正版)

import { ethers, run, network } from "hardhat";
import { BaseContract } from "ethers";
import "dotenv/config";

// =============================
// ⚠️ 請確認 .env 已經更新為最新合約地址！
// =============================

// =================================================================
// Section: 輔助函式
// =================================================================

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

// =================================================================
// Section: 主部署函式
// =================================================================

async function main() {
    log("🚀 正在部署 Dungeon Delvers 核心遊戲合約 (BaseURI 版本)...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);

    // --- 步驟 0: 驗證環境變數 ---
    log("步驟 0: 驗證 .env 檔案中的地址...");

    const {
        FINAL_OWNER_ADDRESS,
        SOUL_SHARD_TOKEN_ADDRESS,
        USD_TOKEN_ADDRESS,
        POOL_ADDRESS,
        METADATA_SERVER_BASE_URL,
        FRONTEND_BASE_URL // ★ 新增：讀取前端網站的 URL
    } = process.env;

    if (!SOUL_SHARD_TOKEN_ADDRESS || !USD_TOKEN_ADDRESS || !POOL_ADDRESS || !METADATA_SERVER_BASE_URL || !FRONTEND_BASE_URL) {
        throw new Error("❌ 錯誤：請務必在 .env 檔案中提供所有必要的地址，包括 METADATA_SERVER_BASE_URL 和 FRONTEND_BASE_URL。");
    }
    
    const finalOwner = FINAL_OWNER_ADDRESS || deployer.address;
    
    logInfo(`最終擁有者地址: ${finalOwner}`);
    logInfo(`元數據 API 伺服器 URL: ${METADATA_SERVER_BASE_URL}`);
    logInfo(`前端網站 URL: ${FRONTEND_BASE_URL}`);
    logInfo(`使用的 SoulShard 地址: ${SOUL_SHARD_TOKEN_ADDRESS}`);
    logInfo(`使用的 USD 地址: ${USD_TOKEN_ADDRESS}`);
    logInfo(`使用的流動性池地址: ${POOL_ADDRESS}`);
    
    const deployedContracts: { [name: string]: { instance: BaseContract, address: string, newlyDeployed: boolean, fqn: string, args: any[] } } = {};
    const newEnvVars: string[] = [];

    async function getOrDeploy(contractName: string, fqn: string, args: any[] = []) {
        const envVarName = `VITE_MAINNET_${contractName.toUpperCase()}_ADDRESS`;
        const existingAddress = process.env[envVarName];

        if (existingAddress && ethers.isAddress(existingAddress)) {
            log(`正在附加至已存在的 ${contractName} 合約: ${existingAddress}`);
            const instance = await ethers.getContractAt(fqn, existingAddress);
            deployedContracts[contractName] = { instance, address: existingAddress, newlyDeployed: false, fqn, args };
        } else {
            log(`正在部署新的 ${contractName}...`);
            const Factory = await ethers.getContractFactory(fqn);
            const contract = await Factory.deploy(...args);
            await contract.waitForDeployment();
            const address = await contract.getAddress();
            
            deployedContracts[contractName] = { instance: contract, address, newlyDeployed: true, fqn, args };
            newEnvVars.push(`${envVarName}=${address}`);
            logSuccess(`✅ ${contractName} 已部署至: ${address}`);
        }
    }

    // --- 步驟 1: 部署所有核心遊戲合約 ---
    log("步驟 1: 部署所有核心遊戲合約...");
    await getOrDeploy("Oracle", "Oracle", [POOL_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS, USD_TOKEN_ADDRESS]);
    await getOrDeploy("DungeonStorage", "DungeonStorage", [deployer.address]);
    await getOrDeploy("PlayerVault", "PlayerVault", [deployer.address]);
    await getOrDeploy("AltarOfAscension", "AltarOfAscension", [deployer.address]);
    await getOrDeploy("DungeonMaster", "DungeonMasterV2", [deployer.address]);
    await getOrDeploy("Hero", "Hero", [deployer.address]);
    await getOrDeploy("Relic", "Relic", [deployer.address]);
    await getOrDeploy("Party", "Party", [deployer.address]);
    await getOrDeploy("VIPStaking", "VIPStaking", [deployer.address]);
    await getOrDeploy("PlayerProfile", "PlayerProfile", [deployer.address]);
    await getOrDeploy("DungeonCore", "DungeonCore", [deployer.address, USD_TOKEN_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS]);

    // --- 步驟 2: 進行合約關聯設定 ---
    log("步驟 2: 進行合約關聯設定...");
    
    const dc = deployedContracts.DungeonCore.instance as any;
    const dm = deployedContracts.DungeonMaster.instance as any;

    logInfo("--- [階段 2.1] 正在向 DungeonCore 註冊所有衛星合約 ---");
    await (await dc.setOracle(deployedContracts.Oracle.address)).wait();
    await (await dc.setPlayerVault(deployedContracts.PlayerVault.address)).wait();
    await (await dc.setDungeonMaster(deployedContracts.DungeonMaster.address)).wait();
    await (await dc.setAltarOfAscension(deployedContracts.AltarOfAscension.address)).wait();
    await (await dc.setHeroContract(deployedContracts.Hero.address)).wait();
    await (await dc.setRelicContract(deployedContracts.Relic.address)).wait();
    await (await dc.setPartyContract(deployedContracts.Party.address)).wait();
    await (await dc.setVipStaking(deployedContracts.VIPStaking.address)).wait();
    await (await dc.setPlayerProfile(deployedContracts.PlayerProfile.address)).wait();
    logSuccess("✅ DungeonCore 設定完成！");
    
    logInfo("\n--- [階段 2.2] 正在為每個衛星合約設定依賴 ---");
    await (await (deployedContracts.DungeonStorage.instance as any).setLogicContract(deployedContracts.DungeonMaster.address)).wait();
    await (await (deployedContracts.Hero.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.Hero.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.Hero.instance as any).setAscensionAltarAddress(deployedContracts.AltarOfAscension.address)).wait();
    await (await (deployedContracts.Relic.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.Relic.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.Relic.instance as any).setAscensionAltarAddress(deployedContracts.AltarOfAscension.address)).wait();
    await (await (deployedContracts.Party.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.Party.instance as any).setHeroContract(deployedContracts.Hero.address)).wait();
    await (await (deployedContracts.Party.instance as any).setRelicContract(deployedContracts.Relic.address)).wait();
    await (await (deployedContracts.PlayerVault.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.PlayerVault.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setHeroContract(deployedContracts.Hero.address)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setRelicContract(deployedContracts.Relic.address)).wait();
    await (await dm.setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await dm.setDungeonStorage(deployedContracts.DungeonStorage.address)).wait();
    await (await dm.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.VIPStaking.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.VIPStaking.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.PlayerProfile.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    logSuccess("✅ 所有衛星合約依賴設定完成！");

    // ★★★【修正】★★★
    // 將所有NFT合約的設定統一處理
    const nftContracts = ["Hero", "Relic", "Party", "VIPStaking", "PlayerProfile"];

    // --- 步驟 3: 設定 BaseURI (指向後端 API) ---
    log("步驟 3: 設定所有 NFT 合約的 BaseURI...");
    
    // ★★★【修正】★★★ 使用後端 API 端點作為 baseURI
    const CORRECT_BASE_URIS: { [key: string]: string } = {
        "Hero": `${METADATA_SERVER_BASE_URL}/api/hero/`,
        "Relic": `${METADATA_SERVER_BASE_URL}/api/relic/`,
        "Party": `${METADATA_SERVER_BASE_URL}/api/party/`,
        "VIPStaking": `${METADATA_SERVER_BASE_URL}/api/vip/`,
        "PlayerProfile": `${METADATA_SERVER_BASE_URL}/api/profile/`,
    };
    
    for (const name of nftContracts) {
        const contractInstance = deployedContracts[name].instance as any;
        const correctBaseURI = CORRECT_BASE_URIS[name];
        logInfo(`正在為 ${name} 設定 BaseURI 為: ${correctBaseURI}`);
        await (await contractInstance.setBaseURI(correctBaseURI)).wait();
    }
    logSuccess("✅ 所有 BaseURI 設定完成！");

    // --- 步驟 4: 設定 Collection URI (指向後端 API) ---
    log("步驟 4: 設定所有 NFT 合約的 Collection URI...");
    const collectionMappings = {
        "Hero": "hero/1",
        "Relic": "relic/1", 
        "Party": "party/1",
        "VIPStaking": "vip/1",
        "PlayerProfile": "profile/1"
    };
    for (const name of nftContracts) {
        const contractInstance = deployedContracts[name].instance as any;
        if (typeof contractInstance.setContractURI !== 'function') {
            logError(`❌ ${name} 合約中找不到 setContractURI 函式。請檢查您的合約代碼與 ABI。`);
            continue;
        }
        try {
            const collectionPath = collectionMappings[name as keyof typeof collectionMappings];
            const collectionURI = `${METADATA_SERVER_BASE_URL}/api/${collectionPath}`;
            logInfo(`正在為 ${name} 設定 Collection URI 為: ${collectionURI}`);
            const tx = await contractInstance.setContractURI(collectionURI);
            await tx.wait();
        } catch (e: any) {
            logError(`❌ 為 ${name} 設定 Collection URI 時失敗: ${e.message}`);
        }
    }
    logSuccess("✅ 所有 Collection URI 設定完成！");

    // --- 步驟 5: 設定初始遊戲參數 ---
    log("步驟 5: 設定初始遊戲參數...");
    await (await (deployedContracts.Hero.instance as any).setPlatformFee(ethers.parseEther("0.0003"))).wait();
    await (await (deployedContracts.Relic.instance as any).setPlatformFee(ethers.parseEther("0.0003"))).wait();
    await (await (deployedContracts.Party.instance as any).setPlatformFee(ethers.parseEther("0.001"))).wait();
    await (await dm.setRestCostPowerDivisor(200)).wait();
    
    // 設定初始獎勵倍率 (15% - 生產環境預設值)
    const initialRewardMultiplier = 150; // 15% = 150/1000
    logInfo(`設定初始獎勵倍率為 ${initialRewardMultiplier/10}% (${initialRewardMultiplier}/1000)`);
    await (await dm.setGlobalRewardMultiplier(initialRewardMultiplier)).wait();
    
    logSuccess("✅ 初始遊戲參數設定完成！");

    // --- 步驟 5.5: 初始化所有地城配置 ---
    log("步驟 5.5: 初始化所有地城配置...");
    // 基於最新經濟模型的地城配置 (2025-01 更新版本)
    const defaultDungeons = [
        { id: 1, name: "新手礦洞", requiredPower: 300, rewardAmountUSD: 29.30, baseSuccessRate: 89 },
        { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardAmountUSD: 62.00, baseSuccessRate: 83 },
        { id: 3, name: "食人魔山谷", requiredPower: 900, rewardAmountUSD: 96.00, baseSuccessRate: 77 },
        { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardAmountUSD: 151.00, baseSuccessRate: 69 },
        { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardAmountUSD: 205.00, baseSuccessRate: 63 },
        { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardAmountUSD: 271.00, baseSuccessRate: 57 },
        { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardAmountUSD: 418.00, baseSuccessRate: 52 },
        { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardAmountUSD: 539.00, baseSuccessRate: 52 },
        { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardAmountUSD: 685.00, baseSuccessRate: 50 },
        { id: 10, name: "混沌深淵", requiredPower: 3000, rewardAmountUSD: 850.00, baseSuccessRate: 50 }
    ];

    for (const dungeon of defaultDungeons) {
        try {
            logInfo(`正在初始化地城 #${dungeon.id} - ${dungeon.name}...`);
            await (await dm.adminSetDungeon(
                BigInt(dungeon.id),
                BigInt(dungeon.requiredPower),
                ethers.parseEther(dungeon.rewardAmountUSD.toString()),
                BigInt(dungeon.baseSuccessRate)
            )).wait();
            logSuccess(`✅ 地城 #${dungeon.id} 初始化完成！`);
        } catch (error: any) {
            logError(`❌ 地城 #${dungeon.id} 初始化失敗: ${error.message}`);
        }
    }
    logSuccess("✅ 所有地城配置初始化完成！");

    // --- 步驟 6: 自動驗證 ---
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 6: 驗證所有新部署的合約...");
        logInfo("等待 30 秒，以確保合約資訊已在區塊鏈瀏覽器上同步...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        for (const name in deployedContracts) {
            const contractInfo = deployedContracts[name];
            if (contractInfo.newlyDeployed) {
                try {
                    logInfo(`正在驗證 ${name}...`);
                    await run("verify:verify", {
                        address: contractInfo.address,
                        constructorArguments: contractInfo.args,
                        contract: contractInfo.fqn.includes(":") ? contractInfo.fqn : undefined,
                    });
                    logSuccess(`✅ ${name} 驗證成功！`);
                } catch (e: any) {
                    if (e.message.toLowerCase().includes("already verified")) {
                        logInfo(`...${name} 已驗證。`);
                    } else {
                        logError(`❌ ${name} 驗證失敗: ${e.message}`);
                    }
                }
            }
        }
    }

    // --- 步驟 7: 轉移所有權 ---
    if (finalOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        log("步驟 7: 開始轉移所有合約的所有權...");
        for (const name in deployedContracts) {
            const contractInfo = deployedContracts[name];
            if (contractInfo.newlyDeployed && typeof (contractInfo.instance as any).owner === 'function') {
                if ((await (contractInfo.instance as any).owner()).toLowerCase() === deployer.address.toLowerCase()) {
                    try {
                        logInfo(`正在轉移 ${name} 的所有權至 ${finalOwner}...`);
                        await (await (contractInfo.instance as any).transferOwnership(finalOwner)).wait();
                        logSuccess(`✅ ${name} 所有權已轉移。`);
                    } catch (error: any) {
                        logError(`❌ 轉移 ${name} 所有權時失敗: ${error.message}`);
                    }
                }
            }
        }
    }
    
    // --- 最終報告 ---
    log("🎉🎉🎉 恭喜！Dungeon Delvers 核心合約已成功部署並設定完成！ 🎉🎉🎉");
    if (newEnvVars.length > 0) {
        log("\n🔔 請將以下新部署的合約地址添加到您的 .env 檔案中：\n");
        console.log(newEnvVars.join("\n"));
    }
    
    console.log("\n--- 所有合約最終地址 ---");
    for (const name in deployedContracts) {
        console.log(`${name.padEnd(25)}: ${deployedContracts[name].address}`);
    }
    console.log("-------------------------\n");
}

main().catch((error) => {
  console.error("❌ 部署過程中發生致命錯誤:", error);
  process.exitCode = 1;
});
