#!/usr/bin/env node

/**
 * V25 DungeonMaster 修復腳本
 * 
 * 修復 DungeonMaster.setDungeonCore 失敗問題
 * 包含 nonce 管理和重試機制
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-fix-dungeonmaster.js --network bsc
 */

const hre = require("hardhat");
const { ethers } = require("ethers");

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
  DUNGEONCORE: '0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a',
  DUNGEONMASTER: '0xd06470d4C6F62F6747cf02bD2b2De0981489034F'
};

class DungeonMasterFixer {
  constructor() {
    this.errors = [];
    this.retryCount = 0;
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

  async fix() {
    console.log(`${colors.bright}
==================================================
🔧 V25 DungeonMaster 修復腳本
==================================================
${colors.reset}`);

    try {
      // 創建原生 ethers provider 和 wallet - 使用備用 RPC
      const rpcUrls = [
        process.env.BSC_MAINNET_RPC_URL,
        "https://bsc-dataseed1.binance.org/",
        "https://bsc-dataseed2.binance.org/",
        "https://bsc-dataseed.binance.org/",
        "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"
      ].filter(Boolean);
      
      let provider;
      for (const rpcUrl of rpcUrls) {
        try {
          this.log(`嘗試連接 RPC: ${rpcUrl.substring(0, 30)}...`, 'info');
          provider = new ethers.JsonRpcProvider(rpcUrl);
          // 測試連接
          await provider.getNetwork();
          this.log('✅ RPC 連接成功', 'success');
          break;
        } catch (error) {
          this.log(`❌ RPC 連接失敗: ${error.message}`, 'error');
          if (rpcUrl === rpcUrls[rpcUrls.length - 1]) {
            throw new Error('所有 RPC 節點都無法連接');
          }
        }
      }
      
      this.deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      this.provider = provider;
      
      // 前置檢查
      await this.preFixChecks();
      
      // 執行修復
      await this.fixDungeonMaster();
      
      // 驗證修復結果
      await this.verifyFix();
      
      this.log('\n✅ DungeonMaster 修復完成！', 'success');
      
    } catch (error) {
      this.log(`修復失敗: ${error.message}`, 'error');
      this.errors.push(error);
      process.exit(1);
    }
  }

  async preFixChecks() {
    this.log('執行修復前檢查...', 'info');
    
    // 檢查網路
    const network = await this.provider.getNetwork();
    if (network.chainId !== 56n) {
      throw new Error(`錯誤的網路 (期望 BSC Mainnet 56, 實際 ${network.chainId})`);
    }
    
    // 檢查餘額
    const balance = await this.provider.getBalance(this.deployer.address);
    const balanceInBNB = ethers.formatEther(balance);
    this.log(`部署錢包: ${this.deployer.address}`, 'info');
    this.log(`錢包餘額: ${balanceInBNB} BNB`, 'info');
    
    if (parseFloat(balanceInBNB) < 0.01) {
      throw new Error('BNB 餘額不足 (建議至少 0.01 BNB)');
    }
    
    // 檢查合約地址
    for (const [name, address] of Object.entries(V25_ADDRESSES)) {
      const code = await this.provider.getCode(address);
      if (code === '0x') {
        throw new Error(`${name} 合約不存在於地址 ${address}`);
      }
      this.log(`✅ ${name} 合約驗證通過: ${address}`, 'success');
    }
  }

  async fixDungeonMaster() {
    this.log('\n開始修復 DungeonMaster...', 'info');
    
    // 獲取合約 ABI
    const artifact = await hre.artifacts.readArtifact('DungeonMasterV2_Fixed');
    
    // 創建合約實例
    const dungeonMaster = new ethers.Contract(
      V25_ADDRESSES.DUNGEONMASTER,
      artifact.abi,
      this.deployer
    );
    
    // 檢查當前狀態
    try {
      const currentDungeonCore = await dungeonMaster.dungeonCore();
      this.log(`當前 DungeonCore 地址: ${currentDungeonCore}`, 'info');
      
      if (currentDungeonCore.toLowerCase() === V25_ADDRESSES.DUNGEONCORE.toLowerCase()) {
        this.log('✅ DungeonMaster.dungeonCore 已正確設置', 'success');
        return;
      }
      
      if (currentDungeonCore === '0x0000000000000000000000000000000000000000') {
        this.log('❌ DungeonMaster.dungeonCore 為零地址，需要設置', 'warning');
      } else {
        this.log('⚠️ DungeonMaster.dungeonCore 地址不正確，需要更新', 'warning');
      }
    } catch (error) {
      this.log(`無法讀取當前 DungeonCore: ${error.message}`, 'warning');
    }
    
    // 執行修復，包含重試機制
    await this.setDungeonCoreWithRetry(dungeonMaster);
  }

  async setDungeonCoreWithRetry(dungeonMaster) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.log(`嘗試 ${attempt}/${this.maxRetries}: 設置 DungeonMaster.setDungeonCore...`, 'info');
        
        // 獲取最新的 nonce
        const nonce = await this.provider.getTransactionCount(this.deployer.address, 'pending');
        this.log(`使用 nonce: ${nonce}`, 'info');
        
        // 設置 gas 參數
        const gasPrice = await this.provider.getGasPrice();
        const adjustedGasPrice = gasPrice * 11n / 10n; // 增加 10% gas price
        
        // 執行交易
        const tx = await dungeonMaster.setDungeonCore(V25_ADDRESSES.DUNGEONCORE, {
          nonce: nonce,
          gasPrice: adjustedGasPrice,
          gasLimit: 100000 // 設置足夠的 gas limit
        });
        
        this.log(`交易已發送: ${tx.hash}`, 'info');
        this.log('等待交易確認...', 'info');
        
        // 等待交易確認
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          this.log('✅ DungeonMaster.setDungeonCore 成功', 'success');
          this.log(`Gas 使用量: ${receipt.gasUsed.toString()}`, 'info');
          return;
        } else {
          throw new Error('交易失敗 (status = 0)');
        }
        
      } catch (error) {
        this.log(`嘗試 ${attempt} 失敗: ${error.message}`, 'error');
        
        // 檢查是否為 nonce 相關錯誤
        if (error.message.includes('nonce') || error.message.includes('NONCE_EXPIRED')) {
          this.log('檢測到 nonce 錯誤，等待 5 秒後重試...', 'warning');
          await this.delay(5000);
        } else if (attempt < this.maxRetries) {
          this.log(`其他錯誤，等待 3 秒後重試...`, 'warning');
          await this.delay(3000);
        }
        
        // 如果是最後一次嘗試，拋出錯誤
        if (attempt === this.maxRetries) {
          throw new Error(`所有重試都失敗了。最後錯誤: ${error.message}`);
        }
      }
    }
  }

  async verifyFix() {
    this.log('\n驗證修復結果...', 'info');
    
    try {
      // 獲取合約 ABI
      const artifact = await hre.artifacts.readArtifact('DungeonMasterV2_Fixed');
      
      // 創建合約實例
      const dungeonMaster = new ethers.Contract(
        V25_ADDRESSES.DUNGEONMASTER,
        artifact.abi,
        this.deployer
      );
      
      const actualDungeonCore = await dungeonMaster.dungeonCore();
      const expectedDungeonCore = V25_ADDRESSES.DUNGEONCORE;
      
      this.log(`預期 DungeonCore: ${expectedDungeonCore}`, 'info');
      this.log(`實際 DungeonCore: ${actualDungeonCore}`, 'info');
      
      if (actualDungeonCore.toLowerCase() === expectedDungeonCore.toLowerCase()) {
        this.log('✅ 驗證通過：DungeonMaster.dungeonCore 設置正確', 'success');
      } else {
        throw new Error('驗證失敗：DungeonCore 地址不匹配');
      }
      
    } catch (error) {
      this.log(`驗證失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 執行修復
async function main() {
  const fixer = new DungeonMasterFixer();
  await fixer.fix();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });