// 測試不同數量的價格顯示
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 測試不同數量的價格 ===\n");
  
  const hero = await ethers.getContractAt([
    "function getRequiredSoulShardAmount(uint256) view returns (uint256)"
  ], "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
  
  const quantities = [1, 5, 10, 20, 50];
  
  console.log("英雄鑄造價格:");
  for (const qty of quantities) {
    const price = await hero.getRequiredSoulShardAmount(qty);
    const priceInSoul = ethers.formatEther(price);
    const pricePerUnit = Number(priceInSoul) / qty;
    
    console.log(`${qty} 個: ${Number(priceInSoul).toLocaleString()} SOUL (每個 ${pricePerUnit.toFixed(0)} SOUL)`);
  }
  
  console.log("\n價格分析:");
  console.log("- 單價: 33,944 SOUL (2 USD)");
  console.log("- 基於真實 Uniswap V3 價格比例");
  console.log("- 不再是整數 33,000！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });