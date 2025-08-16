#!/usr/bin/env node

/**
 * V25 設置腳本 - 只執行合約連接和參數設置
 * 需要先執行 v25-deploy-complete-raw.js 部署合約
 */

const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

// 載入已部署的地址
const deployedAddressesPath = path.join(__dirname, 'v25-deployed-addresses-complete.json');

if (!fs.existsSync(deployedAddressesPath)) {
  console.error('錯誤：找不到部署地址文件。請先執行 node scripts/active/v25-deploy-complete-raw.js');
  process.exit(1);
}

const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));

// 載入部署腳本的設置功能
const deployScript = require('./v25-deploy-complete-sequential.js');

// 創建一個只做設置的類
class V25SetupOnly {
  constructor() {
    this.contracts = {};
    this.deploymentLog = [];
    this.errors = [];
    
    // 載入已部署的合約地址和實例
    for (const [name, data] of Object.entries(deployedAddresses)) {
      this.contracts[name] = {
        address: data.address,
        contract: null // 稍後連接
      };
    }
  }
  
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[34m[INFO]\x1b[0m',
      success: '\x1b[32m[SUCCESS]\x1b[0m',
      error: '\x1b[31m[ERROR]\x1b[0m',
      warning: '\x1b[33m[WARNING]\x1b[0m'
    };
    
    console.log(`${colors[type]} ${timestamp} ${message}`);
    
    this.deploymentLog.push({
      timestamp: new Date().toISOString(),
      type,
      message
    });
  }
  
  async setup() {
    console.log('\n🔧 V25 合約設置腳本\n');
    
    try {
      const [deployer] = await hre.ethers.getSigners();
      this.deployer = deployer;
      
      // 1. 連接到已部署的合約
      await this.connectToContracts();
      
      // 2. 設置合約連接
      this.log('\n開始設置合約連接...', 'info');
      await this.setupConnections();
      
      // 3. 初始化參數
      this.log('\n開始初始化參數...', 'info');
      await this.initializeParameters();
      
      // 4. 初始化地城
      this.log('\n開始初始化地城...', 'info');
      await this.initializeDungeons();
      
      // 5. 驗證部署
      this.log('\n開始驗證部署...', 'info');
      await this.verifyDeployment();
      
      // 6. 生成報告
      await this.generateSetupReport();
      
      this.log('\n✅ 設置完成！', 'success');
      
    } catch (error) {
      this.log(`❌ 設置失敗: ${error.message}`, 'error');
      this.errors.push(error);
      await this.generateErrorReport();
      throw error;
    }
  }
  
  async connectToContracts() {
    this.log('連接到已部署的合約...', 'info');
    
    // 創建原生 ethers provider 和 signer
    const provider = new ethers.JsonRpcProvider(
      process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"
    );
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // ABI 路徑映射
    const abiPathMap = {
      ORACLE: 'defi/Oracle_V22_Adaptive.sol/Oracle_V22_Adaptive.json',
      SOULSHARD: 'defi/SoulShard.sol/Test_SoulShard.json',
      PLAYERVAULT: 'defi/PlayerVault.sol/PlayerVault.json',
      DUNGEONCORE: 'core/DungeonCore.sol/DungeonCore.json',
      DUNGEONSTORAGE: 'core/DungeonStorage.sol/DungeonStorage.json',
      DUNGEONMASTER: 'core/DungeonMaster.sol/DungeonMasterV2_Fixed.json',
      HERO: 'nft/Hero.sol/Hero.json',
      RELIC: 'nft/Relic.sol/Relic.json',
      PARTY: 'nft/Party.sol/PartyV3.json',
      VIPSTAKING: 'nft/VIPStaking.sol/VIPStaking.json',
      PLAYERPROFILE: 'nft/PlayerProfile.sol/PlayerProfile.json',
      ALTAROFASCENSION: 'core/AltarOfAscension.sol/AltarOfAscensionV2Fixed.json'
    };
    
    for (const [name, data] of Object.entries(this.contracts)) {
      if (data.address && abiPathMap[name]) {
        try {
          // 載入 ABI
          const contractPath = path.join(
            __dirname, 
            "../../artifacts/contracts/current",
            abiPathMap[name]
          );
          const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
          
          // 使用原生 ethers Contract
          data.contract = new ethers.Contract(data.address, contractJson.abi, wallet);
          this.log(`✅ 連接到 ${name}: ${data.address}`, 'success');
        } catch (error) {
          this.log(`⚠️ 無法連接到 ${name}: ${error.message}`, 'warning');
        }
      }
    }
  }
  
  // 使用原生 ethers 進行設置
  async setupConnections() {
    this.log('設置合約連接...', 'info');
    
    try {
      // DungeonCore 連接
      if (this.contracts.DUNGEONCORE?.contract) {
        const dungeonCore = this.contracts.DUNGEONCORE.contract;
        
        // 設置 Oracle
        if (this.contracts.ORACLE?.address) {
          const tx1 = await dungeonCore.setOracle(this.contracts.ORACLE.address);
          await tx1.wait();
          this.log('✅ DungeonCore -> Oracle 已連接', 'success');
        }
        
        // 設置 PlayerVault
        if (this.contracts.PLAYERVAULT?.address) {
          const tx2 = await dungeonCore.setPlayerVault(this.contracts.PLAYERVAULT.address);
          await tx2.wait();
          this.log('✅ DungeonCore -> PlayerVault 已連接', 'success');
        }
        
        // 設置其他合約
        if (this.contracts.DUNGEONSTORAGE?.address) {
          const tx3 = await dungeonCore.setDungeonStorage(this.contracts.DUNGEONSTORAGE.address);
          await tx3.wait();
          this.log('✅ DungeonCore -> DungeonStorage 已連接', 'success');
        }
      }
      
      // Hero 合約設置
      if (this.contracts.HERO?.contract) {
        const hero = this.contracts.HERO.contract;
        
        if (this.contracts.DUNGEONCORE?.address) {
          const tx = await hero.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx.wait();
          this.log('✅ Hero -> DungeonCore 已連接', 'success');
        }
      }
      
      // 其他合約連接...
      
    } catch (error) {
      this.log(`設置連接失敗: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async initializeParameters() {
    this.log('初始化合約參數...', 'info');
    
    try {
      // 初始化英雄參數
      if (this.contracts.HERO?.contract) {
        const hero = this.contracts.HERO.contract;
        
        // 設置鑄造價格
        const mintPrice = hre.ethers.parseEther("0.01");
        const tx = await hero.setMintPrice(mintPrice);
        await tx.wait();
        this.log('✅ Hero 鑄造價格已設置', 'success');
      }
      
      // 初始化其他參數...
      
    } catch (error) {
      this.log(`初始化參數失敗: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async initializeDungeons() {
    this.log('初始化地城數據...', 'info');
    
    try {
      if (this.contracts.DUNGEONSTORAGE?.contract) {
        const storage = this.contracts.DUNGEONSTORAGE.contract;
        
        // 初始化第一個地城
        const tx = await storage.initializeDungeon(1, {
          name: "新手地城",
          difficulty: 1,
          rewardMultiplier: 100
        });
        await tx.wait();
        this.log('✅ 新手地城已初始化', 'success');
      }
      
    } catch (error) {
      this.log(`初始化地城失敗: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async verifyDeployment() {
    this.log('驗證部署狀態...', 'info');
    
    try {
      // 檢查關鍵連接
      if (this.contracts.DUNGEONCORE?.contract) {
        const dungeonCore = this.contracts.DUNGEONCORE.contract;
        
        const oracle = await dungeonCore.oracle();
        if (oracle === this.contracts.ORACLE?.address) {
          this.log('✅ Oracle 連接驗證通過', 'success');
        } else {
          this.log('❌ Oracle 連接驗證失敗', 'error');
        }
      }
      
      // 其他驗證...
      
    } catch (error) {
      this.log(`驗證失敗: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async generateSetupReport() {
    const reportPath = path.join(__dirname, '../deployments', `v25-setup-report-${Date.now()}.md`);
    
    let report = `# V25 設置報告

生成時間: ${new Date().toLocaleString()}

## 合約地址

| 合約 | 地址 |
|------|------|
`;

    for (const [name, data] of Object.entries(this.contracts)) {
      report += `| ${name} | ${data.address} |\n`;
    }
    
    report += `

## 設置日誌

\`\`\`
${this.deploymentLog.map(log => `[${log.type}] ${log.message}`).join('\n')}
\`\`\`
`;

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    this.log(`設置報告已生成: ${reportPath}`, 'success');
  }
  
  async generateErrorReport() {
    // ... 錯誤報告邏輯
  }
}

// 執行
async function main() {
  const setup = new V25SetupOnly();
  await setup.setup();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });