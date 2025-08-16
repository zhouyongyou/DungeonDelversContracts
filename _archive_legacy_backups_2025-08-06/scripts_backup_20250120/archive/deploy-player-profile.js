// scripts/deploy-player-profile.js

const hre = require("hardhat");
const { ethers } = hre;
const {
  DUNGEON_CORE_ADDRESS,
  PROFILE_SVG_LIBRARY_ADDRESS,
} = process.env;

// 一個輔助函式，用於在終端機中打印漂亮的日誌
function log(message, type = "info") {
  const colors = {
    info: "\x1b[36m", // 青色
    success: "\x1b[32m", // 綠色
    warning: "\x1b[33m", // 黃色
    error: "\x1b[31m", // 紅色
    reset: "\x1b[0m",
  };
  console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`);
}

async function main() {
  log("腳本開始執行...", "info");

  // 檢查所有必要的環境變數是否都已設定
  if (!DUNGEON_CORE_ADDRESS || !PROFILE_SVG_LIBRARY_ADDRESS) {
    throw new Error(
      "請在您的 .env 檔案中設定 DUNGEON_CORE_ADDRESS 和 PROFILE_SVG_LIBRARY_ADDRESS"
    );
  }

  const [deployer] = await ethers.getSigners();
  log(`部署者地址: ${deployer.address}`);

  // 1. 部署新的 PlayerProfile 合約
  log("正在部署 PlayerProfile 合約...");
  const PlayerProfileFactory = await ethers.getContractFactory("PlayerProfile");
  const playerProfile = await PlayerProfileFactory.deploy(deployer.address);
  await playerProfile.deployed();
  log(`新的 PlayerProfile 合約已部署至: ${playerProfile.address}`, "success");

  // 2. 在 BscScan 上驗證合約
  log("等待 30 秒，以便區塊鏈瀏覽器索引合約...");
  await new Promise((resolve) => setTimeout(resolve, 30000)); // 等待 30 秒

  try {
    log("正在驗證合約...");
    await hre.run("verify:verify", {
      address: playerProfile.address,
      constructorArguments: [deployer.address],
    });
    log("合約驗證成功！", "success");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      log("合約已經被驗證過了。", "warning");
    } else {
      log(`合約驗證失敗: ${error.message}`, "error");
    }
  }

  // 3. 進行合約設定
  log("開始進行合約串接設定...");

  // 獲取現有的 DungeonCore 合約實例
  const dungeonCore = await ethers.getContractAt(
    "IDungeonCore", // 使用介面 ABI 即可
    DUNGEON_CORE_ADDRESS
  );

  // 3.1 在 DungeonCore 中設定新的 PlayerProfile 地址
  log(`正在 DungeonCore (${dungeonCore.address}) 中設定新的 PlayerProfile 地址...`);
  let tx = await dungeonCore.setPlayerProfile(playerProfile.address);
  await tx.wait();
  log("DungeonCore.setPlayerProfile() 呼叫成功！", "success");

  // 3.2 在新的 PlayerProfile 中設定 DungeonCore 地址
  log(`正在新的 PlayerProfile (${playerProfile.address}) 中設定 DungeonCore 地址...`);
  tx = await playerProfile.setDungeonCore(dungeonCore.address);
  await tx.wait();
  log("PlayerProfile.setDungeonCore() 呼叫成功！", "success");

  // 3.3 在新的 PlayerProfile 中設定 SVG Library 地址
  log(`正在新的 PlayerProfile (${playerProfile.address}) 中設定 SVG Library 地址...`);
  tx = await playerProfile.setProfileSvgLibrary(PROFILE_SVG_LIBRARY_ADDRESS);
  await tx.wait();
  log("PlayerProfile.setProfileSvgLibrary() 呼叫成功！", "success");

  log("所有設定已完成！", "success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
