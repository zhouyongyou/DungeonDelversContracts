#!/usr/bin/env node

/**
 * V25 合約連接修復腳本
 * 
 * 修復 DungeonMaster 缺少的 DungeonCore 連接
 * 
 * 使用方式：
 * node scripts/active/v25-fix-connections.js
 */

const hre = require("hardhat");
const path = require('path');
const fs = require('fs');

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

class V25ConnectionFixer {
  constructor() {
    this.deployer = null;
    this.config = null;
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

  async loadConfig() {
    this.log('載入 V25 配置...', 'info');
    
    const configPath = path.join(__dirname, '../../config/v25-config.js');
    if (!fs.existsSync(configPath)) {
      throw new Error('V25 配置文件不存在');
    }
    
    this.config = require(configPath);
    this.log(`已載入配置，包含 ${Object.keys(this.config.contracts).length} 個合約`, 'info');
  }

  async checkConnections() {
    this.log('\n檢查合約連接狀態...', 'info');
    
    // 檢查 DungeonMaster 的連接
    const dungeonMaster = await hre.ethers.getContractAt(
      'DungeonMasterV2_Fixed',
      this.config.contracts.DUNGEONMASTER.address
    );
    
    // 檢查 soulShardToken
    const soulShardToken = await dungeonMaster.soulShardToken();
    this.log(`SoulShard Token: ${soulShardToken}`, 'info');
    if (soulShardToken === '0x0000000000000000000000000000000000000000') {
      this.log('❌ SoulShard Token 未設置', 'error');
    } else {
      this.log('✅ SoulShard Token 已設置', 'success');
    }
    
    // 檢查 dungeonCore
    const dungeonCore = await dungeonMaster.dungeonCore();
    this.log(`DungeonCore: ${dungeonCore}`, 'info');
    if (dungeonCore === '0x0000000000000000000000000000000000000000') {
      this.log('❌ DungeonCore 未設置', 'error');
      return false;
    } else {
      this.log('✅ DungeonCore 已設置', 'success');
      return true;
    }
  }

  async fixConnections() {
    this.log('\n修復合約連接...', 'info');
    
    const dungeonMaster = await hre.ethers.getContractAt(
      'DungeonMasterV2_Fixed',
      this.config.contracts.DUNGEONMASTER.address,
      this.deployer
    );
    
    // 設置 DungeonCore
    try {
      this.log('設置 DungeonMaster.setDungeonCore...', 'info');
      const tx = await dungeonMaster.setDungeonCore(this.config.contracts.DUNGEONCORE.address);
      await tx.wait();
      this.log('✅ DungeonMaster.setDungeonCore 成功', 'success');
    } catch (error) {
      this.log(`❌ DungeonMaster.setDungeonCore 失敗: ${error.message}`, 'error');
    }
  }

  async verifyFix() {
    this.log('\n驗證修復結果...', 'info');
    
    const isFixed = await this.checkConnections();
    if (isFixed) {
      this.log('\n✅ 所有連接已正確設置！', 'success');
    } else {
      this.log('\n❌ 仍有連接問題需要修復', 'error');
    }
  }

  async run() {
    console.log(`${colors.bright}
==================================================
🔧 V25 合約連接修復腳本
==================================================
${colors.reset}`);

    try {
      // 載入配置
      await this.loadConfig();
      
      // 獲取部署者賬戶
      const signers = await hre.ethers.getSigners();
      this.deployer = signers[0];
      this.log(`部署者地址: ${this.deployer.address}`, 'info');
      
      // 檢查當前連接狀態
      const needsFix = !(await this.checkConnections());
      
      if (needsFix) {
        // 修復連接
        await this.fixConnections();
        
        // 驗證修復
        await this.verifyFix();
      } else {
        this.log('\n✅ 所有連接已正確設置，無需修復！', 'success');
      }
      
      this.log('\n修復腳本執行完成', 'success');
      
    } catch (error) {
      this.log(`修復失敗: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// 執行修復
async function main() {
  const fixer = new V25ConnectionFixer();
  await fixer.run();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });