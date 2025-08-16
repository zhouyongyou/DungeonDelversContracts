#!/usr/bin/env node

/**
 * 地下城系統修復驗證腳本
 * 
 * 使用方式：
 * node scripts/verify-dungeon-fixes.js --network bsc
 */

const hre = require("hardhat");
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

class DungeonFixVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
      warning: `${colors.yellow}[WARNING]${colors.reset}`
    };
    console.log(`${prefix[type]} ${timestamp} ${message}`);
  }

  async verify() {
    console.log(`${colors.bright}
==================================================
🔍 地下城系統修復驗證腳本
==================================================
${colors.reset}`);

    try {
      // 1. 驗證合約配置
      await this.verifyContracts();
      
      // 2. 驗證前端文件修復
      await this.verifyFrontendFixes();
      
      // 3. 驗證子圖文件修復
      await this.verifySubgraphFixes();
      
      // 4. 生成驗證報告
      await this.generateReport();
      
    } catch (error) {
      this.log(`驗證過程發生錯誤: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }

  async verifyContracts() {
    this.log('\n驗證合約配置...', 'info');
    
    try {
      // 載入合約配置
      const masterConfigPath = path.join(__dirname, '../config/master-config.json');
      if (!fs.existsSync(masterConfigPath)) {
        this.errors.push('master-config.json 不存在');
        return;
      }
      
      const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      
      // 檢查是否有12個地城的相關配置
      this.log('檢查合約地址配置...', 'info');
      const requiredContracts = ['DUNGEONMASTER_ADDRESS', 'DUNGEONSTORAGE_ADDRESS', 'PLAYERPROFILE_ADDRESS'];
      
      for (const contract of requiredContracts) {
        if (masterConfig.contracts?.mainnet?.[contract]) {
          this.successes.push(`${contract} 配置正確`);
        } else {
          this.errors.push(`${contract} 配置缺失`);
        }
      }
      
      // 檢查 DungeonStorage 文件
      const dungeonStoragePath = path.join(__dirname, '../contracts/current/core/DungeonStorage.sol');
      if (fs.existsSync(dungeonStoragePath)) {
        const content = fs.readFileSync(dungeonStoragePath, 'utf8');
        if (content.includes('NUM_DUNGEONS = 12')) {
          this.successes.push('DungeonStorage NUM_DUNGEONS 已更新為 12');
        } else if (content.includes('NUM_DUNGEONS = 10')) {
          this.errors.push('DungeonStorage NUM_DUNGEONS 仍為 10，需要更新');
        } else {
          this.warnings.push('無法確認 DungeonStorage NUM_DUNGEONS 值');
        }
      }
      
    } catch (error) {
      this.errors.push(`合約驗證失敗: ${error.message}`);
    }
  }

  async verifyFrontendFixes() {
    this.log('\n驗證前端修復...', 'info');
    
    try {
      // 檢查 DungeonPage.tsx 修復
      const dungeonPagePath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/pages/DungeonPage.tsx';
      if (fs.existsSync(dungeonPagePath)) {
        const content = fs.readFileSync(dungeonPagePath, 'utf8');
        
        // 檢查是否使用正確的經驗值公式
        if (content.includes('Number(dungeon.requiredPower) / 10')) {
          this.successes.push('前端經驗值計算公式已修復');
        } else if (content.includes('dungeon.id * 5 + 20')) {
          this.errors.push('前端仍使用錯誤的經驗值計算公式');
        } else {
          this.warnings.push('無法確認前端經驗值計算公式');
        }
        
        // 檢查是否移除了硬編碼的經驗值
        if (!content.includes('25 EXP') && !content.includes('80 EXP')) {
          this.successes.push('前端已移除硬編碼經驗值');
        } else {
          this.warnings.push('前端可能仍有硬編碼經驗值');
        }
        
      } else {
        this.errors.push('找不到 DungeonPage.tsx 文件');
      }
      
    } catch (error) {
      this.errors.push(`前端驗證失敗: ${error.message}`);
    }
  }

  async verifySubgraphFixes() {
    this.log('\n驗證子圖修復...', 'info');
    
    try {
      // 檢查 dungeon-master.ts 修復
      const dungeonMasterPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/src/dungeon-master.ts';
      if (fs.existsSync(dungeonMasterPath)) {
        const content = fs.readFileSync(dungeonMasterPath, 'utf8');
        
        // 檢查是否有反推函數
        if (content.includes('getDungeonIdFromExp')) {
          this.successes.push('子圖已添加地城ID反推函數');
        } else {
          this.errors.push('子圖缺少地城ID反推函數');
        }
        
        // 檢查是否支持12個地城
        if (content.includes('冥界之門') && content.includes('虛空裂隙')) {
          this.successes.push('子圖已支持12個地城');
        } else {
          this.errors.push('子圖仍只支持10個地城');
        }
        
        // 檢查是否移除了硬編碼地城ID
        if (!content.includes('const dungeonId = BigInt.fromI32(1)')) {
          this.successes.push('子圖已移除硬編碼地城ID');
        } else {
          this.warnings.push('子圖可能仍有硬編碼地城ID');
        }
        
        // 檢查戰力需求是否更新到3600
        if (content.includes('BigInt.fromI32(3600)')) {
          this.successes.push('子圖戰力需求已更新到3600');
        } else {
          this.errors.push('子圖戰力需求未更新');
        }
        
      } else {
        this.errors.push('找不到 dungeon-master.ts 文件');
      }
      
      // 檢查 subgraph.yaml 配置
      const subgraphYamlPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
      if (fs.existsSync(subgraphYamlPath)) {
        const content = fs.readFileSync(subgraphYamlPath, 'utf8');
        
        // 檢查是否使用正確的 PlayerProfile 地址
        if (content.includes('0x96e245735b92a493B29887a29b8c6cECa4f65Fc5')) {
          this.successes.push('子圖使用正確的 PlayerProfile 地址');
        } else if (content.includes('0x145F19e672a7D53ddb16bcE3fdeAd976bb3ef82f')) {
          this.errors.push('子圖仍使用錯誤的 PlayerProfile 地址');
        } else {
          this.warnings.push('無法確認子圖 PlayerProfile 地址');
        }
        
        // 檢查起始區塊
        if (content.includes('startBlock: 55808316')) {
          this.successes.push('子圖使用正確的起始區塊');
        } else {
          this.warnings.push('請確認子圖起始區塊設置');
        }
        
      } else {
        this.errors.push('找不到 subgraph.yaml 文件');
      }
      
    } catch (error) {
      this.errors.push(`子圖驗證失敗: ${error.message}`);
    }
  }

  async generateReport() {
    this.log('\n生成驗證報告...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_checks: this.successes.length + this.warnings.length + this.errors.length,
        successes: this.successes.length,
        warnings: this.warnings.length,
        errors: this.errors.length
      },
      details: {
        successes: this.successes,
        warnings: this.warnings,
        errors: this.errors
      }
    };
    
    // 保存報告
    const reportPath = path.join(__dirname, '../verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 顯示結果
    console.log(`\n${colors.bright}驗證結果總結:${colors.reset}`);
    console.log(`✅ 成功: ${colors.green}${this.successes.length}${colors.reset}`);
    console.log(`⚠️  警告: ${colors.yellow}${this.warnings.length}${colors.reset}`);
    console.log(`❌ 錯誤: ${colors.red}${this.errors.length}${colors.reset}`);
    
    if (this.successes.length > 0) {
      console.log(`\n${colors.green}成功項目:${colors.reset}`);
      this.successes.forEach(success => console.log(`  ✅ ${success}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}警告項目:${colors.reset}`);
      this.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}錯誤項目:${colors.reset}`);
      this.errors.forEach(error => console.log(`  ❌ ${error}`));
    }
    
    console.log(`\n📄 詳細報告已保存到: ${reportPath}`);
    
    // 下一步建議
    console.log(`\n${colors.bright}下一步建議:${colors.reset}`);
    if (this.errors.length === 0) {
      console.log('🎉 所有修復驗證通過！可以重新部署子圖了。');
      console.log('📋 子圖部署命令:');
      console.log('   cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers');
      console.log('   npm run codegen');
      console.log('   npm run build');
      console.log('   npm run deploy');
    } else {
      console.log('🔧 請先修復上述錯誤，然後重新運行驗證。');
    }
  }
}

// 執行驗證
async function main() {
  const verifier = new DungeonFixVerifier();
  await verifier.verify();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });