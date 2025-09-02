#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// V25.0.4 完整配置
const V25_0_4_CONFIG = {
  version: "V25.0.4",
  deploymentDate: "2025-08-20T23:00:00.000Z",
  startBlock: 58378888,
  adminWallet: "0xEbCF4A36Ad1485A9737025e9d72186b604487274",
  contracts: {
    // 核心合約
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    ORACLE: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
    DUNGEONSTORAGE: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
    DUNGEONMASTER: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
    ALTAROFASCENSION: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
    
    // NFT 合約
    HERO: "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19",
    RELIC: "0x91Bf924E9CEF490F7C999C1F083eE1636595220D",
    PARTY: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
    PLAYERPROFILE: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
    VIPSTAKING: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661",
    PLAYERVAULT: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
    
    // VRF 合約
    VRF_MANAGER_V2PLUS: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
    
    // 代幣合約
    SOULSHARD: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
    USD: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
    UNISWAP_POOL: "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa"
  },
  vrf: {
    coordinator: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
    keyHash: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",
    subscriptionId: "88422796721004450630713121079263696788635490871993157345476848872165866246915"
  },
  endpoints: {
    decentralizedSubgraph: "https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs",
    studioSubgraph: "https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/version/latest",
    backend: "https://dungeon-delvers-metadata-server.onrender.com"
  }
};

console.log("🚀 V25.0.4 全面配置更新工具");
console.log("================================\n");

// 檢查並更新後端配置
function updateBackendConfig() {
  console.log("📦 更新後端配置...");
  
  const backendConfigPath = "/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json";
  
  const backendConfig = {
    network: "bsc",
    chainId: 56,
    rpcUrl: "https://bnb-mainnet.g.alchemy.com/v2/QzXiHWkNRovjd_EeDRqVfR9rApUDiXRp",
    contracts: {
      dungeoncore: V25_0_4_CONFIG.contracts.DUNGEONCORE.toLowerCase(),
      oracle: V25_0_4_CONFIG.contracts.ORACLE.toLowerCase(),
      hero: V25_0_4_CONFIG.contracts.HERO.toLowerCase(),
      relic: V25_0_4_CONFIG.contracts.RELIC.toLowerCase(),
      party: V25_0_4_CONFIG.contracts.PARTY.toLowerCase(),
      dungeonmaster: V25_0_4_CONFIG.contracts.DUNGEONMASTER.toLowerCase(),
      dungeonstorage: V25_0_4_CONFIG.contracts.DUNGEONSTORAGE.toLowerCase(),
      altarOfAscension: V25_0_4_CONFIG.contracts.ALTAROFASCENSION.toLowerCase(),
      playervault: V25_0_4_CONFIG.contracts.PLAYERVAULT.toLowerCase(),
      playerprofile: V25_0_4_CONFIG.contracts.PLAYERPROFILE.toLowerCase(),
      vipstaking: V25_0_4_CONFIG.contracts.VIPSTAKING.toLowerCase(),
      soulshard: V25_0_4_CONFIG.contracts.SOULSHARD.toLowerCase(),
      usd: V25_0_4_CONFIG.contracts.USD.toLowerCase(),
      uniswap_pool: V25_0_4_CONFIG.contracts.UNISWAP_POOL.toLowerCase(),
      vrf_manager_v2plus: V25_0_4_CONFIG.contracts.VRF_MANAGER_V2PLUS.toLowerCase(),
      developer: V25_0_4_CONFIG.adminWallet.toLowerCase()
    },
    vrf: {
      subscriptionId: V25_0_4_CONFIG.vrf.subscriptionId,
      coordinator: V25_0_4_CONFIG.vrf.coordinator,
      keyHash: V25_0_4_CONFIG.vrf.keyHash
    },
    subgraph: {
      url: V25_0_4_CONFIG.endpoints.decentralizedSubgraph,
      version: "latest"
    },
    deployment: {
      version: V25_0_4_CONFIG.version,
      date: V25_0_4_CONFIG.deploymentDate,
      startBlock: V25_0_4_CONFIG.startBlock.toString()
    }
  };
  
  try {
    fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
    console.log("✅ 後端配置已更新");
  } catch (error) {
    console.log("❌ 後端配置更新失敗:", error.message);
  }
}

// 檢查並更新前端配置
function updateFrontendConfig() {
  console.log("\n🎨 更新前端配置...");
  
  const frontendEnvPath = "/Users/sotadic/Documents/GitHub/SoulboundSaga/.env.local";
  
  const envContent = `# V25.0.4 統一配置
# 更新時間: ${new Date().toISOString()}
# 起始區塊: ${V25_0_4_CONFIG.startBlock}

# ==================== 第三方服務 ====================
VITE_WALLETCONNECT_PROJECT_ID=d02f4199d4862ab0a12a3d0424fb567b

# ==================== RPC 配置 ====================
# Alchemy Keys（用於負載均衡）
VITE_ALCHEMY_KEY=3lmTWjUVbFylAurhdU-rSUefTC-P4tKf
VITE_ALCHEMY_KEY_PUBLIC=QzXiHWkNRovjd_EeDRqVfR9rApUDiXRp
VITE_ALCHEMY_KEY_1=3lmTWjUVbFylAurhdU-rSUefTC-P4tKf
VITE_ALCHEMY_KEY_2=tiPlQVTwx4_2P98Pl7hb-LfzaTyi5HOn
VITE_ALCHEMY_KEY_3=QzXiHWkNRovjd_EeDRqVfR9rApUDiXRp
VITE_ALCHEMY_KEY_4=fB2BrBD6zFEhc6YoWxwuP5UQJ_ee-99M
VITE_ALCHEMY_KEY_5=F7E3-HDwgUHDQvdICnFv_

# ==================== 合約地址 ====================
VITE_HERO_ADDRESS=${V25_0_4_CONFIG.contracts.HERO}
VITE_RELIC_ADDRESS=${V25_0_4_CONFIG.contracts.RELIC}
VITE_PARTY_ADDRESS=${V25_0_4_CONFIG.contracts.PARTY}
VITE_DUNGEONMASTER_ADDRESS=${V25_0_4_CONFIG.contracts.DUNGEONMASTER}
VITE_DUNGEONSTORAGE_ADDRESS=${V25_0_4_CONFIG.contracts.DUNGEONSTORAGE}
VITE_ALTAROFASCENSION_ADDRESS=${V25_0_4_CONFIG.contracts.ALTAROFASCENSION}
VITE_PLAYERVAULT_ADDRESS=${V25_0_4_CONFIG.contracts.PLAYERVAULT}
VITE_PLAYERPROFILE_ADDRESS=${V25_0_4_CONFIG.contracts.PLAYERPROFILE}
VITE_VIPSTAKING_ADDRESS=${V25_0_4_CONFIG.contracts.VIPSTAKING}
VITE_VRFMANAGER_ADDRESS=${V25_0_4_CONFIG.contracts.VRF_MANAGER_V2PLUS}
VITE_VRF_MANAGER_V2PLUS_ADDRESS=${V25_0_4_CONFIG.contracts.VRF_MANAGER_V2PLUS}

# 新部署的核心合約
VITE_DUNGEONCORE_ADDRESS=${V25_0_4_CONFIG.contracts.DUNGEONCORE}
VITE_ORACLE_ADDRESS=${V25_0_4_CONFIG.contracts.ORACLE}
VITE_SOULSHARD_ADDRESS=${V25_0_4_CONFIG.contracts.SOULSHARD}
VITE_USD_ADDRESS=${V25_0_4_CONFIG.contracts.USD}
VITE_UNISWAP_POOL_ADDRESS=${V25_0_4_CONFIG.contracts.UNISWAP_POOL}

# ==================== 服務端點 ====================
VITE_SUBGRAPH_DECENTRALIZED_URL=${V25_0_4_CONFIG.endpoints.decentralizedSubgraph}
VITE_SUBGRAPH_STUDIO_URL=${V25_0_4_CONFIG.endpoints.studioSubgraph}
VITE_SUBGRAPH_URL=${V25_0_4_CONFIG.endpoints.decentralizedSubgraph}
VITE_BACKEND_URL=${V25_0_4_CONFIG.endpoints.backend}

# ==================== 部署信息 ====================
VITE_CONTRACT_VERSION=${V25_0_4_CONFIG.version}
VITE_START_BLOCK=${V25_0_4_CONFIG.startBlock}
VITE_DEPLOYMENT_DATE=${V25_0_4_CONFIG.deploymentDate}
VITE_ADMIN_WALLET=${V25_0_4_CONFIG.adminWallet}
VITE_NETWORK=BSC Mainnet
VITE_CHAIN_ID=56

# ==================== VRF 配置 ====================
VITE_VRF_ENABLED=true
VITE_VRF_SUBSCRIPTION_ID=${V25_0_4_CONFIG.vrf.subscriptionId}
VITE_VRF_COORDINATOR=${V25_0_4_CONFIG.vrf.coordinator}
VITE_VRF_KEY_HASH=${V25_0_4_CONFIG.vrf.keyHash}
VITE_VRF_REQUEST_CONFIRMATIONS=6
VITE_VRF_NUM_WORDS=1
VITE_VRF_CALLBACK_GAS_LIMIT=2500000
`;
  
  try {
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ 前端配置已更新");
  } catch (error) {
    console.log("❌ 前端配置更新失敗:", error.message);
  }
}

// 檢查並更新子圖配置
function updateSubgraphConfig() {
  console.log("\n📊 更新子圖配置...");
  
  const subgraphNetworksPath = "/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers/networks.json";
  
  const networksConfig = {
    bsc: {
      contracts: {
        hero: V25_0_4_CONFIG.contracts.HERO.toLowerCase(),
        relic: V25_0_4_CONFIG.contracts.RELIC.toLowerCase(),
        party: V25_0_4_CONFIG.contracts.PARTY.toLowerCase(),
        dungeonMaster: V25_0_4_CONFIG.contracts.DUNGEONMASTER.toLowerCase(),
        dungeonStorage: V25_0_4_CONFIG.contracts.DUNGEONSTORAGE.toLowerCase(),
        altarOfAscension: V25_0_4_CONFIG.contracts.ALTAROFASCENSION.toLowerCase(),
        vrfManagerV2Plus: V25_0_4_CONFIG.contracts.VRF_MANAGER_V2PLUS.toLowerCase()
      },
      startBlock: V25_0_4_CONFIG.startBlock
    }
  };
  
  try {
    fs.writeFileSync(subgraphNetworksPath, JSON.stringify(networksConfig, null, 2));
    console.log("✅ 子圖配置已更新");
  } catch (error) {
    console.log("❌ 子圖配置更新失敗:", error.message);
  }
}

// 檢查舊地址
function checkOldAddresses() {
  console.log("\n🔍 檢查舊地址殘留...");
  
  const oldAddresses = [
    "0xEbCF4A36Ad1485A9737025e9d72186b604487274", // 舊部署者錢包
    "0x8a2D2b1961135127228EdD71Ff98d6B097915a13", // 舊 DungeonCore
    "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a", // 舊 Oracle
  ];
  
  console.log("需要檢查的舊地址:");
  oldAddresses.forEach(addr => console.log(`  - ${addr}`));
  console.log("\n請手動在各項目中搜尋並替換這些地址。");
}

// 顯示總結
function showSummary() {
  console.log("\n================================");
  console.log("📋 V25.0.4 配置總結");
  console.log("================================");
  console.log("版本:", V25_0_4_CONFIG.version);
  console.log("起始區塊:", V25_0_4_CONFIG.startBlock);
  console.log("管理員錢包:", V25_0_4_CONFIG.adminWallet);
  console.log("\n核心合約:");
  console.log("  DungeonCore:", V25_0_4_CONFIG.contracts.DUNGEONCORE);
  console.log("  PlayerProfile:", V25_0_4_CONFIG.contracts.PLAYERPROFILE);
  console.log("\n⚠️ PlayerProfile 合約需要設置 DungeonCore 地址！");
  console.log("請執行: npx hardhat run scripts/fix-playerprofile-config.js --network bsc");
}

// 執行所有更新
async function main() {
  updateBackendConfig();
  updateFrontendConfig();
  updateSubgraphConfig();
  checkOldAddresses();
  showSummary();
}

main().catch(console.error);