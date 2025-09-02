#!/usr/bin/env node

// 調試地城探索錯誤

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// DungeonMaster ABI
const DUNGEON_MASTER_ABI = [
  'function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable',
  'function explorationFee() public view returns (uint256)',
  'function isPartyLocked(uint256 _partyId) public view returns (bool)',
  'function dungeonCore() public view returns (address)'
];

// DungeonCore ABI
const DUNGEON_CORE_ABI = [
  'function partyContract() public view returns (address)',
  'function playerVaultAddress() public view returns (address)'
];

// Party ABI
const PARTY_ABI = [
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function getHeroIds(uint256 partyId) public view returns (uint256[4] memory)',
  'function getRelicIds(uint256 partyId) public view returns (uint256[4] memory)',
  'function partyPower(uint256 partyId) public view returns (uint256)'
];

// DungeonStorage ABI  
const DUNGEON_STORAGE_ABI = [
  'function dungeons(uint256) public view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)',
  'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel))'
];

async function debugExpeditionError() {
  console.log('🔍 調試地城探索錯誤...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 合約實例
  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    DUNGEON_MASTER_ABI,
    provider
  );
  
  const dungeonCore = new ethers.Contract(
    v22Config.contracts.DUNGEONCORE.address,
    DUNGEON_CORE_ABI,
    provider
  );
  
  const party = new ethers.Contract(
    v22Config.contracts.PARTY.address,
    PARTY_ABI,
    provider
  );
  
  const dungeonStorage = new ethers.Contract(
    v22Config.contracts.DUNGEONSTORAGE.address,
    DUNGEON_STORAGE_ABI,
    provider
  );

  // 測試參數 (從失敗交易獲取)
  const userAddress = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
  const partyId = 1;
  const dungeonId = 10;
  
  try {
    console.log('📋 測試參數：');
    console.log(`   用戶地址: ${userAddress}`);
    console.log(`   隊伍 ID: ${partyId}`);
    console.log(`   地城 ID: ${dungeonId}\n`);
    
    // 1. 檢查隊伍擁有權
    console.log('1️⃣ 檢查隊伍擁有權...');
    try {
      const partyOwner = await party.ownerOf(partyId);
      console.log(`   隊伍擁有者: ${partyOwner}`);
      console.log(`   是否為用戶: ${partyOwner.toLowerCase() === userAddress.toLowerCase() ? '✅ 是' : '❌ 否'}`);
      
      if (partyOwner.toLowerCase() !== userAddress.toLowerCase()) {
        console.log('   ❌ 錯誤: 用戶不擁有此隊伍\n');
        return;
      }
    } catch (error) {
      console.log(`   ❌ 無法獲取隊伍擁有者: ${error.message}\n`);
      return;
    }
    
    // 2. 檢查隊伍狀態
    console.log('\n2️⃣ 檢查隊伍狀態...');
    try {
      const isLocked = await dungeonMaster.isPartyLocked(partyId);
      console.log(`   隊伍是否鎖定: ${isLocked ? '❌ 是（冷卻中）' : '✅ 否'}`);
      
      // 獲取詳細狀態
      const partyStatus = await dungeonStorage.getPartyStatus(partyId);
      console.log(`   糧食剩餘: ${partyStatus.provisionsRemaining}`);
      console.log(`   冷卻結束時間: ${new Date(Number(partyStatus.cooldownEndsAt) * 1000).toLocaleString()}`);
      console.log(`   未領取獎勵: ${ethers.formatUnits(partyStatus.unclaimedRewards, 18)} SOUL`);
      console.log(`   疲勞等級: ${partyStatus.fatigueLevel}`);
    } catch (error) {
      console.log(`   ❌ 無法獲取隊伍狀態: ${error.message}`);
    }
    
    // 3. 檢查隊伍戰力
    console.log('\n3️⃣ 檢查隊伍戰力...');
    try {
      const power = await party.partyPower(partyId);
      console.log(`   隊伍戰力: ${power}`);
      
      // 檢查英雄和聖物
      const heroIds = await party.getHeroIds(partyId);
      const relicIds = await party.getRelicIds(partyId);
      console.log(`   英雄 IDs: [${heroIds.join(', ')}]`);
      console.log(`   聖物 IDs: [${relicIds.join(', ')}]`);
    } catch (error) {
      console.log(`   ❌ 無法獲取隊伍戰力: ${error.message}`);
    }
    
    // 4. 檢查地城狀態
    console.log('\n4️⃣ 檢查地城狀態...');
    try {
      const [requiredPower, rewardAmountUSD, baseSuccessRate, isInitialized] = 
        await dungeonStorage.dungeons(dungeonId);
      
      console.log(`   是否初始化: ${isInitialized ? '✅ 是' : '❌ 否'}`);
      console.log(`   需求戰力: ${requiredPower}`);
      console.log(`   USD 獎勵: $${ethers.formatUnits(rewardAmountUSD, 18)}`);
      console.log(`   成功率: ${baseSuccessRate}%`);
    } catch (error) {
      console.log(`   ❌ 無法獲取地城狀態: ${error.message}`);
    }
    
    // 5. 檢查探索費用
    console.log('\n5️⃣ 檢查探索費用...');
    try {
      const fee = await dungeonMaster.explorationFee();
      console.log(`   探索費用: ${ethers.formatEther(fee)} BNB`);
      console.log(`   交易發送: ${ethers.formatEther('140000000000000')} BNB`);
      console.log(`   費用是否足夠: ${BigInt('140000000000000') >= fee ? '✅ 是' : '❌ 否'}`);
    } catch (error) {
      console.log(`   ❌ 無法獲取探索費用: ${error.message}`);
    }
    
    // 6. 檢查合約連接
    console.log('\n6️⃣ 檢查合約連接...');
    try {
      const coreAddress = await dungeonMaster.dungeonCore();
      console.log(`   DungeonMaster -> DungeonCore: ${coreAddress}`);
      console.log(`   地址正確: ${coreAddress.toLowerCase() === v22Config.contracts.DUNGEONCORE.address.toLowerCase() ? '✅' : '❌'}`);
      
      const partyAddress = await dungeonCore.partyContract();
      console.log(`   DungeonCore -> Party: ${partyAddress}`);
      console.log(`   地址正確: ${partyAddress.toLowerCase() === v22Config.contracts.PARTY.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ 無法檢查合約連接: ${error.message}`);
    }
    
    // 7. 模擬交易
    console.log('\n7️⃣ 模擬交易...');
    try {
      const deployer = new ethers.Wallet(process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY, provider);
      const dungeonMasterWithSigner = dungeonMaster.connect(deployer);
      
      // 直接調用估算 gas
      const estimatedGas = await dungeonMasterWithSigner.requestExpedition.estimateGas(
        partyId,
        dungeonId,
        { value: '140000000000000' }
      );
      
      console.log(`   ✅ 交易模擬成功！`);
      console.log(`   估算 Gas: ${estimatedGas}`);
    } catch (error) {
      console.log(`   ❌ 交易模擬失敗: ${error.message}`);
      
      // 解析錯誤
      if (error.message.includes('execution reverted')) {
        console.log('\n   🔍 分析錯誤原因...');
        
        // 常見錯誤檢查
        if (error.message.includes('DM: Party locked')) {
          console.log('   原因: 隊伍正在冷卻中');
        } else if (error.message.includes('DM: Insufficient power')) {
          console.log('   原因: 隊伍戰力不足');
        } else if (error.message.includes('DM: Invalid dungeon')) {
          console.log('   原因: 無效的地城 ID');
        } else if (error.message.includes('DM: Party not owned')) {
          console.log('   原因: 用戶不擁有此隊伍');
        } else if (error.message.includes('DM: Fee not met')) {
          console.log('   原因: 探索費用不足');
        } else {
          console.log('   原因: 未知錯誤，可能是合約內部邏輯問題');
          console.log('   錯誤碼: #1002 通常表示合約執行失敗');
        }
      }
    }
    
    console.log('\n📊 診斷總結：');
    console.log('根據錯誤碼 #1002 和交易失敗，最可能的原因是：');
    console.log('1. 合約間的連接或權限問題');
    console.log('2. DungeonCore 合約狀態異常');
    console.log('3. Party 合約的 NFT 狀態問題');
    console.log('\n建議檢查：');
    console.log('- DungeonCore 是否正確設置了所有模組地址');
    console.log('- Party 合約是否正確初始化');
    console.log('- 用戶的隊伍 NFT 狀態是否正常');
    
  } catch (error) {
    console.error('\n❌ 調試失敗:', error.message);
  }
}

// 執行調試
if (require.main === module) {
  debugExpeditionError().catch(console.error);
}

module.exports = { debugExpeditionError };