#!/usr/bin/env node

// V23 部署前檢查腳本
// 確保所有前置條件都滿足，避免部署失敗

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

// 配置
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const MIN_BNB_BALANCE = ethers.parseEther('0.5'); // 建議最少 0.5 BNB

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 檢查項目結構
class PreDeploymentChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  async runAllChecks() {
    log('\n🔍 V23 部署前檢查', 'bright');
    log('=====================================', 'cyan');
    log(`📅 執行時間: ${new Date().toLocaleString()}`, 'blue');
    log(`📍 工作目錄: ${process.cwd()}\n`, 'blue');

    // 1. 環境變數檢查
    await this.checkEnvironmentVariables();
    
    // 2. 檔案系統檢查
    await this.checkFileSystem();
    
    // 3. 編譯狀態檢查
    await this.checkCompilationStatus();
    
    // 4. 網路連接檢查
    await this.checkNetworkConnection();
    
    // 5. 部署者餘額檢查
    await this.checkDeployerBalance();
    
    // 6. V22 配置檢查
    await this.checkV22Config();
    
    // 7. 固定地址驗證
    await this.checkFixedAddresses();
    
    // 8. 現有部署檢查
    await this.checkExistingDeployments();
    
    // 9. ABI 文件檢查
    await this.checkABIFiles();
    
    // 10. 依賴專案檢查
    await this.checkDependentProjects();
    
    // 顯示結果
    this.displayResults();
  }

  async checkEnvironmentVariables() {
    log('\n1️⃣ 檢查環境變數', 'yellow');
    
    if (!PRIVATE_KEY) {
      this.errors.push('❌ 未設置 DEPLOYER_PRIVATE_KEY 或 PRIVATE_KEY');
    } else {
      // 驗證私鑰格式
      try {
        const wallet = new ethers.Wallet(PRIVATE_KEY.replace('0x', ''));
        this.checks.push(`✅ 私鑰格式正確，地址: ${wallet.address}`);
      } catch (error) {
        this.errors.push('❌ 私鑰格式無效');
      }
    }
    
    if (!process.env.BSCSCAN_API_KEY) {
      this.warnings.push('⚠️  未設置 BSCSCAN_API_KEY，將無法自動驗證合約');
    } else {
      this.checks.push('✅ BSCSCAN_API_KEY 已設置');
    }
  }

  async checkFileSystem() {
    log('\n2️⃣ 檢查檔案系統', 'yellow');
    
    // 檢查必要目錄
    const requiredDirs = [
      'contracts/current',
      'scripts/active',
      'scripts/config',
      'scripts/deployments',
      'artifacts'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        this.checks.push(`✅ 目錄存在: ${dir}`);
      } else {
        if (dir === 'scripts/deployments') {
          // 創建部署目錄
          fs.mkdirSync(dirPath, { recursive: true });
          this.warnings.push(`⚠️  已創建目錄: ${dir}`);
        } else {
          this.errors.push(`❌ 缺少必要目錄: ${dir}`);
        }
      }
    }
    
    // 檢查必要腳本
    const requiredScripts = [
      'scripts/active/deploy-v23-complete.js',
      'scripts/active/v23-copy-abis.js',
      'scripts/active/setup-v23-complete.js',
      'scripts/active/v23-sync-config.js',
      'scripts/active/verify-v23-setup.js'
    ];
    
    for (const script of requiredScripts) {
      const scriptPath = path.join(process.cwd(), script);
      if (fs.existsSync(scriptPath)) {
        this.checks.push(`✅ 腳本存在: ${path.basename(script)}`);
      } else {
        this.errors.push(`❌ 缺少腳本: ${script}`);
      }
    }
  }

  async checkCompilationStatus() {
    log('\n3️⃣ 檢查編譯狀態', 'yellow');
    
    // 檢查必要的編譯產物
    const requiredArtifacts = [
      'artifacts/contracts/current/nft/Hero.sol/Hero.json',
      'artifacts/contracts/current/nft/Relic.sol/Relic.json',
      'artifacts/contracts/current/nft/Party.sol/PartyV3.json',
      'artifacts/contracts/current/core/DungeonCore.sol/DungeonCore.json'
    ];
    
    let missingArtifacts = [];
    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(process.cwd(), artifact);
      if (!fs.existsSync(artifactPath)) {
        missingArtifacts.push(artifact);
      }
    }
    
    if (missingArtifacts.length === 0) {
      this.checks.push('✅ 所有合約已編譯');
      
      // 檢查編譯時間
      const heroArtifact = path.join(process.cwd(), requiredArtifacts[0]);
      const stats = fs.statSync(heroArtifact);
      const compiledTime = new Date(stats.mtime);
      const hoursAgo = (Date.now() - compiledTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursAgo > 24) {
        this.warnings.push(`⚠️  合約編譯已超過 ${Math.round(hoursAgo)} 小時，建議重新編譯`);
      } else {
        this.checks.push(`✅ 合約編譯時間: ${compiledTime.toLocaleString()}`);
      }
    } else {
      this.errors.push('❌ 缺少編譯產物，請執行: npx hardhat compile');
      missingArtifacts.forEach(a => {
        this.errors.push(`   - ${a}`);
      });
    }
  }

  async checkNetworkConnection() {
    log('\n4️⃣ 檢查網路連接', 'yellow');
    
    try {
      const provider = new ethers.JsonRpcProvider(BSC_RPC);
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      
      if (network.chainId === 56n) {
        this.checks.push('✅ 已連接到 BSC 主網');
        this.checks.push(`✅ 當前區塊高度: ${blockNumber}`);
      } else {
        this.errors.push(`❌ 錯誤的網路: chainId=${network.chainId} (預期: 56)`);
      }
    } catch (error) {
      this.errors.push(`❌ 無法連接到 BSC 節點: ${error.message}`);
    }
  }

  async checkDeployerBalance() {
    log('\n5️⃣ 檢查部署者餘額', 'yellow');
    
    if (!PRIVATE_KEY) {
      this.errors.push('❌ 無法檢查餘額：未設置私鑰');
      return;
    }
    
    try {
      const provider = new ethers.JsonRpcProvider(BSC_RPC);
      const deployer = new ethers.Wallet(PRIVATE_KEY.replace('0x', ''), provider);
      const balance = await provider.getBalance(deployer.address);
      
      this.checks.push(`✅ 部署者地址: ${deployer.address}`);
      this.checks.push(`✅ BNB 餘額: ${ethers.formatEther(balance)} BNB`);
      
      if (balance < MIN_BNB_BALANCE) {
        this.errors.push(`❌ BNB 餘額不足 (建議至少 ${ethers.formatEther(MIN_BNB_BALANCE)} BNB)`);
      } else {
        this.checks.push('✅ BNB 餘額充足');
      }
      
      // 檢查 Gas Price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      this.checks.push(`✅ 當前 Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
      
    } catch (error) {
      this.errors.push(`❌ 檢查餘額失敗: ${error.message}`);
    }
  }

  async checkV22Config() {
    log('\n6️⃣ 檢查 V22 配置', 'yellow');
    
    const v22ConfigPath = path.join(process.cwd(), 'config/v22-config.js');
    if (!fs.existsSync(v22ConfigPath)) {
      this.errors.push('❌ 找不到 V22 配置文件');
      this.errors.push('   V23 部署需要 V22 配置中的固定地址');
      return;
    }
    
    try {
      const v22Config = require(v22ConfigPath);
      
      // 檢查必要的固定地址
      const requiredAddresses = ['USD', 'SOULSHARD', 'UNISWAP_POOL', 'DUNGEONMASTERWALLET'];
      const missingAddresses = [];
      
      for (const name of requiredAddresses) {
        if (!v22Config.contracts[name] || !v22Config.contracts[name].address) {
          missingAddresses.push(name);
        }
      }
      
      if (missingAddresses.length === 0) {
        this.checks.push('✅ V22 配置包含所有必要的固定地址');
        this.checks.push(`✅ V22 版本: ${v22Config.version}`);
      } else {
        this.errors.push('❌ V22 配置缺少必要地址:');
        missingAddresses.forEach(addr => {
          this.errors.push(`   - ${addr}`);
        });
      }
      
    } catch (error) {
      this.errors.push(`❌ 無法載入 V22 配置: ${error.message}`);
    }
  }

  async checkFixedAddresses() {
    log('\n7️⃣ 驗證固定地址', 'yellow');
    
    try {
      const v22Config = require(path.join(process.cwd(), 'config/v22-config.js'));
      const provider = new ethers.JsonRpcProvider(BSC_RPC);
      
      // 檢查各個固定地址是否為合約
      const addressesToCheck = [
        { name: 'USD', address: v22Config.contracts.USD.address },
        { name: 'SOULSHARD', address: v22Config.contracts.SOULSHARD.address },
        { name: 'UNISWAP_POOL', address: v22Config.contracts.UNISWAP_POOL.address }
      ];
      
      for (const { name, address } of addressesToCheck) {
        const code = await provider.getCode(address);
        if (code !== '0x') {
          this.checks.push(`✅ ${name} 是有效合約: ${address}`);
        } else {
          this.errors.push(`❌ ${name} 不是合約地址: ${address}`);
        }
      }
      
      // 檢查錢包地址
      const walletAddress = v22Config.contracts.DUNGEONMASTERWALLET.address;
      const walletBalance = await provider.getBalance(walletAddress);
      this.checks.push(`✅ DungeonMasterWallet: ${walletAddress}`);
      this.checks.push(`   餘額: ${ethers.formatEther(walletBalance)} BNB`);
      
    } catch (error) {
      this.warnings.push(`⚠️  無法驗證固定地址: ${error.message}`);
    }
  }

  async checkExistingDeployments() {
    log('\n8️⃣ 檢查現有部署', 'yellow');
    
    // 檢查 V23 配置是否已存在
    const v23ConfigPath = path.join(process.cwd(), 'config/v23-config.js');
    if (fs.existsSync(v23ConfigPath)) {
      this.warnings.push('⚠️  發現現有 V23 配置文件');
      
      try {
        const v23Config = require(v23ConfigPath);
        this.warnings.push(`   版本: ${v23Config.version}`);
        this.warnings.push(`   部署時間: ${v23Config.lastUpdated}`);
        this.warnings.push('   如果要重新部署，部署腳本會覆蓋此配置');
      } catch (error) {
        this.warnings.push('   無法讀取現有配置');
      }
    } else {
      this.checks.push('✅ 沒有發現現有 V23 部署');
    }
    
    // 檢查部署記錄
    const deploymentsDir = path.join(process.cwd(), 'scripts/deployments');
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir);
      const v23Files = files.filter(f => f.includes('v23'));
      
      if (v23Files.length > 0) {
        this.warnings.push(`⚠️  發現 ${v23Files.length} 個 V23 相關部署記錄`);
        v23Files.slice(0, 3).forEach(f => {
          this.warnings.push(`   - ${f}`);
        });
      }
    }
  }

  async checkABIFiles() {
    log('\n9️⃣ 檢查 ABI 文件', 'yellow');
    
    // 檢查需要更新的 ABI
    const abiToCheck = [
      {
        name: 'Hero',
        artifact: 'artifacts/contracts/current/nft/Hero.sol/Hero.json',
        frontendAbi: '../GitHub/DungeonDelvers/src/config/abis/Hero.json',
        subgraphAbi: '../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/Hero.json'
      },
      {
        name: 'Relic',
        artifact: 'artifacts/contracts/current/nft/Relic.sol/Relic.json',
        frontendAbi: '../GitHub/DungeonDelvers/src/config/abis/Relic.json',
        subgraphAbi: '../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/Relic.json'
      }
    ];
    
    for (const { name, artifact, frontendAbi, subgraphAbi } of abiToCheck) {
      const artifactPath = path.join(process.cwd(), artifact);
      
      if (fs.existsSync(artifactPath)) {
        const artifactContent = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const artifactAbiLength = artifactContent.abi.length;
        
        // 檢查前端 ABI
        const frontendPath = path.join(process.cwd(), frontendAbi);
        if (fs.existsSync(frontendPath)) {
          const frontendContent = JSON.parse(fs.readFileSync(frontendPath, 'utf8'));
          const frontendAbiLength = frontendContent.abi.length;
          
          if (artifactAbiLength !== frontendAbiLength) {
            this.warnings.push(`⚠️  ${name} ABI 不同步`);
            this.warnings.push(`   編譯版本: ${artifactAbiLength} 個函數/事件`);
            this.warnings.push(`   前端版本: ${frontendAbiLength} 個函數/事件`);
          } else {
            this.checks.push(`✅ ${name} 前端 ABI 已同步`);
          }
        } else {
          this.warnings.push(`⚠️  ${name} 前端 ABI 不存在`);
        }
      }
    }
  }

  async checkDependentProjects() {
    log('\n🔟 檢查依賴專案', 'yellow');
    
    const projects = [
      { name: '前端', path: '../GitHub/DungeonDelvers' },
      { name: '後端', path: '../dungeon-delvers-metadata-server' },
      { name: '子圖', path: '../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers' }
    ];
    
    for (const { name, path: projectPath } of projects) {
      const fullPath = path.join(process.cwd(), projectPath);
      if (fs.existsSync(fullPath)) {
        this.checks.push(`✅ ${name}專案存在: ${projectPath}`);
      } else {
        this.warnings.push(`⚠️  ${name}專案不存在: ${projectPath}`);
        this.warnings.push(`   部署後需要手動更新配置`);
      }
    }
  }

  displayResults() {
    log('\n\n========== 檢查結果摘要 ==========', 'bright');
    
    log(`\n✅ 通過檢查: ${this.checks.length} 項`, 'green');
    log(`⚠️  警告事項: ${this.warnings.length} 項`, 'yellow');
    log(`❌ 錯誤事項: ${this.errors.length} 項`, 'red');
    
    if (this.warnings.length > 0) {
      log('\n⚠️  警告詳情:', 'yellow');
      this.warnings.forEach(w => log(w, 'yellow'));
    }
    
    if (this.errors.length > 0) {
      log('\n❌ 錯誤詳情:', 'red');
      this.errors.forEach(e => log(e, 'red'));
      
      log('\n🔧 建議修復步驟:', 'cyan');
      log('1. 解決所有錯誤項目', 'cyan');
      log('2. 重新執行此檢查腳本', 'cyan');
      log('3. 確保所有檢查通過後再執行部署', 'cyan');
    } else {
      log('\n✨ 所有關鍵檢查通過！可以執行 V23 部署。', 'green');
      
      log('\n📋 部署步驟提醒:', 'cyan');
      log('1. npx hardhat compile', 'blue');
      log('2. node scripts/active/deploy-v23-complete.js', 'blue');
      log('3. node scripts/active/v23-copy-abis.js', 'blue');
      log('4. node scripts/active/setup-v23-complete-enhanced.js', 'blue');
      log('5. node scripts/active/v23-sync-config.js', 'blue');
      log('6. node scripts/active/verify-v23-setup.js', 'blue');
    }
    
    // 保存檢查結果
    const resultPath = path.join(process.cwd(), 'scripts/deployments', `pre-deployment-check-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      version: 'V23',
      checks: this.checks.length,
      warnings: this.warnings.length,
      errors: this.errors.length,
      details: {
        checks: this.checks,
        warnings: this.warnings,
        errors: this.errors
      }
    }, null, 2));
    
    log(`\n📄 檢查結果已保存: ${resultPath}`, 'blue');
  }
}

// 執行檢查
async function main() {
  const checker = new PreDeploymentChecker();
  await checker.runAllChecks();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PreDeploymentChecker };