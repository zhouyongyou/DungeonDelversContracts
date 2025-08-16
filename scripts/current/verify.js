#!/usr/bin/env node

/**
 * V26 VRF 合約驗證腳本
 * 
 * 自動驗證所有已部署的 VRF 合約
 * 支援批量驗證和錯誤重試
 * 
 * 使用方式：
 * node scripts/active/v26-verify-contracts-vrf.js
 * node scripts/active/v26-verify-contracts-vrf.js --only HERO,RELIC
 * node scripts/active/v26-verify-contracts-vrf.js --testnet
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m'
};

class V26VRFVerifier {
  constructor() {
    this.v26Config = null;
    this.verificationData = null;
    this.onlyContracts = this.parseOnlyContracts();
    this.useTestnet = process.argv.includes('--testnet');
    this.network = this.useTestnet ? 'bsc_testnet' : 'bsc';
    this.results = {
      success: [],
      failed: [],
      skipped: []
    };
  }

  parseOnlyContracts() {
    const onlyIndex = process.argv.indexOf('--only');
    if (onlyIndex !== -1 && process.argv[onlyIndex + 1]) {
      return process.argv[onlyIndex + 1].split(',');
    }
    return null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
      warning: `${colors.yellow}[WARNING]${colors.reset}`,
      vrf: `${colors.purple}[VRF]${colors.reset}`
    };
    console.log(`${prefix[type]} ${timestamp} ${message}`);
  }

  async verify() {
    console.log(`${colors.bright}
==================================================
🔮 V26 VRF 合約驗證腳本
==================================================
${colors.reset}`);

    try {
      // 載入配置
      await this.loadConfigs();
      
      // 檢查 API Key
      this.checkApiKey();
      
      // 執行驗證
      await this.verifyContracts();
      
      // 生成報告
      await this.generateReport();
      
      // 顯示結果
      this.showResults();
      
    } catch (error) {
      this.log(`驗證失敗: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }

  async loadConfigs() {
    this.log('載入 VRF 配置...', 'info');
    
    // 載入 V26 VRF 配置
    const configPath = path.join(__dirname, '../../config/v26-vrf-config.js');
    if (!fs.existsSync(configPath)) {
      throw new Error('V26 VRF 配置文件不存在');
    }
    this.v26Config = require(configPath);
    this.log(`已載入配置: ${Object.keys(this.v26Config.contracts).length} 個合約`, 'info');
    
    // 載入驗證數據
    const deploymentsDir = path.join(__dirname, '../deployments');
    const verificationFiles = fs.readdirSync(deploymentsDir)
      .filter(f => f.startsWith('v26-vrf-verification-'))
      .sort()
      .reverse();
    
    if (verificationFiles.length > 0) {
      const latestVerificationFile = path.join(deploymentsDir, verificationFiles[0]);
      const verificationContent = JSON.parse(fs.readFileSync(latestVerificationFile, 'utf8'));
      this.verificationData = verificationContent.verificationData || [];
      this.log(`已載入驗證數據: ${latestVerificationFile}`, 'info');
    } else {
      this.log('找不到驗證數據文件，將使用預設參數', 'warning');
      this.verificationData = [];
    }
  }

  checkApiKey() {
    if (!process.env.BSCSCAN_API_KEY) {
      throw new Error('BSCSCAN_API_KEY 環境變數未設置');
    }
    this.log('BSCScan API Key 已配置', 'info');
  }

  async verifyContracts() {
    this.log('\n開始驗證 VRF 合約...', 'vrf');
    
    // 構建驗證列表
    const contractsToVerify = this.buildVerificationList();
    
    // 執行驗證
    for (const contract of contractsToVerify) {
      await this.verifyContract(contract);
    }
  }

  buildVerificationList() {
    const list = [];
    
    // 從配置中獲取所有合約
    for (const [name, data] of Object.entries(this.v26Config.contracts)) {
      // 檢查是否只驗證特定合約
      if (this.onlyContracts && !this.onlyContracts.includes(name)) {
        this.results.skipped.push(name);
        continue;
      }
      
      // 查找驗證數據
      const verifyData = this.verificationData.find(v => v.name === name);
      
      // 確定合約名稱和構造參數
      let contractName = data.contractName || verifyData?.contractName || name;
      let constructorArgs = verifyData?.constructorArgs || [];
      
      // VRF 合約特殊處理
      if (name.includes('_UnifiedVRF')) {
        contractName = name; // 使用完整名稱
        
        // VRF 合約構造參數
        if (['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION'].includes(name.replace('_UnifiedVRF', ''))) {
          // 這些 VRF 合約需要 VRF 配置參數
          const vrfConfig = this.v26Config.vrfConfig;
          if (vrfConfig) {
            // 根據不同的 VRF 合約設置參數
            if (name === 'HERO_UnifiedVRF' || name === 'RELIC_UnifiedVRF') {
              constructorArgs = [
                vrfConfig.wrapperAddress,
                vrfConfig.linkToken
              ];
            } else if (name === 'DUNGEONMASTER_UnifiedVRF') {
              constructorArgs = [
                vrfConfig.wrapperAddress,
                vrfConfig.linkToken,
                this.v26Config.contracts.DUNGEONSTORAGE?.address || '0x0000000000000000000000000000000000000000'
              ];
            } else if (name === 'ALTAROFASCENSION_UnifiedVRF') {
              constructorArgs = [
                vrfConfig.wrapperAddress,
                vrfConfig.linkToken
              ];
            }
          }
        }
      }
      
      list.push({
        name,
        address: data.address,
        contractName,
        constructorArgs,
        isVRF: name.includes('_UnifiedVRF')
      });
    }
    
    return list;
  }

  async verifyContract(contract) {
    this.log(`\n驗證 ${contract.name}...`, contract.isVRF ? 'vrf' : 'info');
    
    try {
      // 構建驗證命令
      let command = `npx hardhat verify --network ${this.network}`;
      
      // 添加合約名稱（如果需要）
      if (contract.contractName && contract.contractName !== contract.name) {
        command += ` --contract contracts/current/${contract.isVRF ? 'VRF/' : ''}${contract.contractName}.sol:${contract.contractName}`;
      }
      
      // 添加地址
      command += ` ${contract.address}`;
      
      // 添加構造參數
      if (contract.constructorArgs.length > 0) {
        const args = contract.constructorArgs.map(arg => {
          // 處理不同類型的參數
          if (typeof arg === 'string' && arg.startsWith('0x')) {
            return `"${arg}"`; // 地址參數需要引號
          } else if (typeof arg === 'object' && arg._isBigNumber) {
            return arg.toString(); // BigNumber
          } else if (typeof arg === 'boolean') {
            return arg.toString(); // 布爾值
          } else {
            return `"${String(arg)}"`; // 其他參數
          }
        }).join(' ');
        
        command += ` ${args}`;
      }
      
      this.log(`執行命令: ${command}`, 'info');
      
      // 執行驗證
      const output = execSync(command, {
        cwd: path.join(__dirname, '../..'),
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (output.includes('Successfully verified') || output.includes('Already Verified')) {
        this.log(`✅ ${contract.name} 驗證成功`, 'success');
        this.results.success.push(contract.name);
      } else {
        throw new Error('驗證結果不明確');
      }
      
    } catch (error) {
      const errorMessage = error.message || error.toString();
      
      if (errorMessage.includes('Already Verified')) {
        this.log(`⚠️ ${contract.name} 已經驗證過`, 'warning');
        this.results.success.push(contract.name);
      } else if (errorMessage.includes('does not have bytecode')) {
        this.log(`❌ ${contract.name} 合約未部署或地址錯誤`, 'error');
        this.results.failed.push({ name: contract.name, error: '合約未部署' });
      } else if (errorMessage.includes('Contract source code already verified')) {
        this.log(`⚠️ ${contract.name} 原始碼已驗證`, 'warning');
        this.results.success.push(contract.name);
      } else {
        this.log(`❌ ${contract.name} 驗證失敗: ${errorMessage.substring(0, 200)}`, 'error');
        this.results.failed.push({ name: contract.name, error: errorMessage.substring(0, 200) });
      }
    }
    
    // 防止 API 限制
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  async generateReport() {
    const reportPath = path.join(__dirname, '../deployments', `v26-vrf-verification-report-${Date.now()}.json`);
    
    const report = {
      version: 'V26-VRF',
      timestamp: new Date().toISOString(),
      network: this.network,
      results: this.results,
      contracts: this.v26Config.contracts,
      vrfConfig: this.v26Config.vrfConfig
    };
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n驗證報告已保存: ${reportPath}`, 'info');
  }

  showResults() {
    console.log(`\n${colors.bright}驗證結果總結:${colors.reset}`);
    console.log(`✅ 成功: ${this.results.success.length}`);
    console.log(`❌ 失敗: ${this.results.failed.length}`);
    console.log(`⏭️  跳過: ${this.results.skipped.length}`);
    
    if (this.results.failed.length > 0) {
      console.log(`\n${colors.bright}失敗的合約:${colors.reset}`);
      for (const fail of this.results.failed) {
        console.log(`- ${fail.name}: ${fail.error}`);
      }
      
      console.log(`\n${colors.bright}重試失敗的合約:${colors.reset}`);
      const failedNames = this.results.failed.map(f => f.name).join(',');
      console.log(`node scripts/active/v26-verify-contracts-vrf.js --only ${failedNames}`);
    }
    
    // VRF 特定提示
    console.log(`\n${colors.purple}🔮 VRF 合約驗證提示:${colors.reset}`);
    console.log('1. VRF 合約使用 Direct Funding 模式');
    console.log('2. 確保構造參數包含正確的 VRF Wrapper 和 LINK Token 地址');
    console.log('3. 驗證後可在 BSCScan 查看合約原始碼和 VRF 配置');
    
    if (this.results.success.length === Object.keys(this.v26Config.contracts).length) {
      this.log('\n🎉 所有 VRF 合約驗證成功！', 'success');
    }
  }
}

// 執行驗證
async function main() {
  const verifier = new V26VRFVerifier();
  await verifier.verify();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });