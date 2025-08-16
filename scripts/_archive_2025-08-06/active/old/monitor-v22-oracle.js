#!/usr/bin/env node

// V22 Oracle 監控腳本 - 監控自適應 TWAP 機制的運作情況
// 定期檢查價格查詢和 TWAP 週期切換

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// Oracle ABI (只包含需要的函數)
const ORACLE_ABI = [
  'function getSoulToUsdTWAP() external view returns (uint256)',
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function getCurrentTwapPeriod() external view returns (uint32)',
  'function getAdaptivePeriods() external view returns (uint32[4])',
  'function getLastSuccessfulPeriod() external view returns (uint32)',
  'function isAdaptiveMode() external view returns (bool)',
  'function pool() external view returns (address)',
  'function soulToken() external view returns (address)',
  'function usdToken() external view returns (address)'
];

// Uniswap V3 Pool ABI (用於獲取當前價格)
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

// 監控配置
const MONITOR_CONFIG = {
  checkInterval: 60000, // 每分鐘檢查一次
  logInterval: 300000, // 每5分鐘記錄一次詳細日誌
  alertThreshold: 0.1, // 價格偏差 10% 時發出警告
  historySize: 100 // 保留最近100筆記錄
};

class OracleMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(BSC_RPC);
    this.oracle = new ethers.Contract(v22Config.contracts.ORACLE.address, ORACLE_ABI, this.provider);
    this.priceHistory = [];
    this.periodHistory = [];
    this.lastLogTime = Date.now();
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🔍 V22 Oracle 監控系統啟動\n');
    console.log('📋 配置信息：');
    console.log(`   Oracle 地址: ${v22Config.contracts.ORACLE.address}`);
    console.log(`   網路: BSC Mainnet`);
    console.log(`   檢查間隔: ${MONITOR_CONFIG.checkInterval / 1000} 秒`);
    console.log(`   詳細日誌間隔: ${MONITOR_CONFIG.logInterval / 60000} 分鐘\n`);

    // 獲取初始信息
    try {
      const poolAddress = await this.oracle.pool();
      const soulToken = await this.oracle.soulToken();
      const usdToken = await this.oracle.usdToken();
      const isAdaptive = await this.oracle.isAdaptiveMode();
      const adaptivePeriods = await this.oracle.getAdaptivePeriods();

      console.log('📊 Oracle 基本信息：');
      console.log(`   Uniswap Pool: ${poolAddress}`);
      console.log(`   SOUL Token: ${soulToken}`);
      console.log(`   USD Token: ${usdToken}`);
      console.log(`   自適應模式: ${isAdaptive ? '✅ 啟用' : '❌ 禁用'}`);
      console.log(`   自適應週期: ${adaptivePeriods.map(p => `${p}s`).join(', ')}`);
      console.log('');

      this.pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
    } catch (error) {
      console.error('❌ 初始化失敗:', error.message);
      process.exit(1);
    }
  }

  async checkOracle() {
    try {
      // 獲取 TWAP 價格
      const soulToUsd = await this.oracle.getSoulToUsdTWAP();
      const usdToSoul = await this.oracle.getUsdToSoulTWAP();
      
      // 獲取當前使用的 TWAP 週期
      const currentPeriod = await this.oracle.getCurrentTwapPeriod();
      const lastSuccessfulPeriod = await this.oracle.getLastSuccessfulPeriod();
      
      // 獲取 Uniswap 當前價格（用於比較）
      const slot0 = await this.pool.slot0();
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      const spotPrice = this.calculateSpotPrice(sqrtPriceX96);
      
      // 計算價格（轉換為人類可讀格式）
      const twapPrice = parseFloat(ethers.formatUnits(soulToUsd, 18));
      const priceDeviation = Math.abs(twapPrice - spotPrice) / spotPrice;
      
      // 記錄數據
      const timestamp = Date.now();
      const record = {
        timestamp,
        twapPrice,
        spotPrice,
        priceDeviation,
        currentPeriod: Number(currentPeriod),
        lastSuccessfulPeriod: Number(lastSuccessfulPeriod)
      };
      
      this.priceHistory.push(record);
      if (this.priceHistory.length > MONITOR_CONFIG.historySize) {
        this.priceHistory.shift();
      }
      
      // 檢查是否需要警告
      if (priceDeviation > MONITOR_CONFIG.alertThreshold) {
        console.log(`\n⚠️  價格偏差警告！`);
        console.log(`   TWAP 價格: $${twapPrice.toFixed(4)}`);
        console.log(`   現貨價格: $${spotPrice.toFixed(4)}`);
        console.log(`   偏差: ${(priceDeviation * 100).toFixed(2)}%`);
      }
      
      // 檢查週期變化
      if (this.periodHistory.length > 0) {
        const lastPeriod = this.periodHistory[this.periodHistory.length - 1];
        if (lastPeriod.period !== currentPeriod) {
          console.log(`\n🔄 TWAP 週期切換！`);
          console.log(`   從 ${lastPeriod.period} 秒 → ${currentPeriod} 秒`);
          console.log(`   原因: ${currentPeriod > lastPeriod.period ? '查詢失敗，降級到更長週期' : '查詢成功，嘗試更短週期'}`);
        }
      }
      
      this.periodHistory.push({
        timestamp,
        period: Number(currentPeriod)
      });
      
      // 定期詳細日誌
      if (timestamp - this.lastLogTime >= MONITOR_CONFIG.logInterval) {
        this.printDetailedReport();
        this.lastLogTime = timestamp;
      }
      
      // 簡單狀態顯示
      process.stdout.write(`\r📈 SOUL/USD: $${twapPrice.toFixed(4)} | TWAP週期: ${currentPeriod}s | 偏差: ${(priceDeviation * 100).toFixed(2)}%`);
      
    } catch (error) {
      console.error(`\n❌ 檢查失敗: ${error.message}`);
    }
  }

  calculateSpotPrice(sqrtPriceX96) {
    // 計算現貨價格（假設 token0 是 USD，token1 是 SOUL）
    const price = (Number(sqrtPriceX96) / (2 ** 96)) ** 2;
    // 如果順序相反，需要取倒數
    return 1 / price; // SOUL/USD 價格
  }

  printDetailedReport() {
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 詳細監控報告');
    console.log('='.repeat(60));
    
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    console.log(`⏱️  運行時間: ${Math.floor(runtime / 3600)}小時 ${Math.floor((runtime % 3600) / 60)}分鐘`);
    
    if (this.priceHistory.length > 0) {
      // 價格統計
      const prices = this.priceHistory.map(r => r.twapPrice);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const latestPrice = prices[prices.length - 1];
      
      console.log('\n💰 價格統計：');
      console.log(`   當前價格: $${latestPrice.toFixed(4)}`);
      console.log(`   平均價格: $${avgPrice.toFixed(4)}`);
      console.log(`   最低價格: $${minPrice.toFixed(4)}`);
      console.log(`   最高價格: $${maxPrice.toFixed(4)}`);
      console.log(`   價格範圍: ${((maxPrice - minPrice) / avgPrice * 100).toFixed(2)}%`);
      
      // 偏差統計
      const deviations = this.priceHistory.map(r => r.priceDeviation);
      const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
      const maxDeviation = Math.max(...deviations);
      
      console.log('\n📏 偏差統計：');
      console.log(`   平均偏差: ${(avgDeviation * 100).toFixed(2)}%`);
      console.log(`   最大偏差: ${(maxDeviation * 100).toFixed(2)}%`);
      console.log(`   偏差超過閾值次數: ${deviations.filter(d => d > MONITOR_CONFIG.alertThreshold).length}`);
      
      // 週期統計
      const periodCounts = {};
      this.periodHistory.forEach(p => {
        periodCounts[p.period] = (periodCounts[p.period] || 0) + 1;
      });
      
      console.log('\n⏱️  TWAP 週期使用統計：');
      Object.entries(periodCounts).forEach(([period, count]) => {
        const percentage = (count / this.periodHistory.length * 100).toFixed(1);
        console.log(`   ${period}秒: ${count}次 (${percentage}%)`);
      });
      
      // 週期切換統計
      let switchCount = 0;
      for (let i = 1; i < this.periodHistory.length; i++) {
        if (this.periodHistory[i].period !== this.periodHistory[i - 1].period) {
          switchCount++;
        }
      }
      console.log(`   週期切換次數: ${switchCount}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }

  async saveReport() {
    const reportPath = path.join(__dirname, '..', '..', 'reports', `oracle-monitor-${Date.now()}.json`);
    const report = {
      version: 'V22',
      oracle: v22Config.contracts.ORACLE.address,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      runtime: Date.now() - this.startTime,
      priceHistory: this.priceHistory,
      periodHistory: this.periodHistory,
      statistics: this.calculateStatistics()
    };
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 報告已保存: ${reportPath}`);
  }

  calculateStatistics() {
    if (this.priceHistory.length === 0) return {};
    
    const prices = this.priceHistory.map(r => r.twapPrice);
    const deviations = this.priceHistory.map(r => r.priceDeviation);
    
    return {
      priceStats: {
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        min: Math.min(...prices),
        max: Math.max(...prices),
        volatility: this.calculateVolatility(prices)
      },
      deviationStats: {
        average: deviations.reduce((a, b) => a + b, 0) / deviations.length,
        max: Math.max(...deviations),
        exceedThresholdCount: deviations.filter(d => d > MONITOR_CONFIG.alertThreshold).length
      },
      periodUsage: this.calculatePeriodUsage()
    };
  }

  calculateVolatility(prices) {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  calculatePeriodUsage() {
    const periodCounts = {};
    this.periodHistory.forEach(p => {
      periodCounts[p.period] = (periodCounts[p.period] || 0) + 1;
    });
    
    const total = this.periodHistory.length;
    const usage = {};
    Object.entries(periodCounts).forEach(([period, count]) => {
      usage[period] = {
        count,
        percentage: (count / total * 100)
      };
    });
    
    return usage;
  }

  async start() {
    await this.initialize();
    
    console.log('🚀 開始監控...\n');
    
    // 首次檢查
    await this.checkOracle();
    
    // 定期檢查
    const interval = setInterval(() => {
      this.checkOracle();
    }, MONITOR_CONFIG.checkInterval);
    
    // 優雅退出
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  停止監控...');
      clearInterval(interval);
      
      this.printDetailedReport();
      await this.saveReport();
      
      console.log('\n👋 監控結束');
      process.exit(0);
    });
  }
}

// 執行監控
if (require.main === module) {
  const monitor = new OracleMonitor();
  monitor.start().catch(console.error);
}

module.exports = { OracleMonitor };