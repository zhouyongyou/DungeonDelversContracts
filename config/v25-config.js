// V25 部署配置 - 2025-08-03T15:55:40.243Z
// 自動生成，請勿手動修改

module.exports = {
  "version": "V25",
  "lastUpdated": "2025-08-03T15:55:40.243Z",
  "network": "BSC Mainnet",
  "deployer": "0x10925A7138649C7E1794CE646182eeb5BF8ba647",
  "startBlock": 56317376,
  "contracts": {
    "SOULSHARD": {
      "address": "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
      "deploymentBlock": 56317376,
      "contractName": "SOULSHARD"
    },
    "UNISWAP_POOL": {
      "address": "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
      "deploymentBlock": 56317376,
      "contractName": "UNISWAP_POOL"
    },
    "ORACLE": {
      "address": "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
      "deploymentBlock": 56317376,
      "contractName": "Oracle_V22_Adaptive"
    },
    "PLAYERVAULT": {
      "address": "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
      "deploymentBlock": 56317376,
      "contractName": "PlayerVault"
    },
    "DUNGEONCORE": {
      "address": "0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a",
      "deploymentBlock": 56317376,
      "contractName": "DungeonCore"
    },
    "DUNGEONSTORAGE": {
      "address": "0x1Fd33E7883FdAC36a49f497440a4E2e95C6fcC77",
      "deploymentBlock": 56317376,
      "contractName": "DungeonStorage"
    },
    "DUNGEONMASTER": {
      "address": "0xd06470d4C6F62F6747cf02bD2b2De0981489034F",
      "deploymentBlock": 56317376,
      "contractName": "DungeonMasterV2_Fixed"
    },
    "HERO": {
      "address": "0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db",
      "deploymentBlock": 56317376,
      "contractName": "Hero"
    },
    "RELIC": {
      "address": "0xcfB83d8545D68b796a236290b3C1bc7e4A140B11",
      "deploymentBlock": 56317376,
      "contractName": "Relic"
    },
    "PARTY": {
      "address": "0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69",
      "deploymentBlock": 56317376,
      "contractName": "PartyV3"
    },
    "VIPSTAKING": {
      "address": "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
      "deploymentBlock": 56317376,
      "contractName": "VIPStaking"
    },
    "PLAYERPROFILE": {
      "address": "0x0f5932e89908400a5AfDC306899A2987b67a3155",
      "deploymentBlock": 56317376,
      "contractName": "PlayerProfile"
    },
    "ALTAROFASCENSION": {
      "address": "0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686",
      "deploymentBlock": 56317376,
      "contractName": "AltarOfAscensionV2Fixed"
    }
  },
  "deploymentOptions": {
    "deployNewTokens": false,
    "existingContracts": {
      "SOULSHARD": "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
      "UNISWAP_POOL": "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"
    },
    "externalAddresses": {
      "USDT": "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"
    },
    "options": {
      "autoVerify": true,
      "setupConnections": true,
      "initializeParams": true,
      "deployMarketplace": false,
      "generateDocs": true
    }
  },
  "gameParams": {
    "mintPriceUSD": 2,
    "dungeons": [
      {
        "id": 1,
        "name": "新手礦洞",
        "requiredPower": 300,
        "rewardUSD": 6,
        "successRate": 89
      },
      {
        "id": 2,
        "name": "哥布林洞穴",
        "requiredPower": 600,
        "rewardUSD": 12,
        "successRate": 84
      },
      {
        "id": 3,
        "name": "食人魔山谷",
        "requiredPower": 900,
        "rewardUSD": 20,
        "successRate": 79
      },
      {
        "id": 4,
        "name": "蜘蛛巢穴",
        "requiredPower": 1200,
        "rewardUSD": 33,
        "successRate": 74
      },
      {
        "id": 5,
        "name": "石化蜥蜴沼澤",
        "requiredPower": 1500,
        "rewardUSD": 52,
        "successRate": 69
      },
      {
        "id": 6,
        "name": "巫妖墓穴",
        "requiredPower": 1800,
        "rewardUSD": 78,
        "successRate": 64
      },
      {
        "id": 7,
        "name": "奇美拉之巢",
        "requiredPower": 2100,
        "rewardUSD": 113,
        "successRate": 59
      },
      {
        "id": 8,
        "name": "惡魔前哨站",
        "requiredPower": 2400,
        "rewardUSD": 156,
        "successRate": 54
      },
      {
        "id": 9,
        "name": "巨龍之巔",
        "requiredPower": 2700,
        "rewardUSD": 209,
        "successRate": 49
      },
      {
        "id": 10,
        "name": "混沌深淵",
        "requiredPower": 3000,
        "rewardUSD": 225,
        "successRate": 44
      },
      {
        "id": 11,
        "name": "冥界之門",
        "requiredPower": 3300,
        "rewardUSD": 320,
        "successRate": 39
      },
      {
        "id": 12,
        "name": "虛空裂隙",
        "requiredPower": 3600,
        "rewardUSD": 450,
        "successRate": 34
      }
    ],
    "baseURIs": {
      "HERO": "https://dungeon-delvers-metadata-server.onrender.com/api/hero/",
      "RELIC": "https://dungeon-delvers-metadata-server.onrender.com/api/relic/",
      "PARTY": "https://dungeon-delvers-metadata-server.onrender.com/api/party/",
      "VIPSTAKING": "https://dungeon-delvers-metadata-server.onrender.com/api/vip/",
      "PLAYERPROFILE": "https://dungeon-delvers-metadata-server.onrender.com/api/profile/"
    },
    "contractURIs": {
      "HERO": "https://www.dungeondelvers.xyz/metadata/hero-collection.json",
      "RELIC": "https://www.dungeondelvers.xyz/metadata/relic-collection.json",
      "PARTY": "https://www.dungeondelvers.xyz/metadata/party-collection.json",
      "VIPSTAKING": "https://www.dungeondelvers.xyz/metadata/vip-staking-collection.json",
      "PLAYERPROFILE": "https://www.dungeondelvers.xyz/metadata/player-profile-collection.json"
    },
    "partyCreationFee": "0.001",
    "vipUnstakeCooldown": 86400
  }
};