// V22 Configuration - 2025-07-25
// Oracle V22 with Adaptive TWAP - Production Deployment

module.exports = {
  // 版本信息
  version: "V22",
  lastUpdated: "2025-07-25",
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
    },
    V22: {
      date: "2025-07-25",
      description: "部署自適應 TWAP Oracle，永不失敗的價格查詢",
      changes: {
        ORACLE: {
          old: "0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B",
          new: "0xb9317179466fd7fb253669538dE1c4635E81eAc4"
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
      address: "0xb9317179466fd7fb253669538dE1c4635E81eAc4",
      deployedAt: "V22",
      type: "PriceOracle",
      description: "Adaptive TWAP Oracle (30/15/5/1 min)",
      features: [
        "自適應 TWAP 週期",
        "自動降級機制",
        "永不失敗查詢",
        "向後兼容 V21"
      ],
      verified: false
    },
    ORACLE_OLD_V21: {
      address: "0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B",
      deployedAt: "V21",
      type: "PriceOracle (Deprecated)",
      description: "舊版 Oracle，已被 V22 取代"
    },
    PLAYERVAULT: {
      address: "0x76d4f6f7270eE61743487c43Cf5E7281238d77F9",
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
      address: "0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee",
      deployedAt: "V19",
      type: "ERC721",
      description: "隊伍 NFT"
    },
    VIPSTAKING: {
      address: "0xc59B9944a9CbB947F4067F941EbFB0a5A2564eb9",
      deployedAt: "V19",
      type: "Staking",
      description: "VIP 質押系統"
    },
    PLAYERPROFILE: {
      address: "0x4998FADF96Be619d54f6E9bcc654F89937201FBe",
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
      address: "0x9ccF46E49DdA7D2DF7cE8064FB879D786D8b12D0",
      deployedAt: "V22_Fixed",
      type: "GameLogic",
      description: "地城探索邏輯 (V22_Fixed - 修復結構不匹配問題)"
    },
    DUNGEONSTORAGE: {
      address: "0x17Bd4d145D7dA47833D797297548039D4E666a8f",
      deployedAt: "V22",
      type: "Storage",
      description: "地城數據存儲"
    },
    ALTAROFASCENSION: {
      address: "0xfb121441510296A92c8A2Cc04B6Aff1a2f72cd3f",
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
    oracle: {
      adaptivePeriods: [1800, 900, 300, 60], // 30分鐘, 15分鐘, 5分鐘, 1分鐘
      defaultPeriod: 1800
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