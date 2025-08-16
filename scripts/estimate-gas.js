const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 估算部署 Gas 費用 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  
  try {
    const heroFactory = new ethers.ContractFactory(heroJson.abi, heroJson.bytecode, wallet);
    
    // 估算 gas
    console.log("估算 Hero 部署 gas...");
    const estimatedGas = await heroFactory.getDeployTransaction(wallet.address).then(tx => 
      provider.estimateGas(tx)
    );
    
    console.log("估算 gas 需求:", estimatedGas.toString());
    console.log("建議 gas limit:", (estimatedGas * 120n / 100n).toString());
    
    // 檢查餘額
    const balance = await provider.getBalance(wallet.address);
    console.log("錢包餘額:", ethers.formatEther(balance), "BNB");
    
    const gasPrice = await provider.getFeeData();
    console.log("當前 gas price:", gasPrice.gasPrice.toString());
    
    const estimatedCost = estimatedGas * gasPrice.gasPrice;
    console.log("估算成本:", ethers.formatEther(estimatedCost), "BNB");
    
  } catch (error) {
    console.log("❌ Gas 估算失敗:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });