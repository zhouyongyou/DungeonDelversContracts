#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// AltarOfAscension 地址
const ALTAR_ADDRESS = '0xfb121441510296A92c8A2Cc04B6Aff1a2f72cd3f';

// AltarOfAscension ABI
const ALTAR_ABI = [
  "function dungeonCore() view returns (address)",
  "function sacrificeRequirements(uint8) view returns (uint256 firstRequirement, uint256 additionalRequirement)",
  "function getRequiredSacrifices(uint8 currentStars, uint256 currentSacrifices) view returns (uint256)",
  "function platformFeePercentage() view returns (uint256)",
  "function admin() view returns (address)",
  "function paused() view returns (bool)"
];

async function checkAltarSettings() {
  console.log('🏛️  檢查升星祭壇設置...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const altar = new ethers.Contract(ALTAR_ADDRESS, ALTAR_ABI, provider);

  try {
    // 檢查基本設置
    console.log('📋 基本設置：');
    const dungeonCore = await altar.dungeonCore();
    const admin = await altar.admin();
    const paused = await altar.paused();
    const platformFee = await altar.platformFeePercentage();
    
    console.log(`  DungeonCore: ${dungeonCore}`);
    console.log(`  Admin: ${admin}`);
    console.log(`  Paused: ${paused}`);
    console.log(`  平台費率: ${platformFee}%\n`);

    // 檢查各星級的祭品需求
    console.log('⭐ 升星祭品需求：');
    for (let stars = 0; stars < 5; stars++) {
      try {
        const requirements = await altar.sacrificeRequirements(stars);
        console.log(`  ${stars}星 -> ${stars + 1}星:`);
        console.log(`    首次需求: ${requirements.firstRequirement}`);
        console.log(`    額外需求: ${requirements.additionalRequirement}`);
        
        // 計算幾個常見的失敗次數的需求
        const examples = [0, 1, 2, 5, 10];
        console.log(`    需求示例:`);
        for (const failures of examples) {
          const required = await altar.getRequiredSacrifices(stars, failures);
          console.log(`      失敗 ${failures} 次: ${required} 個`);
        }
        console.log('');
      } catch (e) {
        console.log(`  ${stars}星: ❌ 未設置或讀取錯誤`);
      }
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  }
}

// 執行檢查
checkAltarSettings().catch(console.error);