// scripts/deploy-and-sync-all.ts - 完整系統同步部署腳本
// 🚀 一鍵部署合約並同步所有系統（前端、後端、子圖）

import { ethers, run, network } from "hardhat";
import { BaseContract } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import "dotenv/config";

// =================================================================
// Section: 配置常量
// =================================================================

const FRONTEND_PATH = "../../GitHub/DungeonDelvers";
const METADATA_SERVER_PATH = "../../dungeon-delvers-metadata-server";
const SUBGRAPH_PATH = "../../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers";

// =================================================================
// Section: 輔助函式
// =================================================================

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);
const logWarning = (message: string) => console.log(`\x1b[33m${message}\x1b[0m`);

// 執行 shell 命令的輔助函數
function execCommand(command: string, cwd?: string): string {
    try {
        return execSync(command, { cwd, encoding: 'utf8' });
    } catch (error: any) {
        logError(`執行命令失敗: ${command}`);
        logError(error.message);
        throw error;
    }
}

// 更新文件內容的輔助函數
function updateFileContent(filePath: string, replacements: { [key: string]: string }) {
    if (!fs.existsSync(filePath)) {
        logWarning(`文件不存在: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    for (const [search, replace] of Object.entries(replacements)) {
        content = content.replace(new RegExp(search, 'g'), replace);
    }
    
    fs.writeFileSync(filePath, content);
    logInfo(`已更新: ${filePath}`);
    return true;
}

// =================================================================
// Section: 主部署函式
// =================================================================

async function main() {
    log("🚀 開始完整系統部署與同步流程...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);

    // --- 步驟 0: 驗證環境變數 ---
    log("步驟 0: 驗證 .env 檔案...");

    const {
        FINAL_OWNER_ADDRESS,
        SOUL_SHARD_TOKEN_ADDRESS,
        USD_TOKEN_ADDRESS,
        POOL_ADDRESS,
        METADATA_SERVER_BASE_URL,
        FRONTEND_BASE_URL,
        THE_GRAPH_API_URL
    } = process.env;

    if (!SOUL_SHARD_TOKEN_ADDRESS || !USD_TOKEN_ADDRESS || !POOL_ADDRESS) {
        throw new Error("❌ 錯誤：請在 .env 檔案中提供所有代幣地址。");
    }
    
    const finalOwner = FINAL_OWNER_ADDRESS || deployer.address;
    const metadataServerUrl = METADATA_SERVER_BASE_URL || "https://dungeon-delvers-metadata-server.onrender.com";
    const frontendUrl = FRONTEND_BASE_URL || "https://dungeondelvers.xyz";
    const graphApiUrl = THE_GRAPH_API_URL || "https://api.studio.thegraph.com/query/115633/dungeon-delvers/version/latest";
    
    const deployedContracts: { [name: string]: { instance: BaseContract, address: string, newlyDeployed: boolean, fqn: string, args: any[] } } = {};
    const contractAddresses: { [name: string]: string } = {};

    // 部署或附加合約的輔助函數
    async function getOrDeploy(contractName: string, fqn: string, args: any[] = []) {
        const envVarName = `VITE_MAINNET_${contractName.toUpperCase()}_ADDRESS`;
        const existingAddress = process.env[envVarName];

        if (existingAddress && ethers.isAddress(existingAddress)) {
            log(`正在附加至已存在的 ${contractName} 合約: ${existingAddress}`);
            const instance = await ethers.getContractAt(fqn, existingAddress);
            deployedContracts[contractName] = { instance, address: existingAddress, newlyDeployed: false, fqn, args };
            contractAddresses[contractName] = existingAddress;
        } else {
            log(`正在部署新的 ${contractName}...`);
            const Factory = await ethers.getContractFactory(fqn);
            const contract = await Factory.deploy(...args);
            await contract.waitForDeployment();
            const address = await contract.getAddress();
            
            deployedContracts[contractName] = { instance: contract, address, newlyDeployed: true, fqn, args };
            contractAddresses[contractName] = address;
            logSuccess(`✅ ${contractName} 已部署至: ${address}`);
        }
    }

    // --- 步驟 1: 部署所有核心遊戲合約 ---
    log("步驟 1: 部署所有核心遊戲合約...");
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

    // --- 步驟 2: 進行合約關聯設定 ---
    log("步驟 2: 進行合約關聯設定...");
    
    const dc = deployedContracts.DungeonCore.instance as any;
    const dm = deployedContracts.DungeonMaster.instance as any;

    // 設定 DungeonCore
    await (await dc.setOracle(contractAddresses.Oracle)).wait();
    await (await dc.setPlayerVault(contractAddresses.PlayerVault)).wait();
    await (await dc.setDungeonMaster(contractAddresses.DungeonMaster)).wait();
    await (await dc.setAltarOfAscension(contractAddresses.AltarOfAscension)).wait();
    await (await dc.setHeroContract(contractAddresses.Hero)).wait();
    await (await dc.setRelicContract(contractAddresses.Relic)).wait();
    await (await dc.setPartyContract(contractAddresses.Party)).wait();
    await (await dc.setVipStaking(contractAddresses.VIPStaking)).wait();
    await (await dc.setPlayerProfile(contractAddresses.PlayerProfile)).wait();
    logSuccess("✅ DungeonCore 設定完成！");

    // 設定其他合約依賴
    await (await (deployedContracts.DungeonStorage.instance as any).setLogicContract(contractAddresses.DungeonMaster)).wait();
    await (await (deployedContracts.Hero.instance as any).setDungeonCore(contractAddresses.DungeonCore)).wait();
    await (await (deployedContracts.Hero.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.Hero.instance as any).setAscensionAltarAddress(contractAddresses.AltarOfAscension)).wait();
    await (await (deployedContracts.Relic.instance as any).setDungeonCore(contractAddresses.DungeonCore)).wait();
    await (await (deployedContracts.Relic.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.Relic.instance as any).setAscensionAltarAddress(contractAddresses.AltarOfAscension)).wait();
    await (await (deployedContracts.Party.instance as any).setDungeonCore(contractAddresses.DungeonCore)).wait();
    await (await (deployedContracts.Party.instance as any).setHeroContract(contractAddresses.Hero)).wait();
    await (await (deployedContracts.Party.instance as any).setRelicContract(contractAddresses.Relic)).wait();
    await (await (deployedContracts.PlayerVault.instance as any).setDungeonCore(contractAddresses.DungeonCore)).wait();
    await (await (deployedContracts.PlayerVault.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setDungeonCore(contractAddresses.DungeonCore)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setHeroContract(contractAddresses.Hero)).wait();
    await (await (deployedContracts.AltarOfAscension.instance as any).setRelicContract(contractAddresses.Relic)).wait();
    await (await dm.setDungeonCore(contractAddresses.DungeonCore)).wait();
    await (await dm.setDungeonStorage(contractAddresses.DungeonStorage)).wait();
    await (await dm.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.VIPStaking.instance as any).setDungeonCore(contractAddresses.DungeonCore)).wait();
    await (await (deployedContracts.VIPStaking.instance as any).setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    await (await (deployedContracts.PlayerProfile.instance as any).setDungeonCore(contractAddresses.DungeonCore)).wait();
    logSuccess("✅ 所有合約依賴設定完成！");

    // --- 步驟 3: 設定 BaseURI ---
    log("步驟 3: 設定所有 NFT 合約的 BaseURI...");
    
    const nftContracts = ["Hero", "Relic", "Party", "VIPStaking", "PlayerProfile"];
    const CORRECT_BASE_URIS: { [key: string]: string } = {
        "Hero": `${metadataServerUrl}/api/hero/`,
        "Relic": `${metadataServerUrl}/api/relic/`,
        "Party": `${metadataServerUrl}/api/party/`,
        "VIPStaking": `${metadataServerUrl}/api/vip/`,
        "PlayerProfile": `${metadataServerUrl}/api/profile/`,
    };
    
    for (const name of nftContracts) {
        const contractInstance = deployedContracts[name].instance as any;
        const correctBaseURI = CORRECT_BASE_URIS[name];
        logInfo(`正在為 ${name} 設定 BaseURI 為: ${correctBaseURI}`);
        await (await contractInstance.setBaseURI(correctBaseURI)).wait();
    }
    logSuccess("✅ 所有 BaseURI 設定完成！");

    // --- 步驟 4: 更新 The Graph 子圖 ---
    log("步驟 4: 更新 The Graph 子圖配置...");
    
    const subgraphYamlPath = path.join(__dirname, SUBGRAPH_PATH, "subgraph.yaml");
    if (fs.existsSync(subgraphYamlPath)) {
        let subgraphContent = fs.readFileSync(subgraphYamlPath, 'utf8');
        
        // 更新合約地址
        const addressMappings = {
            '0x648FcDf1f59a2598e9f68aB3210a25A877fAD353': contractAddresses.Hero,
            '0x6704d55c8736e373B001d54Ba00a80dbb0EC793b': contractAddresses.Relic,
            '0x66EA7C0b2BAA497EAf18bE9f3D4459Ffc20ba491': contractAddresses.Party,
            '0xA1830C9E9Acb7356C9FcdF177A81A5B0D90b3062': contractAddresses.VIPStaking,
            '0x5f041FE4f313AF8aB010319BA85b701b33De13B0': contractAddresses.PlayerProfile,
            '0xbD35485ccfc0aDF28582E2Acf2b2D22cD0F92529': contractAddresses.DungeonMaster,
            '0xbaD08C748596fD72D776B2F6aa5F26100334BD4B': contractAddresses.PlayerVault,
            '0xE29Bb0F3C613CCb56c4188026a7C60898Ad068C4': contractAddresses.AltarOfAscension,
            '0x5f840dE828b4349f2391aF35721564a248C077Fc': contractAddresses.DungeonCore,
            '0xe72eDD302C51DAb2a2Fc599a8e2CF74247dc563B': contractAddresses.Oracle
        };
        
        for (const [oldAddr, newAddr] of Object.entries(addressMappings)) {
            subgraphContent = subgraphContent.replace(new RegExp(oldAddr, 'gi'), newAddr);
        }
        
        fs.writeFileSync(subgraphYamlPath, subgraphContent);
        logSuccess("✅ subgraph.yaml 已更新！");
        
        // 同步 config.ts
        logInfo("同步子圖配置文件...");
        const subgraphDir = path.join(__dirname, SUBGRAPH_PATH);
        execCommand("npm run sync-addresses", subgraphDir);
        
        // 重新生成代碼並構建
        logInfo("重新生成子圖代碼...");
        execCommand("npm run codegen", subgraphDir);
        execCommand("npm run build", subgraphDir);
        
        logWarning("⚠️  請手動執行 'npm run deploy' 來部署子圖到 The Graph Studio");
    } else {
        logWarning("⚠️  找不到 subgraph.yaml 文件");
    }

    // --- 步驟 5: 更新後端 Metadata Server ---
    log("步驟 5: 更新後端 Metadata Server...");
    
    const metadataServerIndexPath = path.join(__dirname, METADATA_SERVER_PATH, "src/index.js");
    if (fs.existsSync(metadataServerIndexPath)) {
        updateFileContent(metadataServerIndexPath, {
            "0x648FcDf1f59a2598e9f68aB3210a25A877fAD353": contractAddresses.Hero,
            "0x6704d55c8736e373B001d54Ba00a80dbb0EC793b": contractAddresses.Relic,
            "0x66EA7C0b2BAA497EAf18bE9f3D4459Ffc20ba491": contractAddresses.Party,
            "0x845dE2d044323161703bb0C6fFb1f2CE287AD5BB": contractAddresses.VIPStaking,
            "0x5f041FE4f313AF8aB010319BA85b701b33De13B0": contractAddresses.PlayerProfile
        });
        
        logWarning("⚠️  請執行以下命令來部署 metadata server:");
        logInfo("cd " + METADATA_SERVER_PATH);
        logInfo("git add -A && git commit -m 'Update contract addresses' && git push");
    } else {
        logWarning("⚠️  找不到 metadata server index.js 文件");
    }

    // --- 步驟 6: 生成前端 .env 文件 ---
    log("步驟 6: 生成前端環境變量配置...");
    
    const envContent = `# GraphQL API URL
VITE_THE_GRAPH_STUDIO_API_URL=${graphApiUrl}

# Mainnet URL
VITE_MAINNET_URL=${frontendUrl}

# Developer Address
VITE_DEVELOPER_ADDRESS=${finalOwner}

# 核心合約地址
VITE_MAINNET_ORACLE_ADDRESS=${contractAddresses.Oracle}
VITE_MAINNET_DUNGEONSTORAGE_ADDRESS=${contractAddresses.DungeonStorage}
VITE_MAINNET_PLAYERVAULT_ADDRESS=${contractAddresses.PlayerVault}
VITE_MAINNET_ALTAROFASCENSION_ADDRESS=${contractAddresses.AltarOfAscension}
VITE_MAINNET_DUNGEONMASTER_ADDRESS=${contractAddresses.DungeonMaster}
VITE_MAINNET_DUNGEONCORE_ADDRESS=${contractAddresses.DungeonCore}

# NFT 合約地址
VITE_MAINNET_HERO_ADDRESS=${contractAddresses.Hero}
VITE_MAINNET_RELIC_ADDRESS=${contractAddresses.Relic}
VITE_MAINNET_PARTY_ADDRESS=${contractAddresses.Party}
VITE_MAINNET_VIPSTAKING_ADDRESS=${contractAddresses.VIPStaking}
VITE_MAINNET_PLAYERPROFILE_ADDRESS=${contractAddresses.PlayerProfile}

# 代幣地址
VITE_MAINNET_SOULSHARDTOKEN_ADDRESS=${SOUL_SHARD_TOKEN_ADDRESS}
VITE_MAINNET_USD_ADDRESS=${USD_TOKEN_ADDRESS}
VITE_MAINNET_POOL_ADDRESS=${POOL_ADDRESS}

# Metadata Server URL
VITE_METADATA_SERVER_URL=${metadataServerUrl}

# Alchemy API Key (需要您手動填寫)
VITE_ALCHEMY_BSC_MAINNET_RPC_URL=https://bnb-mainnet.g.alchemy.com/v2/YOUR_API_KEY_HERE

# WalletConnect Project ID (需要您手動填寫)
VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE
`;

    const frontendEnvPath = path.join(__dirname, FRONTEND_PATH, ".env.production");
    fs.writeFileSync(frontendEnvPath, envContent);
    logSuccess(`✅ 前端 .env.production 文件已生成！`);

    // --- 最終報告 ---
    log("🎉 部署完成！以下是所有系統的更新狀態：");
    
    console.log("\n📋 合約地址匯總：");
    console.log("=====================================");
    for (const name in contractAddresses) {
        console.log(`${name.padEnd(20)}: ${contractAddresses[name]}`);
    }
    
    console.log("\n📝 需要手動完成的步驟：");
    console.log("=====================================");
    console.log("1. 部署 The Graph 子圖:");
    console.log(`   cd ${SUBGRAPH_PATH}`);
    console.log("   npm run deploy");
    console.log("");
    console.log("2. 部署 Metadata Server:");
    console.log(`   cd ${METADATA_SERVER_PATH}`);
    console.log("   git add -A && git commit -m 'Update contract addresses' && git push");
    console.log("");
    console.log("3. 更新前端環境變量:");
    console.log("   - 編輯 " + path.join(FRONTEND_PATH, ".env.production"));
    console.log("   - 填寫 VITE_ALCHEMY_BSC_MAINNET_RPC_URL");
    console.log("   - 填寫 VITE_WALLETCONNECT_PROJECT_ID");
    console.log("");
    console.log("4. 部署前端:");
    console.log(`   cd ${FRONTEND_PATH}`);
    console.log("   npm run build");
    console.log("   git add -A && git commit -m 'Update contract addresses' && git push");
    
    console.log("\n⚠️  重要提醒：");
    console.log("=====================================");
    console.log("- 確保所有系統都使用相同的合約地址");
    console.log("- The Graph 需要等待索引完成（約 10-30 分鐘）");
    console.log("- Metadata Server 部署後需要等待 Render 完成（約 3-5 分鐘）");
    console.log("- 記得更新 NFT 市場的 Collection 資訊");
}

// =================================================================
// Section: 執行主函數
// =================================================================

main().catch((error) => {
    console.error("❌ 部署過程中發生致命錯誤:", error);
    process.exitCode = 1;
});