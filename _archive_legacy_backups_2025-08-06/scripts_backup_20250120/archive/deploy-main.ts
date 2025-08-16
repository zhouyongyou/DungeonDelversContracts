// scripts/deploy-main.ts

import { ethers, run, network } from "hardhat";
import { BaseContract } from "ethers";
import "dotenv/config";

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
    log("🚀 階段二：正在部署 Dungeon Delvers 核心遊戲合約...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);

    // --- 步驟 0: 驗證環境變數 ---
    log("步驟 0: 驗證 .env 檔案中的地址...");

    const {
        FINAL_OWNER_ADDRESS,
        SOUL_SHARD_TOKEN_ADDRESS,
        USD_TOKEN_ADDRESS,
        POOL_ADDRESS
    } = process.env;

    if (!SOUL_SHARD_TOKEN_ADDRESS || !USD_TOKEN_ADDRESS || !POOL_ADDRESS) {
        throw new Error("❌ 錯誤：請務必在 .env 檔案中提供 SOUL_SHARD_TOKEN_ADDRESS, USD_TOKEN_ADDRESS, 和 POOL_ADDRESS。");
    }
    
    const finalOwner = FINAL_OWNER_ADDRESS || deployer.address;
    
    logInfo(`最終擁有者地址: ${finalOwner}`);
    logInfo(`使用的 SoulShard 地址: ${SOUL_SHARD_TOKEN_ADDRESS}`);
    logInfo(`使用的 USD 地址: ${USD_TOKEN_ADDRESS}`);
    logInfo(`使用的流動性池地址: ${POOL_ADDRESS}`);
    
    const deployedContracts: { [name: string]: { instance: BaseContract, address: string, newlyDeployed: boolean, fqn: string, args: any[] } } = {};
    const newEnvVars: string[] = [];

    async function getOrDeploy(contractName: string, fqn: string, args: any[] = []) {
        const envVarName = `${contractName.toUpperCase()}_ADDRESS`;
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

    // --- 步驟 1: 部署所有基礎建設 (SVG 函式庫) ---
    log("步驟 1: 部署所有 SVG 函式庫...");
    await getOrDeploy("DungeonSVGLibrary", "contracts/DungeonSVGLibrary.sol:DungeonSVGLibrary", []);
    await getOrDeploy("VIPSVGLibrary", "contracts/VIPSVGLibrary.sol:VIPSVGLibrary", []);
    await getOrDeploy("ProfileSVGLibrary", "contracts/ProfileSVGLibrary.sol:ProfileSVGLibrary", []);

    // --- 步驟 2: 部署所有核心遊戲合約 ---
    log("步驟 2: 部署所有核心遊戲合約...");
    await getOrDeploy("Oracle", "Oracle", [POOL_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS, USD_TOKEN_ADDRESS]);
    await getOrDeploy("DungeonStorage", "DungeonStorage", [deployer.address]);
    await getOrDeploy("PlayerVault", "PlayerVault", [deployer.address]);
    await getOrDeploy("AltarOfAscension", "AltarOfAscension", [deployer.address]);
    await getOrDeploy("DungeonMaster", "DungeonMaster", [deployer.address]);
    await getOrDeploy("Hero", "Hero", [deployer.address]);
    await getOrDeploy("Relic", "Relic", [deployer.address]);
    await getOrDeploy("Party", "Party", [deployer.address]);
    await getOrDeploy("VIPStaking", "VIPStaking", [deployer.address]);
    await getOrDeploy("PlayerProfile", "PlayerProfile", [deployer.address]);
    await getOrDeploy("DungeonCore", "DungeonCore", [deployer.address, USD_TOKEN_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS]);

    // --- 步驟 3: 進行合約關聯設定 ---
    log("步驟 3: 進行合約關聯設定 (完整版)...");
    
    const dc = deployedContracts.DungeonCore.instance as any;
    const dm = deployedContracts.DungeonMaster.instance as any;

    logInfo("--- [階段 3.1] 正在向 DungeonCore 註冊所有衛星合約 ---");
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
    
    logInfo("\n--- [階段 3.2] 正在為每個衛星合約設定依賴 ---");
    // DungeonStorage
    await (await (deployedContracts.DungeonStorage.instance as any).setLogicContract(deployedContracts.DungeonMaster.address)).wait();
    // Hero
    await (await (deployedContracts.Hero.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.Hero.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.Hero.instance as any).setDungeonSvgLibrary(deployedContracts.DungeonSVGLibrary.address)).wait();
    await (await (deployedContracts.Hero.instance as any).setAscensionAltarAddress(deployedContracts.AltarOfAscension.address)).wait();
    // Relic
    await (await (deployedContracts.Relic.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.Relic.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.Relic.instance as any).setDungeonSvgLibrary(deployedContracts.DungeonSVGLibrary.address)).wait();
    await (await (deployedContracts.Relic.instance as any).setAscensionAltarAddress(deployedContracts.AltarOfAscension.address)).wait();
    // Party
    await (await (deployedContracts.Party.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.Party.instance as any).setHeroContract(deployedContracts.Hero.address)).wait();
    await (await (deployedContracts.Party.instance as any).setRelicContract(deployedContracts.Relic.address)).wait();
    await (await (deployedContracts.Party.instance as any).setDungeonSvgLibrary(deployedContracts.DungeonSVGLibrary.address)).wait();
    // PlayerVault
    await (await (deployedContracts.PlayerVault.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.PlayerVault.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    // AltarOfAscension (★ 補上遺漏的設定)
    await (await (deployedContracts.AltarOfAscension.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setHeroContract(deployedContracts.Hero.address)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setRelicContract(deployedContracts.Relic.address)).wait();
    // DungeonMaster
    await (await dm.setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await dm.setDungeonStorage(deployedContracts.DungeonStorage.address)).wait();
    // VIPStaking
    await (await (deployedContracts.VIPStaking.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.VIPStaking.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.VIPStaking.instance as any).setVipSvgLibrary(deployedContracts.VIPSVGLibrary.address)).wait();
    // PlayerProfile
    await (await (deployedContracts.PlayerProfile.instance as any).setDungeonCore(deployedContracts.DungeonCore.address)).wait();
    await (await (deployedContracts.PlayerProfile.instance as any).setProfileSvgLibrary(deployedContracts.ProfileSVGLibrary.address)).wait();
    logSuccess("✅ 所有衛星合約依賴設定完成！");

    // --- 步驟 4: 設定初始遊戲參數 ---
    log("步驟 4: 設定初始遊戲參數...");
    await (await (deployedContracts.Hero.instance as any).setPlatformFee(ethers.parseEther("0.0003"))).wait();
    await (await (deployedContracts.Relic.instance as any).setPlatformFee(ethers.parseEther("0.0003"))).wait();
    await (await (deployedContracts.Party.instance as any).setPlatformFee(ethers.parseEther("0.001"))).wait();
    await (await dm.setRestCostPowerDivisor(200)).wait();
    logSuccess("✅ 初始遊戲參數設定完成！");

    // --- 步驟 5: 自動驗證所有新部署的合約 ---
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 5: 驗證所有新部署的合約...");
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

    // --- 步驟 6: 轉移所有權 ---
    if (finalOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        log("步驟 6: 開始轉移所有合約的所有權...");
        for (const name in deployedContracts) {
            const contractInfo = deployedContracts[name];
            if (contractInfo.newlyDeployed && typeof (contractInfo.instance as any).owner === 'function') {
                if ((await (contractInfo.instance as any).owner()).toLowerCase() === deployer.address.toLowerCase()) {
                    try {
                        logInfo(`正在轉移 ${name} 的所有權至 ${finalOwner}...`);
                        await (await (contractInfo.instance as any).transferOwnership(finalOwner)).wait();
                        logSuccess(`✅ ${name} 所有權已轉移。`);
                    } catch (error) {
                        logError(`❌ 轉移 ${name} 所有權時失敗: ${error}`);
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
