#!/usr/bin/env node

// 檢查 Party 合約狀態

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// Party ABI
const PARTY_ABI = [
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function dungeonCoreAddress() public view returns (address)',
  'function heroContract() public view returns (address)',
  'function relicContract() public view returns (address)',
  'function getHeroIds(uint256 partyId) public view returns (uint256[4] memory)',
  'function getRelicIds(uint256 partyId) public view returns (uint256[4] memory)',
  'function partyPower(uint256 partyId) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string memory)'
];

// Hero ABI
const HERO_ABI = [
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function heroPower(uint256 tokenId) public view returns (uint256)',
  'function getHeroProperties(uint256 tokenId) public view returns (uint8 level, uint8 stars, uint8 rarity)'
];

async function checkPartyStatus() {
  console.log('🔍 檢查 Party 合約狀態...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const party = new ethers.Contract(
    v22Config.contracts.PARTY.address,
    PARTY_ABI,
    provider
  );
  
  const hero = new ethers.Contract(
    v22Config.contracts.HERO.address,
    HERO_ABI,
    provider
  );
  
  try {
    // 1. 檢查 Party 合約基本信息
    console.log('📋 Party 合約基本信息：');
    console.log(`Party 地址: ${v22Config.contracts.PARTY.address}`);
    
    try {
      const totalSupply = await party.totalSupply();
      console.log(`總供應量: ${totalSupply}`);
    } catch (error) {
      console.log(`❌ 無法獲取總供應量: ${error.message}`);
    }
    
    // 2. 檢查 Party 合約的連接
    console.log('\n📋 Party 合約連接：');
    
    try {
      const dungeonCore = await party.dungeonCoreAddress();
      console.log(`DungeonCore: ${dungeonCore}`);
      console.log(`   正確: ${dungeonCore.toLowerCase() === v22Config.contracts.DUNGEONCORE.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ 無法獲取 DungeonCore 地址: ${error.message}`);
    }
    
    try {
      const heroAddress = await party.heroContract();
      console.log(`Hero: ${heroAddress}`);
      console.log(`   正確: ${heroAddress.toLowerCase() === v22Config.contracts.HERO.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ 無法獲取 Hero 地址: ${error.message}`);
    }
    
    try {
      const relicAddress = await party.relicContract();
      console.log(`Relic: ${relicAddress}`);
      console.log(`   正確: ${relicAddress.toLowerCase() === v22Config.contracts.RELIC.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ 無法獲取 Relic 地址: ${error.message}`);
    }
    
    // 3. 檢查特定隊伍（ID 1）
    console.log('\n📋 檢查隊伍 ID 1：');
    const partyId = 1;
    
    try {
      const owner = await party.ownerOf(partyId);
      console.log(`擁有者: ${owner}`);
    } catch (error) {
      console.log(`❌ 無法獲取擁有者: ${error.message}`);
    }
    
    try {
      const heroIds = await party.getHeroIds(partyId);
      console.log(`英雄 IDs: [${heroIds.join(', ')}]`);
      
      // 檢查英雄是否存在
      for (let i = 0; i < heroIds.length; i++) {
        if (heroIds[i] > 0) {
          try {
            const heroOwner = await hero.ownerOf(heroIds[i]);
            const heroPowerValue = await hero.heroPower(heroIds[i]);
            console.log(`   英雄 ${heroIds[i]}: 擁有者 ${heroOwner}, 戰力 ${heroPowerValue}`);
          } catch (error) {
            console.log(`   英雄 ${heroIds[i]}: ❌ 無法獲取信息`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ 無法獲取英雄 IDs: ${error.message}`);
    }
    
    try {
      const relicIds = await party.getRelicIds(partyId);
      console.log(`聖物 IDs: [${relicIds.join(', ')}]`);
    } catch (error) {
      console.log(`❌ 無法獲取聖物 IDs: ${error.message}`);
    }
    
    // 4. 嘗試計算戰力
    console.log('\n🔍 嘗試計算隊伍戰力...');
    try {
      const power = await party.partyPower(partyId);
      console.log(`✅ 隊伍戰力: ${power}`);
    } catch (error) {
      console.log(`❌ 無法計算戰力: ${error.message}`);
      
      // 分析錯誤
      if (error.message.includes('Party: Incomplete party')) {
        console.log('   原因: 隊伍不完整（需要 4 個英雄）');
      } else if (error.message.includes('Hero not owned by this party')) {
        console.log('   原因: 英雄不屬於此隊伍');
      } else {
        console.log('   原因: 未知錯誤');
      }
    }
    
    // 5. 檢查 tokenURI
    console.log('\n🔍 檢查 tokenURI...');
    try {
      const uri = await party.tokenURI(partyId);
      console.log(`tokenURI: ${uri}`);
    } catch (error) {
      console.log(`❌ 無法獲取 tokenURI: ${error.message}`);
    }
    
    // 6. 診斷總結
    console.log('\n📊 診斷總結：');
    console.log('Party 合約的主要問題可能是：');
    console.log('1. 隊伍中的英雄不完整或不存在');
    console.log('2. 英雄 NFT 的擁有權問題');
    console.log('3. partyPower 函數的邏輯錯誤');
    console.log('\n建議：');
    console.log('1. 確保隊伍有 4 個有效的英雄');
    console.log('2. 檢查英雄 NFT 是否正確轉移到隊伍');
    console.log('3. 可能需要重新創建隊伍');
    
  } catch (error) {
    console.error('\n❌ 檢查失敗:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  checkPartyStatus().catch(console.error);
}

module.exports = { checkPartyStatus };