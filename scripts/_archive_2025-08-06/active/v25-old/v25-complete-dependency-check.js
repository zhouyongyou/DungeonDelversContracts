#!/usr/bin/env node

/**
 * V25 完整依賴關係檢查腳本
 * 
 * 檢查所有合約間的依賴關係並生成報告
 * 
 * 使用方式：
 * node scripts/active/v25-complete-dependency-check.js
 */

const { createPublicClient, http } = require('viem');
const { bsc } = require('viem/chains');
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

// V25 合約地址
const V25_ADDRESSES = {
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  ORACLE: '0x2350D85e5DF1b6a6d055CD61FeD27d5dC36B6F52',
  DUNGEONCORE: '0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E',
  PLAYERVAULT: '0x4d06483c907DB1CfA9C2207D9DC5a1Abad86544b',
  PLAYERPROFILE: '0x145F19e672a7D53ddb16bcE3fdeAd976bb3ef82f',
  VIPSTAKING: '0xdC285539069Fa51b9259bd1F1d66f23f74B96A6c',
  DUNGEONSTORAGE: '0x4b1A9a45d0a1C35CDbae04272814f3daA9b59c47',
  DUNGEONMASTER: '0x08Bd8E0D85A7F10bEecCBA9a67da9033f9a7C8D9',
  HERO: '0x162b0b673f38C11732b0bc0B4B026304e563e8e2',
  RELIC: '0x15c2454A31Abc0063ef4a71d0640057d71847a22',
  PARTY: '0xab07E90d44c34FB62313C74F3C7b4b343E52a253',
  ALTAROFASCENSION: '0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845'
};

// 依賴關係定義
const DEPENDENCY_DEFINITIONS = {
  // NFT 合約
  HERO: {
    dependencies: [
      { name: 'dungeonCore', type: 'address', critical: true },
      { name: 'soulShardToken', type: 'address', critical: true },
      { name: 'ascensionAltarAddress', type: 'address', critical: true }
    ],
    functions: [
      { name: 'getRequiredSoulShardAmount', args: [1n], description: '獲取鑄造價格' }
    ]
  },
  RELIC: {
    dependencies: [
      { name: 'dungeonCore', type: 'address', critical: true },
      { name: 'soulShardToken', type: 'address', critical: true },
      { name: 'ascensionAltarAddress', type: 'address', critical: true }
    ],
    functions: [
      { name: 'getRequiredSoulShardAmount', args: [1n], description: '獲取鑄造價格' }
    ]
  },
  PARTY: {
    dependencies: [
      { name: 'heroContract', type: 'address', critical: true },
      { name: 'relicContract', type: 'address', critical: true },
      { name: 'dungeonCore', type: 'address', critical: false }
    ],
    functions: []
  },
  
  // 核心合約
  DUNGEONCORE: {
    dependencies: [
      { name: 'oracle', type: 'address', critical: true },
      { name: 'heroContract', type: 'address', critical: true },
      { name: 'relicContract', type: 'address', critical: true },
      { name: 'partyContract', type: 'address', critical: true },
      { name: 'dungeonMaster', type: 'address', critical: true },
      { name: 'playerVault', type: 'address', critical: true },
      { name: 'playerProfile', type: 'address', critical: true },
      { name: 'vipStaking', type: 'address', critical: true },
      { name: 'altarOfAscension', type: 'address', critical: true }
    ],
    functions: [
      { name: 'getSoulShardAmountForUSD', args: [1000000000000000000n], description: 'USD 轉 SoulShard' }
    ]
  },
  
  DUNGEONMASTER: {
    dependencies: [
      { name: 'dungeonCore', type: 'address', critical: true },
      { name: 'dungeonStorage', type: 'address', critical: true },
      { name: 'soulShardToken', type: 'address', critical: true }
    ],
    functions: []
  },
  
  PLAYERVAULT: {
    dependencies: [
      { name: 'dungeonCore', type: 'address', critical: true },
      { name: 'soulShardToken', type: 'address', critical: true }
    ],
    functions: []
  },
  
  ALTAROFASCENSION: {
    dependencies: [
      { name: 'dungeonCore', type: 'address', critical: true },
      { name: 'heroContract', type: 'address', critical: true },
      { name: 'relicContract', type: 'address', critical: true }
    ],
    functions: []
  },
  
  VIPSTAKING: {
    dependencies: [
      { name: 'dungeonCore', type: 'address', critical: true },
      { name: 'soulShardToken', type: 'address', critical: true }
    ],
    functions: []
  },
  
  PLAYERPROFILE: {
    dependencies: [
      { name: 'dungeonCore', type: 'address', critical: true }
    ],
    functions: []
  }
};

// 預期的依賴值
const EXPECTED_VALUES = {
  dungeonCore: V25_ADDRESSES.DUNGEONCORE,
  soulShardToken: V25_ADDRESSES.SOULSHARD,
  ascensionAltarAddress: V25_ADDRESSES.ALTAROFASCENSION,
  heroContract: V25_ADDRESSES.HERO,
  relicContract: V25_ADDRESSES.RELIC,
  partyContract: V25_ADDRESSES.PARTY,
  oracle: V25_ADDRESSES.ORACLE,
  dungeonMaster: V25_ADDRESSES.DUNGEONMASTER,
  dungeonStorage: V25_ADDRESSES.DUNGEONSTORAGE,
  playerVault: V25_ADDRESSES.PLAYERVAULT,
  playerProfile: V25_ADDRESSES.PLAYERPROFILE,
  vipStaking: V25_ADDRESSES.VIPSTAKING,
  altarOfAscension: V25_ADDRESSES.ALTAROFASCENSION
};

class DependencyChecker {
  constructor() {
    this.client = createPublicClient({
      chain: bsc,
      transport: http('https://bsc-dataseed1.binance.org/')
    });
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
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

  async checkContract(contractName) {
    this.log(`\n檢查 ${contractName} 合約...`, 'info');
    
    const contractAddress = V25_ADDRESSES[contractName];
    const definition = DEPENDENCY_DEFINITIONS[contractName];
    
    if (!definition) {
      this.log(`⚠️ ${contractName} 沒有定義依賴檢查`, 'warning');
      return;
    }

    const contractResult = {
      contract: contractName,
      address: contractAddress,
      dependencies: [],
      functions: []
    };

    // 檢查依賴
    for (const dep of definition.dependencies || []) {
      const result = await this.checkDependency(contractName, contractAddress, dep);
      contractResult.dependencies.push(result);
      
      this.results.summary.total++;
      if (result.status === 'passed') {
        this.results.summary.passed++;
        this.log(`✅ ${dep.name}: ${result.actual}`, 'success');
      } else {
        this.results.summary.failed++;
        if (dep.critical) {
          this.results.summary.critical++;
        }
        this.log(`❌ ${dep.name}: ${result.actual} (期望: ${result.expected})`, 'error');
      }
    }

    // 檢查函數
    for (const func of definition.functions || []) {
      const result = await this.checkFunction(contractName, contractAddress, func);
      contractResult.functions.push(result);
      
      if (result.status === 'success') {
        this.log(`✅ ${func.name}(): ${result.result}`, 'success');
      } else {
        this.log(`❌ ${func.name}(): ${result.error}`, 'error');
      }
    }

    this.results.checks.push(contractResult);
  }

  async checkDependency(contractName, contractAddress, dep) {
    try {
      // 創建簡單的 ABI
      const abi = [{
        inputs: [],
        name: dep.name,
        outputs: [{ internalType: dep.type, name: '', type: dep.type }],
        stateMutability: 'view',
        type: 'function'
      }];

      const result = await this.client.readContract({
        address: contractAddress,
        abi,
        functionName: dep.name
      });

      const expected = EXPECTED_VALUES[dep.name];
      const actual = result.toString();
      const isCorrect = expected && actual.toLowerCase() === expected.toLowerCase();

      return {
        name: dep.name,
        expected,
        actual,
        status: isCorrect ? 'passed' : 'failed',
        critical: dep.critical
      };
    } catch (error) {
      return {
        name: dep.name,
        expected: EXPECTED_VALUES[dep.name],
        actual: 'ERROR',
        status: 'error',
        critical: dep.critical,
        error: error.message
      };
    }
  }

  async checkFunction(contractName, contractAddress, func) {
    try {
      const abi = [{
        inputs: func.args.map((_, index) => ({ 
          internalType: 'uint256', 
          name: `arg${index}`, 
          type: 'uint256' 
        })),
        name: func.name,
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }];

      const result = await this.client.readContract({
        address: contractAddress,
        abi,
        functionName: func.name,
        args: func.args
      });

      return {
        name: func.name,
        description: func.description,
        status: 'success',
        result: result.toString()
      };
    } catch (error) {
      return {
        name: func.name,
        description: func.description,
        status: 'error',
        error: error.message
      };
    }
  }

  async generateReport() {
    const reportPath = path.join(__dirname, '../deployments', `v25-dependency-report-${Date.now()}.json`);
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    this.log(`\n報告已生成: ${reportPath}`, 'info');
    
    // 生成 Markdown 報告
    const mdReportPath = reportPath.replace('.json', '.md');
    let mdContent = `# V25 合約依賴關係檢查報告

生成時間: ${this.results.timestamp}

## 總結

- 總檢查項目: ${this.results.summary.total}
- 通過: ${this.results.summary.passed}
- 失敗: ${this.results.summary.failed}
- 關鍵失敗: ${this.results.summary.critical}

## 詳細結果

`;

    for (const check of this.results.checks) {
      mdContent += `### ${check.contract}\n\n`;
      mdContent += `地址: \`${check.address}\`\n\n`;
      
      if (check.dependencies.length > 0) {
        mdContent += `#### 依賴檢查\n\n`;
        mdContent += `| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |\n`;
        mdContent += `|------|--------|--------|------|------|\n`;
        
        for (const dep of check.dependencies) {
          const status = dep.status === 'passed' ? '✅' : '❌';
          const critical = dep.critical ? '是' : '否';
          mdContent += `| ${dep.name} | \`${dep.expected || 'N/A'}\` | \`${dep.actual}\` | ${status} | ${critical} |\n`;
        }
        mdContent += '\n';
      }
      
      if (check.functions.length > 0) {
        mdContent += `#### 函數測試\n\n`;
        mdContent += `| 函數 | 描述 | 結果 |\n`;
        mdContent += `|------|------|------|\n`;
        
        for (const func of check.functions) {
          const status = func.status === 'success' ? '✅' : '❌';
          const result = func.result || func.error || 'N/A';
          mdContent += `| ${func.name} | ${func.description} | ${status} ${result} |\n`;
        }
        mdContent += '\n';
      }
    }
    
    fs.writeFileSync(mdReportPath, mdContent);
    this.log(`Markdown 報告已生成: ${mdReportPath}`, 'info');
  }

  async run() {
    console.log(`${colors.bright}
==================================================
🔍 V25 完整依賴關係檢查
==================================================
${colors.reset}`);

    try {
      // 檢查所有合約
      for (const contractName of Object.keys(DEPENDENCY_DEFINITIONS)) {
        await this.checkContract(contractName);
      }

      // 生成報告
      await this.generateReport();

      // 顯示總結
      this.log(`\n檢查完成！`, 'info');
      this.log(`總計: ${this.results.summary.total} 項`, 'info');
      this.log(`通過: ${this.results.summary.passed} 項`, 'success');
      this.log(`失敗: ${this.results.summary.failed} 項`, 'error');
      
      if (this.results.summary.critical > 0) {
        this.log(`⚠️ 有 ${this.results.summary.critical} 個關鍵依賴失敗！`, 'error');
      }

    } catch (error) {
      this.log(`檢查失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 執行檢查
async function main() {
  const checker = new DependencyChecker();
  await checker.run();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });