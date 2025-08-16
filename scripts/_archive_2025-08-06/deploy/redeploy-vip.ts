// scripts/redeploy-vip.ts - 重新部署 VIP 合約並更新配置
import { ethers, run, network } from "hardhat";
import fs from "fs";
import path from "path";
import "dotenv/config";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

interface ConfigContract {
  [key: string]: string;
}

interface Config {
  network: string;
  version: string;
  lastUpdated: string;
  contracts: ConfigContract;
  tokens: ConfigContract;
  pool: string;
  apis: ConfigContract;
  explorerUrls: ConfigContract;
  vipFixChanges: {
    description: string;
    changes: string[];
  };
}

async function main() {
    log("🔄 重新部署 VIP 合約 (平方根計算修正版)...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);

    // 讀取現有配置
    const configPath = path.join(__dirname, "..", "shared-config.json");
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 驗證環境變數
    const {
        FINAL_OWNER_ADDRESS,
        SOUL_SHARD_TOKEN_ADDRESS,
        METADATA_SERVER_BASE_URL
    } = process.env;

    if (!SOUL_SHARD_TOKEN_ADDRESS || !METADATA_SERVER_BASE_URL) {
        throw new Error("❌ 錯誤：請在 .env 檔案中提供 SOUL_SHARD_TOKEN_ADDRESS 和 METADATA_SERVER_BASE_URL");
    }

    const finalOwner = FINAL_OWNER_ADDRESS || deployer.address;
    const dungeonCoreAddress = config.contracts.dungeonCore;

    logInfo(`DungeonCore 地址: ${dungeonCoreAddress}`);
    logInfo(`SoulShard 代幣地址: ${SOUL_SHARD_TOKEN_ADDRESS}`);
    logInfo(`元數據伺服器: ${METADATA_SERVER_BASE_URL}`);

    // 部署新的 VIP 合約
    log("步驟 1: 部署新的 VIPStaking 合約...");
    const VIPStakingFactory = await ethers.getContractFactory("VIPStaking");
    const newVIPStaking = await VIPStakingFactory.deploy(deployer.address);
    await newVIPStaking.waitForDeployment();
    const newVIPAddress = await newVIPStaking.getAddress();
    
    logSuccess(`✅ 新 VIPStaking 合約已部署至: ${newVIPAddress}`);

    // 設定新 VIP 合約
    log("步驟 2: 設定新 VIP 合約依賴...");
    await (await newVIPStaking.setDungeonCore(dungeonCoreAddress)).wait();
    await (await newVIPStaking.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS)).wait();
    
    // 設定 BaseURI
    const baseURI = `${METADATA_SERVER_BASE_URL}/api/vipstaking/`;
    await (await newVIPStaking.setBaseURI(baseURI)).wait();
    logInfo(`BaseURI 設定為: ${baseURI}`);

    // 更新 DungeonCore 中的 VIP 地址
    log("步驟 3: 更新 DungeonCore 中的 VIP 地址...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    await (await dungeonCore.setVipStaking(newVIPAddress)).wait();
    logSuccess("✅ DungeonCore 已更新 VIP 地址");

    // 驗證合約
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 4: 驗證新 VIP 合約...");
        logInfo("等待 30 秒確保合約資訊同步...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            await run("verify:verify", {
                address: newVIPAddress,
                constructorArguments: [deployer.address],
            });
            logSuccess(`✅ VIP 合約驗證成功！`);
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                logInfo("VIP 合約已驗證。");
            } else {
                logError(`❌ VIP 合約驗證失敗: ${e.message}`);
            }
        }
    }

    // 轉移所有權
    if (finalOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        log("步驟 5: 轉移 VIP 合約所有權...");
        await (await newVIPStaking.transferOwnership(finalOwner)).wait();
        logSuccess(`✅ VIP 合約所有權已轉移至: ${finalOwner}`);
    }

    // 更新配置文件
    log("步驟 6: 更新配置文件...");
    config.contracts.vipStaking = newVIPAddress;
    config.explorerUrls.vipStaking = `https://bscscan.com/address/${newVIPAddress}#code`;
    config.version = "VIP Sqrt Calculation Fix - 2024-07-13";
    config.lastUpdated = new Date().toISOString();
    config.vipFixChanges = {
        description: "Fixed VIP level calculation to use square root formula",
        changes: [
            "Updated VIP level calculation to sqrt(USD/100) for smooth progression",
            "Fixed tax reduction to 50 basis points (0.5%) per level",
            "Maintained Oracle integration through DungeonCore",
            "Added proper overflow protection for level calculation"
        ]
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logSuccess("✅ 配置文件已更新");

    // 生成更新腳本
    log("步驟 7: 生成前端和後端更新腳本...");
    
    // 前端更新腳本
    const frontendUpdate = `
// 前端 .env 更新
VITE_MAINNET_VIPSTAKING_ADDRESS=${newVIPAddress}

// 或直接更新 src/config/contracts.ts 中的地址
`;

    // 後端更新腳本
    const backendUpdate = `
// 後端 .env 更新  
VIP_STAKING_ADDRESS=${newVIPAddress}

// 或直接更新 src/index.js 中的 CONTRACTS 配置
const CONTRACTS = {
  // ... 其他合約
  vip: '${newVIPAddress}',
};
`;

    // 子圖更新配置
    const subgraphUpdate = `
# 子圖更新配置
# 請更新 subgraph.yaml 中的 VIPStaking 地址：

dataSources:
  - kind: ethereum
    name: VIPStaking
    network: bsc
    source:
      address: "${newVIPAddress}"
      abi: VIPStaking
      startBlock: ${await ethers.provider.getBlockNumber()}
`;

    fs.writeFileSync(path.join(__dirname, "..", "frontend-vip-update.txt"), frontendUpdate);
    fs.writeFileSync(path.join(__dirname, "..", "backend-vip-update.txt"), backendUpdate);
    fs.writeFileSync(path.join(__dirname, "..", "subgraph-vip-update.yaml"), subgraphUpdate);

    // 最終報告
    log("🎉 VIP 合約重新部署完成！");
    console.log("\n=== 部署摘要 ===");
    console.log(`舊 VIP 地址: ${config.contracts.vipStaking}`);
    console.log(`新 VIP 地址: ${newVIPAddress}`);
    console.log(`BSC Scan: https://bscscan.com/address/${newVIPAddress}#code`);
    console.log(`當前區塊: ${await ethers.provider.getBlockNumber()}`);
    
    console.log("\n=== 後續步驟 ===");
    console.log("1. 檢查 frontend-vip-update.txt 更新前端地址");
    console.log("2. 檢查 backend-vip-update.txt 更新後端地址");
    console.log("3. 檢查 subgraph-vip-update.yaml 更新子圖配置");
    console.log("4. 重新部署子圖到 The Graph");
    console.log("5. 重新部署後端伺服器");
    console.log("6. 重新建構並部署前端");
    
    console.log("\n=== VIP 功能變更 ===");
    console.log("• VIP 等級計算：level = √(USD價值/100)");
    console.log("• 稅率減免：每級 50 基點 (0.5%)");
    console.log("• 平滑成長，無等級上限");
    console.log("• 示例：$100=VIP1, $400=VIP2, $900=VIP3, $10000=VIP10");
}

main().catch((error) => {
    console.error("❌ VIP 重新部署失敗:", error);
    process.exitCode = 1;
});