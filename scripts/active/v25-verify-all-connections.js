const hre = require("hardhat");

// V25 合約地址配置
const V25_CONTRACTS = {
  HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
  RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
  PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
  DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
  DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
  ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  VRFMANAGER: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038',
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF'
};

async function main() {
  console.log('🔍 V25 完整合約連接驗證');
  console.log('===========================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('驗證賬戶:', signer.address);
  console.log('');
  
  let correctConnections = 0;
  let totalConnections = 0;
  const issues = [];
  
  try {
    // 1. DungeonCore 驗證
    console.log('1️⃣ DungeonCore 連接驗證:');
    const dungeonCore = await hre.ethers.getContractAt('DungeonCore', V25_CONTRACTS.DUNGEONCORE);
    
    const coreConnections = [
      { name: 'PlayerProfile', expected: V25_CONTRACTS.PLAYERPROFILE, actual: await dungeonCore.playerProfileAddress() },
      { name: 'Hero', expected: V25_CONTRACTS.HERO, actual: await dungeonCore.heroContractAddress() },
      { name: 'Relic', expected: V25_CONTRACTS.RELIC, actual: await dungeonCore.relicContractAddress() },
      { name: 'Party', expected: V25_CONTRACTS.PARTY, actual: await dungeonCore.partyContractAddress() },
      { name: 'DungeonMaster', expected: V25_CONTRACTS.DUNGEONMASTER, actual: await dungeonCore.dungeonMasterAddress() },
      { name: 'AltarOfAscension', expected: V25_CONTRACTS.ALTAROFASCENSION, actual: await dungeonCore.altarOfAscensionAddress() },
      { name: 'PlayerVault', expected: V25_CONTRACTS.PLAYERVAULT, actual: await dungeonCore.playerVaultAddress() },
      { name: 'VIPStaking', expected: V25_CONTRACTS.VIPSTAKING, actual: await dungeonCore.vipStakingAddress() },
      { name: 'Oracle', expected: V25_CONTRACTS.ORACLE, actual: await dungeonCore.oracleAddress() }
    ];
    
    for (const conn of coreConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`DungeonCore.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 2. DungeonMaster 驗證
    console.log('2️⃣ DungeonMaster 連接驗證:');
    const dungeonMaster = await hre.ethers.getContractAt('DungeonMaster', V25_CONTRACTS.DUNGEONMASTER);
    
    const masterConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await dungeonMaster.dungeonCore() },
      { name: 'DungeonStorage', expected: V25_CONTRACTS.DUNGEONSTORAGE, actual: await dungeonMaster.dungeonStorage() },
      { name: 'VRFManager', expected: V25_CONTRACTS.VRFMANAGER, actual: await dungeonMaster.vrfManager() }
    ];
    
    for (const conn of masterConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`DungeonMaster.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 3. Hero NFT 驗證
    console.log('3️⃣ Hero NFT 連接驗證:');
    const hero = await hre.ethers.getContractAt('Hero', V25_CONTRACTS.HERO);
    
    const heroConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await hero.dungeonCore() },
      { name: 'VRFManager', expected: V25_CONTRACTS.VRFMANAGER, actual: await hero.vrfManager() }
    ];
    
    for (const conn of heroConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`Hero.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 4. Relic NFT 驗證
    console.log('4️⃣ Relic NFT 連接驗證:');
    const relic = await hre.ethers.getContractAt('Relic', V25_CONTRACTS.RELIC);
    
    const relicConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await relic.dungeonCore() },
      { name: 'VRFManager', expected: V25_CONTRACTS.VRFMANAGER, actual: await relic.vrfManager() }
    ];
    
    for (const conn of relicConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`Relic.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 5. Party NFT 驗證
    console.log('5️⃣ Party NFT 連接驗證:');
    const party = await hre.ethers.getContractAt('PartyV3', V25_CONTRACTS.PARTY);
    
    const partyConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await party.dungeonCoreContract() }
    ];
    
    for (const conn of partyConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`Party.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 6. AltarOfAscension 驗證
    console.log('6️⃣ AltarOfAscension 連接驗證:');
    const altarOfAscension = await hre.ethers.getContractAt('AltarOfAscensionVRF', V25_CONTRACTS.ALTAROFASCENSION);
    
    const altarConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await altarOfAscension.dungeonCore() }
    ];
    
    for (const conn of altarConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`AltarOfAscension.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 7. PlayerProfile 驗證
    console.log('7️⃣ PlayerProfile 連接驗證:');
    const playerProfile = await hre.ethers.getContractAt('PlayerProfile', V25_CONTRACTS.PLAYERPROFILE);
    
    const profileConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await playerProfile.dungeonCore() }
    ];
    
    for (const conn of profileConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`PlayerProfile.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 8. PlayerVault 驗證
    console.log('8️⃣ PlayerVault 連接驗證:');
    const playerVault = await hre.ethers.getContractAt('PlayerVault', V25_CONTRACTS.PLAYERVAULT);
    
    const vaultConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await playerVault.dungeonCore() }
    ];
    
    for (const conn of vaultConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`PlayerVault.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 9. VIPStaking 驗證
    console.log('9️⃣ VIPStaking 連接驗證:');
    const vipStaking = await hre.ethers.getContractAt('VIPStaking', V25_CONTRACTS.VIPSTAKING);
    
    const vipConnections = [
      { name: 'DungeonCore', expected: V25_CONTRACTS.DUNGEONCORE, actual: await vipStaking.dungeonCore() }
    ];
    
    for (const conn of vipConnections) {
      totalConnections++;
      if (conn.actual.toLowerCase() === conn.expected.toLowerCase()) {
        console.log(`   ✅ ${conn.name}: ${conn.actual}`);
        correctConnections++;
      } else {
        console.log(`   ❌ ${conn.name}: ${conn.actual} (應為: ${conn.expected})`);
        issues.push(`VIPStaking.${conn.name} 地址不正確`);
      }
    }
    
    console.log('');
    
    // 總結
    console.log('=============================');
    console.log('🎯 V25 合約連接驗證結果');
    console.log('=============================');
    console.log(`✅ 正確連接: ${correctConnections}/${totalConnections} (${(correctConnections/totalConnections*100).toFixed(1)}%)`);
    
    if (issues.length === 0) {
      console.log('🎉 所有合約連接都正確！V25 系統完全就緒');
    } else {
      console.log(`❌ 發現 ${issues.length} 個問題:`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 驗證過程中發生錯誤:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });