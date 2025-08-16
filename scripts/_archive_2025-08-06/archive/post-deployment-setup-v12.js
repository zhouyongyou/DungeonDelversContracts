// V12 部署後設置腳本
// 確保所有必要的設置都完成

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

async function setupV12() {
  log('\n🔧 V12 部署後設置', 'cyan');
  log('================================\n', 'cyan');

  // V12 合約地址
  const addresses = {
    VIPSTAKING: "0x738eA7A2408F56D47EF127954Db42D37aE6339D5",
    HERO: "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E",
    RELIC: "0x853DAAeC0ae354bF40c732C199Eb09F1a0CD3dC1",
    SOULSHARD: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    DUNGEONCORE: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5"
  };

  const [signer] = await ethers.getSigners();
  log(`操作者: ${signer.address}\n`, 'yellow');

  let hasErrors = false;

  // 1. 設置 VIPStaking SoulShard Token
  log('1️⃣ 設置 VIPStaking SoulShard Token:', 'yellow');
  try {
    const vipStaking = await ethers.getContractAt([
      "function soulShardToken() external view returns (address)",
      "function setSoulShardToken(address) external"
    ], addresses.VIPSTAKING);

    const currentToken = await vipStaking.soulShardToken();
    if (currentToken === ethers.ZeroAddress) {
      const tx = await vipStaking.setSoulShardToken(addresses.SOULSHARD);
      await tx.wait();
      log('  ✅ 已設置', 'green');
    } else {
      log('  ⏭️  已經設置', 'yellow');
    }
  } catch (error) {
    log(`  ❌ 失敗: ${error.message}`, 'red');
    hasErrors = true;
  }

  // 2. 設置 Hero SoulShard Token
  log('\n2️⃣ 設置 Hero SoulShard Token:', 'yellow');
  try {
    const hero = await ethers.getContractAt([
      "function soulShardToken() external view returns (address)",
      "function setSoulShardToken(address) external"
    ], addresses.HERO);

    const currentToken = await hero.soulShardToken();
    if (currentToken === ethers.ZeroAddress) {
      const tx = await hero.setSoulShardToken(addresses.SOULSHARD);
      await tx.wait();
      log('  ✅ 已設置', 'green');
    } else {
      log('  ⏭️  已經設置', 'yellow');
    }
  } catch (error) {
    log(`  ❌ 失敗: ${error.message}`, 'red');
    hasErrors = true;
  }

  // 3. 設置 Relic SoulShard Token
  log('\n3️⃣ 設置 Relic SoulShard Token:', 'yellow');
  try {
    const relic = await ethers.getContractAt([
      "function soulShardToken() external view returns (address)",
      "function setSoulShardToken(address) external"
    ], addresses.RELIC);

    const currentToken = await relic.soulShardToken();
    if (currentToken === ethers.ZeroAddress) {
      const tx = await relic.setSoulShardToken(addresses.SOULSHARD);
      await tx.wait();
      log('  ✅ 已設置', 'green');
    } else {
      log('  ⏭️  已經設置', 'yellow');
    }
  } catch (error) {
    log(`  ❌ 失敗: ${error.message}`, 'red');
    hasErrors = true;
  }

  // 4. 設置 NFT 鑄造價格
  log('\n4️⃣ 設置 NFT 鑄造價格:', 'yellow');
  
  // Hero 價格
  try {
    const hero = await ethers.getContractAt([
      "function mintPriceUSD() external view returns (uint256)",
      "function setMintPriceUSD(uint256) external"
    ], addresses.HERO);

    const currentPrice = await hero.mintPriceUSD();
    log(`  Hero 當前價格: $${ethers.formatEther(currentPrice)}`, 'cyan');
    
    if (currentPrice === 0n) {
      const tx = await hero.setMintPriceUSD(10); // $10
      await tx.wait();
      log('  ✅ Hero 價格設置為 $10', 'green');
    }
  } catch (error) {
    log(`  ❌ Hero 價格設置失敗: ${error.message}`, 'red');
    hasErrors = true;
  }

  // Relic 價格
  try {
    const relic = await ethers.getContractAt([
      "function mintPriceUSD() external view returns (uint256)",
      "function setMintPriceUSD(uint256) external"
    ], addresses.RELIC);

    const currentPrice = await relic.mintPriceUSD();
    log(`  Relic 當前價格: $${ethers.formatEther(currentPrice)}`, 'cyan');
    
    if (currentPrice === 0n) {
      const tx = await relic.setMintPriceUSD(5); // $5
      await tx.wait();
      log('  ✅ Relic 價格設置為 $5', 'green');
    }
  } catch (error) {
    log(`  ❌ Relic 價格設置失敗: ${error.message}`, 'red');
    hasErrors = true;
  }

  // 5. 測試價格轉換
  log('\n5️⃣ 測試價格轉換:', 'yellow');
  try {
    const dungeonCore = await ethers.getContractAt([
      "function getSoulShardAmountForUSD(uint256) external view returns (uint256)"
    ], addresses.DUNGEONCORE);

    const testUSD = ethers.parseEther("10");
    const soulAmount = await dungeonCore.getSoulShardAmountForUSD(testUSD);
    log(`  10 USD = ${ethers.formatEther(soulAmount)} SOUL`, 'green');
    
    const hero = await ethers.getContractAt([
      "function getRequiredSoulShardAmount(uint256) external view returns (uint256)"
    ], addresses.HERO);
    
    const requiredForHero = await hero.getRequiredSoulShardAmount(1);
    log(`  鑄造 1 個 Hero 需要: ${ethers.formatEther(requiredForHero)} SOUL`, 'cyan');
    
  } catch (error) {
    log(`  ❌ 價格轉換測試失敗: ${error.message}`, 'red');
    hasErrors = true;
  }

  // 總結
  if (hasErrors) {
    log('\n❌ 設置過程中有錯誤，請檢查', 'red');
  } else {
    log('\n✅ 所有設置完成！', 'green');
    log('\n💡 注意事項:', 'magenta');
    log('  - 測試環境使用自己的 USD 版本，價格較低是正常的', 'magenta');
    log('  - 用戶需要授權合約使用 SoulShard', 'magenta');
    log('  - 平台費用當前為 0 BNB', 'magenta');
  }
}

setupV12()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });