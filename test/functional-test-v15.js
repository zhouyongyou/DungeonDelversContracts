#!/usr/bin/env node

/**
 * DungeonDelvers V15 功能測試腳本
 * 測試所有核心功能是否正常運作
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 載入部署地址
const V15_DEPLOYMENT = JSON.parse(fs.readFileSync(path.join(__dirname, '../deployments/V15_DEPLOYMENT_2025-07-23.json'), 'utf8'));

// 合約地址
const CONTRACTS = {
  testUSD: V15_DEPLOYMENT.TestUSD.address,
  soulShard: V15_DEPLOYMENT.SoulShard.address,
  hero: V15_DEPLOYMENT.Hero.address,
  relic: V15_DEPLOYMENT.Relic.address,
  party: V15_DEPLOYMENT.Party.address,
  dungeonCore: V15_DEPLOYMENT.DungeonCore.address,
  dungeonMaster: V15_DEPLOYMENT.DungeonMaster.address,
  dungeonStorage: V15_DEPLOYMENT.DungeonStorage.address,
  playerVault: V15_DEPLOYMENT.PlayerVault.address,
  playerProfile: V15_DEPLOYMENT.PlayerProfile.address,
  vipStaking: V15_DEPLOYMENT.VIPStaking.address,
  oracle: V15_DEPLOYMENT.Oracle.address,
  altarOfAscension: V15_DEPLOYMENT.AltarOfAscension.address
};

// 測試結果
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 執行測試並記錄結果
async function runTest(testName, testFunction) {
  testResults.total++;
  log(`\n🧪 測試: ${testName}`, 'cyan');
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED', error: null });
    log(`  ✅ 通過`, 'green');
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    log(`  ❌ 失敗: ${error.message}`, 'red');
  }
}

// 主測試函數
async function runFunctionalTests() {
  log('\n🚀 DungeonDelvers V15 功能測試', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const [signer] = await ethers.getSigners();
  log(`\n📍 測試帳號: ${signer.address}`, 'yellow');
  
  // 載入合約
  const testUSD = await ethers.getContractAt("Test_USD", CONTRACTS.testUSD);
  const soulShard = await ethers.getContractAt("Test_SoulShard", CONTRACTS.soulShard);
  const hero = await ethers.getContractAt("Hero", CONTRACTS.hero);
  const relic = await ethers.getContractAt("Relic", CONTRACTS.relic);
  const party = await ethers.getContractAt("Party", CONTRACTS.party);
  const dungeonCore = await ethers.getContractAt("DungeonCore", CONTRACTS.dungeonCore);
  const dungeonMaster = await ethers.getContractAt("DungeonMaster", CONTRACTS.dungeonMaster);
  const dungeonStorage = await ethers.getContractAt("DungeonStorage", CONTRACTS.dungeonStorage);
  const playerVault = await ethers.getContractAt("PlayerVault", CONTRACTS.playerVault);
  const playerProfile = await ethers.getContractAt("PlayerProfile", CONTRACTS.playerProfile);
  const vipStaking = await ethers.getContractAt("VIPStaking", CONTRACTS.vipStaking);
  const oracle = await ethers.getContractAt("Oracle", CONTRACTS.oracle);
  const altarOfAscension = await ethers.getContractAt("AltarOfAscension", CONTRACTS.altarOfAscension);
  
  // 1. 測試合約連接
  await runTest("合約地址設定", async () => {
    const coreAddress = await hero.dungeonCore();
    if (coreAddress !== CONTRACTS.dungeonCore) {
      throw new Error("Hero 合約的 DungeonCore 地址不正確");
    }
    
    const storageAddress = await dungeonMaster.dungeonStorage();
    if (storageAddress !== CONTRACTS.dungeonStorage) {
      throw new Error("DungeonMaster 的 DungeonStorage 地址不正確");
    }
  });
  
  // 2. 測試預言機
  await runTest("預言機價格", async () => {
    const usdPrice = await oracle.getLatestUSDPrice();
    const soulPrice = await oracle.getLatestSOULPrice();
    
    log(`    USD 價格: ${ethers.formatEther(usdPrice)} USD`, 'cyan');
    log(`    SOUL 價格: ${ethers.formatEther(soulPrice)} USD`, 'cyan');
    
    if (usdPrice == 0 || soulPrice == 0) {
      throw new Error("預言機價格為 0");
    }
  });
  
  // 3. 測試代幣鑄造
  await runTest("USD 代幣鑄造", async () => {
    const amount = ethers.parseEther("1000");
    const balanceBefore = await testUSD.balanceOf(signer.address);
    
    await testUSD.mint(signer.address, amount);
    
    const balanceAfter = await testUSD.balanceOf(signer.address);
    const diff = balanceAfter - balanceBefore;
    
    if (diff !== amount) {
      throw new Error(`鑄造數量不正確: 期望 ${amount}, 實際 ${diff}`);
    }
  });
  
  await runTest("SOUL 代幣鑄造", async () => {
    const amount = ethers.parseEther("1000");
    const balanceBefore = await soulShard.balanceOf(signer.address);
    
    await soulShard.mint(signer.address, amount);
    
    const balanceAfter = await soulShard.balanceOf(signer.address);
    const diff = balanceAfter - balanceBefore;
    
    if (diff !== amount) {
      throw new Error(`鑄造數量不正確: 期望 ${amount}, 實際 ${diff}`);
    }
  });
  
  // 4. 測試玩家金庫存取
  await runTest("存入 USD 到金庫", async () => {
    const amount = ethers.parseEther("100");
    
    // 先授權
    await testUSD.approve(CONTRACTS.playerVault, amount);
    
    const vaultBalanceBefore = await playerVault.balances(signer.address, CONTRACTS.testUSD);
    await playerVault.deposit(CONTRACTS.testUSD, amount);
    const vaultBalanceAfter = await playerVault.balances(signer.address, CONTRACTS.testUSD);
    
    const diff = vaultBalanceAfter - vaultBalanceBefore;
    if (diff !== amount) {
      throw new Error(`存入數量不正確: 期望 ${amount}, 實際 ${diff}`);
    }
  });
  
  await runTest("從金庫提取 USD", async () => {
    const amount = ethers.parseEther("50");
    
    const vaultBalanceBefore = await playerVault.balances(signer.address, CONTRACTS.testUSD);
    const tokenBalanceBefore = await testUSD.balanceOf(signer.address);
    
    await playerVault.withdraw(CONTRACTS.testUSD, amount);
    
    const vaultBalanceAfter = await playerVault.balances(signer.address, CONTRACTS.testUSD);
    const tokenBalanceAfter = await testUSD.balanceOf(signer.address);
    
    const vaultDiff = vaultBalanceBefore - vaultBalanceAfter;
    const tokenDiff = tokenBalanceAfter - tokenBalanceBefore;
    
    if (vaultDiff !== amount || tokenDiff !== amount) {
      throw new Error(`提取數量不正確`);
    }
  });
  
  // 5. 測試 NFT 鑄造（使用 BNB）
  await runTest("鑄造英雄 NFT", async () => {
    const mintPrice = await hero.mintPriceBNB();
    log(`    鑄造價格: ${ethers.formatEther(mintPrice)} BNB`, 'cyan');
    
    const balanceBefore = await hero.balanceOf(signer.address);
    
    const tx = await hero.mintHero(1, { value: mintPrice });
    await tx.wait();
    
    const balanceAfter = await hero.balanceOf(signer.address);
    
    if (balanceAfter - balanceBefore !== 1n) {
      throw new Error("英雄 NFT 鑄造失敗");
    }
    
    // 獲取最新的 tokenId
    const totalSupply = await hero.totalSupply();
    const tokenId = totalSupply;
    log(`    鑄造的英雄 ID: ${tokenId}`, 'cyan');
    
    // 檢查英雄屬性
    const stats = await hero.getHeroStats(tokenId);
    log(`    英雄稀有度: ${stats.rarity}`, 'cyan');
    log(`    英雄力量: ${stats.power}`, 'cyan');
  });
  
  await runTest("鑄造聖物 NFT", async () => {
    const mintPrice = await relic.mintPriceBNB();
    const balanceBefore = await relic.balanceOf(signer.address);
    
    const tx = await relic.mintRelic(1, { value: mintPrice });
    await tx.wait();
    
    const balanceAfter = await relic.balanceOf(signer.address);
    
    if (balanceAfter - balanceBefore !== 1n) {
      throw new Error("聖物 NFT 鑄造失敗");
    }
  });
  
  // 6. 測試隊伍創建
  await runTest("創建隊伍", async () => {
    const totalSupply = await hero.totalSupply();
    const heroIds = [];
    
    // 找出擁有的英雄
    for (let i = 1; i <= totalSupply; i++) {
      const owner = await hero.ownerOf(i);
      if (owner === signer.address) {
        heroIds.push(i);
        if (heroIds.length >= 3) break;
      }
    }
    
    if (heroIds.length < 3) {
      throw new Error("英雄數量不足，無法創建隊伍");
    }
    
    log(`    使用英雄: ${heroIds.join(', ')}`, 'cyan');
    
    const partyBalanceBefore = await party.balanceOf(signer.address);
    
    const tx = await party.createParty(heroIds);
    await tx.wait();
    
    const partyBalanceAfter = await party.balanceOf(signer.address);
    
    if (partyBalanceAfter - partyBalanceBefore !== 1n) {
      throw new Error("隊伍創建失敗");
    }
    
    const partyTotalSupply = await party.totalSupply();
    const partyId = partyTotalSupply;
    log(`    創建的隊伍 ID: ${partyId}`, 'cyan');
  });
  
  // 7. 測試 VIP 質押
  await runTest("VIP NFT 質押", async () => {
    // 先鑄造 VIP NFT
    const mintPrice = await vipStaking.mintPriceBNB();
    const tx1 = await vipStaking.mintVIPPass(1, { value: mintPrice });
    await tx1.wait();
    
    const totalSupply = await vipStaking.totalSupply();
    const vipTokenId = totalSupply;
    
    // 質押 VIP
    const tx2 = await vipStaking.stake(vipTokenId);
    await tx2.wait();
    
    const isStaked = await vipStaking.isStaked(vipTokenId);
    if (!isStaked) {
      throw new Error("VIP 質押失敗");
    }
    
    log(`    VIP #${vipTokenId} 已成功質押`, 'cyan');
  });
  
  // 8. 測試玩家檔案
  await runTest("創建玩家檔案", async () => {
    const hasProfile = await playerProfile.hasProfile(signer.address);
    
    if (!hasProfile) {
      const tx = await playerProfile.createProfile();
      await tx.wait();
      
      const hasProfileAfter = await playerProfile.hasProfile(signer.address);
      if (!hasProfileAfter) {
        throw new Error("玩家檔案創建失敗");
      }
    }
    
    const profileTokenId = await playerProfile.getPlayerTokenId(signer.address);
    log(`    玩家檔案 NFT ID: ${profileTokenId}`, 'cyan');
  });
  
  // 9. 測試升星系統
  await runTest("升星祭壇", async () => {
    // 先準備足夠的英雄
    const mintPrice = await hero.mintPriceBNB();
    const neededHeroes = 3;
    
    for (let i = 0; i < neededHeroes; i++) {
      const tx = await hero.mintHero(1, { value: mintPrice });
      await tx.wait();
    }
    
    const totalSupply = await hero.totalSupply();
    const heroIds = [];
    
    // 找出最後 3 個英雄
    for (let i = totalSupply - 2; i <= totalSupply; i++) {
      heroIds.push(i);
    }
    
    log(`    使用英雄: ${heroIds.join(', ')}`, 'cyan');
    
    // 授權祭壇合約
    const isApproved = await hero.isApprovedForAll(signer.address, CONTRACTS.altarOfAscension);
    if (!isApproved) {
      await hero.setApprovalForAll(CONTRACTS.altarOfAscension, true);
    }
    
    // 計算費用
    const upgradeFee = await altarOfAscension.getUpgradeFeeInBNB();
    log(`    升星費用: ${ethers.formatEther(upgradeFee)} BNB`, 'cyan');
    
    // 執行升星
    const tx = await altarOfAscension.upgradeHero(heroIds[0], [heroIds[1], heroIds[2]], {
      value: upgradeFee
    });
    const receipt = await tx.wait();
    
    // 檢查結果
    const events = receipt.logs.filter(log => log.topics[0] === altarOfAscension.interface.getEvent('HeroUpgraded').topicHash);
    if (events.length === 0) {
      throw new Error("升星失敗，沒有觸發 HeroUpgraded 事件");
    }
    
    log(`    升星成功！`, 'cyan');
  });
  
  // 10. 測試地城探索
  await runTest("地城探索", async () => {
    // 獲取一個隊伍
    const partyBalance = await party.balanceOf(signer.address);
    if (partyBalance === 0n) {
      throw new Error("沒有隊伍，無法探索地城");
    }
    
    const partyTotalSupply = await party.totalSupply();
    let partyId;
    
    // 找出擁有的隊伍
    for (let i = 1; i <= partyTotalSupply; i++) {
      try {
        const owner = await party.ownerOf(i);
        if (owner === signer.address) {
          partyId = i;
          break;
        }
      } catch (e) {
        // 跳過不存在的隊伍
      }
    }
    
    if (!partyId) {
      throw new Error("找不到可用的隊伍");
    }
    
    log(`    使用隊伍 ID: ${partyId}`, 'cyan');
    
    // 授權 DungeonMaster
    const isApproved = await party.isApprovedForAll(signer.address, CONTRACTS.dungeonMaster);
    if (!isApproved) {
      await party.setApprovalForAll(CONTRACTS.dungeonMaster, true);
    }
    
    // 獲取探索費用
    const exploreFee = await dungeonMaster.getExploreFeeInBNB();
    log(`    探索費用: ${ethers.formatEther(exploreFee)} BNB`, 'cyan');
    
    // 開始探索
    const tx = await dungeonMaster.startExploration(partyId, { value: exploreFee });
    const receipt = await tx.wait();
    
    // 檢查事件
    const events = receipt.logs.filter(log => log.topics[0] === dungeonMaster.interface.getEvent('ExplorationStarted').topicHash);
    if (events.length === 0) {
      throw new Error("探索開始失敗");
    }
    
    log(`    地城探索已開始！`, 'cyan');
  });
  
  // 顯示測試結果
  log('\n' + '=' .repeat(50), 'magenta');
  log('📊 測試結果總結', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  log(`\n總測試數: ${testResults.total}`, 'yellow');
  log(`✅ 通過: ${testResults.passed}`, 'green');
  log(`❌ 失敗: ${testResults.failed}`, 'red');
  log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'cyan');
  
  if (testResults.failed > 0) {
    log('\n❌ 失敗的測試:', 'red');
    testResults.details
      .filter(t => t.status === 'FAILED')
      .forEach(t => {
        log(`  - ${t.name}: ${t.error}`, 'red');
      });
  }
  
  // 保存測試報告
  const report = {
    timestamp: new Date().toISOString(),
    network: 'BSC Mainnet',
    version: 'V15',
    results: testResults,
    contracts: CONTRACTS
  };
  
  const reportPath = path.join(__dirname, '../test-reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(reportPath, `functional-test-v15-${Date.now()}.json`),
    JSON.stringify(report, null, 2)
  );
  
  log('\n📄 測試報告已保存', 'green');
  
  return testResults.failed === 0;
}

// 執行測試
if (require.main === module) {
  runFunctionalTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ 測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { runFunctionalTests };