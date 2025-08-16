#!/usr/bin/env node

/**
 * 更新市場子圖合約地址
 * 
 * 從 marketplace-config.json 讀取部署地址並更新 subgraph.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function updateSubgraphAddresses() {
  console.log(`${colors.bright}${colors.blue}更新市場子圖合約地址...${colors.reset}`);
  
  try {
    // 讀取市場配置
    const configPath = path.join(__dirname, '../../../marketplace-config.json');
    if (!fs.existsSync(configPath)) {
      console.error(`${colors.red}❌ 找不到 marketplace-config.json，請先部署合約${colors.reset}`);
      console.log(`${colors.yellow}執行: npm run deploy:marketplace${colors.reset}`);
      return;
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // 讀取 subgraph.yaml
    const subgraphPath = path.join(__dirname, '../subgraph.yaml');
    const subgraphConfig = yaml.load(fs.readFileSync(subgraphPath, 'utf8'));
    
    // 更新合約地址
    let updated = false;
    
    for (let dataSource of subgraphConfig.dataSources) {
      if (dataSource.name === 'DungeonMarketplace') {
        console.log(`${colors.yellow}更新 DungeonMarketplace...${colors.reset}`);
        dataSource.source.address = config.contracts.DungeonMarketplace;
        dataSource.source.startBlock = config.deploymentBlock;
        updated = true;
      } else if (dataSource.name === 'OfferSystem') {
        console.log(`${colors.yellow}更新 OfferSystem...${colors.reset}`);
        dataSource.source.address = config.contracts.OfferSystem;
        dataSource.source.startBlock = config.deploymentBlock;
        updated = true;
      }
    }
    
    if (!updated) {
      console.error(`${colors.red}❌ 無法更新地址，請檢查 subgraph.yaml 格式${colors.reset}`);
      return;
    }
    
    // 保存更新
    const updatedYaml = yaml.dump(subgraphConfig, {
      lineWidth: -1,
      noRefs: true,
      quotingType: "'",
    });
    
    fs.writeFileSync(subgraphPath, updatedYaml);
    
    console.log(`${colors.green}✅ 子圖配置已更新${colors.reset}`);
    console.log(`\n合約地址：`);
    console.log(`DungeonMarketplace: ${colors.cyan}${config.contracts.DungeonMarketplace}${colors.reset}`);
    console.log(`OfferSystem: ${colors.cyan}${config.contracts.OfferSystem}${colors.reset}`);
    console.log(`起始區塊: ${colors.cyan}${config.deploymentBlock}${colors.reset}`);
    
    // 複製 ABI 文件
    console.log(`\n${colors.yellow}複製 ABI 文件...${colors.reset}`);
    
    const abiSourceDir = path.join(__dirname, '../../../abis');
    const abiTargetDir = path.join(__dirname, '../abis');
    
    // 創建目標目錄
    fs.mkdirSync(abiTargetDir, { recursive: true });
    
    // 複製 ABI
    const contracts = ['DungeonMarketplace', 'OfferSystem'];
    for (const contract of contracts) {
      const sourcePath = path.join(abiSourceDir, `${contract}.json`);
      const targetPath = path.join(abiTargetDir, `${contract}.json`);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`${colors.green}✅ ${contract}.json 已複製${colors.reset}`);
      } else {
        console.warn(`${colors.yellow}⚠️ 找不到 ${contract}.json ABI 文件${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.bright}後續步驟：${colors.reset}`);
    console.log(`1. ${colors.yellow}npm install${colors.reset}`);
    console.log(`2. ${colors.yellow}npm run codegen${colors.reset}`);
    console.log(`3. ${colors.yellow}npm run build${colors.reset}`);
    console.log(`4. ${colors.yellow}npm run deploy:studio${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ 更新失敗: ${error.message}${colors.reset}`);
  }
}

// 執行更新
updateSubgraphAddresses();