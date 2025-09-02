#!/usr/bin/env node

// V23 增強版設置腳本 - 包含 ContractURI 和動態種子更新

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// Base URI 配置（用於每個 NFT 的元數據）
const BASE_URIS = {
  HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
  RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
  PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
  VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
  PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/'
};

// Contract URI 配置（用於合約級別的元數據，如 OpenSea 顯示的合約信息）
// 使用前端靜態文件，已經在 /public/metadata/ 目錄準備好
const CONTRACT_URIS = {
  HERO: 'https://www.dungeondelvers.xyz/metadata/hero-collection.json',
  RELIC: 'https://www.dungeondelvers.xyz/metadata/relic-collection.json',
  PARTY: 'https://www.dungeondelvers.xyz/metadata/party-collection.json',
  VIPSTAKING: 'https://www.dungeondelvers.xyz/metadata/vip-staking-collection.json',
  PLAYERPROFILE: 'https://www.dungeondelvers.xyz/metadata/player-profile-collection.json'
};

// 費用參數
const FEE_PARAMS = {
  DUNGEONMASTER_WALLET: '0xEbCF4A36Ad1485A9737025e9d72186b604487274'
};

async function setupV23ContractsEnhanced() {
  console.log('🔧 開始 V23 增強版合約設置...\n');
  
  // 載入 V23 配置
  const configPath = path.join(__dirname, '..', '..', 'config', 'v23-config.js');
  if (!fs.existsSync(configPath)) {
    console.error('❌ 錯誤: 找不到 V23 配置文件，請先執行部署腳本');
    process.exit(1);
  }
  
  const v23Config = require(configPath);
  console.log(`📋 版本: ${v23Config.version}`);
  console.log(`📅 部署時間: ${v23Config.lastUpdated}`);
  console.log(`🌐 網路: ${v23Config.network}\n`);
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 設置者地址: ${deployer.address}\n`);
  
  const setupState = {
    totalSteps: 0,
    completedSteps: 0,
    failedSteps: []
  };
  
  try {
    // 執行原有的所有設置
    console.log('📌 執行基礎設置腳本...');
    const { setupV23Contracts } = require('./setup-v23-complete');
    await setupV23Contracts();
    
    // Phase 7: 設置 Contract URI
    console.log('\n📌 Phase 7: 設置 Contract URI (合約級元數據)');
    console.log('='.repeat(50));
    await setupContractURIs(v23Config.contracts, deployer, setupState);
    
    // Phase 8: 更新動態種子
    console.log('\n📌 Phase 8: 更新動態種子');
    console.log('='.repeat(50));
    await updateDynamicSeeds(v23Config.contracts, deployer, setupState);
    
    // 保存增強設置結果
    const setupResult = {
      version: 'V23-Enhanced',
      timestamp: new Date().toISOString(),
      setupBy: deployer.address,
      enhancedSteps: setupState.totalSteps,
      completedSteps: setupState.completedSteps,
      failedSteps: setupState.failedSteps
    };
    
    const resultPath = path.join(__dirname, '..', 'deployments', `v23-enhanced-setup-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
    fs.writeFileSync(resultPath, JSON.stringify(setupResult, null, 2));
    
    // 顯示結果
    console.log('\n\n✅ V23 增強設置完成！');
    console.log('='.repeat(50));
    console.log(`📊 增強步驟: ${setupState.totalSteps}`);
    console.log(`✅ 成功: ${setupState.completedSteps}`);
    console.log(`❌ 失敗: ${setupState.failedSteps.length}`);
    
    if (setupState.failedSteps.length > 0) {
      console.log('\n⚠️ 失敗的步驟:');
      setupState.failedSteps.forEach(step => {
        console.log(`   - ${step.name}: ${step.error}`);
      });
    }
    
    console.log(`\n📄 增強設置結果: ${resultPath}`);
    
  } catch (error) {
    console.error('\n❌ 增強設置失敗:', error);
    process.exit(1);
  }
}

// Phase 7: 設置 Contract URI
async function setupContractURIs(contracts, deployer, state) {
  console.log('\n🎨 Contract URI vs Base URI 說明:');
  console.log('   - Base URI: 用於每個 NFT 的元數據 (tokenURI)');
  console.log('   - Contract URI: 用於整個合約的元數據 (在 OpenSea 顯示)');
  console.log('   - Contract URI 應返回符合 OpenSea 標準的 JSON\n');
  
  const steps = [
    {
      name: 'Hero.setContractURI',
      contract: contracts.HERO.address,
      method: 'setContractURI',
      args: [CONTRACT_URIS.HERO],
      description: 'Hero 設置 Contract URI'
    },
    {
      name: 'Relic.setContractURI',
      contract: contracts.RELIC.address,
      method: 'setContractURI',
      args: [CONTRACT_URIS.RELIC],
      description: 'Relic 設置 Contract URI'
    },
    {
      name: 'Party.setContractURI',
      contract: contracts.PARTY.address,
      method: 'setContractURI',
      args: [CONTRACT_URIS.PARTY],
      description: 'Party 設置 Contract URI'
    },
    {
      name: 'VIPStaking.setContractURI',
      contract: contracts.VIPSTAKING.address,
      method: 'setContractURI',
      args: [CONTRACT_URIS.VIPSTAKING],
      description: 'VIPStaking 設置 Contract URI'
    },
    {
      name: 'PlayerProfile.setContractURI',
      contract: contracts.PLAYERPROFILE.address,
      method: 'setContractURI',
      args: [CONTRACT_URIS.PLAYERPROFILE],
      description: 'PlayerProfile 設置 Contract URI'
    }
  ];
  
  await executeSteps(steps, deployer, state);
}

// Phase 8: 更新動態種子
async function updateDynamicSeeds(contracts, deployer, state) {
  // 生成新的隨機種子
  const generateSeed = () => {
    return ethers.keccak256(
      ethers.solidityPacked(
        ['uint256', 'address', 'uint256'],
        [Date.now(), deployer.address, Math.floor(Math.random() * 1000000)]
      )
    );
  };
  
  const steps = [
    {
      name: 'DungeonMaster.updateDynamicSeed',
      contract: contracts.DUNGEONMASTER.address,
      method: 'updateDynamicSeed',
      args: [generateSeed()],
      description: 'DungeonMaster 更新動態種子'
    },
    {
      name: 'AltarOfAscension.updateDynamicSeed',
      contract: contracts.ALTAROFASCENSION.address,
      method: 'updateDynamicSeed',
      args: [generateSeed()],
      description: 'AltarOfAscension 更新動態種子'
    }
  ];
  
  await executeSteps(steps, deployer, state);
}

// 執行步驟輔助函數
async function executeSteps(steps, deployer, state) {
  for (const step of steps) {
    state.totalSteps++;
    
    try {
      console.log(`\n⚙️  ${step.description}`);
      console.log(`   合約: ${step.contract}`);
      console.log(`   方法: ${step.method}`);
      console.log(`   參數: ${JSON.stringify(step.args)}`);
      
      // 建立合約實例
      const abi = [`function ${step.method}(...) external`];
      const contract = new ethers.Contract(step.contract, abi, deployer);
      
      // 執行交易
      const tx = await contract[step.method](...step.args);
      console.log(`   交易: ${tx.hash}`);
      
      // 等待確認
      const receipt = await tx.wait();
      console.log(`   ✅ 成功 (Gas: ${ethers.formatUnits(receipt.gasUsed, 'gwei')} Gwei)`);
      
      state.completedSteps++;
    } catch (error) {
      console.log(`   ❌ 失敗: ${error.message}`);
      state.failedSteps.push({
        name: step.name,
        error: error.message
      });
    }
  }
}

// 執行增強設置
if (require.main === module) {
  setupV23ContractsEnhanced().catch(console.error);
}

module.exports = { setupV23ContractsEnhanced };

/* 
Contract URI JSON 格式示例（OpenSea 標準）：
{
  "name": "Dungeon Delvers Hero",
  "description": "Heroes are the main characters in Dungeon Delvers...",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/hero-collection.png",
  "external_link": "https://dungeondelvers.com",
  "seller_fee_basis_points": 500,  // 5%
  "fee_recipient": "0xEbCF4A36Ad1485A9737025e9d72186b604487274"
}

Base URI 和 Contract URI 的差異：
1. Base URI：
   - 用於構建每個 NFT 的 tokenURI
   - 例如：baseURI + tokenId = "https://.../api/hero/123"
   - 返回單個 NFT 的元數據

2. Contract URI：
   - 用於整個合約的元數據
   - 顯示在 OpenSea 的合約頁面
   - 包含合約名稱、描述、圖片、版稅信息等
*/