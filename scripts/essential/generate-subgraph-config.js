// generate-subgraph-config.js - 生成子圖配置更新文件
// 🚨 Gas Price 核心原則：0.11 gwei
// 🔥 重構：從 .env 動態讀取所有地址，消除硬編碼
require('dotenv').config();
const fs = require("fs");
const path = require("path");

// 🚀 從 .env 動態讀取合約地址 - 單一事實來源原則
const contractAddresses = {
  // 核心合約
  dungeonCore: process.env.DUNGEONCORE_ADDRESS,
  oracle: process.env.ORACLE_ADDRESS,
  playerVault: process.env.PLAYERVAULT_ADDRESS,
  
  // NFT 合約
  hero: process.env.HERO_ADDRESS,
  relic: process.env.RELIC_ADDRESS,
  party: process.env.PARTY_ADDRESS,
  playerProfile: process.env.PLAYERPROFILE_ADDRESS,
  vipStaking: process.env.VIPSTAKING_ADDRESS,
  
  // 遊戲合約
  altarOfAscension: process.env.ALTAROFASCENSION_ADDRESS,
  dungeonMaster: process.env.DUNGEONMASTER_ADDRESS,
  dungeonStorage: process.env.DUNGEONSTORAGE_ADDRESS,
  
  // VRF 管理
  vrfManager: process.env.VRF_MANAGER_V2PLUS_ADDRESS,
  
  // 代幣合約 (永久固定)
  soulShard: process.env.SOULSHARD_ADDRESS,
  testUSD1: process.env.USD_ADDRESS,
  v3Pool: process.env.V3_POOL_ADDRESS
};

// 🚀 從 .env 動態讀取部署資訊
const deploymentInfo = {
  version: process.env.VITE_CONTRACT_VERSION || "v1.4.0.3",
  startBlock: parseInt(process.env.VITE_START_BLOCK) || 60555454,
  deploymentDate: process.env.VITE_DEPLOYMENT_DATE || new Date().toISOString(),
  network: "bsc",
  chainId: parseInt(process.env.VITE_CHAIN_ID) || 56
};

function generateSubgraphManifest() {
  const manifest = {
    specVersion: "0.0.5",
    description: `DungeonDelvers ${deploymentInfo.version} - Complete Game Ecosystem`,
    repository: "https://github.com/your-repo/dungeon-delvers-subgraph",
    schema: {
      file: "./schema.graphql"
    },
    dataSources: [
      {
        kind: "ethereum",
        name: "Hero",
        network: "bsc",
        source: {
          address: contractAddresses.hero,
          abi: "Hero",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["Hero", "Player", "HeroMinted", "HeroTransfer"],
          abis: [
            {
              name: "Hero",
              file: "./abis/Hero.json"
            }
          ],
          eventHandlers: [
            {
              event: "Transfer(indexed address,indexed address,indexed uint256)",
              handler: "handleHeroTransfer"
            }
          ],
          file: "./src/hero.ts"
        }
      },
      {
        kind: "ethereum",
        name: "Relic",
        network: "bsc",
        source: {
          address: contractAddresses.relic,
          abi: "Relic",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["Relic", "Player", "RelicMinted", "RelicTransfer"],
          abis: [
            {
              name: "Relic",
              file: "./abis/Relic.json"
            }
          ],
          eventHandlers: [
            {
              event: "Transfer(indexed address,indexed address,indexed uint256)",
              handler: "handleRelicTransfer"
            }
          ],
          file: "./src/relic.ts"
        }
      },
      {
        kind: "ethereum",
        name: "Party",
        network: "bsc",
        source: {
          address: contractAddresses.party,
          abi: "Party",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["Party", "Player", "PartyCreated", "PartyTransfer"],
          abis: [
            {
              name: "Party",
              file: "./abis/Party.json"
            }
          ],
          eventHandlers: [
            {
              event: "Transfer(indexed address,indexed address,indexed uint256)",
              handler: "handlePartyTransfer"
            }
          ],
          file: "./src/party.ts"
        }
      },
      {
        kind: "ethereum",
        name: "PlayerProfile",
        network: "bsc",
        source: {
          address: contractAddresses.playerProfile,
          abi: "PlayerProfile",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["PlayerProfile", "Player"],
          abis: [
            {
              name: "PlayerProfile",
              file: "./abis/PlayerProfile.json"
            }
          ],
          eventHandlers: [
            {
              event: "Transfer(indexed address,indexed address,indexed uint256)",
              handler: "handlePlayerProfileTransfer"
            }
          ],
          file: "./src/playerProfile.ts"
        }
      },
      {
        kind: "ethereum",
        name: "VIPStaking",
        network: "bsc",
        source: {
          address: contractAddresses.vipStaking,
          abi: "VIPStaking",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["VIPStake", "Player", "StakeEvent"],
          abis: [
            {
              name: "VIPStaking",
              file: "./abis/VIPStaking.json"
            }
          ],
          eventHandlers: [
            {
              event: "Transfer(indexed address,indexed address,indexed uint256)",
              handler: "handleVIPStakingTransfer"
            }
          ],
          file: "./src/vipStaking.ts"
        }
      },
      {
        kind: "ethereum",
        name: "DungeonMaster",
        network: "bsc",
        source: {
          address: contractAddresses.dungeonMaster,
          abi: "DungeonMaster",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["Expedition", "Player", "ExpeditionStarted", "ExpeditionCompleted"],
          abis: [
            {
              name: "DungeonMaster",
              file: "./abis/DungeonMaster.json"
            }
          ],
          eventHandlers: [
            {
              event: "ExpeditionStarted(indexed address,indexed uint256,uint256,uint256)",
              handler: "handleExpeditionStarted"
            },
            {
              event: "ExpeditionCompleted(indexed address,indexed uint256,bool,uint256)",
              handler: "handleExpeditionCompleted"
            }
          ],
          file: "./src/dungeonMaster.ts"
        }
      },
      {
        kind: "ethereum",
        name: "AltarOfAscension",
        network: "bsc",
        source: {
          address: contractAddresses.altarOfAscension,
          abi: "AltarOfAscension",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["Ascension", "Player", "AscensionEvent"],
          abis: [
            {
              name: "AltarOfAscension",
              file: "./abis/AltarOfAscension.json"
            }
          ],
          eventHandlers: [
            {
              event: "AscensionCompleted(indexed address,indexed uint256,uint256)",
              handler: "handleAscensionCompleted"
            }
          ],
          file: "./src/altarOfAscension.ts"
        }
      },
      {
        kind: "ethereum",
        name: "PlayerVault",
        network: "bsc",
        source: {
          address: contractAddresses.playerVault,
          abi: "PlayerVault",
          startBlock: deploymentInfo.startBlock
        },
        mapping: {
          kind: "ethereum/events",
          apiVersion: "0.0.7",
          language: "wasm/assemblyscript",
          entities: ["VaultTransaction", "Player", "Deposit", "Withdrawal"],
          abis: [
            {
              name: "PlayerVault",
              file: "./abis/PlayerVault.json"
            }
          ],
          eventHandlers: [
            {
              event: "Deposit(indexed address,uint256)",
              handler: "handleDeposit"
            },
            {
              event: "Withdrawal(indexed address,uint256)",
              handler: "handleWithdrawal"
            }
          ],
          file: "./src/playerVault.ts"
        }
      }
    ]
  };
  
  return manifest;
}

function generateNetworksConfig() {
  return {
    bsc: {
      [contractAddresses.hero]: {
        startBlock: deploymentInfo.startBlock
      },
      [contractAddresses.relic]: {
        startBlock: deploymentInfo.startBlock
      },
      [contractAddresses.party]: {
        startBlock: deploymentInfo.startBlock
      },
      [contractAddresses.playerProfile]: {
        startBlock: deploymentInfo.startBlock
      },
      [contractAddresses.vipStaking]: {
        startBlock: deploymentInfo.startBlock
      },
      [contractAddresses.dungeonMaster]: {
        startBlock: deploymentInfo.startBlock
      },
      [contractAddresses.altarOfAscension]: {
        startBlock: deploymentInfo.startBlock
      },
      [contractAddresses.playerVault]: {
        startBlock: deploymentInfo.startBlock
      }
    }
  };
}

function generateDeploymentInstructions() {
  return `
# DungeonDelvers ${deploymentInfo.version} 子圖部署指南

## 📋 更新的合約地址

### 核心合約
- DungeonCore: ${contractAddresses.dungeonCore}
- Oracle: ${contractAddresses.oracle}
- PlayerVault: ${contractAddresses.playerVault}

### NFT 合約
- Hero: ${contractAddresses.hero}
- Relic: ${contractAddresses.relic}  
- Party: ${contractAddresses.party}
- PlayerProfile: ${contractAddresses.playerProfile}
- VIPStaking: ${contractAddresses.vipStaking}

### 遊戲合約
- AltarOfAscension: ${contractAddresses.altarOfAscension}
- DungeonMaster: ${contractAddresses.dungeonMaster}
- DungeonStorage: ${contractAddresses.dungeonStorage}
- VRFManager: ${contractAddresses.vrfManager}

## 🚀 部署步驟

1. **更新子圖配置文件**
   \`\`\`bash
   cp subgraph.yaml.new subgraph.yaml
   cp networks.json.new networks.json
   \`\`\`

2. **更新 ABI 文件**
   \`\`\`bash
   # 從合約項目複製最新 ABI
   cp ../DungeonDelversContracts/artifacts/contracts/current/**/*.json ./abis/
   \`\`\`

3. **生成代碼**
   \`\`\`bash
   graph codegen
   \`\`\`

4. **構建子圖**
   \`\`\`bash
   graph build
   \`\`\`

5. **部署到 Studio**
   \`\`\`bash
   graph deploy --studio dungeon-delvers---bsc --version-label ${deploymentInfo.version}
   \`\`\`

## ⚙️ 重要配置

- **起始區塊**: ${deploymentInfo.startBlock}
- **部署日期**: ${deploymentInfo.deploymentDate}
- **網路**: BSC Mainnet (Chain ID: ${deploymentInfo.chainId})
- **版本**: ${deploymentInfo.version}

## 🔗 驗證鏈接

所有合約都已在 BSCScan 上驗證：
${Object.entries(contractAddresses).map(([name, address]) => 
  `- ${name}: https://bscscan.com/address/${address}#code`
).join('\n')}
`;
}

function main() {
  console.log("🔧 生成子圖配置文件");
  console.log("=".repeat(50));
  
  const outputDir = path.join(__dirname, "../../subgraph-config");
  
  // 創建輸出目錄
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ 創建目錄: ${outputDir}`);
  }
  
  try {
    // 生成子圖清單
    const manifest = generateSubgraphManifest();
    const manifestPath = path.join(outputDir, "subgraph.yaml");
    fs.writeFileSync(manifestPath, `# DungeonDelvers ${deploymentInfo.version} Subgraph Manifest
# 自動生成於: ${new Date().toISOString()}

${JSON.stringify(manifest, null, 2).replace(/"/g, '').replace(/,/g, '')}
`);
    console.log(`✅ 生成子圖清單: ${manifestPath}`);
    
    // 生成網路配置
    const networks = generateNetworksConfig();
    const networksPath = path.join(outputDir, "networks.json");
    fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
    console.log(`✅ 生成網路配置: ${networksPath}`);
    
    // 生成部署指南
    const instructions = generateDeploymentInstructions();
    const instructionsPath = path.join(outputDir, "DEPLOYMENT.md");
    fs.writeFileSync(instructionsPath, instructions);
    console.log(`✅ 生成部署指南: ${instructionsPath}`);
    
    // 生成合約地址摘要
    const addressSummary = {
      version: deploymentInfo.version,
      deploymentDate: deploymentInfo.deploymentDate,
      startBlock: deploymentInfo.startBlock,
      network: deploymentInfo.network,
      chainId: deploymentInfo.chainId,
      contracts: contractAddresses
    };
    
    const summaryPath = path.join(outputDir, "contract-addresses.json");
    fs.writeFileSync(summaryPath, JSON.stringify(addressSummary, null, 2));
    console.log(`✅ 生成地址摘要: ${summaryPath}`);
    
    console.log("\n🎉 子圖配置文件生成完成！");
    console.log("\n📋 下一步操作:");
    console.log("1. 將配置文件複製到子圖項目");
    console.log("2. 更新 ABI 文件");
    console.log("3. 重新部署子圖");
    console.log("4. 更新前端子圖端點");
    
  } catch (error) {
    console.error("❌ 生成配置文件失敗:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { contractAddresses, deploymentInfo };