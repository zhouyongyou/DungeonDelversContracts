import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🔄 開始更新所有配置...");
    
    const deployedAddresses = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "deployed-addresses.json"), "utf8")
    );
    
    // 1. 更新前端配置
    updateFrontendConfig(deployedAddresses);
    
    // 2. 更新後端配置
    updateBackendConfig(deployedAddresses);
    
    // 3. 生成子圖配置指南
    generateSubgraphGuide(deployedAddresses);
    
    console.log("\n✅ 所有配置更新完成！");
}

function updateFrontendConfig(addresses: any) {
    console.log("\n📱 更新前端配置...");
    
    const frontendConfigPath = path.join(process.cwd(), "../DungeonDelversFrontend/.env");
    const frontendEnvExamplePath = path.join(process.cwd(), "../DungeonDelversFrontend/.env.example");
    
    // 前端環境變數
    const frontendEnv = `# BSC Mainnet RPC
VITE_BSC_RPC_URL="https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"

# Contract Addresses
VITE_DUNGEONMASTER_ADDRESS="${addresses.DUNGEONMASTER_ADDRESS}"
VITE_DUNGEONCORE_ADDRESS="${addresses.DUNGEONCORE_ADDRESS}"
VITE_DUNGEONSTORAGE_ADDRESS="${addresses.DUNGEONSTORAGE_ADDRESS}"
VITE_HERO_ADDRESS="${addresses.HERO_ADDRESS}"
VITE_PARTY_ADDRESS="${addresses.PARTY_ADDRESS}"
VITE_PLAYERPROFILE_ADDRESS="${addresses.PLAYERPROFILE_ADDRESS}"
VITE_PLAYERVAULT_ADDRESS="${addresses.PLAYERVAULT_ADDRESS}"
VITE_VIPSTAKING_ADDRESS="${addresses.VIPSTAKING_ADDRESS}"
VITE_ORACLE_ADDRESS="${addresses.ORACLE_ADDRESS}"
VITE_RELIC_ADDRESS="${addresses.RELIC_ADDRESS}"
VITE_ALTAROFASCENSION_ADDRESS="${addresses.ALTAROFASCENSION_ADDRESS}"
VITE_SOUL_SHARD_TOKEN_ADDRESS="${addresses.SOUL_SHARD_TOKEN_ADDRESS}"
VITE_USD_TOKEN_ADDRESS="${addresses.USD_TOKEN_ADDRESS}"

# API URLs
VITE_METADATA_SERVER_BASE_URL="${process.env.VITE_METADATA_SERVER_BASE_URL}"
VITE_THE_GRAPH_API_URL="${process.env.THE_GRAPH_API_URL}"
`;
    
    // 保存前端環境變數
    const frontendEnvPath = path.join(process.cwd(), "frontend-env-update.txt");
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    console.log(`✅ 前端環境變數已生成: ${frontendEnvPath}`);
}

function updateBackendConfig(addresses: any) {
    console.log("\n🔧 更新後端配置...");
    
    // 後端配置
    const backendConfig = {
        network: {
            name: "BSC Mainnet",
            chainId: 56,
            rpcUrl: process.env.BSC_MAINNET_RPC_URL
        },
        contracts: {
            dungeonMaster: addresses.DUNGEONMASTER_ADDRESS,
            dungeonCore: addresses.DUNGEONCORE_ADDRESS,
            dungeonStorage: addresses.DUNGEONSTORAGE_ADDRESS,
            hero: addresses.HERO_ADDRESS,
            party: addresses.PARTY_ADDRESS,
            playerProfile: addresses.PLAYERPROFILE_ADDRESS,
            playerVault: addresses.PLAYERVAULT_ADDRESS,
            vipStaking: addresses.VIPSTAKING_ADDRESS,
            oracle: addresses.ORACLE_ADDRESS,
            relic: addresses.RELIC_ADDRESS,
            altarOfAscension: addresses.ALTAROFASCENSION_ADDRESS,
            soulShardToken: addresses.SOUL_SHARD_TOKEN_ADDRESS,
            usdToken: addresses.USD_TOKEN_ADDRESS
        },
        api: {
            metadataServerUrl: process.env.METADATA_SERVER_BASE_URL,
            theGraphUrl: process.env.THE_GRAPH_API_URL
        }
    };
    
    // 保存後端配置
    const backendConfigPath = path.join(process.cwd(), "backend-config-update.json");
    fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
    console.log(`✅ 後端配置已生成: ${backendConfigPath}`);
}

function generateSubgraphGuide(addresses: any) {
    console.log("\n📊 生成子圖更新指南...");
    
    const subgraphGuide = `# 子圖更新指南

## 1. 更新 subgraph.yaml

請在 subgraph.yaml 中更新以下合約地址：

\`\`\`yaml
dataSources:
  - kind: ethereum/contract
    name: DungeonMaster
    network: bsc
    source:
      address: "${addresses.DUNGEONMASTER_ADDRESS}"
      abi: DungeonMaster
      startBlock: # 使用部署區塊號
      
  - kind: ethereum/contract
    name: Party
    network: bsc
    source:
      address: "${addresses.PARTY_ADDRESS}"
      abi: Party
      startBlock: # 使用部署區塊號
      
  - kind: ethereum/contract
    name: Hero
    network: bsc
    source:
      address: "${addresses.HERO_ADDRESS}"
      abi: Hero
      startBlock: # 使用部署區塊號
      
  - kind: ethereum/contract
    name: PlayerProfile
    network: bsc
    source:
      address: "${addresses.PLAYERPROFILE_ADDRESS}"
      abi: PlayerProfile
      startBlock: # 使用部署區塊號
\`\`\`

## 2. 更新 ABI 檔案

ABI 檔案已經在 abi/ 目錄生成，請複製到子圖的 abis/ 目錄。

## 3. 重新部署子圖

\`\`\`bash
# 安裝依賴
npm install

# 生成代碼
npm run codegen

# 構建
npm run build

# 部署到 The Graph
npm run deploy
\`\`\`

## 4. 重要提醒

- 記得更新 startBlock 為實際的部署區塊號
- 確保 ABI 檔案與合約版本匹配
- 部署後測試查詢功能是否正常
`;
    
    const subgraphGuidePath = path.join(process.cwd(), "subgraph-update-guide.md");
    fs.writeFileSync(subgraphGuidePath, subgraphGuide);
    console.log(`✅ 子圖更新指南已生成: ${subgraphGuidePath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });