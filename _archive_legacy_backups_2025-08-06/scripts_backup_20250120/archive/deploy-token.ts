// scripts/deploy-tokens.ts

import { ethers, run, network } from "hardhat";
import "dotenv/config";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

async function main() {
    log("🚀 階段一：正在部署並驗證測試代幣...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);

    // 部署 SoulShard 測試代幣
    const soulShardFactory = await ethers.getContractFactory("Test_SoulShard");
    const soulShardToken = await soulShardFactory.deploy();
    await soulShardToken.waitForDeployment();
    const soulShardAddress = await soulShardToken.getAddress();
    logSuccess(`✅ Test_SoulShard 已部署至: ${soulShardAddress}`);

    // 部署 USD 測試代幣
    const usdFactory = await ethers.getContractFactory("Test_USD1");
    const usdToken = await usdFactory.deploy();
    await usdToken.waitForDeployment();
    const usdAddress = await usdToken.getAddress();
    logSuccess(`✅ Test_USD1 已部署至: ${usdAddress}`);

    // ★ 新增：自動驗證合約原始碼
    // 僅在非本地網路（如 bscTestnet）上執行驗證
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("🔍 正在驗證合約，請稍候...");
        // 等待幾個區塊，確保合約已在區塊鏈瀏覽器上可見
        await new Promise(resolve => setTimeout(resolve, 30000)); 

        try {
            logInfo("正在驗證 Test_SoulShard...");
            await run("verify:verify", {
                address: soulShardAddress,
                constructorArguments: [],
                // ★ 核心修正：明確指定合約的完整路徑和名稱
                contract: "contracts/Test_SoulShard.sol:Test_SoulShard",
            });
            logSuccess("✅ Test_SoulShard 驗證成功！");
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                logInfo("...Test_SoulShard 已驗證。");
            } else {
                logError(`❌ Test_SoulShard 驗證失敗: ${e.message}`);
            }
        }

        try {
            logInfo("正在驗證 Test_USD1...");
            await run("verify:verify", {
                address: usdAddress,
                constructorArguments: [],
                // ★ 核心修正：明確指定合約的完整路徑和名稱
                contract: "contracts/Test_USD1.sol:Test_USD1",
            });
            logSuccess("✅ Test_USD1 驗證成功！");
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                logInfo("...Test_USD1 已驗證。");
            } else {
                logError(`❌ Test_USD1 驗證失敗: ${e.message}`);
            }
        }
    }

    log("🎉 階段一完成！請執行以下手動步驟：");
    logInfo("1. 複製以上兩個代幣地址。");
    logInfo("2. 前往 PancakeSwap 測試網，創建一個新的 V3 流動性池。");
    logInfo("3. 將您提供的流動性（例如 2億 SOUL 和 11750 USD）添加到池子中。");
    logInfo("4. 複製新創建的流動性池地址。");
    logInfo("5. 將這三個地址填入您的 .env 檔案中：");
    console.log(`
SOUL_SHARD_TOKEN_ADDRESS=${soulShardAddress}
USD_TOKEN_ADDRESS=${usdAddress}
POOL_ADDRESS=【請在此處貼上您剛剛創建的池子地址】
    `);
    log("完成後，即可運行第二階段的部署腳本。");
}

main().catch((error) => {
  console.error("❌ 部署過程中發生致命錯誤:", error);
  process.exitCode = 1;
});
