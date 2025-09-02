const fs = require('fs');
const path = require('path');

// V12 部署地址
const V12_ADDRESSES = {
  DUNGEONCORE_ADDRESS: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
  DUNGEONMASTER_ADDRESS: "0xb71f6ED7B13452a99d740024aC17470c1b4F0021",
  DUNGEONSTORAGE_ADDRESS: "0xea21D782CefD785B128346F39f1574c8D6eb64C9",
  ORACLE_ADDRESS: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
  HERO_ADDRESS: "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E",
  RELIC_ADDRESS: "0x853DAAeC0ae354bF40c732C199Eb09F1a0CD3dC1",
  PARTY_ADDRESS: "0x847DceaE26aF1CFc09beC195CE87a9b5701863A7",
  PLAYERVAULT_ADDRESS: "0xA5BA5EE03d452eA5e57c72657c8EC03C6F388E1f",
  PLAYERPROFILE_ADDRESS: "0x39b09c3c64D5ada443d2965cb31C7bad7AC66F2f",
  ALTAROFASCENSION_ADDRESS: "0xB9878bBDcB82926f0D03E0157e8c34AEa35E06cb",
  VIPSTAKING_ADDRESS: "0x738eA7A2408F56D47EF127954Db42D37aE6339D5",
  SOULSHARD_ADDRESS: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
  DUNGEONMASTERWALLET_ADDRESS: "0xEbCF4A36Ad1485A9737025e9d72186b604487274"
};

console.log('📋 生成 V12 部署後的配置更新...\n');

// 1. 生成前端 contracts.ts 更新
console.log('1️⃣ 前端 contracts.ts 更新：');
console.log('================================');
console.log(`// 更新 /Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts
// V12 版本 (${new Date().toISOString().split('T')[0]})
const CONTRACT_ADDRESSES = {
  // 核心合約 (4個) - V12 部署地址
  CORE: {
    DUNGEON_CORE: import.meta.env.VITE_MAINNET_DUNGEONCORE_ADDRESS || "${V12_ADDRESSES.DUNGEONCORE_ADDRESS}",
    ORACLE: import.meta.env.VITE_MAINNET_ORACLE_ADDRESS || "${V12_ADDRESSES.ORACLE_ADDRESS}", 
    PLAYER_VAULT: import.meta.env.VITE_MAINNET_PLAYERVAULT_ADDRESS || "${V12_ADDRESSES.PLAYERVAULT_ADDRESS}",
    DUNGEON_STORAGE: import.meta.env.VITE_MAINNET_DUNGEONSTORAGE_ADDRESS || "${V12_ADDRESSES.DUNGEONSTORAGE_ADDRESS}"
  },
  // NFT合約 (3個) - V12 部署地址
  NFTS: {
    HERO: import.meta.env.VITE_MAINNET_HERO_ADDRESS || "${V12_ADDRESSES.HERO_ADDRESS}",
    RELIC: import.meta.env.VITE_MAINNET_RELIC_ADDRESS || "${V12_ADDRESSES.RELIC_ADDRESS}",
    PARTY: import.meta.env.VITE_MAINNET_PARTY_ADDRESS || "${V12_ADDRESSES.PARTY_ADDRESS}"
  },
  // 遊戲合約 (3個) - V12 部署地址
  GAME: {
    DUNGEON_MASTER: import.meta.env.VITE_MAINNET_DUNGEONMASTER_ADDRESS || "${V12_ADDRESSES.DUNGEONMASTER_ADDRESS}",
    ALTAR: import.meta.env.VITE_MAINNET_ALTAROFASCENSION_ADDRESS || "${V12_ADDRESSES.ALTAROFASCENSION_ADDRESS}",
    PLAYER_PROFILE: import.meta.env.VITE_MAINNET_PLAYERPROFILE_ADDRESS || "${V12_ADDRESSES.PLAYERPROFILE_ADDRESS}"
  },
  // 代幣合約 (2個) - V12 部署地址
  TOKENS: {
    SOUL_SHARD: import.meta.env.VITE_MAINNET_SOULSHARDTOKEN_ADDRESS || "${V12_ADDRESSES.SOULSHARD_ADDRESS}",
    VIP_STAKING: import.meta.env.VITE_MAINNET_VIPSTAKING_ADDRESS || "${V12_ADDRESSES.VIPSTAKING_ADDRESS}"
  }
} as const;`);

// 2. 生成 Vercel 環境變數
console.log('\n\n2️⃣ Vercel 環境變數更新：');
console.log('================================');
console.log('在 Vercel 專案設定中更新以下環境變數：\n');
Object.entries(V12_ADDRESSES).forEach(([key, value]) => {
  const envKey = `VITE_MAINNET_${key}`;
  console.log(`${envKey}=${value}`);
});

// 3. 生成 Render 環境變數
console.log('\n\n3️⃣ Render 環境變數更新：');
console.log('================================');
console.log('在 Render 服務設定中更新以下環境變數：\n');
Object.entries(V12_ADDRESSES).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

// 4. 生成子圖更新指南
console.log('\n\n4️⃣ 子圖 (The Graph) 更新：');
console.log('================================');
console.log(`# 更新 subgraph.yaml
dataSources:
  - kind: ethereum/contract
    name: DungeonMaster
    network: bsc
    source:
      address: "${V12_ADDRESSES.DUNGEONMASTER_ADDRESS}"
      abi: DungeonMaster
      startBlock: 54670894  # V12 部署區塊
      
  - kind: ethereum/contract
    name: Party
    network: bsc
    source:
      address: "${V12_ADDRESSES.PARTY_ADDRESS}"
      abi: Party
      startBlock: 54670894  # V12 部署區塊`);

console.log(`\n# 更新 src/config.ts
export const DUNGEONMASTER_ADDRESS = "${V12_ADDRESSES.DUNGEONMASTER_ADDRESS}";
export const PARTY_ADDRESS = "${V12_ADDRESSES.PARTY_ADDRESS}";
export const HERO_ADDRESS = "${V12_ADDRESSES.HERO_ADDRESS}";
export const RELIC_ADDRESS = "${V12_ADDRESSES.RELIC_ADDRESS}";
export const PLAYERPROFILE_ADDRESS = "${V12_ADDRESSES.PLAYERPROFILE_ADDRESS}";`);

// 5. 生成驗證腳本
console.log('\n\n5️⃣ 合約驗證指令：');
console.log('================================');
const verifyCommands = [
  `npx hardhat verify --network bsc ${V12_ADDRESSES.DUNGEONCORE_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}" "0x55d398326f99059fF775485246999027B3197955" "${V12_ADDRESSES.SOULSHARD_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.DUNGEONMASTER_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.DUNGEONSTORAGE_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.ORACLE_ADDRESS} "0x737c5b0430d5aeb104680460179aaa38608b6169" "${V12_ADDRESSES.SOULSHARD_ADDRESS}" "0x55d398326f99059fF775485246999027B3197955"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.HERO_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.RELIC_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.PARTY_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.PLAYERVAULT_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.PLAYERPROFILE_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.ALTAROFASCENSION_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`,
  `npx hardhat verify --network bsc ${V12_ADDRESSES.VIPSTAKING_ADDRESS} "${V12_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"`
];

verifyCommands.forEach((cmd, index) => {
  console.log(`# ${index + 1}. ${cmd}`);
});

// 6. 保存配置到文件
const configDir = path.join(__dirname, 'configs');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir);
}

// 保存前端配置
fs.writeFileSync(
  path.join(configDir, 'frontend-contracts-v12.ts'),
  `// V12 部署地址 (${new Date().toISOString().split('T')[0]})
const CONTRACT_ADDRESSES = ${JSON.stringify({
  CORE: {
    DUNGEON_CORE: V12_ADDRESSES.DUNGEONCORE_ADDRESS,
    ORACLE: V12_ADDRESSES.ORACLE_ADDRESS,
    PLAYER_VAULT: V12_ADDRESSES.PLAYERVAULT_ADDRESS,
    DUNGEON_STORAGE: V12_ADDRESSES.DUNGEONSTORAGE_ADDRESS
  },
  NFTS: {
    HERO: V12_ADDRESSES.HERO_ADDRESS,
    RELIC: V12_ADDRESSES.RELIC_ADDRESS,
    PARTY: V12_ADDRESSES.PARTY_ADDRESS
  },
  GAME: {
    DUNGEON_MASTER: V12_ADDRESSES.DUNGEONMASTER_ADDRESS,
    ALTAR: V12_ADDRESSES.ALTAROFASCENSION_ADDRESS,
    PLAYER_PROFILE: V12_ADDRESSES.PLAYERPROFILE_ADDRESS
  },
  TOKENS: {
    SOUL_SHARD: V12_ADDRESSES.SOULSHARD_ADDRESS,
    VIP_STAKING: V12_ADDRESSES.VIPSTAKING_ADDRESS
  }
}, null, 2)};`
);

// 保存環境變數
let envContent = '# V12 部署環境變數\n';
Object.entries(V12_ADDRESSES).forEach(([key, value]) => {
  envContent += `${key}=${value}\n`;
});
fs.writeFileSync(path.join(configDir, 'env-v12.env'), envContent);

console.log('\n\n✅ 配置文件已保存到 scripts/configs/ 目錄');
console.log('\n📌 下一步操作：');
console.log('1. 更新前端 contracts.ts');
console.log('2. 更新 Vercel 環境變數');
console.log('3. 更新 Render 環境變數');
console.log('4. 更新並重新部署子圖');
console.log('5. 驗證所有合約');
console.log('6. 測試所有功能');