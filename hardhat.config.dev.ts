import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// 開發環境配置 - 優化編譯速度

const privateKey = process.env.PRIVATE_KEY || "";
const bscscanApiKey = process.env.BSCSCAN_API_KEY || "";

const bscTestnetRpcUrl = process.env.BSC_TESTNET_RPC_URL || process.env.VITE_ALCHEMY_BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const bscMainnetRpcUrl = process.env.BSC_MAINNET_RPC_URL || process.env.VITE_ALCHEMY_BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org/";

if (!privateKey) {
  console.warn("⚠️ 警告：找不到 PRIVATE_KEY，請在 .env 檔案中設定。");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // 開發環境關閉 viaIR 以加速編譯
      viaIR: false,
      metadata: {
        bytecodeHash: "ipfs"
      }
    }
  },
  paths: {
    sources: "./contracts/current",
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
    },
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