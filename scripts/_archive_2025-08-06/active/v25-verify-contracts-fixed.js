const { exec } = require('child_process');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// V25 正確的合約地址（今天部署的）
const V25_CONTRACTS = {
  // 核心合約
  ORACLE: {
    address: "0xdbf49cd5708C56b8b0848233b754b418806D7018",
    name: "Oracle_V22_Adaptive",
    args: ["0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82", "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF", "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"]
  },
  DUNGEONCORE: {
    address: "0x2953ed03825b40e9c1EBa1cAe5FBD47f20A4823d",
    name: "DungeonCore",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647", "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE", "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"]
  },
  // 遊戲機制合約
  PLAYERVAULT: {
    address: "0x7085b353f553225B6001Ba23ECCb39611fBa31Bf",
    name: "PlayerVault",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  PLAYERPROFILE: {
    address: "0x481ABDF19E41Bf2cE84075174675626aa027fE82",
    name: "PlayerProfile",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  VIPSTAKING: {
    address: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    name: "VIPStaking",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  DUNGEONSTORAGE: {
    address: "0x22bbcF5411c991A5DE7774Ace435DcBF69EF0a8a",
    name: "DungeonStorage",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  DUNGEONMASTER: {
    address: "0x9e17c01A610618223d49D64E322DC1b6360E4E8D",
    name: "DungeonMasterV2_Fixed",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  ALTAROFASCENSION: {
    address: "0xB102a57eD4697f7A721541fd7B0bba8D6bdF63a5",
    name: "AltarOfAscensionV2Fixed",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  // NFT 合約
  HERO: {
    address: "0x001b7462B0f1Ab832c017a6f09133932Be140b18",
    name: "Hero",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  RELIC: {
    address: "0xdd8E52cD1d248D04C306c038780315a03866B402",
    name: "Relic",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  PARTY: {
    address: "0x382024850E08AB37E290315fc5f3692b8D6646EB",
    name: "PartyV3",
    args: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  }
};

class V25Verifier {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    
    if (type === 'success') {
      console.log(chalk.green(`[SUCCESS] ${timestamp} ${message}`));
    } else if (type === 'error') {
      console.log(chalk.red(`[ERROR] ${timestamp} ${message}`));
    } else if (type === 'warning') {
      console.log(chalk.yellow(`[WARNING] ${timestamp} ${message}`));
    } else {
      console.log(chalk.blue(`[INFO] ${timestamp} ${message}`));
    }
  }

  async verifyContract(name, config) {
    this.log(`\n驗證 ${name}...`);
    
    try {
      // 構建驗證命令
      let command = `npx hardhat verify --network bsc ${config.address}`;
      
      // 如果有構造參數，添加它們
      if (config.args && config.args.length > 0) {
        const argsStr = config.args.map(arg => `"${arg}"`).join(' ');
        command += ` ${argsStr}`;
      }
      
      // 如果是特殊合約，需要指定合約名稱
      if (config.contract) {
        command += ` --contract ${config.contract}`;
      }
      
      this.log(`執行命令: ${command}`);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.log(`⏰ ${name} 驗證超時（60秒），標記為需要手動檢查`, 'warning');
          this.results.push({ name, status: 'timeout', note: '需要手動檢查 BSCScan' });
          resolve(false);
        }, 60000); // 60秒超時
        
        exec(command, { 
          maxBuffer: 10 * 1024 * 1024,
          timeout: 55000 // 55秒內部超時
        }, (error, stdout, stderr) => {
          clearTimeout(timeout);
          if (error) {
            // 檢查是否已經驗證
            if (stdout.includes('already verified') || stderr.includes('already verified')) {
              this.log(`✅ ${name} 已經驗證過了`, 'success');
              this.results.push({ name, status: 'already_verified' });
              resolve(true);
            } else {
              this.log(`❌ ${name} 驗證失敗: ${error.message}`, 'error');
              this.log(`輸出: ${stdout}`, 'warning');
              if (stderr) this.log(`錯誤: ${stderr}`, 'error');
              this.results.push({ name, status: 'failed', error: error.message });
              resolve(false);
            }
          } else {
            // 檢查輸出確認是否成功
            if (stdout.includes('Successfully verified') || stdout.includes('successfully verified')) {
              this.log(`✅ ${name} 驗證成功`, 'success');
              this.results.push({ name, status: 'success' });
              resolve(true);
            } else if (stdout.includes('already verified')) {
              this.log(`✅ ${name} 已經驗證過了`, 'success');
              this.results.push({ name, status: 'already_verified' });
              resolve(true);
            } else {
              this.log(`⚠️ ${name} 驗證結果不明確`, 'warning');
              this.log(`輸出: ${stdout}`, 'warning');
              this.results.push({ name, status: 'unclear', output: stdout });
              resolve(false);
            }
          }
        });
      });
      
    } catch (error) {
      this.log(`❌ ${name} 驗證異常: ${error.message}`, 'error');
      this.results.push({ name, status: 'error', error: error.message });
      return false;
    }
  }

  async run() {
    console.log(chalk.cyan('\n=================================================='));
    console.log(chalk.cyan('🔍 V25 合約驗證腳本（正確地址版）'));
    console.log(chalk.cyan('==================================================\n'));
    
    this.log('開始驗證 V25 合約...');
    
    // 按順序驗證
    for (const [name, config] of Object.entries(V25_CONTRACTS)) {
      await this.verifyContract(name, config);
      
      // 避免 API 限制，稍微延遲
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 顯示總結
    this.showSummary();
    
    // 保存報告
    await this.saveReport();
  }

  showSummary() {
    console.log(chalk.cyan('\n=================================================='));
    console.log(chalk.cyan('📊 驗證總結'));
    console.log(chalk.cyan('==================================================\n'));
    
    const success = this.results.filter(r => r.status === 'success').length;
    const already = this.results.filter(r => r.status === 'already_verified').length;
    const timeout = this.results.filter(r => r.status === 'timeout').length;
    const failed = this.results.filter(r => r.status === 'failed' || r.status === 'unclear' || r.status === 'error').length;
    
    console.log(chalk.green(`✅ 新驗證成功: ${success}`));
    console.log(chalk.green(`✅ 已經驗證: ${already}`));
    console.log(chalk.yellow(`⏰ 超時需檢查: ${timeout}`));
    console.log(chalk.red(`❌ 驗證失敗: ${failed}`));
    
    if (failed > 0) {
      console.log(chalk.yellow('\n失敗的合約:'));
      this.results
        .filter(r => r.status === 'failed' || r.status === 'unclear' || r.status === 'error')
        .forEach(r => {
          console.log(`- ${r.name}: ${r.error || r.status}`);
        });
    }
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(chalk.cyan(`\n總耗時: ${duration} 秒`));
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      version: 'V25',
      contracts: V25_CONTRACTS,
      results: this.results,
      summary: {
        total: this.results.length,
        success: this.results.filter(r => r.status === 'success').length,
        already_verified: this.results.filter(r => r.status === 'already_verified').length,
        failed: this.results.filter(r => r.status === 'failed' || r.status === 'unclear' || r.status === 'error').length
      }
    };
    
    const reportPath = path.join(__dirname, '../deployments', `v25-verification-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n驗證報告已保存: ${reportPath}`);
  }
}

async function main() {
  // 檢查 API Key
  if (!process.env.BSCSCAN_API_KEY) {
    console.error(chalk.red('❌ 錯誤：未設置 BSCSCAN_API_KEY'));
    process.exit(1);
  }
  
  const verifier = new V25Verifier();
  await verifier.run();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });