#!/usr/bin/env node

/**
 * ENV 優先的配置同步腳本
 * 從環境變數讀取 V25.0.4 配置並同步到所有項目
 */

const fs = require('fs');
const path = require('path');

// V25.0.4 配置 - 從環境變數優先，回退到默認值
const V25_0_4_CONFIG = {
  version: process.env.CONTRACT_VERSION || "V25.0.4",
  deploymentDate: process.env.DEPLOYMENT_DATE || "2025-08-20T23:00:00.000Z",
  startBlock: parseInt(process.env.START_BLOCK || "58378888"),
  adminWallet: process.env.ADMIN_WALLET || "0xEbCF4A36Ad1485A9737025e9d72186b604487274",
  contracts: {
    DUNGEONCORE: process.env.DUNGEONCORE_ADDRESS || "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    ORACLE: process.env.ORACLE_ADDRESS || "0xEE322Eff70320759487f67875113C062AC1F4cfB",
    DUNGEONSTORAGE: process.env.DUNGEONSTORAGE_ADDRESS || "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
    DUNGEONMASTER: process.env.DUNGEONMASTER_ADDRESS || "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
    ALTAROFASCENSION: process.env.ALTAROFASCENSION_ADDRESS || "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
    HERO: process.env.HERO_ADDRESS || "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19",
    RELIC: process.env.RELIC_ADDRESS || "0x91Bf924E9CEF490F7C999C1F083eE1636595220D",
    PARTY: process.env.PARTY_ADDRESS || "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
    PLAYERPROFILE: process.env.PLAYERPROFILE_ADDRESS || "0x3509d0f0cD6f7b518860f945128205ac4F426090",
    VIPSTAKING: process.env.VIPSTAKING_ADDRESS || "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661",
    PLAYERVAULT: process.env.PLAYERVAULT_ADDRESS || "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
    VRF_MANAGER_V2PLUS: process.env.VRF_MANAGER_ADDRESS || "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
    SOULSHARD: process.env.SOULSHARD_ADDRESS || "0xB73FE158689EAB3396B64794b573D4BEc7113412",
    USD: process.env.USD_ADDRESS || "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
    UNISWAP_POOL: process.env.UNISWAP_POOL_ADDRESS || "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa"
  },
  vrf: {
    coordinator: process.env.VRF_COORDINATOR || "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
    keyHash: process.env.VRF_KEY_HASH || "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",
    subscriptionId: process.env.VRF_SUBSCRIPTION_ID || "88422796721004450630713121079263696788635490871993157345476848872165866246915"
  },
  endpoints: {
    decentralizedSubgraph: process.env.SUBGRAPH_DECENTRALIZED_URL || "https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs",
    studioSubgraph: process.env.SUBGRAPH_STUDIO_URL || "https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/version/latest",
    backend: process.env.BACKEND_URL || "https://dungeon-delvers-metadata-server.onrender.com"
  }
};

console.log("🚀 ENV 優先配置同步工具 - V25.0.4");
console.log("================================\n");

// 更新後端配置
function updateBackendConfig() {
  console.log("📦 更新後端配置...");
  
  const backendConfigPath = "/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json";
  
  const backendConfig = {
    network: "bsc",
    chainId: 56,
    rpcUrl: process.env.RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/QzXiHWkNRovjd_EeDRqVfR9rApUDiXRp",
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
    vrf: V25_0_4_CONFIG.vrf,
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

// 更新前端配置 - 從現有的 .env.local 讀取並更新
function updateFrontendConfig() {
  console.log("\n🎨 更新前端配置...");
  
  const frontendEnvPath = "/Users/sotadic/Documents/GitHub/SoulboundSaga/.env.local";
  
  // 讀取現有的 .env.local
  let existingEnv = {};
  if (fs.existsSync(frontendEnvPath)) {
    const envContent = fs.readFileSync(frontendEnvPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        existingEnv[key.trim()] = valueParts.join('=').trim();
      }
    });
    console.log("  讀取現有配置:", Object.keys(existingEnv).length, "個設置");
  }
  
  // 更新合約地址（保留其他設置）
  const updatedEnv = {
    ...existingEnv,
    // 合約地址
    VITE_HERO_ADDRESS: V25_0_4_CONFIG.contracts.HERO,
    VITE_RELIC_ADDRESS: V25_0_4_CONFIG.contracts.RELIC,
    VITE_PARTY_ADDRESS: V25_0_4_CONFIG.contracts.PARTY,
    VITE_DUNGEONMASTER_ADDRESS: V25_0_4_CONFIG.contracts.DUNGEONMASTER,
    VITE_DUNGEONSTORAGE_ADDRESS: V25_0_4_CONFIG.contracts.DUNGEONSTORAGE,
    VITE_ALTAROFASCENSION_ADDRESS: V25_0_4_CONFIG.contracts.ALTAROFASCENSION,
    VITE_PLAYERVAULT_ADDRESS: V25_0_4_CONFIG.contracts.PLAYERVAULT,
    VITE_PLAYERPROFILE_ADDRESS: V25_0_4_CONFIG.contracts.PLAYERPROFILE,
    VITE_VIPSTAKING_ADDRESS: V25_0_4_CONFIG.contracts.VIPSTAKING,
    VITE_VRFMANAGER_ADDRESS: V25_0_4_CONFIG.contracts.VRF_MANAGER_V2PLUS,
    VITE_VRF_MANAGER_V2PLUS_ADDRESS: V25_0_4_CONFIG.contracts.VRF_MANAGER_V2PLUS,
    VITE_DUNGEONCORE_ADDRESS: V25_0_4_CONFIG.contracts.DUNGEONCORE,
    VITE_ORACLE_ADDRESS: V25_0_4_CONFIG.contracts.ORACLE,
    VITE_SOULSHARD_ADDRESS: V25_0_4_CONFIG.contracts.SOULSHARD,
    VITE_USD_ADDRESS: V25_0_4_CONFIG.contracts.USD,
    VITE_UNISWAP_POOL_ADDRESS: V25_0_4_CONFIG.contracts.UNISWAP_POOL,
    // VRF 配置
    VITE_VRF_SUBSCRIPTION_ID: V25_0_4_CONFIG.vrf.subscriptionId,
    VITE_VRF_COORDINATOR: V25_0_4_CONFIG.vrf.coordinator,
    VITE_VRF_KEY_HASH: V25_0_4_CONFIG.vrf.keyHash,
    // 部署信息
    VITE_CONTRACT_VERSION: V25_0_4_CONFIG.version,
    VITE_START_BLOCK: V25_0_4_CONFIG.startBlock.toString(),
    VITE_DEPLOYMENT_DATE: V25_0_4_CONFIG.deploymentDate,
    VITE_ADMIN_WALLET: V25_0_4_CONFIG.adminWallet
  };
  
  // 生成新的 .env.local 內容
  let envContent = `# V25.0.4 配置\n# 更新時間: ${new Date().toISOString()}\n\n`;
  
  // 按順序寫入
  const sections = {
    '第三方服務': ['VITE_WALLETCONNECT_PROJECT_ID'],
    'RPC 配置': ['VITE_ALCHEMY_KEY', 'VITE_ALCHEMY_KEY_PUBLIC', 'VITE_ALCHEMY_KEY_1', 'VITE_ALCHEMY_KEY_2', 'VITE_ALCHEMY_KEY_3', 'VITE_ALCHEMY_KEY_4', 'VITE_ALCHEMY_KEY_5'],
    '合約地址': ['VITE_HERO_ADDRESS', 'VITE_RELIC_ADDRESS', 'VITE_PARTY_ADDRESS', 'VITE_DUNGEONMASTER_ADDRESS', 'VITE_DUNGEONSTORAGE_ADDRESS', 'VITE_ALTAROFASCENSION_ADDRESS', 'VITE_PLAYERVAULT_ADDRESS', 'VITE_PLAYERPROFILE_ADDRESS', 'VITE_VIPSTAKING_ADDRESS', 'VITE_VRFMANAGER_ADDRESS', 'VITE_VRF_MANAGER_V2PLUS_ADDRESS', 'VITE_DUNGEONCORE_ADDRESS', 'VITE_ORACLE_ADDRESS', 'VITE_SOULSHARD_ADDRESS', 'VITE_USD_ADDRESS', 'VITE_UNISWAP_POOL_ADDRESS'],
    '服務端點': ['VITE_SUBGRAPH_DECENTRALIZED_URL', 'VITE_SUBGRAPH_STUDIO_URL', 'VITE_SUBGRAPH_URL', 'VITE_BACKEND_URL'],
    '部署信息': ['VITE_CONTRACT_VERSION', 'VITE_START_BLOCK', 'VITE_DEPLOYMENT_DATE', 'VITE_ADMIN_WALLET', 'VITE_NETWORK', 'VITE_CHAIN_ID'],
    'VRF 配置': ['VITE_VRF_ENABLED', 'VITE_VRF_SUBSCRIPTION_ID', 'VITE_VRF_COORDINATOR', 'VITE_VRF_KEY_HASH', 'VITE_VRF_REQUEST_CONFIRMATIONS', 'VITE_VRF_NUM_WORDS', 'VITE_VRF_CALLBACK_GAS_LIMIT']
  };
  
  const written = new Set();
  
  for (const [section, keys] of Object.entries(sections)) {
    envContent += `\n# ==================== ${section} ====================\n`;
    for (const key of keys) {
      if (updatedEnv[key] !== undefined) {
        envContent += `${key}=${updatedEnv[key]}\n`;
        written.add(key);
      }
    }
  }
  
  // 寫入其他未分類的設置
  const otherKeys = Object.keys(updatedEnv).filter(k => !written.has(k));
  if (otherKeys.length > 0) {
    envContent += `\n# ==================== 其他設置 ====================\n`;
    for (const key of otherKeys) {
      envContent += `${key}=${updatedEnv[key]}\n`;
    }
  }
  
  try {
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ 前端配置已更新");
    console.log("  保留了原有設置，只更新了合約地址和部署信息");
  } catch (error) {
    console.log("❌ 前端配置更新失敗:", error.message);
  }
}

// 顯示配置總結
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
  console.log("\n✅ PlayerProfile 合約已修復完成！");
  console.log("交易: 0xef1fca18d6203f393fe62577ce3b87448f3843e0bff3a2f7b84ea7fed33ede99");
}

// 執行所有更新
async function main() {
  console.log("🔍 使用環境變數優先配置");
  console.log("如需覆蓋，設置對應的環境變數");
  console.log("例如: DUNGEONCORE_ADDRESS=0x... node scripts/env-first-sync.js\n");
  
  updateBackendConfig();
  updateFrontendConfig();
  showSummary();
  
  console.log("\n⚠️ 請重啟前端和後端服務使配置生效");
}

main().catch(console.error);