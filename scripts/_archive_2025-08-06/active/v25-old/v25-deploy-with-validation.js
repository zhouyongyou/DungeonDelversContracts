#!/usr/bin/env node

/**
 * V25 改進版部署腳本 - 帶依賴驗證
 * 
 * 修復原始部署腳本的問題：
 * 1. 加強錯誤處理 - 失敗時停止部署
 * 2. 添加依賴驗證 - 確保每個設置都成功
 * 3. 改進重試機制
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-deploy-with-validation.js --network bsc
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// 繼承原始部署腳本但增加驗證
const originalDeployScript = require('./v25-deploy-complete-sequential.js');

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

// 依賴驗證配置
const DEPENDENCY_VALIDATIONS = {
  HERO: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' },
    { property: 'soulShardToken', setter: 'setSoulShardToken', target: 'SOULSHARD' },
    { property: 'ascensionAltarAddress', setter: 'setAscensionAltarAddress', target: 'ALTAROFASCENSION' }
  ],
  RELIC: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' },
    { property: 'soulShardToken', setter: 'setSoulShardToken', target: 'SOULSHARD' },
    { property: 'ascensionAltarAddress', setter: 'setAscensionAltarAddress', target: 'ALTAROFASCENSION' }
  ],
  PARTY: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' },
    { property: 'heroContract', setter: 'setHeroContract', target: 'HERO' },
    { property: 'relicContract', setter: 'setRelicContract', target: 'RELIC' }
  ],
  DUNGEONMASTER: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' },
    { property: 'dungeonStorage', setter: 'setDungeonStorage', target: 'DUNGEONSTORAGE' }
  ],
  PLAYERVAULT: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' },
    { property: 'soulShardToken', setter: 'setSoulShardToken', target: 'SOULSHARD' }
  ],
  VIPSTAKING: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' }
  ],
  PLAYERPROFILE: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' }
  ],
  ALTAROFASCENSION: [
    { property: 'dungeonCore', setter: 'setDungeonCore', target: 'DUNGEONCORE' },
    { property: 'heroContract', setter: 'setHeroContract', target: 'HERO' },
    { property: 'relicContract', setter: 'setRelicContract', target: 'RELIC' }
  ]
};

class ValidatedDeployer {
  constructor() {
    this.contracts = {};
    this.validationErrors = [];
    this.maxRetries = 3;
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

  // 設置依賴並驗證
  async setDependencyWithValidation(contractName, dependency, maxRetries = 3) {
    const contract = this.contracts[contractName]?.contract;
    const targetAddress = this.contracts[dependency.target]?.address;
    
    if (!contract) {
      throw new Error(`找不到 ${contractName} 合約`);
    }
    
    if (!targetAddress) {
      throw new Error(`找不到 ${dependency.target} 合約地址`);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`設置 ${contractName}.${dependency.setter} (嘗試 ${attempt}/${maxRetries})`, 'info');
        
        // 執行設置
        const tx = await contract[dependency.setter](targetAddress);
        await tx.wait();
        
        // 驗證設置
        const actualValue = await contract[dependency.property]();
        if (actualValue.toLowerCase() === targetAddress.toLowerCase()) {
          this.log(`✅ ${contractName}.${dependency.property} 設置並驗證成功`, 'success');
          return true;
        } else {
          throw new Error(`驗證失敗: 期望 ${targetAddress}, 實際 ${actualValue}`);
        }
        
      } catch (error) {
        this.log(`❌ ${contractName}.${dependency.setter} 嘗試 ${attempt} 失敗: ${error.message}`, 'error');
        
        if (attempt === maxRetries) {
          this.validationErrors.push({
            contract: contractName,
            dependency: dependency.property,
            error: error.message
          });
          return false;
        }
        
        // 重試前等待
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return false;
  }

  // 批量設置並驗證所有依賴
  async setupAndValidateAllDependencies() {
    this.log('\n開始設置並驗證所有依賴...', 'info');
    
    let totalSuccess = 0;
    let totalAttempts = 0;
    
    for (const [contractName, dependencies] of Object.entries(DEPENDENCY_VALIDATIONS)) {
      if (!this.contracts[contractName]) {
        this.log(`⚠️ 跳過 ${contractName} (合約未部署)`, 'warning');
        continue;
      }
      
      this.log(`\n配置 ${contractName} 合約依賴:`, 'info');
      
      for (const dependency of dependencies) {
        totalAttempts++;
        const success = await this.setDependencyWithValidation(contractName, dependency);
        if (success) {
          totalSuccess++;
        }
      }
    }
    
    this.log(`\n依賴設置總結: ${totalSuccess}/${totalAttempts} 成功`, 'info');
    
    if (this.validationErrors.length > 0) {
      this.log('\n依賴設置失敗項目:', 'error');
      for (const error of this.validationErrors) {
        this.log(`- ${error.contract}.${error.dependency}: ${error.error}`, 'error');
      }
      
      throw new Error(`${this.validationErrors.length} 個依賴設置失敗，部署中止`);
    }
  }

  // 最終驗證
  async finalValidation() {
    this.log('\n執行最終驗證...', 'info');
    
    let validationCount = 0;
    let passedCount = 0;
    
    for (const [contractName, dependencies] of Object.entries(DEPENDENCY_VALIDATIONS)) {
      const contract = this.contracts[contractName]?.contract;
      if (!contract) continue;
      
      this.log(`驗證 ${contractName}:`, 'info');
      
      for (const dependency of dependencies) {
        validationCount++;
        try {
          const actualValue = await contract[dependency.property]();
          const expectedValue = this.contracts[dependency.target]?.address;
          
          if (actualValue.toLowerCase() === expectedValue.toLowerCase()) {
            this.log(`  ✅ ${dependency.property}: 正確`, 'success');
            passedCount++;
          } else {
            this.log(`  ❌ ${dependency.property}: 錯誤 (${actualValue})`, 'error');
          }
        } catch (error) {
          this.log(`  ❌ ${dependency.property}: 驗證失敗 - ${error.message}`, 'error');
        }
      }
    }
    
    this.log(`\n最終驗證結果: ${passedCount}/${validationCount} 通過`, 'info');
    
    if (passedCount !== validationCount) {
      throw new Error('最終驗證未完全通過，部署不完整');
    }
    
    this.log('✅ 所有依賴驗證通過！', 'success');
  }

  // 生成驗證報告
  async generateValidationReport() {
    const reportPath = path.join(__dirname, '../deployments', `v25-validation-report-${Date.now()}.md`);
    
    let report = `# V25 依賴驗證報告

生成時間: ${new Date().toLocaleString()}

## 驗證結果

| 合約 | 依賴 | 狀態 | 地址 |
|------|------|------|------|
`;

    for (const [contractName, dependencies] of Object.entries(DEPENDENCY_VALIDATIONS)) {
      const contract = this.contracts[contractName]?.contract;
      if (!contract) continue;
      
      for (const dependency of dependencies) {
        try {
          const actualValue = await contract[dependency.property]();
          const expectedValue = this.contracts[dependency.target]?.address;
          const status = actualValue.toLowerCase() === expectedValue.toLowerCase() ? '✅ 正確' : '❌ 錯誤';
          
          report += `| ${contractName} | ${dependency.property} | ${status} | \`${actualValue}\` |\n`;
        } catch (error) {
          report += `| ${contractName} | ${dependency.property} | ❌ 讀取失敗 | - |\n`;
        }
      }
    }

    if (this.validationErrors.length > 0) {
      report += `\n## 錯誤詳情\n\n`;
      for (const error of this.validationErrors) {
        report += `- **${error.contract}.${error.dependency}**: ${error.error}\n`;
      }
    }

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    this.log(`✅ 驗證報告已生成: ${reportPath}`, 'success');
  }
}

// 繼承並擴展原始部署器
class EnhancedV25Deployer extends ValidatedDeployer {
  // 這裡可以繼承原始部署腳本的邏輯
  // 但添加我們的驗證機制
}

async function main() {
  console.log(`${colors.bright}
==================================================
🚀 V25 改進版部署腳本 - 帶依賴驗證
==================================================
${colors.reset}`);

  const deployer = new EnhancedV25Deployer();
  
  try {
    // 這裡應該調用原始部署邏輯
    // 然後添加我們的驗證步驟
    
    console.log(`${colors.yellow}
注意：這是改進版本的框架
實際使用時需要整合完整的部署邏輯
建議先執行修復腳本：
npx hardhat run scripts/active/v25-fix-contract-dependencies.js --network bsc
${colors.reset}`);
    
  } catch (error) {
    console.error(`部署失敗: ${error.message}`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });