#!/usr/bin/env node

/**
 * V24 合約驗證腳本
 * 自動在 BSCScan 上驗證所有已部署的合約
 * 
 * 使用方式：
 * node scripts/active/v24-verify-contracts.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const execAsync = promisify(exec);

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

class V24Verifier {
  constructor() {
    this.configPath = path.join(__dirname, '../../config/v24-config.js');
    this.config = null;
    this.results = [];
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
🔍 V24 合約驗證腳本
==================================================
${colors.reset}`);

    try {
      // 1. 載入配置
      await this.loadConfig();
      
      // 2. 檢查 API Key
      this.checkApiKey();
      
      // 3. 驗證所有合約
      await this.verifyAllContracts();
      
      // 4. 顯示結果
      this.showResults();
      
    } catch (error) {
      this.log(`驗證失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async loadConfig() {
    this.log('載入 V24 配置...', 'info');
    
    if (!fs.existsSync(this.configPath)) {
      throw new Error('找不到 V24 配置文件，請先執行部署腳本');
    }
    
    this.config = require(this.configPath);
    this.log(`已載入配置: ${this.config.contracts ? Object.keys(this.config.contracts).length : 0} 個合約`, 'info');
    
    // 查找驗證數據文件
    const deploymentDir = path.join(__dirname, '../deployments');
    const files = fs.readdirSync(deploymentDir);
    const verificationFile = files
      .filter(f => f.startsWith('v24-verification-'))
      .sort()
      .pop();
    
    if (verificationFile) {
      const verificationPath = path.join(deploymentDir, verificationFile);
      this.verificationData = JSON.parse(fs.readFileSync(verificationPath, 'utf8'));
      this.log(`已載入驗證數據: ${verificationPath}`, 'info');
    }
  }

  checkApiKey() {
    if (!process.env.BSCSCAN_API_KEY) {
      throw new Error('缺少 BSCSCAN_API_KEY 環境變數');
    }
    this.log('BSCScan API Key 已配置', 'info');
  }

  async verifyAllContracts() {
    this.log('\\n開始驗證合約...', 'info');
    
    // 合約驗證順序（簡單到複雜）
    const verifyOrder = [
      'ORACLE',
      'SOULSHARD',
      'DUNGEONCORE',
      'DUNGEONSTORAGE',
      'DUNGEONMASTER',
      'PLAYERVAULT',
      'HERO',
      'RELIC',
      'PARTY',
      'VIPSTAKING',
      'PLAYERPROFILE',
      'ALTAROFASCENSION'
    ];
    
    for (const contractName of verifyOrder) {
      if (this.config.contracts[contractName]) {
        await this.verifyContract(contractName);
        // 延遲避免 API 限制
        await this.delay(5000);
      }
    }
  }

  async verifyContract(contractName) {
    this.log(`\\n驗證 ${contractName}...`, 'info');
    
    const contractInfo = this.config.contracts[contractName];
    const verificationInfo = this.verificationData?.find(v => v.name === contractName);
    
    if (!verificationInfo) {
      this.log(`找不到 ${contractName} 的驗證數據`, 'warning');
      return;
    }
    
    // 構建驗證命令
    const args = verificationInfo.constructorArgs.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('0x')) {
        return arg;
      }
      return `"${arg}"`;
    }).join(' ');
    
    const command = `npx hardhat verify --network bsc ${contractInfo.address} ${args}`;
    
    this.log(`執行命令: ${command}`, 'info');
    
    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout.includes('Successfully verified') || stdout.includes('Already Verified')) {
        this.log(`✅ ${contractName} 驗證成功`, 'success');
        this.results.push({ name: contractName, status: 'success', message: '驗證成功' });
      } else {
        this.log(`⚠️ ${contractName} 驗證結果不確定`, 'warning');
        this.results.push({ name: contractName, status: 'warning', message: stdout });
      }
      
    } catch (error) {
      // 檢查是否已經驗證
      if (error.message.includes('Already Verified')) {
        this.log(`✅ ${contractName} 已經驗證`, 'success');
        this.results.push({ name: contractName, status: 'success', message: '已經驗證' });
      } else {
        this.log(`❌ ${contractName} 驗證失敗: ${error.message}`, 'error');
        this.results.push({ name: contractName, status: 'error', message: error.message });
      }
    }
  }

  showResults() {
    console.log(`\\n${colors.bright}驗證結果摘要:${colors.reset}`);
    
    const success = this.results.filter(r => r.status === 'success').length;
    const warning = this.results.filter(r => r.status === 'warning').length;
    const error = this.results.filter(r => r.status === 'error').length;
    
    console.log(`✅ 成功: ${success}`);
    console.log(`⚠️ 警告: ${warning}`);
    console.log(`❌ 失敗: ${error}`);
    
    // 顯示失敗的合約
    const failed = this.results.filter(r => r.status === 'error');
    if (failed.length > 0) {
      console.log(`\\n${colors.red}失敗的合約:${colors.reset}`);
      failed.forEach(f => {
        console.log(`- ${f.name}: ${f.message}`);
      });
    }
    
    // 保存結果
    const resultPath = path.join(__dirname, '../deployments', `v24-verification-result-${Date.now()}.json`);
    fs.writeFileSync(resultPath, JSON.stringify(this.results, null, 2));
    this.log(`\\n驗證結果已保存: ${resultPath}`, 'info');
    
    // 如果有合約需要手動驗證
    if (error > 0) {
      console.log(`\\n${colors.yellow}手動驗證指南:${colors.reset}`);
      console.log('1. 訪問 https://bscscan.com/verifyContract');
      console.log('2. 選擇對應的合約版本和優化設置');
      console.log('3. 使用 flatten 後的合約代碼');
      console.log('4. 構造函數參數可在驗證數據文件中找到');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 執行驗證
if (require.main === module) {
  const verifier = new V24Verifier();
  verifier.verify().catch(console.error);
}

module.exports = V24Verifier;