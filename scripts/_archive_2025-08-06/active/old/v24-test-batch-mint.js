#!/usr/bin/env node

/**
 * V24 批量鑄造測試腳本
 * 測試 Hero 和 Relic 的批量鑄造功能
 * 
 * 使用方式：
 * node scripts/active/v24-test-batch-mint.js
 */

const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

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

class V24BatchMintTester {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/');
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.config = null;
    this.abis = {};
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

  async test() {
    console.log(`${colors.bright}
==================================================
🧪 V24 批量鑄造測試
==================================================
${colors.reset}`);

    try {
      // 1. 載入配置和 ABI
      await this.loadConfig();
      
      // 2. 檢查前置條件
      await this.checkPrerequisites();
      
      // 3. 測試單個鑄造
      await this.testSingleMint();
      
      // 4. 測試批量鑄造
      await this.testBatchMint();
      
      // 5. 測試批量階層
      await this.testBatchTiers();
      
      // 6. 監控事件
      await this.monitorEvents();
      
      this.log('\\n✅ 測試完成！', 'success');
      
    } catch (error) {
      this.log(`測試失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async loadConfig() {
    this.log('載入配置...', 'info');
    
    // 載入 V24 配置
    const configPath = path.join(__dirname, '../../config/v24-config.js');
    this.config = require(configPath);
    
    // 載入 ABI
    const heroABI = require('../../abi/Hero.json');
    const relicABI = require('../../abi/Relic.json');
    const oracleABI = require('../../abi/Oracle.json');
    
    // 創建合約實例
    this.contracts = {
      hero: new ethers.Contract(this.config.contracts.HERO.address, heroABI, this.signer),
      relic: new ethers.Contract(this.config.contracts.RELIC.address, relicABI, this.signer),
      oracle: new ethers.Contract(this.config.contracts.ORACLE.address, oracleABI, this.provider)
    };
    
    this.log('✅ 配置和 ABI 載入成功', 'success');
  }

  async checkPrerequisites() {
    this.log('\\n檢查前置條件...', 'info');
    
    // 1. 檢查餘額
    const balance = await this.provider.getBalance(this.signer.address);
    const balanceInBNB = ethers.formatEther(balance);
    this.log(`錢包餘額: ${balanceInBNB} BNB`, 'info');
    
    if (parseFloat(balanceInBNB) < 0.1) {
      throw new Error('BNB 餘額不足');
    }
    
    // 2. 檢查價格
    const heroPriceUSD = await this.contracts.hero.mintPriceUSD();
    const relicPriceUSD = await this.contracts.relic.mintPriceUSD();
    
    this.log(`Hero 鑄造價格: $${ethers.formatUnits(heroPriceUSD, 18)} USD`, 'info');
    this.log(`Relic 鑄造價格: $${ethers.formatUnits(relicPriceUSD, 18)} USD`, 'info');
    
    // 3. 檢查 Oracle 價格
    try {
      const [price, period] = await this.contracts.oracle.getPriceAdaptive();
      const bnbPrice = parseFloat(ethers.formatUnits(price, 18));
      this.log(`BNB 價格: $${bnbPrice.toFixed(2)} USD (週期: ${period}秒)`, 'info');
      
      // 計算鑄造成本
      const heroCostBNB = parseFloat(ethers.formatUnits(heroPriceUSD, 18)) / bnbPrice;
      const relicCostBNB = parseFloat(ethers.formatUnits(relicPriceUSD, 18)) / bnbPrice;
      
      this.log(`Hero 鑄造成本: ${heroCostBNB.toFixed(6)} BNB`, 'info');
      this.log(`Relic 鑄造成本: ${relicCostBNB.toFixed(6)} BNB`, 'info');
      
    } catch (error) {
      this.log('⚠️ 無法獲取 Oracle 價格', 'warning');
    }
  }

  async testSingleMint() {
    this.log('\\n測試單個鑄造...', 'info');
    
    try {
      // 獲取鑄造價格（BNB）
      const mintPrice = await this.contracts.hero.getMintPrice(1);
      this.log(`單個 Hero 鑄造價格: ${ethers.formatEther(mintPrice)} BNB`, 'info');
      
      // 執行鑄造
      this.log('執行 Hero 鑄造...', 'info');
      const tx = await this.contracts.hero.mint({ value: mintPrice });
      this.log(`交易已發送: ${tx.hash}`, 'info');
      
      // 等待確認
      const receipt = await tx.wait();
      this.log(`✅ Hero 鑄造成功! Gas 使用: ${receipt.gasUsed.toString()}`, 'success');
      
      // 解析事件
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contracts.hero.interface.parseLog(log);
          return parsed.name === 'HeroMinted';
        } catch {
          return false;
        }
      });
      
      if (mintEvent) {
        const parsedEvent = this.contracts.hero.interface.parseLog(mintEvent);
        this.log(`鑄造的 Hero ID: ${parsedEvent.args[0]}`, 'info');
        this.log(`稀有度: ${parsedEvent.args[2]}`, 'info');
        this.log(`戰力: ${parsedEvent.args[3]}`, 'info');
      }
      
    } catch (error) {
      this.log(`單個鑄造失敗: ${error.message}`, 'error');
    }
  }

  async testBatchMint() {
    this.log('\\n測試批量鑄造...', 'info');
    
    const quantities = [5, 10]; // 測試 5 個和 10 個
    
    for (const quantity of quantities) {
      this.log(`\\n測試鑄造 ${quantity} 個 Hero...`, 'info');
      
      try {
        // 獲取批量鑄造價格
        const batchPrice = await this.contracts.hero.getMintPrice(quantity);
        const pricePerUnit = batchPrice / BigInt(quantity);
        const singlePrice = await this.contracts.hero.getMintPrice(1);
        const discount = ((singlePrice - pricePerUnit) * 100n) / singlePrice;
        
        this.log(`批量價格: ${ethers.formatEther(batchPrice)} BNB`, 'info');
        this.log(`單價: ${ethers.formatEther(pricePerUnit)} BNB`, 'info');
        this.log(`折扣: ${discount}%`, 'info');
        
        // 詢問是否繼續
        this.log('執行批量鑄造...', 'info');
        const tx = await this.contracts.hero.batchMint(quantity, { value: batchPrice });
        this.log(`交易已發送: ${tx.hash}`, 'info');
        
        // 等待確認
        const receipt = await tx.wait();
        this.log(`✅ 批量鑄造成功! Gas 使用: ${receipt.gasUsed.toString()}`, 'success');
        
        // 解析 BatchMintCompleted 事件
        const batchEvent = receipt.logs.find(log => {
          try {
            const parsed = this.contracts.hero.interface.parseLog(log);
            return parsed.name === 'BatchMintCompleted';
          } catch {
            return false;
          }
        });
        
        if (batchEvent) {
          const parsedEvent = this.contracts.hero.interface.parseLog(batchEvent);
          this.log(`鑄造數量: ${parsedEvent.args.quantity}`, 'info');
          this.log(`最高稀有度: ${parsedEvent.args.maxRarity}`, 'info');
          this.log(`Token IDs: ${parsedEvent.args.tokenIds.join(', ')}`, 'info');
        }
        
        // 短暫延遲
        await this.delay(5000);
        
      } catch (error) {
        this.log(`批量鑄造 ${quantity} 個失敗: ${error.message}`, 'error');
      }
    }
  }

  async testBatchTiers() {
    this.log('\\n檢查批量階層設置...', 'info');
    
    for (let tier = 1; tier <= 5; tier++) {
      try {
        const tierInfo = await this.contracts.hero.batchTiers(tier);
        this.log(`\\nTier ${tier}:`, 'info');
        this.log(`  數量: ${tierInfo.quantity}`, 'info');
        this.log(`  最高稀有度: ${tierInfo.maxRarity}`, 'info');
        this.log(`  折扣: ${tierInfo.discountPercent}%`, 'info');
        this.log(`  啟用: ${tierInfo.isActive ? '是' : '否'}`, 'info');
      } catch (error) {
        this.log(`無法讀取 Tier ${tier}: ${error.message}`, 'warning');
      }
    }
  }

  async monitorEvents() {
    this.log('\\n設置事件監控...', 'info');
    
    // 監控 HeroMinted 事件
    this.contracts.hero.on('HeroMinted', (tokenId, owner, rarity, power) => {
      this.log(`\\n🎉 新 Hero 鑄造!`, 'success');
      this.log(`  ID: ${tokenId}`, 'info');
      this.log(`  擁有者: ${owner}`, 'info');
      this.log(`  稀有度: ${rarity}`, 'info');
      this.log(`  戰力: ${power}`, 'info');
    });
    
    // 監控 BatchMintCompleted 事件
    this.contracts.hero.on('BatchMintCompleted', (player, quantity, maxRarity, tokenIds) => {
      this.log(`\\n🎊 批量鑄造完成!`, 'success');
      this.log(`  玩家: ${player}`, 'info');
      this.log(`  數量: ${quantity}`, 'info');
      this.log(`  最高稀有度: ${maxRarity}`, 'info');
      this.log(`  Token IDs: ${tokenIds.join(', ')}`, 'info');
    });
    
    this.log('✅ 事件監控已啟動', 'success');
    this.log('（按 Ctrl+C 退出）', 'info');
    
    // 保持程序運行
    await new Promise(() => {});
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 執行測試
if (require.main === module) {
  const tester = new V24BatchMintTester();
  tester.test().catch(console.error);
}

module.exports = V24BatchMintTester;