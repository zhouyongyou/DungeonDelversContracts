// generate-subgraph-config.js - 生成子圖配置更新文件
// 🚨 Gas Price 核心原則：0.11 gwei
const fs = require("fs");
const path = require("path");

// V1.3.3 部署的合約地址
const contractAddresses = {
  // 核心合約
  dungeonCore: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f",
  oracle: "0x21928de992cb31ede864b62bc94002fb449c2738",
  playerVault: "0xb8807c99ade19e4e2db5cf48650474f10ff874a3",
  
  // NFT 合約
  hero: "0x1723b67ef81c4d2c5dd2027776ae8bdbdd61636b",
  relic: "0x7a78a54010b0d201c026ef0f4a9456b464dfce11",
  party: "0xb393e482495bacde5aaf08d25323146cc5b9567f",
  playerProfile: "0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b",
  vipStaking: "0x409d964675235a5a00f375053535fce9f6e79882",
  
  // 遊戲合約
  altarOfAscension: "0x7f4b3d0ff2994182200fc3b306fb5b035680de3c",
  dungeonMaster: "0xdbee76d1c6e94f93ceecf743a0a0132c57371254",
  dungeonStorage: "0x30dcbe703b258fa1e421d22c8ada643da51ceb4c",
  
  // VRF 管理
  vrfManager: "0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40",
  
  // 代幣合約 (保持不變)
  soulShard: "0x1a98769b8034d400745cc658dc204cd079de36fa",
  testUSD1: "0x916a2a1eb605e88561139c56af0698de241169f2",
  v3Pool: "0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba"
};

const deploymentInfo = {
  version: "v1.3.3",
  startBlock: 59848829,
  deploymentDate: "2025-09-03T16:00:00.000Z",
  network: "bsc",
  chainId: 56
};

function generateSubgraphManifest() {
  const manifest = {
    specVersion: "0.0.5",
    description: "DungeonDelvers V1.3.3 - Complete Game Ecosystem",
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
# DungeonDelvers V1.3.3 子圖部署指南

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
   graph deploy --studio dungeon-delvers---bsc --version-label v1.3.3
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
    fs.writeFileSync(manifestPath, `# DungeonDelvers V1.3.3 Subgraph Manifest
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