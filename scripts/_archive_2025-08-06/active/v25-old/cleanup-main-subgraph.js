#!/usr/bin/env node

/**
 * 清理主子圖中的市場相關配置
 * 
 * 因為市場系統現在完全獨立部署，主子圖不應包含市場相關內容
 * 
 * 使用方式：
 * node scripts/active/cleanup-main-subgraph.js
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

function cleanupMainSubgraph() {
  console.log(`${colors.bright}${colors.blue}清理主子圖中的市場相關配置...${colors.reset}`);
  
  try {
    // 1. 清理 subgraph.yaml
    const subgraphPath = path.join(
      __dirname,
      '../../../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml'
    );
    
    console.log(`\n${colors.yellow}1. 清理 subgraph.yaml...${colors.reset}`);
    
    const subgraphConfig = yaml.load(fs.readFileSync(subgraphPath, 'utf8'));
    
    // 過濾掉市場相關的數據源
    const originalLength = subgraphConfig.dataSources.length;
    subgraphConfig.dataSources = subgraphConfig.dataSources.filter(ds => 
      ds.name !== 'DungeonMarketplace' && ds.name !== 'OfferSystem'
    );
    
    const removedCount = originalLength - subgraphConfig.dataSources.length;
    
    if (removedCount > 0) {
      // 保存清理後的配置
      const cleanedYaml = yaml.dump(subgraphConfig, {
        lineWidth: -1,
        noRefs: true,
        quotingType: "'",
      });
      
      fs.writeFileSync(subgraphPath, cleanedYaml);
      console.log(`${colors.green}✅ 已移除 ${removedCount} 個市場相關數據源${colors.reset}`);
    } else {
      console.log(`${colors.cyan}ℹ️ 沒有找到市場相關數據源${colors.reset}`);
    }
    
    // 2. 清理 schema.graphql
    const schemaPath = path.join(
      __dirname,
      '../../../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/schema.graphql'
    );
    
    console.log(`\n${colors.yellow}2. 清理 schema.graphql...${colors.reset}`);
    
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // 檢查是否包含市場相關實體
    if (schemaContent.includes('# 市場相關實體')) {
      // 找到市場部分的開始位置
      const marketSectionStart = schemaContent.indexOf('# =================================================================\n# 市場相關實體');
      
      if (marketSectionStart !== -1) {
        // 保留市場部分之前的內容
        const cleanedSchema = schemaContent.substring(0, marketSectionStart).trimEnd();
        
        // 備份原始文件
        const backupPath = schemaPath + '.backup-' + Date.now();
        fs.writeFileSync(backupPath, schemaContent);
        console.log(`${colors.cyan}📄 原始 schema 已備份到: ${backupPath}${colors.reset}`);
        
        // 寫入清理後的內容
        fs.writeFileSync(schemaPath, cleanedSchema);
        console.log(`${colors.green}✅ 已移除市場相關實體定義${colors.reset}`);
      }
    } else {
      console.log(`${colors.cyan}ℹ️ Schema 中沒有市場相關實體${colors.reset}`);
    }
    
    // 3. 清理 mapping 文件
    const mappingDir = path.join(
      __dirname,
      '../../../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/src'
    );
    
    console.log(`\n${colors.yellow}3. 清理 mapping 文件...${colors.reset}`);
    
    const marketMappings = ['marketplace.ts', 'offer-system.ts'];
    let removedMappings = 0;
    
    for (const mapping of marketMappings) {
      const mappingPath = path.join(mappingDir, mapping);
      if (fs.existsSync(mappingPath)) {
        // 備份並刪除
        const backupPath = mappingPath + '.backup-' + Date.now();
        fs.renameSync(mappingPath, backupPath);
        console.log(`${colors.green}✅ 已移除 ${mapping}${colors.reset}`);
        console.log(`${colors.cyan}   備份到: ${backupPath}${colors.reset}`);
        removedMappings++;
      }
    }
    
    if (removedMappings === 0) {
      console.log(`${colors.cyan}ℹ️ 沒有找到市場相關 mapping 文件${colors.reset}`);
    }
    
    // 4. 提醒後續步驟
    console.log(`\n${colors.bright}${colors.green}清理完成！${colors.reset}`);
    console.log(`\n${colors.bright}${colors.yellow}後續步驟：${colors.reset}`);
    console.log(`1. ${colors.yellow}cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers${colors.reset}`);
    console.log(`2. ${colors.yellow}npm run codegen${colors.reset} - 重新生成代碼`);
    console.log(`3. ${colors.yellow}npm run build${colors.reset} - 重新構建子圖`);
    console.log(`4. ${colors.yellow}graph deploy --studio dungeon-delvers${colors.reset} - 重新部署`);
    
    console.log(`\n${colors.bright}${colors.cyan}市場子圖信息：${colors.reset}`);
    console.log(`市場系統現在有獨立的子圖，位於：`);
    console.log(`${colors.cyan}/Users/sotadic/Documents/DungeonDelversContracts/marketplace/subgraph/${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ 清理失敗: ${error.message}${colors.reset}`);
  }
}

// 執行清理
cleanupMainSubgraph();