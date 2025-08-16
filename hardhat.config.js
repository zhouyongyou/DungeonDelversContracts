require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// 從 .env 檔案讀取環境變數
const privateKey = process.env.PRIVATE_KEY || "";
const bscscanApiKey = process.env.BSCSCAN_API_KEY || "";

// RPC URLs
const bscTestnetRpcUrl = process.env.BSC_TESTNET_RPC_URL || process.env.VITE_ALCHEMY_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const bscMainnetRpcUrl = process.env.BSC_MAINNET_RPC_URL || process.env.VITE_ALCHEMY_BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org/";

if (!privateKey) {
  console.warn("⚠️ 警告：找不到 PRIVATE_KEY，請在 .env 檔案中設定。");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "ipfs"
      }
    }
  },
  paths: {
    sources: "./contracts/current", // 只編譯 current 目錄
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    bscTestnet: {
      url: bscTestnetRpcUrl,
      chainId: 97,
      accounts: privateKey !== '' ? [privateKey] : [],
    },
    bsc: {
      url: bscMainnetRpcUrl,
      chainId: 56,
      accounts: privateKey !== '' ? [privateKey] : [],
      gasPrice: 3000000000, // 3 gwei
    },
    hardhat: {
      chainId: 1337,
    }
  },
  etherscan: {
    apiKey: {
      bsc: bscscanApiKey,
      bscTestnet: bscscanApiKey
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};