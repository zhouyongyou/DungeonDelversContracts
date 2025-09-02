import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// 該行僅用於確認配置檔案是否被讀取，現已移除避免影響合約編譯
// console.log("✅ hardhat.config.ts 檔案已成功讀取！");

// 從 .env 檔案讀取環境變數
const privateKey = process.env.PRIVATE_KEY || "";
const bscscanApiKey = process.env.BSCSCAN_API_KEY || "";

// 為測試網和主網分別讀取 RPC URL，並提供公開的備用節點
const bscTestnetRpcUrl = process.env.BSC_TESTNET_RPC_URL || process.env.VITE_ALCHEMY_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const bscMainnetRpcUrl = process.env.BSC_MAINNET_RPC_URL || process.env.VITE_ALCHEMY_BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/";

if (!privateKey) {
  console.warn("⚠️ 警告：找不到 PRIVATE_KEY，請在 .env 檔案中設定。");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      // V15: 必須使用 viaIR 才能編譯
      viaIR: true,
      metadata: {
        // 確保元數據一致性
        bytecodeHash: "ipfs"
      }
    }
  },
  paths: {
    sources: "./contracts/current", // 只編譯 current 目錄，排除 archive
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    // 測試網設定
    bscTestnet: {
      url: bscTestnetRpcUrl,
      chainId: 97,
      accounts: privateKey !== '' ? [privateKey] : [],
    },
    // 【新增】主網設定
    bsc: {
      url: bscMainnetRpcUrl,
      chainId: 56,
      accounts: privateKey !== '' ? [privateKey] : [],
    },
    // 本地開發網路設定
    hardhat: {
        blockGasLimit: 30000000,
        allowUnlimitedContractSize: true
    }
  },
  etherscan: {
    apiKey: {
      bsc: bscscanApiKey,
    },
  },
};

export default config;
