// 部署並初始化 TestUSD/SoulShard Uniswap V3 Pool
const { ethers } = require("hardhat");

// Uniswap V3 BSC 主網地址
const UNISWAP_V3_FACTORY = "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7";
const UNISWAP_V3_POSITION_MANAGER = "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613";

// 費率級別 (0.3% = 3000)
const FEE_TIER = 3000;

// 價格設定: 1 USD = 16,500 SOUL
const PRICE_RATIO = 16500;

async function main() {
  console.log("\n=== 部署 Uniswap V3 Pool ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者:", deployer.address);
  
  // 合約地址
  const addresses = {
    usdToken: "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    oracle: "0x1Cd2FBa6f4614383C32f4807f67f059eF4Dbfd0c"
  };
  
  // 獲取合約實例
  const usdToken = await ethers.getContractAt("contracts/core/Token.sol:TestUSD", addresses.usdToken);
  const soulShard = await ethers.getContractAt("contracts/core/Token.sol:SoulShard", addresses.soulShard);
  
  // 獲取 Uniswap V3 Factory
  const factory = await ethers.getContractAt(
    ["function getPool(address,address,uint24) view returns (address)"],
    UNISWAP_V3_FACTORY
  );
  
  // 檢查池是否已存在
  let poolAddress = await factory.getPool(addresses.usdToken, addresses.soulShard, FEE_TIER);
  
  if (poolAddress === ethers.ZeroAddress) {
    console.log("池不存在，需要創建...");
    
    // 使用 Position Manager 創建池
    const positionManager = await ethers.getContractAt([
      "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)"
    ], UNISWAP_V3_POSITION_MANAGER);
    
    // 計算初始價格 sqrtPriceX96
    // 需要確定 token0 和 token1 的順序
    const token0 = addresses.usdToken.toLowerCase() < addresses.soulShard.toLowerCase() 
      ? addresses.usdToken 
      : addresses.soulShard;
    const token1 = token0 === addresses.usdToken ? addresses.soulShard : addresses.usdToken;
    
    console.log("Token0:", token0 === addresses.usdToken ? "USD" : "SOUL", token0);
    console.log("Token1:", token1 === addresses.usdToken ? "USD" : "SOUL", token1);
    
    // 計算 sqrtPriceX96
    let sqrtPriceX96;
    if (token0 === addresses.usdToken) {
      // token0 是 USD, token1 是 SOUL
      // 價格 = SOUL/USD = 16500
      // sqrtPrice = sqrt(16500) ≈ 128.45
      // sqrtPriceX96 = 128.45 * 2^96
      const sqrtPrice = Math.sqrt(PRICE_RATIO);
      sqrtPriceX96 = ethers.parseUnits(sqrtPrice.toString(), 0) * (2n ** 96n) / (10n ** 18n);
    } else {
      // token0 是 SOUL, token1 是 USD
      // 價格 = USD/SOUL = 1/16500
      // sqrtPrice = sqrt(1/16500) ≈ 0.00778
      // sqrtPriceX96 = 0.00778 * 2^96
      const sqrtPrice = Math.sqrt(1 / PRICE_RATIO);
      sqrtPriceX96 = ethers.parseUnits(sqrtPrice.toString(), 18) * (2n ** 96n) / (10n ** 18n);
    }
    
    console.log("初始 sqrtPriceX96:", sqrtPriceX96.toString());
    
    // 創建並初始化池
    const createTx = await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      FEE_TIER,
      sqrtPriceX96
    );
    const receipt = await createTx.wait();
    console.log("✅ Pool 創建交易:", receipt.hash);
    
    // 再次獲取池地址
    poolAddress = await factory.getPool(addresses.usdToken, addresses.soulShard, FEE_TIER);
  }
  
  console.log("✅ Pool 地址:", poolAddress);
  
  // 準備添加流動性
  console.log("\n=== 添加流動性 ===");
  
  // 計算流動性金額
  const usdAmount = ethers.parseEther("10000"); // 10,000 USD
  const soulAmount = ethers.parseEther("165000000"); // 165,000,000 SOUL
  
  // 檢查餘額
  const usdBalance = await usdToken.balanceOf(deployer.address);
  const soulBalance = await soulShard.balanceOf(deployer.address);
  
  console.log("當前餘額:");
  console.log("USD:", ethers.formatEther(usdBalance));
  console.log("SOUL:", ethers.formatEther(soulBalance));
  
  // 如果餘額不足，先鑄造代幣
  if (usdBalance < usdAmount) {
    console.log("\n鑄造 USD...");
    const mintTx = await usdToken.mint(deployer.address, usdAmount - usdBalance);
    await mintTx.wait();
    console.log("✅ 已鑄造", ethers.formatEther(usdAmount - usdBalance), "USD");
  }
  
  if (soulBalance < soulAmount) {
    console.log("\n鑄造 SOUL...");
    const mintTx = await soulShard.mint(deployer.address, soulAmount - soulBalance);
    await mintTx.wait();
    console.log("✅ 已鑄造", ethers.formatEther(soulAmount - soulBalance), "SOUL");
  }
  
  // 授權 Position Manager
  console.log("\n授權代幣...");
  const usdAllowance = await usdToken.allowance(deployer.address, UNISWAP_V3_POSITION_MANAGER);
  if (usdAllowance < usdAmount) {
    const approveTx = await usdToken.approve(UNISWAP_V3_POSITION_MANAGER, ethers.MaxUint256);
    await approveTx.wait();
    console.log("✅ USD 已授權");
  }
  
  const soulAllowance = await soulShard.allowance(deployer.address, UNISWAP_V3_POSITION_MANAGER);
  if (soulAllowance < soulAmount) {
    const approveTx = await soulShard.approve(UNISWAP_V3_POSITION_MANAGER, ethers.MaxUint256);
    await approveTx.wait();
    console.log("✅ SOUL 已授權");
  }
  
  // 使用 Position Manager 添加流動性
  const positionManager = await ethers.getContractAt([
    "struct MintParams { address token0; address token1; uint24 fee; int24 tickLower; int24 tickUpper; uint256 amount0Desired; uint256 amount1Desired; uint256 amount0Min; uint256 amount1Min; address recipient; uint256 deadline; }",
    "function mint(tuple(address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ], UNISWAP_V3_POSITION_MANAGER);
  
  // 計算 tick 範圍 (全範圍流動性)
  const tickLower = -887220;
  const tickUpper = 887220;
  
  // 確定 token0 和 token1 的順序
  const token0 = addresses.usdToken.toLowerCase() < addresses.soulShard.toLowerCase() 
    ? addresses.usdToken 
    : addresses.soulShard;
  const token1 = token0 === addresses.usdToken ? addresses.soulShard : addresses.usdToken;
  
  const amount0Desired = token0 === addresses.usdToken ? usdAmount : soulAmount;
  const amount1Desired = token1 === addresses.usdToken ? usdAmount : soulAmount;
  
  const mintParams = {
    token0: token0,
    token1: token1,
    fee: FEE_TIER,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600
  };
  
  console.log("\n添加流動性參數:");
  console.log("Token0 金額:", ethers.formatEther(amount0Desired), token0 === addresses.usdToken ? "USD" : "SOUL");
  console.log("Token1 金額:", ethers.formatEther(amount1Desired), token1 === addresses.usdToken ? "USD" : "SOUL");
  
  try {
    const mintTx = await positionManager.mint(mintParams);
    const mintReceipt = await mintTx.wait();
    console.log("✅ 流動性已添加，交易:", mintReceipt.hash);
    
    // 解析事件獲取詳情
    console.log("\n流動性詳情:");
    console.log("- Pool 地址:", poolAddress);
    console.log("- 費率:", FEE_TIER / 10000, "%");
    console.log("- 價格比例: 1 USD = 16,500 SOUL");
  } catch (error) {
    console.error("添加流動性失敗:", error.message);
    console.log("\n請確保:");
    console.log("1. 您有足夠的代幣餘額");
    console.log("2. 代幣已正確授權");
    console.log("3. Pool 已正確初始化");
  }
  
  // 更新 Oracle 合約
  console.log("\n=== 更新 Oracle 合約 ===");
  
  const dungeonCore = await ethers.getContractAt(
    "contracts/core/DungeonCore.sol:DungeonCore",
    "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0"
  );
  
  // 檢查當前 Oracle
  const currentOracle = await dungeonCore.oracle();
  console.log("當前 Oracle:", currentOracle);
  
  if (currentOracle !== addresses.oracle) {
    console.log("設置回原始 Oracle...");
    const setOracleTx = await dungeonCore.setOracle(addresses.oracle);
    await setOracleTx.wait();
    console.log("✅ Oracle 已更新為原始合約");
  }
  
  // 測試價格
  console.log("\n=== 測試價格計算 ===");
  
  const oracle = await ethers.getContractAt(
    ["function getAmountOut(address,uint256) view returns (uint256)"],
    addresses.oracle
  );
  
  try {
    const testUsdAmount = ethers.parseEther("2");
    const soulAmountOut = await oracle.getAmountOut(addresses.usdToken, testUsdAmount);
    console.log("2 USD =", ethers.formatEther(soulAmountOut), "SOUL");
    console.log("預期: ~33,000 SOUL");
    
    const hero = await ethers.getContractAt("Hero", "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
    const requiredSoul = await hero.getRequiredSoulShardAmount(1);
    console.log("\nHero 鑄造價格:", ethers.formatEther(requiredSoul), "SOUL");
  } catch (error) {
    console.error("價格測試失敗:", error.message);
    console.log("\n可能需要:");
    console.log("1. 等待幾個區塊讓 TWAP 累積數據");
    console.log("2. 確保 Oracle 合約正確配置了 Pool 地址");
  }
  
  console.log("\n=== 部署總結 ===");
  console.log("Uniswap V3 Pool:", poolAddress);
  console.log("Oracle 合約:", addresses.oracle);
  console.log("價格比例: 1 USD = 16,500 SOUL");
  console.log("\n✅ 真實 Uniswap V3 Pool 已部署並初始化");
  console.log("請等待幾個區塊讓 TWAP 累積足夠數據");
  
  // 保存部署信息
  const fs = require('fs');
  const deploymentInfo = {
    poolAddress,
    oracle: addresses.oracle,
    priceRatio: PRICE_RATIO,
    feeTier: FEE_TIER,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    './UNISWAP_V3_POOL_DEPLOYMENT.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });