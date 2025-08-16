#!/usr/bin/env node

/**
 * V25 合約依賴修復腳本
 * 
 * 修復所有合約間的依賴設置問題
 * 基於 Hero/Relic 合約 dungeonCore 未設置的發現
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-fix-contract-dependencies.js --network bsc
 */

const hre = require("hardhat");

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

// V25 合約地址 (從配置文件載入)
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

// 合約名稱映射到文件名
const CONTRACT_FILES = {
  HERO: 'Hero',
  RELIC: 'Relic',
  PARTY: 'Party',
  DUNGEONCORE: 'DungeonCore',
  DUNGEONMASTER: 'DungeonMasterV2_Fixed',
  PLAYERVAULT: 'PlayerVault',
  PLAYERPROFILE: 'PlayerProfile',
  VIPSTAKING: 'VIPStaking',
  ALTAROFASCENSION: 'AltarOfAscensionV2Fixed',
  SOULSHARD: 'Test_SoulShard'
};

class DependencyFixer {
  constructor() {
    this.contracts = {};
    this.results = [];
    this.errors = [];
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

  async loadContracts() {
    this.log('載入合約實例...', 'info');
    
    for (const [name, address] of Object.entries(V25_ADDRESSES)) {
      try {
        const contractFile = CONTRACT_FILES[name];
        if (!contractFile) {
          this.log(`⚠️ 找不到 ${name} 的合約文件映射`, 'warning');
          continue;
        }
        
        const ContractFactory = await hre.ethers.getContractFactory(contractFile);
        const contract = ContractFactory.attach(address);
        
        this.contracts[name] = contract;
        this.log(`✅ ${name} 載入成功 (${address})`, 'success');
        
      } catch (error) {
        this.log(`❌ ${name} 載入失敗: ${error.message}`, 'error');
        this.errors.push({ type: '合約載入', name, error });
      }
    }
  }

  async checkCurrentState() {
    this.log('\n檢查當前依賴狀態...', 'info');
    
    const checks = [
      // Hero 合約檢查
      {
        contract: 'HERO',
        dependencies: [
          { name: 'dungeonCore', expected: V25_ADDRESSES.DUNGEONCORE },
          { name: 'soulShardToken', expected: V25_ADDRESSES.SOULSHARD },
          { name: 'ascensionAltarAddress', expected: V25_ADDRESSES.ALTAROFASCENSION }
        ]
      },
      // Relic 合約檢查
      {
        contract: 'RELIC',
        dependencies: [
          { name: 'dungeonCore', expected: V25_ADDRESSES.DUNGEONCORE },
          { name: 'soulShardToken', expected: V25_ADDRESSES.SOULSHARD },
          { name: 'ascensionAltarAddress', expected: V25_ADDRESSES.ALTAROFASCENSION }
        ]
      },
      // Party 合約檢查
      {
        contract: 'PARTY',
        dependencies: [
          { name: 'dungeonCore', expected: V25_ADDRESSES.DUNGEONCORE },
          { name: 'heroContract', expected: V25_ADDRESSES.HERO },
          { name: 'relicContract', expected: V25_ADDRESSES.RELIC }
        ]
      }
    ];

    for (const check of checks) {
      this.log(`\n檢查 ${check.contract} 合約依賴:`, 'info');
      const contract = this.contracts[check.contract];
      
      if (!contract) {
        this.log(`❌ ${check.contract} 合約未載入`, 'error');
        continue;
      }

      for (const dep of check.dependencies) {
        try {
          // 特殊處理：某些合約可能使用 public 變量而非函數
          let current;
          try {
            // 嘗試作為函數調用
            current = await contract[dep.name]();
          } catch (e) {
            // 如果失敗，嘗試直接讀取
            current = await contract[dep.name];
          }
          
          const isCorrect = current && current.toLowerCase() === dep.expected.toLowerCase();
          
          if (isCorrect) {
            this.log(`✅ ${check.contract}.${dep.name} 已正確設置`, 'success');
          } else {
            this.log(`❌ ${check.contract}.${dep.name} 設置錯誤`, 'error');
            this.log(`   當前: ${current || '0x0000000000000000000000000000000000000000'}`, 'error');
            this.log(`   期望: ${dep.expected}`, 'error');
            
            // 記錄需要修復的項目
            this.results.push({
              contract: check.contract,
              dependency: dep.name,
              current: current || '0x0000000000000000000000000000000000000000',
              expected: dep.expected,
              needsFix: true
            });
          }
        } catch (error) {
          this.log(`❌ ${check.contract}.${dep.name} 讀取失敗: ${error.message}`, 'error');
          // 仍然嘗試修復
          this.results.push({
            contract: check.contract,
            dependency: dep.name,
            current: '0x0000000000000000000000000000000000000000',
            expected: dep.expected,
            needsFix: true
          });
        }
      }
    }
  }

  async fixDependencies() {
    this.log('\n開始修復依賴...', 'info');
    
    const itemsToFix = this.results.filter(item => item.needsFix);
    
    if (itemsToFix.length === 0) {
      this.log('✅ 所有依賴都已正確設置，無需修復', 'success');
      return;
    }

    this.log(`發現 ${itemsToFix.length} 個需要修復的依賴`, 'info');

    for (const item of itemsToFix) {
      await this.fixSingleDependency(item);
    }
  }

  async fixSingleDependency(item) {
    this.log(`\n修復 ${item.contract}.${item.dependency}...`, 'info');
    
    const contract = this.contracts[item.contract];
    if (!contract) {
      this.log(`❌ 找不到 ${item.contract} 合約`, 'error');
      return;
    }

    try {
      // 構造函數名 (例如: setDungeonCore, setSoulShardToken)
      const functionName = `set${item.dependency.charAt(0).toUpperCase() + item.dependency.slice(1)}`;
      
      // 特殊處理一些函數名
      const specialNames = {
        'ascensionAltarAddress': 'setAscensionAltarAddress',
        'heroContract': 'setHeroContract',
        'relicContract': 'setRelicContract'
      };
      
      const actualFunctionName = specialNames[item.dependency] || functionName;
      
      // 檢查函數是否存在
      if (typeof contract[actualFunctionName] !== 'function') {
        this.log(`❌ ${item.contract} 沒有 ${actualFunctionName} 函數`, 'error');
        return;
      }

      // 執行設置
      this.log(`調用 ${item.contract}.${actualFunctionName}(${item.expected})`, 'info');
      const tx = await contract[actualFunctionName](item.expected);
      await tx.wait();
      
      // 驗證設置是否成功
      const newValue = await contract[item.dependency]();
      if (newValue.toLowerCase() === item.expected.toLowerCase()) {
        this.log(`✅ ${item.contract}.${item.dependency} 修復成功`, 'success');
      } else {
        this.log(`❌ ${item.contract}.${item.dependency} 修復後驗證失敗`, 'error');
        this.log(`   設置後的值: ${newValue}`, 'error');
      }
      
    } catch (error) {
      this.log(`❌ ${item.contract}.${item.dependency} 修復失敗: ${error.message}`, 'error');
      this.errors.push({ type: '依賴修復', item, error });
    }
  }

  async generateReport() {
    const fixedCount = this.results.filter(item => item.needsFix).length;
    const errorCount = this.errors.length;
    
    this.log(`\n修復報告:`, 'info');
    this.log(`- 需要修復的項目: ${fixedCount}`, 'info');
    this.log(`- 錯誤數量: ${errorCount}`, 'info');
    
    if (errorCount > 0) {
      this.log('\n錯誤詳情:', 'error');
      for (const error of this.errors) {
        this.log(`- ${error.type}: ${error.error?.message || '未知錯誤'}`, 'error');
      }
    }
  }

  async run() {
    console.log(`${colors.bright}
==================================================
🔧 V25 合約依賴修復腳本
==================================================
${colors.reset}`);

    try {
      // 1. 檢查網路
      const network = await hre.ethers.provider.getNetwork();
      if (network.chainId !== 56n) {
        throw new Error(`錯誤的網路 (期望 BSC Mainnet 56, 實際 ${network.chainId})`);
      }

      // 2. 載入合約
      await this.loadContracts();

      // 3. 檢查當前狀態
      await this.checkCurrentState();

      // 4. 修復依賴
      await this.fixDependencies();

      // 5. 生成報告
      await this.generateReport();

      this.log('\n✅ 依賴修復完成！', 'success');

    } catch (error) {
      this.log(`修復失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 執行修復
async function main() {
  const fixer = new DependencyFixer();
  await fixer.run();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });