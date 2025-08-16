// V21 統一配置系統
// 這是所有合約地址和配置的單一真相來源

module.exports = {
  // 版本信息
  version: "V21",
  lastUpdated: "2025-01-25",
  network: "bsc-mainnet",
  
  // 部署歷史
  deployments: {
    V19: {
      date: "2025-01-20",
      description: "初始部署，Oracle 有問題"
    },
    V20: {
      date: "2025-01-25", 
      description: "修復 Oracle public 函數問題",
      changes: {
        ORACLE: {
          old: "0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9",
          new: "0x570ab1b068FB8ca51c995e78d2D62189B6201284"
        }
      }
    },
    V21: {
      date: "2025-01-25",
      description: "重新部署 Oracle，使用正確的 SoulShard 地址",
      changes: {
        ORACLE: {
          old: "0x570ab1b068FB8ca51c995e78d2D62189B6201284",
          new: "0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B"
        }
      }
    }
  },
  
  // 當前合約地址
  contracts: {
    // 核心代幣
    USD: {
      address: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
      deployedAt: "V19",
      type: "ERC20",
      description: "USD 穩定幣"
    },
    SOULSHARD: {
      address: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
      deployedAt: "Pre-V19",
      type: "ERC20",
      description: "遊戲代幣"
    },
    
    // DeFi
    ORACLE: {
      address: "0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B",
      deployedAt: "V21",
      type: "PriceOracle",
      description: "Uniswap V3 TWAP 價格預言機",
      verified: false
    },
    PLAYERVAULT: {
      address: "0xE4654796e4c03f88776a666f3A47E16F5d6BE4FA",
      deployedAt: "V19",
      type: "Vault",
      description: "玩家金庫系統"
    },
    
    // NFT 合約
    HERO: {
      address: "0x141F081922D4015b3157cdA6eE970dff34bb8AAb",
      deployedAt: "V19",
      type: "ERC721",
      description: "英雄 NFT",
      mintPrice: "2 USD",
      platformFee: "0.0003 BNB"
    },
    RELIC: {
      address: "0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3",
      deployedAt: "V19",
      type: "ERC721",
      description: "聖物 NFT",
      mintPrice: "0.8 USD",
      platformFee: "0.0003 BNB"
    },
    PARTY: {
      address: "0x096aA1e0f9c87e57e8B69a7DD35D893d13Bba8f5",
      deployedAt: "V19",
      type: "ERC721",
      description: "隊伍 NFT"
    },
    VIPSTAKING: {
      address: "0x43f03C89aF6091090bE05C00a65CC4934CF5f90D",
      deployedAt: "V19",
      type: "Staking",
      description: "VIP 質押系統"
    },
    PLAYERPROFILE: {
      address: "0xc5A972B7186562f768c8aC97D3b4ca15A019657d",
      deployedAt: "V19",
      type: "ERC721",
      description: "玩家檔案 NFT"
    },
    
    // 核心系統
    DUNGEONCORE: {
      address: "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9",
      deployedAt: "V19",
      type: "Core",
      description: "系統核心控制器"
    },
    DUNGEONMASTER: {
      address: "0xbC7eCa65F0D0BA6f7aDDC5C6C956FE926d3344CE",
      deployedAt: "V19",
      type: "GameLogic",
      description: "地城探索邏輯"
    },
    DUNGEONSTORAGE: {
      address: "0x2Fcd1BBbb88CCE8040A2DE92E97d5375D8B088da",
      deployedAt: "V19",
      type: "Storage",
      description: "地城數據存儲"
    },
    ALTAROFASCENSION: {
      address: "0xFaEda7886Cc9dF32a96ebc7DaF4DA1a27d3fB3De",
      deployedAt: "V19",
      type: "GameLogic",
      description: "升星祭壇"
    },
    
    // 其他
    DUNGEONMASTERWALLET: {
      address: "0x10925A7138649C7E1794CE646182eeb5BF8ba647",
      deployedAt: "V19",
      type: "EOA",
      description: "DungeonMaster 獎勵錢包"
    },
    UNISWAP_POOL: {
      address: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
      deployedAt: "External",
      type: "UniswapV3Pool",
      description: "SOUL/USD 交易對"
    }
  },
  
  // 配置參數
  parameters: {
    hero: {
      mintPriceUSD: "2",
      platformFeeBNB: "0.0003"
    },
    relic: {
      mintPriceUSD: "0.8",
      platformFeeBNB: "0.0003"
    },
    dungeons: [
      { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
      { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 83 },
      { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 78 },
      { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 27, successRate: 74 },
      { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 35, successRate: 70 },
      { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 60, successRate: 66 },
      { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 82, successRate: 62 },
      { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 103, successRate: 58 },
      { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 136, successRate: 54 },
      { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 50 }
    ]
  },
  
  // 需要同步的項目
  syncTargets: {
    frontend: {
      path: "/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts",
      format: "typescript"
    },
    backend: {
      path: "/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env",
      format: "env"
    },
    subgraph: {
      path: "/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml",
      format: "yaml"
    }
  }
};