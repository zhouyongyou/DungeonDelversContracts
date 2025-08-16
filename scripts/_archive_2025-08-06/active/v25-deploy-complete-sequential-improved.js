const hre = require("hardhat");
const { ethers } = hre;
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// ======================== 超時和監控工具 ========================

// 1. 超時包裝器 - 防止卡住
async function executeWithTimeout(promise, timeoutMs = 15000, description = '交易') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${description} 超時 (${timeoutMs/1000}秒)`)), timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } catch (error) {
    if (error.message.includes('超時')) {
      console.log(chalk.red(`\n⏱️ ${description} 執行超時！`));
      console.log(chalk.yellow('可能原因：網路擁塞或 Gas Price 太低'));
    }
    throw error;
  }
}

// 2. 心跳監測 - 顯示腳本還活著
class HeartbeatMonitor {
  constructor(intervalMs = 5000) {
    this.intervalMs = intervalMs;
    this.lastActivity = Date.now();
    this.timer = null;
    this.currentTask = '';
  }
  
  start() {
    this.timer = setInterval(() => {
      console.log(chalk.gray(`💓 ${new Date().toLocaleTimeString()} - ${this.currentTask || '運行中...'}`));
    }, this.intervalMs);
  }
  
  setCurrentTask(task) {
    this.currentTask = task;
    this.lastActivity = Date.now();
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// 3. 進度追蹤器 - 記錄每步耗時
class ProgressTracker {
  constructor() {
    this.steps = [];
    this.currentStep = null;
    this.startTime = Date.now();
  }
  
  startStep(name) {
    if (this.currentStep) {
      this.completeStep();
    }
    this.currentStep = {
      name,
      startTime: Date.now()
    };
    console.log(chalk.blue(`\n▶️ 開始: ${name}`));
  }
  
  completeStep(success = true) {
    if (!this.currentStep) return;
    
    const duration = (Date.now() - this.currentStep.startTime) / 1000;
    this.steps.push({
      ...this.currentStep,
      duration,
      success
    });
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} 完成: ${this.currentStep.name} (${duration}秒)`);
    this.currentStep = null;
  }
  
  printSummary() {
    const totalDuration = (Date.now() - this.startTime) / 1000;
    console.log(chalk.cyan(`\n📊 總耗時: ${totalDuration}秒`));
  }
}

// ======================== 遊戲參數 ========================
const GAME_PARAMS = {
  dungeons: [
    { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
    { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 84 },
    { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 79 },
    { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 33, successRate: 74 },
    { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 52, successRate: 69 },
    { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 78, successRate: 64 },
    { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 113, successRate: 59 },
    { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 156, successRate: 54 },
    { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 209, successRate: 49 },
    { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 44 },
    { id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 320, successRate: 39 },
    { id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 450, successRate: 34 }
  ],
  baseURIs: {
    HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
    RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
    PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
    VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
    PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/'
  },
  partyCreationFee: '0.001',
  vipUnstakeCooldown: 86400
};

// ======================== 主部署類（改進版） ========================
class V25ImprovedDeployer {
  constructor() {
    this.contracts = {};
    this.signer = null;
    this.heartbeat = new HeartbeatMonitor();
    this.tracker = new ProgressTracker();
    this.errors = [];
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

  async initialize() {
    this.tracker.startStep('初始化');
    
    [this.signer] = await ethers.getSigners();
    const address = await this.signer.getAddress();
    this.log(`部署錢包: ${address}`);
    
    const balance = await ethers.provider.getBalance(address);
    this.log(`錢包餘額: ${ethers.formatEther(balance)} BNB`);
    
    this.tracker.completeStep();
  }

  // 改進的合約部署 - 加入超時
  async deployContract(name, contractName, args = []) {
    this.tracker.startStep(`部署 ${name}`);
    this.heartbeat.setCurrentTask(`部署 ${name}`);
    
    try {
      this.log(`部署 ${name} (${contractName})...`);
      
      const factory = await ethers.getContractFactory(contractName);
      const contract = await factory.deploy(...args);
      
      this.log(`交易發送: ${contract.deploymentTransaction().hash}`);
      
      // 等待部署完成（帶超時）
      await executeWithTimeout(
        contract.waitForDeployment(),
        30000, // 30秒超時
        `${name} 部署`
      );
      
      const address = await contract.getAddress();
      this.contracts[name] = { contract, address };
      
      this.log(`✅ ${name} 部署成功: ${address}`, 'success');
      this.tracker.completeStep(true);
      
      return contract;
    } catch (error) {
      this.log(`❌ ${name} 部署失敗: ${error.message}`, 'error');
      this.tracker.completeStep(false);
      this.errors.push({ phase: 'deploy', contract: name, error });
      throw error;
    }
  }

  // 改進的交易執行 - 加入超時和重試
  async executeTransaction(description, txPromise, options = {}) {
    const { 
      critical = false,
      retries = 1,
      timeoutMs = 15000
    } = options;
    
    this.heartbeat.setCurrentTask(description);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.log(`${description}... (嘗試 ${attempt}/${retries})`);
        
        const tx = await txPromise();
        this.log(`交易發送: ${tx.hash}`);
        
        const receipt = await executeWithTimeout(
          tx.wait(),
          timeoutMs,
          description
        );
        
        this.log(`✅ ${description} 成功`, 'success');
        return receipt;
        
      } catch (error) {
        this.log(`❌ ${description} 失敗: ${error.message}`, 'error');
        
        if (attempt < retries) {
          this.log(`等待 5 秒後重試...`, 'warning');
          await this.sleep(5000);
        } else {
          this.errors.push({ phase: 'setup', description, error });
          if (critical) throw error;
        }
      }
    }
  }

  // 設置地城 - 改進版
  async setupDungeons() {
    this.tracker.startStep('初始化地城');
    
    const dungeonMaster = this.contracts.DUNGEONMASTER?.contract;
    if (!dungeonMaster) {
      this.log('⚠️ DungeonMaster 未部署，跳過地城初始化', 'warning');
      return;
    }
    
    for (const dungeon of GAME_PARAMS.dungeons) {
      await this.executeTransaction(
        `設置地城 ${dungeon.id} - ${dungeon.name}`,
        () => dungeonMaster.setDungeon(
          dungeon.id,
          dungeon.requiredPower,
          ethers.parseUnits(dungeon.rewardUSD.toString(), 18),
          dungeon.successRate
        ),
        { critical: false, timeoutMs: 20000 }
      );
      
      // 避免 nonce 衝突，稍微延遲
      await this.sleep(1000);
    }
    
    this.tracker.completeStep();
  }

  // 批次設置 - 但是順序執行避免 nonce 衝突
  async setupModules() {
    this.tracker.startStep('配置各模組');
    
    const modulesToSetup = [
      'HERO', 'RELIC', 'PARTY', 'VIPSTAKING', 'PLAYERPROFILE', 
      'PLAYERVAULT', 'DUNGEONMASTER', 'ALTAROFASCENSION'
    ];
    
    for (const moduleName of modulesToSetup) {
      const module = this.contracts[moduleName]?.contract;
      if (!module) continue;
      
      if (module.setDungeonCore) {
        await this.executeTransaction(
          `${moduleName}.setDungeonCore`,
          () => module.setDungeonCore(this.contracts.DUNGEONCORE.address),
          { critical: true }
        );
      }
    }
    
    this.tracker.completeStep();
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    console.log(chalk.cyan('\n=================================================='));
    console.log(chalk.cyan('🚀 V25 部署腳本 - 改進版'));
    console.log(chalk.cyan('==================================================\n'));
    
    try {
      // 啟動心跳監測
      this.heartbeat.start();
      
      await this.initialize();
      
      // 部署合約...
      // await this.deployContract('ORACLE', 'Oracle', [...]);
      
      // 設置連接...
      // await this.setupConnections();
      
      // 設置地城
      await this.setupDungeons();
      
      // 設置模組
      await this.setupModules();
      
      // 顯示總結
      this.tracker.printSummary();
      
      if (this.errors.length > 0) {
        console.log(chalk.red(`\n⚠️ 發生 ${this.errors.length} 個錯誤`));
        this.errors.forEach((err, i) => {
          console.log(`${i + 1}. ${err.phase} - ${err.description || err.contract}: ${err.error.message}`);
        });
      }
      
    } finally {
      // 停止心跳
      this.heartbeat.stop();
    }
  }
}

// 使用示例
async function main() {
  const deployer = new V25ImprovedDeployer();
  await deployer.run();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { 
  executeWithTimeout, 
  HeartbeatMonitor, 
  ProgressTracker,
  V25ImprovedDeployer 
};