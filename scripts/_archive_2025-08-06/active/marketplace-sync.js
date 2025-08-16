#!/usr/bin/env node

/**
 * Marketplace V2 配置同步腳本
 * 
 * 當主要合約部署後，同步 NFT 合約地址到 Marketplace 配置
 * 確保 Marketplace 使用最新的 V25 合約地址
 * 
 * 使用方式：
 * node scripts/active/marketplace-sync.js
 * node scripts/active/marketplace-sync.js --check-only
 */

const fs = require('fs');
const path = require('path');

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

function log(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
  const levelColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red
  };
  
  console.log(`${levelColors[level]}[${level}]${colors.reset} ${colors.bright}${timestamp}${colors.reset} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

class MarketplaceV2Syncer {
  constructor() {
    this.checkOnly = process.argv.includes('--check-only');
    this.contractsPath = '/Users/sotadic/Documents/DungeonDelversContracts';
    this.frontendPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers';
    this.errors = [];
  }

  // 讀取主配置文件
  loadMasterConfig() {
    log('INFO', '讀取主配置文件...');
    try {
      const configPath = path.join(this.contractsPath, 'config/master-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      const nftAddresses = {
        HERO: config.contracts.mainnet.HERO_ADDRESS,
        RELIC: config.contracts.mainnet.RELIC_ADDRESS,
        PARTY: config.contracts.mainnet.PARTY_ADDRESS
      };
      
      log('SUCCESS', '✅ 主配置載入成功', nftAddresses);
      return nftAddresses;
    } catch (error) {
      log('ERROR', '❌ 無法載入主配置文件', { error: error.message });
      this.errors.push(`Master config load failed: ${error.message}`);
      return null;
    }
  }

  // 檢查當前 Marketplace 配置
  checkMarketplaceConfig() {
    log('INFO', '檢查 Marketplace V2 配置...');
    try {
      // 檢查 marketplace-v2-config.json
      const marketplaceConfigPath = path.join(this.contractsPath, 'marketplace/marketplace-v2-config.json');
      const marketplaceConfig = JSON.parse(fs.readFileSync(marketplaceConfigPath, 'utf8'));
      
      // 檢查前端配置
      const frontendConfigPath = path.join(this.frontendPath, 'src/config/marketplace.ts');
      let frontendAddresses = null;
      
      if (fs.existsSync(frontendConfigPath)) {
        const frontendContent = fs.readFileSync(frontendConfigPath, 'utf8');
        // 解析前端文件中的地址
        const heroMatch = frontendContent.match(/HERO: '(0x[a-fA-F0-9]{40})'/);
        const relicMatch = frontendContent.match(/RELIC: '(0x[a-fA-F0-9]{40})'/);
        const partyMatch = frontendContent.match(/PARTY: '(0x[a-fA-F0-9]{40})'/);
        
        if (heroMatch && relicMatch && partyMatch) {
          frontendAddresses = {
            HERO: heroMatch[1],
            RELIC: relicMatch[1],
            PARTY: partyMatch[1]
          };
        }
      }
      
      return {
        marketplace: marketplaceConfig.nftContracts,
        frontend: frontendAddresses,
        frontendExists: !!frontendAddresses
      };
    } catch (error) {
      log('ERROR', '❌ 無法讀取 Marketplace 配置', { error: error.message });
      return null;
    }
  }

  // 比較地址差異
  compareAddresses(masterAddresses, marketplaceAddresses) {
    log('INFO', '比較合約地址...');
    
    const differences = [];
    for (const [nftType, masterAddr] of Object.entries(masterAddresses)) {
      const marketplaceAddr = marketplaceAddresses[nftType];
      
      if (masterAddr !== marketplaceAddr) {
        differences.push({
          nftType,
          master: masterAddr,
          marketplace: marketplaceAddr,
          status: '❌ 不匹配'
        });
      } else {
        differences.push({
          nftType,
          master: masterAddr,
          marketplace: marketplaceAddr,
          status: '✅ 匹配'
        });
      }
    }
    
    console.log('\\n📊 地址比較結果:');
    console.log('┌─────────┬──────────────────────────────────────────────┬──────────────────────────────────────────────┬──────────┐');
    console.log('│ NFT類型 │                主配置 (V25)                │              Marketplace V2               │   狀態   │');
    console.log('├─────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┼──────────┤');
    
    differences.forEach(diff => {
      const masterShort = diff.master ? `${diff.master.substring(0, 20)}...` : 'N/A';
      const marketplaceShort = diff.marketplace ? `${diff.marketplace.substring(0, 20)}...` : 'N/A';
      console.log(`│ ${diff.nftType.padEnd(7)} │ ${masterShort.padEnd(44)} │ ${marketplaceShort.padEnd(44)} │ ${diff.status.padEnd(8)} │`);
    });
    
    console.log('└─────────┴──────────────────────────────────────────────┴──────────────────────────────────────────────┴──────────┘\\n');
    
    return differences;
  }

  // 更新 Marketplace 配置文件
  updateMarketplaceConfig(masterAddresses) {
    if (this.checkOnly) {
      log('INFO', '🔍 僅檢查模式，跳過更新');
      return;
    }
    
    log('INFO', '更新 Marketplace 配置文件...');
    
    try {
      // 更新 marketplace-v2-config.json
      const marketplaceConfigPath = path.join(this.contractsPath, 'marketplace/marketplace-v2-config.json');
      const marketplaceConfig = JSON.parse(fs.readFileSync(marketplaceConfigPath, 'utf8'));
      
      // 備份原文件
      const backupPath = `${marketplaceConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(marketplaceConfigPath, backupPath);
      log('INFO', `📋 已備份: ${path.basename(backupPath)}`);
      
      // 更新地址
      marketplaceConfig.nftContracts = masterAddresses;
      marketplaceConfig.lastUpdated = new Date().toISOString();
      marketplaceConfig.version = "2.0.1"; // 版本號遞增
      
      // 寫入更新
      fs.writeFileSync(marketplaceConfigPath, JSON.stringify(marketplaceConfig, null, 2));
      log('SUCCESS', '✅ marketplace-v2-config.json 已更新');
      
      // 更新前端配置
      this.updateFrontendConfig(masterAddresses);
      
    } catch (error) {
      log('ERROR', '❌ 更新 Marketplace 配置失敗', { error: error.message });
      this.errors.push(`Marketplace config update failed: ${error.message}`);
    }
  }

  // 更新前端配置
  updateFrontendConfig(masterAddresses) {
    log('INFO', '更新前端 Marketplace 配置...');
    
    try {
      const frontendConfigPath = path.join(this.frontendPath, 'src/config/marketplace.ts');
      
      if (fs.existsSync(frontendConfigPath)) {
        // 備份
        const backupPath = `${frontendConfigPath}.backup-${Date.now()}`;
        fs.copyFileSync(frontendConfigPath, backupPath);
        log('INFO', `📋 已備份: ${path.basename(backupPath)}`);
        
        // 讀取並更新
        let content = fs.readFileSync(frontendConfigPath, 'utf8');
        
        // 更新 NFT 合約地址
        content = content.replace(
          /nftContracts: \\{[\\s\\S]*?\\}/,
          `nftContracts: {
    HERO: '${masterAddresses.HERO}' as const,
    RELIC: '${masterAddresses.RELIC}' as const,
    PARTY: '${masterAddresses.PARTY}' as const,
  }`
        );
        
        // 添加更新時間註釋
        const timestamp = new Date().toISOString();
        content = content.replace(
          '// ⚠️ IMPORTANT: 使用與主配置一致的 V25 NFT 合約地址',
          `// ⚠️ IMPORTANT: 使用與主配置一致的 V25 NFT 合約地址\n// Last synced: ${timestamp}`
        );
        
        fs.writeFileSync(frontendConfigPath, content);
        log('SUCCESS', '✅ 前端 marketplace.ts 已更新');
      } else {
        log('WARNING', '⚠️ 前端配置文件不存在，跳過更新');
      }
      
    } catch (error) {
      log('ERROR', '❌ 更新前端配置失敗', { error: error.message });
      this.errors.push(`Frontend config update failed: ${error.message}`);
    }
  }

  // 生成同步報告
  generateReport(differences) {
    const reportPath = path.join(this.contractsPath, `marketplace-sync-report-${Date.now()}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: this.checkOnly ? 'check-only' : 'sync',
      differences: differences,
      errors: this.errors,
      recommendations: []
    };
    
    // 生成建議
    const mismatches = differences.filter(d => d.status.includes('❌'));
    if (mismatches.length > 0) {
      report.recommendations.push('需要更新 Marketplace V2 合約的 NFT 白名單');
      report.recommendations.push('建議執行 marketplace-sync.js 同步配置');
      
      mismatches.forEach(m => {
        report.recommendations.push(
          `在 DungeonMarketplaceV2 合約上執行: approveNFTContract("${m.master}")`
        );
      });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('SUCCESS', `📋 同步報告已生成: ${path.basename(reportPath)}`);
    
    return report;
  }

  // 主執行函數
  async run() {
    console.log(`${colors.bright}
==================================================
🔄 Marketplace V2 配置同步腳本
==================================================
${colors.reset}`);
    
    if (this.checkOnly) {
      console.log(`${colors.cyan}🔍 執行模式: 僅檢查${colors.reset}\\n`);
    } else {
      console.log(`${colors.cyan}⚡ 執行模式: 同步更新${colors.reset}\\n`);
    }
    
    // 1. 載入主配置
    const masterAddresses = this.loadMasterConfig();
    if (!masterAddresses) return;
    
    // 2. 檢查 Marketplace 配置
    const marketplaceConfig = this.checkMarketplaceConfig();
    if (!marketplaceConfig) return;
    
    // 3. 比較地址
    const differences = this.compareAddresses(masterAddresses, marketplaceConfig.marketplace);
    
    // 3.5 檢查前端配置差異
    let frontendDifferences = [];
    if (marketplaceConfig.frontend) {
      log('INFO', '檢查前端配置差異...');
      frontendDifferences = this.compareAddresses(masterAddresses, marketplaceConfig.frontend);
    }
    
    // 4. 更新配置（如果不是僅檢查模式）
    const hasMarketplaceChanges = differences.some(d => d.status.includes('❌'));
    const hasFrontendChanges = frontendDifferences.some(d => d.status.includes('❌'));
    
    if ((hasMarketplaceChanges || hasFrontendChanges) && !this.checkOnly) {
      this.updateMarketplaceConfig(masterAddresses);
    }
    
    // 5. 生成報告
    const report = this.generateReport(differences);
    
    // 6. 總結
    console.log(`${colors.bright}\\n📋 同步結果總結:${colors.reset}`);
    console.log(`  - 檢查項目: ${differences.length}`);
    console.log(`  - 需要更新: ${differences.filter(d => d.status.includes('❌')).length}`);
    console.log(`  - 錯誤數量: ${this.errors.length}`);
    
    if (hasMarketplaceChanges || hasFrontendChanges) {
      console.log(`\\n${colors.yellow}⚠️ 下一步操作建議:${colors.reset}`);
      console.log('1. 檢查 DungeonMarketplaceV2 合約的 NFT 白名單');
      console.log('2. 如需要，執行合約的 approveNFTContract() 函數');
      console.log('3. 測試 Marketplace 交易功能');
    } else {
      console.log(`\\n${colors.green}✅ 所有配置已同步，無需額外操作！${colors.reset}`);
    }
  }
}

// 執行同步
if (require.main === module) {
  const syncer = new MarketplaceV2Syncer();
  syncer.run().catch(console.error);
}

module.exports = MarketplaceV2Syncer;