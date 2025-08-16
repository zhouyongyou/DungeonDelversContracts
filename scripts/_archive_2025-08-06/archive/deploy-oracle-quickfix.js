#!/usr/bin/env node

// Oracle 快速修補部署腳本
// 僅部署新的 Oracle_QuickFix 並更新 DungeonCore

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 載入環境變數
dotenv.config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// V19 地址
const ADDRESSES = {
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  SOULSHARD: '0x4e02B4d0A6b6a90fDDFF058B8a6148BA3F909915',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  DUNGEON_CORE: '0x3c97732E72Db4Bc9B3033cAAc08C4Be24C3fB84c',
  OLD_ORACLE: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9'
};

async function deployQuickFix() {
  console.log('🚀 開始 Oracle 快速修補部署...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB\n`);

  try {
    // 1. 編譯並載入合約
    console.log('📊 步驟 1: 載入合約...');
    
    // 需要先編譯
    console.log('   請先執行: npx hardhat compile');
    console.log('   等待編譯完成後再繼續...\n');
    
    // 載入 bytecode 和 ABI
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'defi', 'Oracle_QuickFix.sol', 'Oracle_QuickFix.json');
    
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ 找不到編譯文件，請先執行: npx hardhat compile');
      process.exit(1);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const OracleFactory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    
    // 2. 部署新 Oracle
    console.log('📊 步驟 2: 部署 Oracle_QuickFix...');
    console.log(`   Pool: ${ADDRESSES.UNISWAP_POOL}`);
    console.log(`   SoulShard: ${ADDRESSES.SOULSHARD}`);
    console.log(`   USD: ${ADDRESSES.USD}`);
    
    const oracle = await OracleFactory.deploy(
      ADDRESSES.UNISWAP_POOL,
      ADDRESSES.SOULSHARD,
      ADDRESSES.USD
    );
    
    console.log('   ⏳ 等待部署確認...');
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    
    console.log(`   ✅ Oracle_QuickFix 部署成功: ${oracleAddress}`);
    
    // 3. 驗證功能
    console.log('\n📊 步驟 3: 驗證 Oracle 功能...');
    
    // 測試所有函數
    try {
      // 測試原有功能
      const amountOut = await oracle.getAmountOut(ADDRESSES.USD, ethers.parseUnits('2', 18));
      console.log(`   ✅ getAmountOut(USD, 2): ${ethers.formatUnits(amountOut, 18)} SOUL`);
      
      // 測試新增功能
      const latestPrice = await oracle.getLatestPrice();
      console.log(`   ✅ getLatestPrice(): ${ethers.formatUnits(latestPrice, 18)} USD/SOUL`);
      
      const poolAddress = await oracle.poolAddress();
      console.log(`   ✅ poolAddress(): ${poolAddress}`);
      
      const token0 = await oracle.token0();
      const token1 = await oracle.token1();
      console.log(`   ✅ token0(): ${token0}`);
      console.log(`   ✅ token1(): ${token1}`);
      
      const soulToken = await oracle.soulToken();
      console.log(`   ✅ soulToken(): ${soulToken}`);
      
    } catch (error) {
      console.error('   ❌ 功能測試失敗:', error.message);
      process.exit(1);
    }
    
    // 4. 更新 DungeonCore
    console.log('\n📊 步驟 4: 更新 DungeonCore...');
    
    const dungeonCoreABI = [
      'function oracle() view returns (address)',
      'function setOracle(address) returns (bool)',
      'function owner() view returns (address)'
    ];
    
    const dungeonCore = new ethers.Contract(ADDRESSES.DUNGEON_CORE, dungeonCoreABI, deployer);
    
    const currentOracle = await dungeonCore.oracle();
    console.log(`   當前 Oracle: ${currentOracle}`);
    console.log(`   新 Oracle: ${oracleAddress}`);
    
    const owner = await dungeonCore.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error(`   ❌ 部署者不是 DungeonCore 的 owner`);
      console.log(`   DungeonCore owner: ${owner}`);
      console.log(`   部署者: ${deployer.address}`);
      process.exit(1);
    }
    
    console.log('   ⏳ 更新 Oracle 地址...');
    const tx = await dungeonCore.setOracle(oracleAddress);
    await tx.wait();
    console.log('   ✅ DungeonCore Oracle 更新成功');
    
    // 5. 最終驗證
    console.log('\n📊 步驟 5: 最終驗證...');
    
    // 測試 Hero 合約價格查詢
    const heroABI = ['function getRequiredSoulShardAmount(uint256) view returns (uint256)'];
    const hero = new ethers.Contract(ADDRESSES.HERO || '0x141F081922D4015b3157cdA6eE970dff34bb8AAb', heroABI, provider);
    
    try {
      const heroPrice = await hero.getRequiredSoulShardAmount(1);
      console.log(`   ✅ Hero 價格查詢成功: ${ethers.formatUnits(heroPrice, 18)} SOUL`);
      
      if (heroPrice > ethers.parseUnits('10000', 18) && heroPrice < ethers.parseUnits('100000', 18)) {
        console.log('   ✅ 價格在合理範圍內');
      } else {
        console.log('   ⚠️ 價格可能異常，請檢查');
      }
    } catch (error) {
      console.log('   ⚠️ 無法測試 Hero 價格:', error.message);
    }
    
    // 6. 生成更新腳本
    console.log('\n📝 生成配置更新腳本...');
    
    const updateScript = `#!/bin/bash
# Oracle 快速修補 - 配置更新腳本
# 生成時間: ${new Date().toISOString()}

echo "🔄 更新 Oracle 地址..."

# 更新前端
cd /Users/sotadic/Documents/GitHub/DungeonDelvers
sed -i '' "s/${ADDRESSES.OLD_ORACLE}/${oracleAddress}/g" src/config/contracts.ts
echo "✅ 前端配置已更新"

# 更新後端
cd /Users/sotadic/Documents/GitHub/backend-nft-marketplace-master
sed -i '' "s/${ADDRESSES.OLD_ORACLE}/${oracleAddress}/g" .env
echo "✅ 後端配置已更新"

# 更新子圖
cd /Users/sotadic/Documents/DungeonDelvers-Subgraph
sed -i '' "s/${ADDRESSES.OLD_ORACLE}/${oracleAddress}/g" networks.json
echo "✅ 子圖配置已更新"

echo ""
echo "📋 更新摘要:"
echo "   舊 Oracle: ${ADDRESSES.OLD_ORACLE}"
echo "   新 Oracle: ${oracleAddress}"
echo ""
echo "⚠️ 請記得:"
echo "   1. 停用臨時價格覆蓋 (priceOverride.ts)"
echo "   2. 重啟前端和後端服務"
echo "   3. 監控系統運行狀態"
`;
    
    const scriptPath = path.join(__dirname, 'update-oracle-quickfix.sh');
    fs.writeFileSync(scriptPath, updateScript);
    fs.chmodSync(scriptPath, '755');
    console.log(`   ✅ 更新腳本已保存: ${scriptPath}`);
    
    // 總結
    console.log('\n' + '='.repeat(60));
    console.log('✅ Oracle 快速修補完成！\n');
    console.log('📋 部署摘要:');
    console.log(`   新 Oracle 地址: ${oracleAddress}`);
    console.log(`   DungeonCore 已更新: ✅`);
    console.log(`   所有功能測試通過: ✅`);
    console.log('\n📌 下一步:');
    console.log('   1. 執行 ./update-oracle-quickfix.sh 更新配置');
    console.log('   2. 在 src/config/priceOverride.ts 設置 enabled: false');
    console.log('   3. 重啟前端查看價格是否正常顯示');
    console.log('   4. 在 BSCScan 驗證合約');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error);
    process.exit(1);
  }
}

// 執行
deployQuickFix().catch(console.error);