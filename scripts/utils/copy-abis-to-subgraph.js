const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const SUBGRAPH_DIR = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/';

async function copyABIs() {
  log('\n🔧 複製 ABI 文件到子圖專案', 'magenta');
  log('='.repeat(70), 'magenta');

  const abisTargetDir = path.join(SUBGRAPH_DIR, 'abis');

  // 確保目標目錄存在
  if (!fs.existsSync(abisTargetDir)) {
    fs.mkdirSync(abisTargetDir, { recursive: true });
  }

  // 需要複製的 ABI 文件（使用正確的路徑）
  const abiFiles = [
    { source: 'nft/Hero.sol/Hero.json', target: 'Hero.json' },
    { source: 'nft/Relic.sol/Relic.json', target: 'Relic.json' },
    { source: 'nft/Party_V3.sol/Party.json', target: 'Party.json' },
    { source: 'nft/VIPStaking.sol/VIPStaking.json', target: 'VIPStaking.json' },
    { source: 'nft/PlayerProfile.sol/PlayerProfile.json', target: 'PlayerProfile.json' },
    { source: 'core/DungeonCore.sol/DungeonCore.json', target: 'DungeonCore.json' },
    { source: 'core/DungeonMaster_V8.sol/DungeonMasterV8.json', target: 'DungeonMasterV8.json' },
    { source: 'core/DungeonStorage.sol/DungeonStorage.json', target: 'DungeonStorage.json' },
    { source: 'defi/PlayerVault.sol/PlayerVault.json', target: 'PlayerVault.json' },
    { source: 'defi/Oracle_VerificationFix.sol/Oracle.json', target: 'Oracle.json' }
  ];

  const abisSourceDir = path.join(__dirname, '../../artifacts/contracts');

  let successCount = 0;
  abiFiles.forEach(({ source, target }) => {
    const sourcePath = path.join(abisSourceDir, source);
    const targetPath = path.join(abisTargetDir, target);

    if (fs.existsSync(sourcePath)) {
      try {
        // 讀取完整的 artifact 文件
        const artifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
        // 只提取 ABI 部分
        fs.writeFileSync(targetPath, JSON.stringify(artifact.abi, null, 2));
        log(`✅ 複製 ABI: ${target}`, 'green');
        successCount++;
      } catch (error) {
        log(`❌ 複製 ${target} 失敗: ${error.message}`, 'red');
      }
    } else {
      log(`⚠️  找不到 ABI 文件: ${source}`, 'yellow');
    }
  });

  log(`\n📊 ABI 複製完成: ${successCount}/${abiFiles.length} 成功`, 'cyan');

  // 檢查是否需要更新 schema.graphql
  const schemaPath = path.join(SUBGRAPH_DIR, 'schema.graphql');
  if (fs.existsSync(schemaPath)) {
    log('\n✅ schema.graphql 已存在', 'green');
  } else {
    log('\n⚠️  需要創建 schema.graphql', 'yellow');
    createBasicSchema(schemaPath);
  }
}

function createBasicSchema(schemaPath) {
  const schema = `# DungeonDelvers Subgraph Schema
# Version: V15

type Hero @entity {
  id: ID!
  tokenId: BigInt!
  owner: Bytes!
  power: Int!
  health: Int!
  stamina: Int!
  level: Int!
  mintedAt: BigInt!
  transfers: [Transfer!]! @derivedFrom(field: "hero")
}

type Relic @entity {
  id: ID!
  tokenId: BigInt!
  owner: Bytes!
  relicType: Int!
  mintedAt: BigInt!
  transfers: [Transfer!]! @derivedFrom(field: "relic")
}

type Party @entity {
  id: ID!
  tokenId: BigInt!
  owner: Bytes!
  heroes: [BigInt!]!
  relics: [BigInt!]!
  formedAt: BigInt!
  transfers: [Transfer!]! @derivedFrom(field: "party")
}

type VIPStake @entity {
  id: ID!
  user: Bytes!
  amount: BigInt!
  stakedAt: BigInt!
  unstakedAt: BigInt
  isActive: Boolean!
}

type PlayerProfile @entity {
  id: ID!
  player: Bytes!
  username: String!
  referrer: Bytes
  referralCount: Int!
  createdAt: BigInt!
}

type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  tokenId: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
  hero: Hero
  relic: Relic
  party: Party
}

type User @entity {
  id: ID!
  address: Bytes!
  heroCount: Int!
  relicCount: Int!
  partyCount: Int!
  vipStakeAmount: BigInt!
  profileCreated: Boolean!
}
`;

  fs.writeFileSync(schemaPath, schema);
  log('✅ 創建基礎 schema.graphql', 'green');
}

// 執行
copyABIs();