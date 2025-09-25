// fix-altar-connections.js - 修復 AltarOfAscension 合約連接
// 🎯 目標：設定 AltarOfAscension 的 heroContract 和 relicContract 地址

const { ethers } = require("hardhat");
require('dotenv').config();

// 🔧 BSC 主網配置
const NETWORK_CONFIG = {
  chainId: 56,
  name: "BSC Mainnet",
  rpcUrl: "https://bsc-dataseed.binance.org/"
};

// 📍 v1.4.0.3 合約地址
const ADDRESSES = {
  HERO: "0xc09b6613c32a505bf05f97ed2f567b4959914396",
  RELIC: "0xf4ae79568a34af621bbea06b716e8fb84b5b41b6",
  ALTAROFASCENSION: "0x3dfd80271eb96c3be8d1e841643746954ffda11d",
  DUNGEONCORE: "0x6c900a1cf182aa5960493bf4646c9efc8eaed16b"
};

// ⛽ Gas 配置
const GAS_CONFIG = {
  gasPrice: ethers.parseUnits("3", "gwei"), // BSC 主網適用
  gasLimit: 300000
};

async function checkCurrentConnections() {
  console.log("\n🔍 === 檢查當前連接狀態 ===");

  // 創建 Provider
  const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

  try {
    // 檢查 AltarOfAscension 的當前設定
    const altarContract = new ethers.Contract(
      ADDRESSES.ALTAROFASCENSION,
      [
        "function heroContract() view returns (address)",
        "function relicContract() view returns (address)",
        "function dungeonCore() view returns (address)",
        "function owner() view returns (address)",
        "function paused() view returns (bool)"
      ],
      provider
    );

    console.log("📍 AltarOfAscension 當前狀態:");

    try {
      const heroAddress = await altarContract.heroContract();
      console.log(`  Hero Contract: ${heroAddress}`);
    } catch (error) {
      console.log(`  Hero Contract: ❌ 未設定或無法訪問 (${error.reason || error.message})`);
    }

    try {
      const relicAddress = await altarContract.relicContract();
      console.log(`  Relic Contract: ${relicAddress}`);
    } catch (error) {
      console.log(`  Relic Contract: ❌ 未設定或無法訪問 (${error.reason || error.message})`);
    }

    try {
      const dungeonCoreAddress = await altarContract.dungeonCore();
      console.log(`  DungeonCore: ${dungeonCoreAddress}`);
    } catch (error) {
      console.log(`  DungeonCore: ❌ 未設定或無法訪問 (${error.reason || error.message})`);
    }

    try {
      const owner = await altarContract.owner();
      console.log(`  Owner: ${owner}`);
    } catch (error) {
      console.log(`  Owner: ❌ 無法獲取 (${error.reason || error.message})`);
    }

    try {
      const paused = await altarContract.paused();
      console.log(`  Paused: ${paused}`);
    } catch (error) {
      console.log(`  Paused: ❌ 無法獲取 (${error.reason || error.message})`);
    }

  } catch (error) {
    console.error("❌ 檢查連接狀態失敗:", error.message);
  }
}

async function setupAltarConnections() {
  console.log("\n🔧 === 設定 AltarOfAscension 連接 ===");

  // 檢查私鑰
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ 未找到 PRIVATE_KEY 環境變數");
  }

  // 創建 Signer
  const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log(`👤 使用錢包: ${wallet.address}`);

  // 檢查餘額
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 錢包餘額: ${ethers.formatEther(balance)} BNB`);

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("❌ 錢包餘額不足 (需要至少 0.01 BNB)");
  }

  // 獲取合約實例
  const altarContract = new ethers.Contract(
    ADDRESSES.ALTAROFASCENSION,
    [
      "function setDungeonCore(address _address) external",
      "function owner() view returns (address)",
      "function heroContract() view returns (address)",
      "function relicContract() view returns (address)"
    ],
    wallet
  );

  // 檢查權限
  const owner = await altarContract.owner();
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(`❌ 權限不足: 合約擁有者是 ${owner}, 但當前錢包是 ${wallet.address}`);
  }

  console.log("✅ 權限確認: 當前錢包是合約擁有者");

  // 設定 DungeonCore 連接 (這會間接設定 Hero 和 Relic)
  console.log("\n🔗 設定 DungeonCore 連接...");
  try {
    const tx = await altarContract.setDungeonCore(ADDRESSES.DUNGEONCORE, GAS_CONFIG);
    console.log(`📤 交易已發送: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ 交易確認: 區塊 ${receipt.blockNumber}`);

    // 驗證設定
    await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒

    console.log("\n✅ === 驗證設定結果 ===");
    await checkCurrentConnections();

  } catch (error) {
    console.error("❌ 設定 DungeonCore 失敗:", error.message);

    // 提供詳細錯誤信息
    if (error.reason) {
      console.error("   原因:", error.reason);
    }
    if (error.code) {
      console.error("   錯誤代碼:", error.code);
    }
  }
}

async function main() {
  console.log("🔧 AltarOfAscension 連接修復工具");
  console.log("=".repeat(50));
  console.log(`🌐 網路: ${NETWORK_CONFIG.name}`);
  console.log(`⛽ Gas Price: ${ethers.formatUnits(GAS_CONFIG.gasPrice, "gwei")} gwei`);

  try {
    // 先檢查當前狀態
    await checkCurrentConnections();

    // 然後嘗試修復
    await setupAltarConnections();

    console.log("\n🎉 === 修復完成 ===");
    console.log("✅ AltarOfAscension 應該現在可以正常運作了");
    console.log("🔗 請在前端重新嘗試升星操作");

  } catch (error) {
    console.error("\n💥 === 修復失敗 ===");
    console.error("❌ 錯誤:", error.message);

    console.log("\n🛠️ === 手動解決方案 ===");
    console.log("1. 確認錢包地址是合約擁有者");
    console.log("2. 確認網路連接到 BSC 主網");
    console.log("3. 確認錢包有足夠的 BNB 支付 Gas");
    console.log("4. 手動調用 AltarOfAscension.setDungeonCore() 函數");
  }
}

// 運行腳本
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 腳本執行失敗:", error);
      process.exit(1);
    });
}

module.exports = { checkCurrentConnections, setupAltarConnections };