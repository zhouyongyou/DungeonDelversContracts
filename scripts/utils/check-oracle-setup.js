// 檢查 Oracle 設置
const { ethers } = require("hardhat");

async function checkOracle() {
  console.log('\n🔮 檢查 Oracle 設置...\n');

  const ORACLE_ADDRESS = "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806";
  const SOULSHARD_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

  try {
    const oracle = await ethers.getContractAt([
      "function owner() external view returns (address)",
      "function heroMintPriceUSD() external view returns (uint256)",
      "function relicMintPriceUSD() external view returns (uint256)",
      "function provisionPriceUSD() external view returns (uint256)",
      "function soulShardToken() external view returns (address)",
      "function stableToken() external view returns (address)",
      "function getTokenPriceInUSD(address token) external view returns (uint256)",
      "function setHeroMintPriceUSD(uint256 price) external",
      "function setRelicMintPriceUSD(uint256 price) external",
      "function setSoulShardToken(address token) external"
    ], ORACLE_ADDRESS);

    console.log('📍 基本信息:');
    const owner = await oracle.owner();
    console.log(`  擁有者: ${owner}`);

    console.log('\n📍 代幣設置:');
    try {
      const soulShard = await oracle.soulShardToken();
      console.log(`  SoulShard 代幣: ${soulShard}`);
    } catch (e) {
      console.log('  SoulShard 代幣: ❌ 未設置');
    }

    try {
      const stable = await oracle.stableToken();
      console.log(`  穩定幣: ${stable}`);
    } catch (e) {
      console.log('  穩定幣: ❌ 未設置');
    }

    console.log('\n📍 價格設置 (USD):');
    try {
      const heroPrice = await oracle.heroMintPriceUSD();
      console.log(`  Hero 鑄造價格: ${ethers.formatUnits(heroPrice, 8)} USD`);
      
      if (heroPrice === 0n) {
        console.log('  ⚠️  Hero 價格未設置！');
      }
    } catch (e) {
      console.log('  Hero 鑄造價格: ❌ 讀取失敗');
    }

    try {
      const relicPrice = await oracle.relicMintPriceUSD();
      console.log(`  Relic 鑄造價格: ${ethers.formatUnits(relicPrice, 8)} USD`);
      
      if (relicPrice === 0n) {
        console.log('  ⚠️  Relic 價格未設置！');
      }
    } catch (e) {
      console.log('  Relic 鑄造價格: ❌ 讀取失敗');
    }

    try {
      const provisionPrice = await oracle.provisionPriceUSD();
      console.log(`  補給品價格: ${ethers.formatUnits(provisionPrice, 8)} USD`);
    } catch (e) {
      console.log('  補給品價格: ❌ 讀取失敗');
    }

    console.log('\n📍 代幣價格查詢:');
    try {
      const soulPrice = await oracle.getTokenPriceInUSD(SOULSHARD_ADDRESS);
      console.log(`  SoulShard 價格: ${ethers.formatUnits(soulPrice, 8)} USD`);
    } catch (e) {
      console.log('  SoulShard 價格: ❌ 查詢失敗:', e.message);
    }

    // 如果是擁有者，嘗試設置價格
    const [signer] = await ethers.getSigners();
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      console.log('\n🔧 你是擁有者，檢查並設置必要參數...');
      
      // 設置 SoulShard 代幣
      try {
        const currentSoulShard = await oracle.soulShardToken();
        if (currentSoulShard === ethers.ZeroAddress) {
          console.log('  設置 SoulShard 代幣地址...');
          const tx = await oracle.setSoulShardToken(SOULSHARD_ADDRESS);
          await tx.wait();
          console.log('  ✅ SoulShard 代幣已設置');
        }
      } catch (e) {
        console.log('  ❌ 無法設置 SoulShard:', e.message);
      }

      // 設置 Hero 價格
      try {
        const heroPrice = await oracle.heroMintPriceUSD();
        if (heroPrice === 0n) {
          console.log('  設置 Hero 價格為 10 USD...');
          const tx = await oracle.setHeroMintPriceUSD(ethers.parseUnits("10", 8));
          await tx.wait();
          console.log('  ✅ Hero 價格已設置');
        }
      } catch (e) {
        console.log('  ❌ 無法設置 Hero 價格:', e.message);
      }

      // 設置 Relic 價格
      try {
        const relicPrice = await oracle.relicMintPriceUSD();
        if (relicPrice === 0n) {
          console.log('  設置 Relic 價格為 5 USD...');
          const tx = await oracle.setRelicMintPriceUSD(ethers.parseUnits("5", 8));
          await tx.wait();
          console.log('  ✅ Relic 價格已設置');
        }
      } catch (e) {
        console.log('  ❌ 無法設置 Relic 價格:', e.message);
      }
    }

  } catch (error) {
    console.error('❌ 主要錯誤:', error.message);
  }
}

checkOracle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });