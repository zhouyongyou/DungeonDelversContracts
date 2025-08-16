#!/usr/bin/env node

// V23 批量鑄造事件監控腳本
// 實時監控 BatchMintCompleted 事件並生成統計報告

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${colors[color]}${message}${colors.reset}`);
}

// 稀有度名稱
const RARITY_NAMES = {
  1: '⚪ Common',
  2: '🟢 Uncommon',
  3: '🔵 Rare',
  4: '🟣 Epic',
  5: '🟡 Legendary'
};

// 批量階層名稱
const TIER_NAMES = {
  1: 'Single Mint',
  5: 'Bronze Pack',
  10: 'Silver Pack',
  20: 'Gold Pack',
  50: 'Platinum Pack'
};

class BatchMintMonitor {
  constructor(config) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(BSC_RPC);
    this.statistics = {
      totalMints: 0,
      totalNFTs: 0,
      totalValue: 0n,
      rarityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      tierDistribution: {},
      topMinters: new Map(),
      hourlyStats: new Map(),
      startTime: Date.now()
    };
    this.contracts = {
      hero: null,
      relic: null
    };
  }

  async initialize() {
    log('🚀 初始化批量鑄造監控器...', 'bright');
    
    // 載入合約
    const heroABI = [
      "event BatchMintCompleted(address indexed player, uint256 quantity, uint8 maxRarity, uint256[] tokenIds)",
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      "function mintPriceUSD() view returns (uint256)",
      "function getBNBAmount(uint256 usdAmount) view returns (uint256)",
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function getRarity(uint256 tokenId) view returns (uint8)"
    ];
    
    this.contracts.hero = new ethers.Contract(this.config.contracts.HERO.address, heroABI, this.provider);
    this.contracts.relic = new ethers.Contract(this.config.contracts.RELIC.address, heroABI, this.provider);
    
    // 獲取當前區塊
    this.currentBlock = await this.provider.getBlockNumber();
    log(`📦 當前區塊: ${this.currentBlock}`, 'blue');
    
    // 載入歷史統計（如果存在）
    await this.loadStatistics();
    
    log('✅ 監控器初始化完成\n', 'green');
  }

  async startMonitoring() {
    log('👁️  開始監控批量鑄造事件...', 'cyan');
    
    // 監控 Hero 合約
    this.contracts.hero.on('BatchMintCompleted', async (player, quantity, maxRarity, tokenIds, event) => {
      await this.handleBatchMint('Hero', player, quantity, maxRarity, tokenIds, event);
    });
    
    // 監控 Relic 合約
    this.contracts.relic.on('BatchMintCompleted', async (player, quantity, maxRarity, tokenIds, event) => {
      await this.handleBatchMint('Relic', player, quantity, maxRarity, tokenIds, event);
    });
    
    // 定期顯示統計
    setInterval(() => this.displayStatistics(), 60000); // 每分鐘
    
    // 定期保存統計
    setInterval(() => this.saveStatistics(), 300000); // 每5分鐘
    
    // 處理退出信號
    process.on('SIGINT', async () => {
      log('\n\n🛑 停止監控...', 'yellow');
      await this.saveStatistics();
      await this.displayFinalReport();
      process.exit(0);
    });
    
    log('📡 監控器正在運行，按 Ctrl+C 停止\n', 'green');
  }

  async handleBatchMint(contractType, player, quantity, maxRarity, tokenIds, event) {
    const quantityNum = Number(quantity);
    const maxRarityNum = Number(maxRarity);
    const block = await event.getBlock();
    const timestamp = new Date(block.timestamp * 1000);
    
    // 顯示鑄造信息
    log(`\n🎉 新的批量鑄造！`, 'bright');
    log(`   類型: ${contractType}`, 'cyan');
    log(`   玩家: ${player}`, 'blue');
    log(`   數量: ${quantityNum} (${TIER_NAMES[quantityNum] || 'Custom'})`, 'green');
    log(`   最高稀有度: ${RARITY_NAMES[maxRarityNum]} (${maxRarityNum}★)`, 'magenta');
    log(`   Token IDs: ${tokenIds.slice(0, 5).map(id => id.toString()).join(', ')}${tokenIds.length > 5 ? '...' : ''}`, 'blue');
    log(`   區塊: ${event.blockNumber} | 交易: ${event.transactionHash}`, 'cyan');
    log(`   時間: ${timestamp.toLocaleString()}`, 'blue');
    
    // 更新統計
    this.updateStatistics(player, quantityNum, maxRarityNum, tokenIds, contractType);
    
    // 分析稀有度分布（如果可能）
    try {
      await this.analyzeRarityDistribution(contractType, tokenIds);
    } catch (error) {
      log(`   ⚠️  無法分析稀有度分布: ${error.message}`, 'yellow');
    }
    
    // 發送通知（如果配置了）
    if (maxRarityNum >= 4) {
      await this.sendNotification(contractType, player, quantityNum, maxRarityNum, event.transactionHash);
    }
  }

  updateStatistics(player, quantity, maxRarity, tokenIds, contractType) {
    // 更新總計
    this.statistics.totalMints++;
    this.statistics.totalNFTs += quantity;
    
    // 更新稀有度分布（基於最高稀有度）
    this.statistics.rarityDistribution[maxRarity] = (this.statistics.rarityDistribution[maxRarity] || 0) + 1;
    
    // 更新階層分布
    const tierKey = `${quantity}_${contractType}`;
    this.statistics.tierDistribution[tierKey] = (this.statistics.tierDistribution[tierKey] || 0) + 1;
    
    // 更新頂級鑄造者
    const currentCount = this.statistics.topMinters.get(player) || 0;
    this.statistics.topMinters.set(player, currentCount + quantity);
    
    // 更新小時統計
    const hourKey = new Date().toISOString().slice(0, 13);
    const hourStats = this.statistics.hourlyStats.get(hourKey) || { mints: 0, nfts: 0 };
    hourStats.mints++;
    hourStats.nfts += quantity;
    this.statistics.hourlyStats.set(hourKey, hourStats);
  }

  async analyzeRarityDistribution(contractType, tokenIds) {
    const contract = contractType === 'Hero' ? this.contracts.hero : this.contracts.relic;
    const rarities = [];
    
    // 只分析前幾個（避免太多請求）
    const samplesToCheck = Math.min(5, tokenIds.length);
    for (let i = 0; i < samplesToCheck; i++) {
      try {
        const rarity = await contract.getRarity(tokenIds[i]);
        rarities.push(Number(rarity));
      } catch (error) {
        // 某些合約可能沒有 getRarity 函數
        break;
      }
    }
    
    if (rarities.length > 0) {
      const rarityCount = rarities.reduce((acc, r) => {
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
      
      log(`   稀有度採樣 (前${samplesToCheck}個):`, 'cyan');
      Object.entries(rarityCount).forEach(([rarity, count]) => {
        log(`     ${RARITY_NAMES[rarity]}: ${count}`, 'blue');
      });
    }
  }

  displayStatistics() {
    const runtime = Math.floor((Date.now() - this.statistics.startTime) / 1000 / 60);
    
    console.log('\n' + '='.repeat(60));
    log('📊 批量鑄造統計報告', 'bright');
    console.log('='.repeat(60));
    
    log(`\n⏱️  運行時間: ${runtime} 分鐘`, 'blue');
    log(`🎯 總批次數: ${this.statistics.totalMints}`, 'green');
    log(`🎨 總 NFT 數: ${this.statistics.totalNFTs}`, 'green');
    
    if (this.statistics.totalMints > 0) {
      const avgPerBatch = (this.statistics.totalNFTs / this.statistics.totalMints).toFixed(2);
      log(`📈 平均每批: ${avgPerBatch} 個`, 'cyan');
    }
    
    // 稀有度分布
    log('\n🌟 最高稀有度分布:', 'yellow');
    Object.entries(this.statistics.rarityDistribution).forEach(([rarity, count]) => {
      if (count > 0) {
        const percentage = ((count / this.statistics.totalMints) * 100).toFixed(2);
        log(`   ${RARITY_NAMES[rarity]}: ${count} 次 (${percentage}%)`, 'blue');
      }
    });
    
    // 階層分布
    log('\n📦 批量階層分布:', 'yellow');
    const tierSummary = {};
    Object.entries(this.statistics.tierDistribution).forEach(([key, count]) => {
      const [quantity, type] = key.split('_');
      const tierName = TIER_NAMES[quantity] || `${quantity}個`;
      const displayKey = `${type} - ${tierName}`;
      tierSummary[displayKey] = count;
    });
    
    Object.entries(tierSummary).sort((a, b) => b[1] - a[1]).forEach(([tier, count]) => {
      const percentage = ((count / this.statistics.totalMints) * 100).toFixed(2);
      log(`   ${tier}: ${count} 次 (${percentage}%)`, 'blue');
    });
    
    // 頂級鑄造者
    log('\n🏆 Top 5 鑄造者:', 'yellow');
    const topMinters = Array.from(this.statistics.topMinters.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    topMinters.forEach(([address, count], index) => {
      const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
      log(`   ${index + 1}. ${shortAddr}: ${count} 個 NFT`, 'blue');
    });
    
    // 最近一小時統計
    const currentHour = new Date().toISOString().slice(0, 13);
    const currentHourStats = this.statistics.hourlyStats.get(currentHour);
    if (currentHourStats) {
      log(`\n⏰ 本小時統計:`, 'yellow');
      log(`   批次: ${currentHourStats.mints}`, 'blue');
      log(`   NFTs: ${currentHourStats.nfts}`, 'blue');
    }
    
    console.log('='.repeat(60) + '\n');
  }

  async saveStatistics() {
    const statsPath = path.join(__dirname, '..', 'deployments', 'v23-batch-mint-stats.json');
    try {
      // 轉換 Map 為 Object 以便序列化
      const statsToSave = {
        ...this.statistics,
        topMinters: Object.fromEntries(this.statistics.topMinters),
        hourlyStats: Object.fromEntries(this.statistics.hourlyStats),
        lastSaved: new Date().toISOString()
      };
      
      fs.mkdirSync(path.dirname(statsPath), { recursive: true });
      fs.writeFileSync(statsPath, JSON.stringify(statsToSave, null, 2));
      log('💾 統計數據已保存', 'green');
    } catch (error) {
      log(`❌ 保存統計失敗: ${error.message}`, 'red');
    }
  }

  async loadStatistics() {
    const statsPath = path.join(__dirname, '..', 'deployments', 'v23-batch-mint-stats.json');
    try {
      if (fs.existsSync(statsPath)) {
        const savedStats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        
        // 恢復統計數據
        this.statistics.totalMints = savedStats.totalMints || 0;
        this.statistics.totalNFTs = savedStats.totalNFTs || 0;
        this.statistics.rarityDistribution = savedStats.rarityDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        this.statistics.tierDistribution = savedStats.tierDistribution || {};
        this.statistics.topMinters = new Map(Object.entries(savedStats.topMinters || {}));
        this.statistics.hourlyStats = new Map(Object.entries(savedStats.hourlyStats || {}));
        
        log(`📂 已載入歷史統計數據 (上次保存: ${savedStats.lastSaved})`, 'green');
      }
    } catch (error) {
      log(`⚠️  載入統計失敗: ${error.message}`, 'yellow');
    }
  }

  async sendNotification(contractType, player, quantity, maxRarity, txHash) {
    const message = `🎉 *V23 高稀有度鑄造！*\n\n` +
      `類型: ${contractType}\n` +
      `玩家: \`${player}\`\n` +
      `數量: ${quantity} (${TIER_NAMES[quantity] || 'Custom'})\n` +
      `最高稀有度: ${RARITY_NAMES[maxRarity]} (${maxRarity}★)\n` +
      `交易: [查看](https://bscscan.com/tx/${txHash})`;
    
    // 如果配置了 Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        await this.sendTelegramMessage(message);
        log('📱 已發送 Telegram 通知', 'green');
      } catch (error) {
        log(`❌ Telegram 通知失敗: ${error.message}`, 'red');
      }
    }
  }

  async sendTelegramMessage(message) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }
  }

  async displayFinalReport() {
    console.log('\n' + '='.repeat(60));
    log('📊 最終統計報告', 'bright');
    console.log('='.repeat(60));
    
    this.displayStatistics();
    
    // 保存最終報告
    const reportPath = path.join(__dirname, '..', 'deployments', `v23-batch-mint-report-${Date.now()}.json`);
    const report = {
      version: 'V23',
      monitoringPeriod: {
        start: new Date(this.statistics.startTime).toISOString(),
        end: new Date().toISOString(),
        durationMinutes: Math.floor((Date.now() - this.statistics.startTime) / 1000 / 60)
      },
      summary: {
        totalBatches: this.statistics.totalMints,
        totalNFTs: this.statistics.totalNFTs,
        averagePerBatch: this.statistics.totalMints > 0 ? (this.statistics.totalNFTs / this.statistics.totalMints).toFixed(2) : 0
      },
      rarityDistribution: this.statistics.rarityDistribution,
      tierDistribution: this.statistics.tierDistribution,
      topMinters: Object.fromEntries(
        Array.from(this.statistics.topMinters.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
      ),
      hourlyStats: Object.fromEntries(this.statistics.hourlyStats)
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 最終報告已保存: ${reportPath}`, 'green');
  }
}

// 主函數
async function main() {
  // 載入配置
  const configPath = path.join(__dirname, '..', 'config', 'v23-config.js');
  if (!fs.existsSync(configPath)) {
    log('❌ 錯誤: 找不到 V23 配置文件', 'red');
    process.exit(1);
  }
  
  const v23Config = require(configPath);
  
  // 創建並啟動監控器
  const monitor = new BatchMintMonitor(v23Config);
  await monitor.initialize();
  await monitor.startMonitoring();
}

// 執行
if (require.main === module) {
  main().catch(error => {
    log(`❌ 錯誤: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { BatchMintMonitor };