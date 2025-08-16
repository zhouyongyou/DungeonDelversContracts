// 測試 NFT 鑄造功能
const { ethers } = require("hardhat");

async function testNFTMint() {
  console.log('\n🧪 測試 NFT 鑄造功能...\n');

  // V12 合約地址
  const HERO_ADDRESS = "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E";
  const RELIC_ADDRESS = "0x853DAAeC0ae354bF40c732C199Eb09F1a0CD3dC1";
  const SOULSHARD_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
  const DUNGEONCORE_ADDRESS = "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5";

  const [signer] = await ethers.getSigners();
  console.log(`測試地址: ${signer.address}\n`);

  // 獲取合約實例
  const Hero = await ethers.getContractAt([
    "function platformFee() external view returns (uint256)",
    "function heroMintPriceUSD() external view returns (uint256)",
    "function mintHero(uint256 quantity) external payable returns (uint256[] memory)",
    "function balanceOf(address) external view returns (uint256)"
  ], HERO_ADDRESS);

  const DungeonCore = await ethers.getContractAt([
    "function heroMintPriceUSD() external view returns (uint256)",
    "function relicMintPriceUSD() external view returns (uint256)",
    "function oracle() external view returns (address)"
  ], DUNGEONCORE_ADDRESS);

  const SoulShard = await ethers.getContractAt([
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address,address) external view returns (uint256)",
    "function approve(address,uint256) external returns (bool)"
  ], SOULSHARD_ADDRESS);

  try {
    // 1. 檢查價格設置
    console.log('💰 檢查鑄造價格:');
    const heroPrice = await DungeonCore.heroMintPriceUSD();
    const relicPrice = await DungeonCore.relicMintPriceUSD();
    console.log(`  Hero 價格: ${ethers.formatUnits(heroPrice, 8)} USD`);
    console.log(`  Relic 價格: ${ethers.formatUnits(relicPrice, 8)} USD`);

    // 2. 檢查平台費用
    const platformFee = await Hero.platformFee();
    console.log(`  平台費用: ${ethers.formatEther(platformFee)} BNB`);

    // 3. 檢查 Oracle
    const oracle = await DungeonCore.oracle();
    console.log(`  Oracle 地址: ${oracle}`);

    // 獲取 Oracle 實例
    const Oracle = await ethers.getContractAt([
      "function getTokenPriceInUSD(address token) external view returns (uint256)",
      "function soulShardToken() external view returns (address)"
    ], oracle);

    // 4. 計算 SoulShard 價格
    const soulPrice = await Oracle.getTokenPriceInUSD(SOULSHARD_ADDRESS);
    console.log(`  SoulShard 價格: ${ethers.formatUnits(soulPrice, 8)} USD`);

    // 5. 計算需要的 SoulShard 數量
    if (heroPrice > 0 && soulPrice > 0) {
      const soulNeeded = (heroPrice * BigInt(10 ** 18)) / soulPrice;
      console.log(`  鑄造 1 個 Hero 需要: ${ethers.formatEther(soulNeeded)} SOUL`);

      // 6. 檢查餘額
      const soulBalance = await SoulShard.balanceOf(signer.address);
      console.log(`\n  你的 SoulShard 餘額: ${ethers.formatEther(soulBalance)} SOUL`);

      if (soulBalance >= soulNeeded) {
        console.log('  ✅ 餘額充足');

        // 7. 檢查授權
        const allowance = await SoulShard.allowance(signer.address, HERO_ADDRESS);
        console.log(`  當前授權: ${ethers.formatEther(allowance)} SOUL`);

        if (allowance < soulNeeded) {
          console.log('  ⚠️  需要授權 SoulShard');
          console.log('  授權中...');
          const approveTx = await SoulShard.approve(HERO_ADDRESS, ethers.MaxUint256);
          await approveTx.wait();
          console.log('  ✅ 授權成功');
        }

        // 8. 執行鑄造
        console.log('\n🎨 開始鑄造 Hero NFT...');
        const mintTx = await Hero.mintHero(1, { value: platformFee });
        console.log(`  交易哈希: ${mintTx.hash}`);
        
        const receipt = await mintTx.wait();
        console.log('  ✅ 鑄造成功！');
        
        // 從事件中獲取 token ID
        const mintEvent = receipt.logs.find(log => {
          try {
            const decoded = Hero.interface.parseLog(log);
            return decoded.name === 'Transfer';
          } catch {
            return false;
          }
        });

        if (mintEvent) {
          console.log(`  新 Hero Token ID: ${mintEvent.args[2]}`);
        }

        // 檢查新餘額
        const newBalance = await Hero.balanceOf(signer.address);
        console.log(`  你現在擁有 ${newBalance} 個 Hero NFT`);

      } else {
        console.log('  ❌ SoulShard 餘額不足');
      }
    } else {
      console.log('\n❌ 無法計算價格，可能是 Oracle 或價格設置問題');
    }

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    // 嘗試更詳細的錯誤診斷
    if (error.data) {
      try {
        const reason = ethers.toUtf8String('0x' + error.data.slice(138));
        console.error('  錯誤原因:', reason);
      } catch {}
    }
  }
}

testNFTMint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });