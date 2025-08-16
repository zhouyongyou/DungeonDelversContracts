const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 測試簡單部署 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // 編譯簡單合約測試
  console.log("\n🔨 編譯合約...");
  const { execSync } = require('child_process');
  try {
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log("✅ 編譯成功");
  } catch (error) {
    console.log("❌ 編譯失敗");
    return;
  }
  
  // 嘗試部署 Hero
  console.log("\n🚀 測試 Hero 部署");
  console.log("─".repeat(60));
  
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  
  if (!fs.existsSync(heroPath)) {
    console.log("❌ Hero.json 不存在");
    return;
  }
  
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  
  console.log("Bytecode 長度:", heroJson.bytecode.length);
  console.log("ABI 函數數量:", heroJson.abi.length);
  
  // 檢查構造函數
  const constructor = heroJson.abi.find(item => item.type === 'constructor');
  console.log("構造函數參數:", constructor ? constructor.inputs : "無構造函數");
  
  try {
    const heroFactory = new ethers.ContractFactory(heroJson.abi, heroJson.bytecode, wallet);
    
    console.log("\n嘗試部署...");
    const heroContract = await heroFactory.deploy(
      wallet.address, // initialOwner
      {
        gasLimit: 3000000
      }
    );
    
    console.log("部署交易哈希:", heroContract.deploymentTransaction().hash);
    
    await heroContract.waitForDeployment();
    const heroAddress = await heroContract.getAddress();
    console.log("✅ Hero 部署成功:", heroAddress);
    
  } catch (error) {
    console.log("❌ 部署失敗:", error.shortMessage);
    console.log("詳細錯誤:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });