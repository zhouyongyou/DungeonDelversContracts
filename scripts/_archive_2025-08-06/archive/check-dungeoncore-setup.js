// 檢查 DungeonCore 設置
const { ethers } = require("hardhat");

async function checkDungeonCore() {
  console.log('\n🔍 檢查 DungeonCore 設置...\n');

  const DUNGEONCORE_ADDRESS = "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5";
  const ORACLE_ADDRESS = "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806";
  const SOULSHARD_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";

  try {
    // 基本合約檢查 - 使用正確的變數名稱
    const dungeonCore = await ethers.getContractAt([
      "function owner() external view returns (address)",
      "function soulShardTokenAddress() external view returns (address)",
      "function oracleAddress() external view returns (address)",
      "function heroContractAddress() external view returns (address)",
      "function relicContractAddress() external view returns (address)",
      "function partyContractAddress() external view returns (address)",
      "function playerVaultAddress() external view returns (address)",
      "function dungeonMasterAddress() external view returns (address)",
      "function altarOfAscensionAddress() external view returns (address)",
      "function playerProfileAddress() external view returns (address)",
      "function vipStakingAddress() external view returns (address)",
      "function getHeroMintPriceInSoulShard() external view returns (uint256)",
      "function getRelicMintPriceInSoulShard() external view returns (uint256)"
    ], DUNGEONCORE_ADDRESS);

    console.log('📍 基本信息:');
    const owner = await dungeonCore.owner();
    console.log(`  擁有者: ${owner}`);

    console.log('\n📍 合約連接:');
    try {
      const soulShard = await dungeonCore.soulShardTokenAddress();
      console.log(`  SoulShard: ${soulShard}`);
    } catch (e) {
      console.log('  SoulShard: ❌ 讀取失敗');
    }

    try {
      const oracle = await dungeonCore.oracleAddress();
      console.log(`  Oracle: ${oracle}`);
    } catch (e) {
      console.log('  Oracle: ❌ 讀取失敗');
    }

    try {
      const hero = await dungeonCore.heroContractAddress();
      console.log(`  Hero: ${hero}`);
    } catch (e) {
      console.log('  Hero: ❌ 讀取失敗');
    }

    try {
      const relic = await dungeonCore.relicContractAddress();
      console.log(`  Relic: ${relic}`);
    } catch (e) {
      console.log('  Relic: ❌ 讀取失敗');
    }

    try {
      const party = await dungeonCore.partyContractAddress();
      console.log(`  Party: ${party}`);
    } catch (e) {
      console.log('  Party: ❌ 讀取失敗');
    }

    console.log('\n📍 價格計算 (in SoulShard):');
    try {
      const heroPrice = await dungeonCore.getHeroMintPriceInSoulShard();
      console.log(`  Hero 鑄造價格: ${ethers.formatEther(heroPrice)} SOUL`);
    } catch (e) {
      console.log('  Hero 鑄造價格: ❌ 讀取失敗');
    }

    try {
      const relicPrice = await dungeonCore.getRelicMintPriceInSoulShard();
      console.log(`  Relic 鑄造價格: ${ethers.formatEther(relicPrice)} SOUL`);
    } catch (e) {
      console.log('  Relic 鑄造價格: ❌ 讀取失敗');
    }

  } catch (error) {
    console.error('❌ 主要錯誤:', error.message);
    
    // 嘗試讀取合約字節碼
    const code = await ethers.provider.getCode(DUNGEONCORE_ADDRESS);
    if (code === '0x') {
      console.error('❌ 地址上沒有合約！');
    } else {
      console.log('✅ 合約存在，但可能是介面問題');
    }
  }
}

checkDungeonCore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });