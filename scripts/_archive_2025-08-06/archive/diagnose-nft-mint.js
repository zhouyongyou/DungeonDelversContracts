// 診斷 NFT 鑄造問題
const { ethers } = require("hardhat");

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function diagnoseNFTMint() {
  log('\n🔍 診斷 NFT 鑄造問題...', 'cyan');
  log('================================\n', 'cyan');

  // V12 合約地址
  const addresses = {
    HERO: "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E",
    RELIC: "0x853DAAeC0ae354bF40c732C199Eb09F1a0CD3dC1", 
    PARTY: "0x847DceaE26aF1CFc09beC195CE87a9b5701863A7",
    DUNGEONCORE: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    SOULSHARD: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
  };

  const [signer] = await ethers.getSigners();
  log(`檢查地址: ${signer.address}\n`, 'yellow');

  // 獲取合約實例
  const Hero = await ethers.getContractAt([
    "function dungeonCore() external view returns (address)",
    "function baseURI() external view returns (string memory)",
    "function platformFee() external view returns (uint256)",
    "function heroMintPriceUSD() external view returns (uint256)",
    "function owner() external view returns (address)"
  ], addresses.HERO);

  const Relic = await ethers.getContractAt([
    "function dungeonCore() external view returns (address)",
    "function baseURI() external view returns (string memory)",
    "function platformFee() external view returns (uint256)",
    "function relicMintPriceUSD() external view returns (uint256)",
    "function owner() external view returns (address)"
  ], addresses.RELIC);

  const Party = await ethers.getContractAt([
    "function dungeonCore() external view returns (address)",
    "function baseURI() external view returns (string memory)",
    "function platformFee() external view returns (uint256)",
    "function owner() external view returns (address)"
  ], addresses.PARTY);

  const SoulShard = await ethers.getContractAt([
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address,address) external view returns (uint256)"
  ], addresses.SOULSHARD);

  const DungeonCore = await ethers.getContractAt([
    "function soulShardToken() external view returns (address)",
    "function heroMintPriceUSD() external view returns (uint256)",
    "function relicMintPriceUSD() external view returns (uint256)"
  ], addresses.DUNGEONCORE);

  // 1. 檢查 Hero 合約
  log('📍 Hero 合約檢查:', 'yellow');
  try {
    const heroDungeonCore = await Hero.dungeonCore();
    log(`  DungeonCore: ${heroDungeonCore}`, heroDungeonCore !== ethers.ZeroAddress ? 'green' : 'red');
    
    const heroBaseURI = await Hero.baseURI();
    log(`  BaseURI: ${heroBaseURI || '❌ 未設置'}`, heroBaseURI ? 'green' : 'red');
    
    const heroPlatformFee = await Hero.platformFee();
    log(`  平台費用: ${ethers.formatEther(heroPlatformFee)} BNB`, 'cyan');
    
    const heroOwner = await Hero.owner();
    log(`  擁有者: ${heroOwner}`, 'cyan');
  } catch (error) {
    log(`  ❌ 錯誤: ${error.message}`, 'red');
  }

  // 2. 檢查 Relic 合約
  log('\n📍 Relic 合約檢查:', 'yellow');
  try {
    const relicDungeonCore = await Relic.dungeonCore();
    log(`  DungeonCore: ${relicDungeonCore}`, relicDungeonCore !== ethers.ZeroAddress ? 'green' : 'red');
    
    const relicBaseURI = await Relic.baseURI();
    log(`  BaseURI: ${relicBaseURI || '❌ 未設置'}`, relicBaseURI ? 'green' : 'red');
    
    const relicPlatformFee = await Relic.platformFee();
    log(`  平台費用: ${ethers.formatEther(relicPlatformFee)} BNB`, 'cyan');
    
    const relicOwner = await Relic.owner();
    log(`  擁有者: ${relicOwner}`, 'cyan');
  } catch (error) {
    log(`  ❌ 錯誤: ${error.message}`, 'red');
  }

  // 3. 檢查 Party 合約
  log('\n📍 Party 合約檢查:', 'yellow');
  try {
    const partyDungeonCore = await Party.dungeonCore();
    log(`  DungeonCore: ${partyDungeonCore}`, partyDungeonCore !== ethers.ZeroAddress ? 'green' : 'red');
    
    const partyBaseURI = await Party.baseURI();
    log(`  BaseURI: ${partyBaseURI || '❌ 未設置'}`, partyBaseURI ? 'green' : 'red');
    
    const partyPlatformFee = await Party.platformFee();
    log(`  平台費用: ${ethers.formatEther(partyPlatformFee)} BNB`, 'cyan');
    
    const partyOwner = await Party.owner();
    log(`  擁有者: ${partyOwner}`, 'cyan');
  } catch (error) {
    log(`  ❌ 錯誤: ${error.message}`, 'red');
  }

  // 4. 檢查用戶餘額和授權
  log('\n💰 用戶餘額檢查:', 'yellow');
  try {
    const bnbBalance = await ethers.provider.getBalance(signer.address);
    log(`  BNB 餘額: ${ethers.formatEther(bnbBalance)} BNB`, 'cyan');
    
    const soulBalance = await SoulShard.balanceOf(signer.address);
    log(`  SoulShard 餘額: ${ethers.formatEther(soulBalance)} SOUL`, 'cyan');
    
    // 檢查對各合約的授權
    const heroAllowance = await SoulShard.allowance(signer.address, addresses.HERO);
    log(`  Hero 授權: ${ethers.formatEther(heroAllowance)} SOUL`, heroAllowance > 0 ? 'green' : 'yellow');
    
    const relicAllowance = await SoulShard.allowance(signer.address, addresses.RELIC);
    log(`  Relic 授權: ${ethers.formatEther(relicAllowance)} SOUL`, relicAllowance > 0 ? 'green' : 'yellow');
  } catch (error) {
    log(`  ❌ 錯誤: ${error.message}`, 'red');
  }

  // 5. 檢查 DungeonCore 設置
  log('\n🏛️  DungeonCore 檢查:', 'yellow');
  try {
    const soulShardInCore = await DungeonCore.soulShardToken();
    log(`  SoulShard 代幣: ${soulShardInCore}`, soulShardInCore !== ethers.ZeroAddress ? 'green' : 'red');
    
    const heroPrice = await DungeonCore.heroMintPriceUSD();
    log(`  Hero 鑄造價格: ${ethers.formatUnits(heroPrice, 8)} USD`, 'cyan');
    
    const relicPrice = await DungeonCore.relicMintPriceUSD();
    log(`  Relic 鑄造價格: ${ethers.formatUnits(relicPrice, 8)} USD`, 'cyan');
  } catch (error) {
    log(`  ❌ 錯誤: ${error.message}`, 'red');
  }

  // 總結
  log('\n📋 診斷總結:', 'magenta');
  log('=============', 'magenta');
  
  // 檢查關鍵問題
  const issues = [];
  
  try {
    if ((await Hero.dungeonCore()) === ethers.ZeroAddress) {
      issues.push('Hero 合約未設置 DungeonCore');
    }
    if (!(await Hero.baseURI())) {
      issues.push('Hero 合約未設置 BaseURI');
    }
  } catch {}
  
  try {
    if ((await Relic.dungeonCore()) === ethers.ZeroAddress) {
      issues.push('Relic 合約未設置 DungeonCore');
    }
    if (!(await Relic.baseURI())) {
      issues.push('Relic 合約未設置 BaseURI');
    }
  } catch {}
  
  try {
    if ((await Party.dungeonCore()) === ethers.ZeroAddress) {
      issues.push('Party 合約未設置 DungeonCore');
    }
    if (!(await Party.baseURI())) {
      issues.push('Party 合約未設置 BaseURI');
    }
  } catch {}
  
  if (issues.length > 0) {
    log('\n❌ 發現以下問題:', 'red');
    issues.forEach(issue => log(`  - ${issue}`, 'red'));
    log('\n💡 解決方案：需要執行合約設置腳本', 'yellow');
  } else {
    log('\n✅ 所有檢查通過！', 'green');
    log('   如果仍有問題，請檢查：', 'yellow');
    log('   1. 用戶是否有足夠的 BNB 支付平台費', 'yellow');
    log('   2. 用戶是否有足夠的 SoulShard 餘額', 'yellow');
    log('   3. 用戶是否已授權合約使用 SoulShard', 'yellow');
  }
}

diagnoseNFTMint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });