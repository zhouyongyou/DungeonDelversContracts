#!/usr/bin/env node

/**
 * 更新子圖部署腳本以使用新的配置系統
 * 自動從 master-config.json 生成部署腳本和配置
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 載入主配置
const masterConfigPath = path.join(__dirname, '../config/master-config.json');
const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));

// 子圖專案路徑
const SUBGRAPH_PATH = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers';

// V15 部署區塊（使用之前腳本中的值）
const V15_START_BLOCK = 55018576;

function updateSubgraphDeployment() {
  log('\n🔄 更新子圖部署配置', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  // 1. 更新 subgraph.yaml
  updateSubgraphYaml();
  
  // 2. 更新部署腳本
  updateDeployScript();
  
  // 3. 更新 CLAUDE.md
  updateSubgraphClaude();
  
  log('\n✅ 子圖部署配置更新完成！', 'green');
  log('\n📝 下一步：', 'yellow');
  log('  1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers', 'cyan');
  log('  2. npm run codegen', 'cyan');
  log('  3. npm run build', 'cyan');
  log('  4. npm run deploy:v15', 'cyan');
}

function updateSubgraphYaml() {
  log('\n📄 更新 subgraph.yaml...', 'yellow');
  
  const subgraphYamlPath = path.join(SUBGRAPH_PATH, 'subgraph.yaml');
  
  if (!fs.existsSync(subgraphYamlPath)) {
    log('❌ 找不到 subgraph.yaml', 'red');
    return;
  }
  
  const config = yaml.load(fs.readFileSync(subgraphYamlPath, 'utf8'));
  
  // 合約名稱到配置鍵的映射
  const contractMapping = {
    'Hero': 'HERO_ADDRESS',
    'Relic': 'RELIC_ADDRESS',
    'Party': 'PARTY_ADDRESS',
    'VIPStaking': 'VIPSTAKING_ADDRESS',
    'PlayerProfile': 'PLAYERPROFILE_ADDRESS',
    'DungeonMasterV8': 'DUNGEONMASTER_ADDRESS',
    'AltarOfAscension': 'ALTAROFASCENSION_ADDRESS'
  };
  
  // 更新每個數據源
  config.dataSources.forEach(dataSource => {
    const configKey = contractMapping[dataSource.name];
    if (configKey && masterConfig.contracts.mainnet[configKey]) {
      const oldAddress = dataSource.source.address;
      const newAddress = masterConfig.contracts.mainnet[configKey];
      
      if (oldAddress !== newAddress) {
        log(`  更新 ${dataSource.name}: ${oldAddress} → ${newAddress}`, 'cyan');
        dataSource.source.address = newAddress;
      }
      
      // 更新 startBlock
      if (dataSource.source.startBlock !== V15_START_BLOCK) {
        log(`  更新 ${dataSource.name} startBlock: ${dataSource.source.startBlock} → ${V15_START_BLOCK}`, 'cyan');
        dataSource.source.startBlock = V15_START_BLOCK;
      }
    }
  });
  
  // 寫回文件，保持格式
  const newContent = yaml.dump(config, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true
  });
  
  // 修復 YAML 格式
  const fixedContent = newContent
    .replace(/"(specVersion|schema|file|kind|name|network|address|abi|startBlock|mapping|apiVersion|language|entities|abis|eventHandlers|event|handler)"/g, '$1')
    .replace(/startBlock: "(\d+)"/g, 'startBlock: $1');
  
  fs.writeFileSync(subgraphYamlPath, fixedContent);
  log('✅ subgraph.yaml 更新完成', 'green');
}

function updateDeployScript() {
  log('\n📜 創建新的部署腳本...', 'yellow');
  
  const deployScriptPath = path.join(SUBGRAPH_PATH, 'deploy-v15-auto.sh');
  
  const scriptContent = `#!/bin/bash

# DungeonDelvers V15 子圖部署腳本（自動生成）
# 版本: ${masterConfig.version}
# 生成時間: ${new Date().toISOString()}
# 從 master-config.json 自動生成

echo "🚀 開始部署 DungeonDelvers ${masterConfig.version} 子圖..."
echo "=====================================\\n"

# 顯示配置信息
echo "📋 配置版本: ${masterConfig.version}"
echo "📅 最後更新: ${masterConfig.lastUpdated}"
echo "🔢 起始區塊: ${V15_START_BLOCK}"
echo ""

# 檢查是否已登錄
echo "📝 檢查 The Graph CLI 登錄狀態..."
graph auth --product hosted-service || {
    echo "❌ 請先使用 'graph auth' 登錄"
    exit 1
}

# 清理舊的構建文件
echo "\\n🧹 清理舊的構建文件..."
rm -rf build/
rm -rf generated/

# 編譯子圖
echo "\\n📦 編譯子圖..."
graph codegen && graph build || {
    echo "❌ 編譯失敗"
    exit 1
}

echo "\\n✅ 編譯成功！"

# 部署到 The Graph Studio
echo "\\n🌐 部署到 The Graph Studio..."
echo "版本: ${masterConfig.version}"

# 使用 graph deploy 並指定版本標籤
graph deploy --studio dungeon-delvers --version-label "${masterConfig.version}" || {
    echo "❌ 部署失敗"
    exit 1
}

echo "\\n✅ 部署成功！"
echo "\\n📊 查詢端點："
echo "Studio: ${masterConfig.subgraph.studio.url}"
echo "Decentralized: ${masterConfig.subgraph.decentralized.url}"
echo "\\n📝 注意事項："
echo "1. 新交易會立即被索引"
echo "2. 子圖同步需要時間（可能數小時）"
echo "3. 請在 The Graph Studio 控制台查看同步進度"
echo "\\n🎉 ${masterConfig.version} 子圖部署完成！"
`;
  
  fs.writeFileSync(deployScriptPath, scriptContent);
  fs.chmodSync(deployScriptPath, '755');
  
  // 更新 package.json scripts
  updatePackageJsonScripts();
  
  log('✅ 部署腳本創建完成', 'green');
}

function updatePackageJsonScripts() {
  const packageJsonPath = path.join(SUBGRAPH_PATH, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('⚠️ 找不到 package.json', 'yellow');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // 添加新的部署腳本
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['deploy:v15'] = './deploy-v15-auto.sh';
  packageJson.scripts['deploy:current'] = './deploy-v15-auto.sh';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  log('✅ package.json scripts 更新完成', 'green');
}

function updateSubgraphClaude() {
  log('\n📝 更新子圖 CLAUDE.md...', 'yellow');
  
  const claudePath = path.join(SUBGRAPH_PATH, 'CLAUDE.md');
  
  if (!fs.existsSync(claudePath)) {
    log('⚠️ 找不到 CLAUDE.md', 'yellow');
    return;
  }
  
  let content = fs.readFileSync(claudePath, 'utf8');
  
  // 更新版本信息
  const versionRegex = /## 當前版本\n[\s\S]*?(?=\n##)/;
  const newVersionSection = `## 當前版本
- ${masterConfig.version} - 用於 V15 合約（區塊 ${V15_START_BLOCK} 開始）
- 生成時間: ${new Date().toISOString()}
- 自動從 master-config.json 生成`;
  
  if (content.match(versionRegex)) {
    content = content.replace(versionRegex, newVersionSection);
  }
  
  // 更新查詢端點
  const endpointRegex = /## 查詢端點\n[\s\S]*?(?=\n##)/;
  const newEndpointSection = `## 查詢端點
\`\`\`
Studio: ${masterConfig.subgraph.studio.url}
Decentralized: ${masterConfig.subgraph.decentralized.url}
\`\`\``;
  
  if (content.match(endpointRegex)) {
    content = content.replace(endpointRegex, newEndpointSection);
  }
  
  // 添加自動部署說明
  if (!content.includes('## 🚀 自動部署')) {
    content += `

## 🚀 自動部署

使用新的配置管理系統自動部署：

\`\`\`bash
# 使用自動生成的部署腳本
npm run deploy:v15

# 或者
npm run deploy:current
\`\`\`

部署腳本會自動：
1. 從 master-config.json 讀取配置
2. 更新 subgraph.yaml
3. 執行編譯和部署
`;
  }
  
  fs.writeFileSync(claudePath, content);
  log('✅ CLAUDE.md 更新完成', 'green');
}

// 檢查並安裝 js-yaml
function ensureYamlInstalled(callback) {
  try {
    require('js-yaml');
    callback();
  } catch (error) {
    log('\n📦 安裝 js-yaml...', 'yellow');
    const { execSync } = require('child_process');
    execSync('npm install js-yaml', { stdio: 'inherit' });
    
    // 重新執行
    delete require.cache[require.resolve('js-yaml')];
    callback();
  }
}

// 執行更新
ensureYamlInstalled(() => {
  updateSubgraphDeployment();
});