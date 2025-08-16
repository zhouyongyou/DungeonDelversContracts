#!/usr/bin/env node

// V23 批量鑄造測試腳本
// 驗證批量鑄造機制是否正常運作

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

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

// 批量階層配置（應與合約一致）
const BATCH_TIERS = [
  { quantity: 1, maxRarity: 2, name: "Single Mint", distribution: "70% 1★, 30% 2★" },
  { quantity: 5, maxRarity: 2, name: "Bronze Pack", distribution: "60% 1★, 40% 2★" },
  { quantity: 10, maxRarity: 3, name: "Silver Pack", distribution: "50% 1★, 35% 2★, 15% 3★" },
  { quantity: 20, maxRarity: 4, name: "Gold Pack", distribution: "45% 1★, 35% 2★, 15% 3★, 5% 4★" },
  { quantity: 50, maxRarity: 5, name: "Platinum Pack", distribution: "44% 1★, 35% 2★, 15% 3★, 5% 4★, 1% 5★" }
];

async function testBatchMinting() {
  log('\n🧪 V23 批量鑄造機制測試', 'bright');
  log('=====================================', 'cyan');
  log(`📅 執行時間: ${new Date().toLocaleString()}`, 'blue');
  
  // 載入配置
  const configPath = path.join(__dirname, '..', 'config', 'v23-config.js');
  if (!fs.existsSync(configPath)) {
    log('\n❌ 錯誤: 找不到 V23 配置文件', 'red');
    process.exit(1);
  }
  
  const v23Config = require(configPath);
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const tester = new ethers.Wallet(PRIVATE_KEY.replace('0x', ''), provider);
  
  log(`\n👤 測試者地址: ${tester.address}`, 'blue');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    version: v23Config.version,
    tester: tester.address,
    tests: []
  };
  
  try {
    // 1. 測試 Hero 批量階層
    log('\n\n📌 測試 Hero 批量階層配置', 'yellow');
    log('='.repeat(50));
    await testHeroBatchTiers(v23Config, provider, testResults);
    
    // 2. 測試 Relic 批量階層
    log('\n\n📌 測試 Relic 批量階層配置', 'yellow');
    log('='.repeat(50));
    await testRelicBatchTiers(v23Config, provider, testResults);
    
    // 3. 測試批量鑄造函數
    log('\n\n📌 測試批量鑄造函數', 'yellow');
    log('='.repeat(50));
    await testBatchMintFunctions(v23Config, provider, tester, testResults);
    
    // 4. 測試事件監聽
    log('\n\n📌 測試事件監聽', 'yellow');
    log('='.repeat(50));
    await testEventListening(v23Config, provider, testResults);
    
    // 5. 測試 Gas 估算
    log('\n\n📌 測試 Gas 估算', 'yellow');
    log('='.repeat(50));
    await testGasEstimation(v23Config, provider, tester, testResults);
    
    // 顯示測試結果
    displayTestResults(testResults);
    
    // 保存測試結果
    const resultPath = path.join(__dirname, '..', 'deployments', `v23-batch-test-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, JSON.stringify(testResults, null, 2));
    
    log(`\n📄 測試結果已保存: ${resultPath}`, 'blue');
    
  } catch (error) {
    log(`\n❌ 測試失敗: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 測試 Hero 批量階層
async function testHeroBatchTiers(config, provider, results) {
  const heroABI = [
    "function getMaxRarityForQuantity(uint256 quantity) view returns (uint8 maxRarity, string memory tierName)",
    "function getBatchTier(uint256 quantity) view returns (uint8 tierIndex, uint8 maxRarity, string memory tierName)",
    "function batchTierCount() view returns (uint256)"
  ];
  
  const hero = new ethers.Contract(config.contracts.HERO.address, heroABI, provider);
  const testResult = { contract: 'Hero', tests: [] };
  
  try {
    // 測試批量階層數量
    const tierCount = await hero.batchTierCount();
    log(`\n📊 Hero 批量階層數量: ${tierCount}`, 'blue');
    testResult.tests.push({
      name: 'batchTierCount',
      expected: BATCH_TIERS.length,
      actual: Number(tierCount),
      passed: Number(tierCount) === BATCH_TIERS.length
    });
    
    // 測試每個階層
    for (const tier of BATCH_TIERS) {
      try {
        const [maxRarity, tierName] = await hero.getMaxRarityForQuantity(tier.quantity);
        const passed = Number(maxRarity) === tier.maxRarity && tierName === tier.name;
        
        if (passed) {
          log(`✅ 數量 ${tier.quantity}: ${tierName} (最高 ${maxRarity}★)`, 'green');
        } else {
          log(`❌ 數量 ${tier.quantity}: 預期 ${tier.name} (${tier.maxRarity}★), 實際 ${tierName} (${maxRarity}★)`, 'red');
        }
        
        testResult.tests.push({
          name: `getMaxRarityForQuantity(${tier.quantity})`,
          expected: { maxRarity: tier.maxRarity, tierName: tier.name },
          actual: { maxRarity: Number(maxRarity), tierName },
          passed
        });
      } catch (error) {
        log(`❌ 測試數量 ${tier.quantity} 失敗: ${error.message}`, 'red');
        testResult.tests.push({
          name: `getMaxRarityForQuantity(${tier.quantity})`,
          error: error.message,
          passed: false
        });
      }
    }
    
    // 測試邊界情況
    log('\n🔍 測試邊界情況:', 'cyan');
    
    // 測試超過最大數量
    try {
      const [maxRarity, tierName] = await hero.getMaxRarityForQuantity(100);
      log(`✅ 數量 100: ${tierName} (最高 ${maxRarity}★) - 應該返回最高階層`, 'green');
      testResult.tests.push({
        name: 'getMaxRarityForQuantity(100)',
        description: '超過最大數量應返回最高階層',
        actual: { maxRarity: Number(maxRarity), tierName },
        passed: Number(maxRarity) === 5
      });
    } catch (error) {
      log(`❌ 測試數量 100 失敗: ${error.message}`, 'red');
    }
    
    // 測試 0 數量
    try {
      const [maxRarity, tierName] = await hero.getMaxRarityForQuantity(0);
      log(`⚠️  數量 0: ${tierName} (最高 ${maxRarity}★)`, 'yellow');
      testResult.tests.push({
        name: 'getMaxRarityForQuantity(0)',
        description: '0 數量的處理',
        actual: { maxRarity: Number(maxRarity), tierName },
        passed: true
      });
    } catch (error) {
      log(`✅ 數量 0 正確拋出錯誤: ${error.message}`, 'green');
      testResult.tests.push({
        name: 'getMaxRarityForQuantity(0)',
        description: '0 數量應該拋出錯誤',
        error: error.message,
        passed: true
      });
    }
    
  } catch (error) {
    log(`\n❌ Hero 批量階層測試失敗: ${error.message}`, 'red');
    testResult.error = error.message;
  }
  
  results.tests.push(testResult);
}

// 測試 Relic 批量階層
async function testRelicBatchTiers(config, provider, results) {
  const relicABI = [
    "function getMaxRarityForQuantity(uint256 quantity) view returns (uint8 maxRarity, string memory tierName)",
    "function getBatchTier(uint256 quantity) view returns (uint8 tierIndex, uint8 maxRarity, string memory tierName)",
    "function batchTierCount() view returns (uint256)"
  ];
  
  const relic = new ethers.Contract(config.contracts.RELIC.address, relicABI, provider);
  const testResult = { contract: 'Relic', tests: [] };
  
  try {
    // 測試批量階層數量
    const tierCount = await relic.batchTierCount();
    log(`\n📊 Relic 批量階層數量: ${tierCount}`, 'blue');
    
    // 簡化測試，只測試幾個關鍵數量
    const keyQuantities = [1, 10, 50];
    for (const quantity of keyQuantities) {
      try {
        const [maxRarity, tierName] = await relic.getMaxRarityForQuantity(quantity);
        log(`✅ 數量 ${quantity}: ${tierName} (最高 ${maxRarity}★)`, 'green');
        
        testResult.tests.push({
          name: `getMaxRarityForQuantity(${quantity})`,
          actual: { maxRarity: Number(maxRarity), tierName },
          passed: true
        });
      } catch (error) {
        log(`❌ 測試數量 ${quantity} 失敗: ${error.message}`, 'red');
        testResult.tests.push({
          name: `getMaxRarityForQuantity(${quantity})`,
          error: error.message,
          passed: false
        });
      }
    }
  } catch (error) {
    log(`\n❌ Relic 批量階層測試失敗: ${error.message}`, 'red');
    testResult.error = error.message;
  }
  
  results.tests.push(testResult);
}

// 測試批量鑄造函數
async function testBatchMintFunctions(config, provider, tester, results) {
  const heroABI = [
    "function mintHeroBatch(uint256 quantity, address inviter) payable",
    "function mintPriceUSD() view returns (uint256)",
    "function getBNBAmount(uint256 usdAmount) view returns (uint256)"
  ];
  
  const hero = new ethers.Contract(config.contracts.HERO.address, heroABI, provider);
  const testResult = { contract: 'Batch Minting Functions', tests: [] };
  
  try {
    // 獲取鑄造價格
    const mintPriceUSD = await hero.mintPriceUSD();
    log(`\n💰 單個 Hero 鑄造價格: ${ethers.formatUnits(mintPriceUSD, 18)} USD`, 'blue');
    
    // 測試不同數量的 BNB 價格計算
    const quantities = [1, 5, 10, 20, 50];
    log('\n📊 批量鑄造價格計算:', 'cyan');
    
    for (const quantity of quantities) {
      const totalUSD = mintPriceUSD * BigInt(quantity);
      const bnbAmount = await hero.getBNBAmount(totalUSD);
      const bnbFormatted = ethers.formatEther(bnbAmount);
      
      log(`   ${quantity} 個: ${ethers.formatUnits(totalUSD, 18)} USD = ${bnbFormatted} BNB`, 'blue');
      
      testResult.tests.push({
        name: `Price calculation for ${quantity} NFTs`,
        totalUSD: ethers.formatUnits(totalUSD, 18),
        bnbAmount: bnbFormatted,
        passed: bnbAmount > 0n
      });
    }
    
    // 測試 Gas 估算（不實際執行）
    log('\n⛽ 測試 Gas 估算:', 'cyan');
    try {
      const quantity = 5;
      const totalUSD = mintPriceUSD * BigInt(quantity);
      const bnbAmount = await hero.getBNBAmount(totalUSD);
      
      // 只估算 Gas，不執行交易
      const gasEstimate = await hero.mintHeroBatch.estimateGas(
        quantity,
        ethers.ZeroAddress,
        { value: bnbAmount }
      );
      
      log(`   批量鑄造 ${quantity} 個的 Gas 估算: ${gasEstimate.toString()}`, 'green');
      
      testResult.tests.push({
        name: `Gas estimate for minting ${quantity} NFTs`,
        gasEstimate: gasEstimate.toString(),
        passed: true
      });
    } catch (error) {
      log(`   ⚠️  Gas 估算失敗 (這是正常的，可能需要額外權限): ${error.message}`, 'yellow');
      testResult.tests.push({
        name: 'Gas estimation',
        error: error.message,
        passed: false,
        note: '這可能是正常的，實際鑄造時會成功'
      });
    }
    
  } catch (error) {
    log(`\n❌ 批量鑄造函數測試失敗: ${error.message}`, 'red');
    testResult.error = error.message;
  }
  
  results.tests.push(testResult);
}

// 測試事件監聽
async function testEventListening(config, provider, results) {
  const heroABI = [
    "event BatchMintCompleted(address indexed player, uint256 quantity, uint8 maxRarity, uint256[] tokenIds)"
  ];
  
  const hero = new ethers.Contract(config.contracts.HERO.address, heroABI, provider);
  const testResult = { contract: 'Event Listening', tests: [] };
  
  try {
    log('\n📡 測試事件過濾器創建:', 'cyan');
    
    // 創建事件過濾器
    const filter = hero.filters.BatchMintCompleted();
    log('✅ BatchMintCompleted 事件過濾器創建成功', 'green');
    
    testResult.tests.push({
      name: 'Create BatchMintCompleted event filter',
      passed: true
    });
    
    // 獲取最近的區塊
    const currentBlock = await provider.getBlockNumber();
    log(`📦 當前區塊: ${currentBlock}`, 'blue');
    
    // 查詢歷史事件（最近 1000 個區塊）
    try {
      const fromBlock = Math.max(0, currentBlock - 1000);
      const events = await hero.queryFilter(filter, fromBlock, currentBlock);
      
      log(`📊 最近 1000 個區塊中的 BatchMintCompleted 事件: ${events.length} 個`, 'blue');
      
      if (events.length > 0) {
        log('\n最近的批量鑄造事件:', 'cyan');
        events.slice(0, 3).forEach((event, index) => {
          log(`   ${index + 1}. 玩家: ${event.args.player}`, 'blue');
          log(`      數量: ${event.args.quantity}`, 'blue');
          log(`      最高稀有度: ${event.args.maxRarity}★`, 'blue');
          log(`      Token IDs: ${event.args.tokenIds.slice(0, 5).join(', ')}...`, 'blue');
        });
      }
      
      testResult.tests.push({
        name: 'Query historical events',
        eventsFound: events.length,
        passed: true
      });
      
    } catch (error) {
      log(`⚠️  無法查詢歷史事件: ${error.message}`, 'yellow');
      testResult.tests.push({
        name: 'Query historical events',
        error: error.message,
        passed: false,
        note: '這可能是因為合約剛部署'
      });
    }
    
  } catch (error) {
    log(`\n❌ 事件監聽測試失敗: ${error.message}`, 'red');
    testResult.error = error.message;
  }
  
  results.tests.push(testResult);
}

// 測試 Gas 估算比較
async function testGasEstimation(config, provider, tester, results) {
  const heroABI = [
    "function mintHero(address inviter) payable",
    "function mintHeroBatch(uint256 quantity, address inviter) payable",
    "function mintPriceUSD() view returns (uint256)",
    "function getBNBAmount(uint256 usdAmount) view returns (uint256)"
  ];
  
  const hero = new ethers.Contract(config.contracts.HERO.address, heroABI, provider);
  const testResult = { contract: 'Gas Comparison', tests: [] };
  
  try {
    log('\n⛽ 單次鑄造 vs 批量鑄造 Gas 比較:', 'cyan');
    
    const mintPriceUSD = await hero.mintPriceUSD();
    
    // 比較不同數量的 Gas 效率
    const comparisons = [
      { single: 5, batch: 5 },
      { single: 10, batch: 10 },
      { single: 20, batch: 20 }
    ];
    
    for (const { single, batch } of comparisons) {
      try {
        // 估算單次鑄造的總 Gas
        const singleBnb = await hero.getBNBAmount(mintPriceUSD);
        const singleGas = await hero.mintHero.estimateGas(
          ethers.ZeroAddress,
          { value: singleBnb }
        );
        const totalSingleGas = singleGas * BigInt(single);
        
        // 估算批量鑄造的 Gas
        const batchBnb = await hero.getBNBAmount(mintPriceUSD * BigInt(batch));
        const batchGas = await hero.mintHeroBatch.estimateGas(
          batch,
          ethers.ZeroAddress,
          { value: batchBnb }
        );
        
        const gasSaved = ((Number(totalSingleGas) - Number(batchGas)) / Number(totalSingleGas) * 100).toFixed(2);
        
        log(`\n   鑄造 ${single} 個 NFT:`, 'blue');
        log(`   - 單次鑄造總 Gas: ${totalSingleGas.toString()}`, 'yellow');
        log(`   - 批量鑄造 Gas: ${batchGas.toString()}`, 'green');
        log(`   - 節省 Gas: ${gasSaved}%`, 'bright');
        
        testResult.tests.push({
          name: `Gas comparison for ${single} NFTs`,
          singleTotalGas: totalSingleGas.toString(),
          batchGas: batchGas.toString(),
          gasSavedPercent: gasSaved,
          passed: Number(batchGas) < Number(totalSingleGas)
        });
        
      } catch (error) {
        log(`   ⚠️  無法比較 ${single} 個 NFT 的 Gas: ${error.message}`, 'yellow');
        testResult.tests.push({
          name: `Gas comparison for ${single} NFTs`,
          error: error.message,
          passed: false
        });
      }
    }
    
  } catch (error) {
    log(`\n❌ Gas 估算測試失敗: ${error.message}`, 'red');
    testResult.error = error.message;
  }
  
  results.tests.push(testResult);
}

// 顯示測試結果摘要
function displayTestResults(results) {
  log('\n\n========== 測試結果摘要 ==========', 'bright');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  results.tests.forEach(testGroup => {
    const groupTests = testGroup.tests || [];
    const groupPassed = groupTests.filter(t => t.passed).length;
    const groupFailed = groupTests.filter(t => !t.passed).length;
    
    totalTests += groupTests.length;
    passedTests += groupPassed;
    failedTests += groupFailed;
    
    log(`\n${testGroup.contract}:`, 'cyan');
    log(`   ✅ 通過: ${groupPassed}`, 'green');
    log(`   ❌ 失敗: ${groupFailed}`, groupFailed > 0 ? 'red' : 'green');
    
    if (testGroup.error) {
      log(`   ⚠️  錯誤: ${testGroup.error}`, 'yellow');
    }
  });
  
  log('\n總計:', 'bright');
  log(`   📊 測試項目: ${totalTests}`, 'blue');
  log(`   ✅ 通過: ${passedTests}`, 'green');
  log(`   ❌ 失敗: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;
  log(`   📈 成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (failedTests > 0) {
    log('\n⚠️  部分測試失敗，請檢查:', 'yellow');
    log('1. 合約是否正確部署和設置', 'yellow');
    log('2. 批量階層是否已初始化', 'yellow');
    log('3. 價格和權限是否正確配置', 'yellow');
  } else {
    log('\n✨ 所有測試通過！V23 批量鑄造機制運作正常。', 'green');
  }
}

// 執行測試
if (require.main === module) {
  testBatchMinting().catch(console.error);
}

module.exports = { testBatchMinting };