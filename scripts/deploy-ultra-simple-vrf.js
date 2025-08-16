const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 部署超簡化 VRF 測試合約 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("部署者:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // 讀取編譯後的合約
  const contractPath = 'artifacts/contracts/current/core/UltraSimpleVRF.sol/UltraSimpleVRF.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // 部署
  console.log("🚀 部署 UltraSimpleVRF");
  console.log("─".repeat(50));
  
  const wrapperAddress = "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94";
  console.log("VRF Wrapper:", wrapperAddress);
  
  const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  
  const contract = await factory.deploy(wrapperAddress, {
    gasLimit: 2000000
  });
  
  console.log("交易哈希:", contract.deploymentTransaction().hash);
  console.log("等待確認...");
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("✅ 部署成功:", address);
  
  // 等待確認
  await contract.deploymentTransaction().wait(3);
  
  // 測試
  console.log("\n🧪 測試基本功能");
  console.log("─".repeat(50));
  
  const simpleVRF = new ethers.Contract(address, contractJson.abi, wallet);
  
  const fee = await simpleVRF.fee();
  console.log("當前費用:", ethers.formatEther(fee), "BNB");
  
  // 請求隨機數
  console.log("\n📊 請求隨機數");
  console.log("─".repeat(50));
  
  try {
    console.log("發送請求...");
    const tx = await simpleVRF.requestRandom({
      value: fee,
      gasLimit: 1000000
    });
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ 請求成功！");
    
    // 從事件獲取 requestId
    const event = receipt.logs.find(log => {
      try {
        const parsed = simpleVRF.interface.parseLog(log);
        return parsed && parsed.name === 'RequestSent';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = simpleVRF.interface.parseLog(event);
      console.log("請求 ID:", parsed.args.requestId.toString());
    }
    
    // 等待結果
    console.log("\n⏳ 等待 Chainlink 回調...");
    
    let attempts = 0;
    const maxAttempts = 60;
    let fulfilled = false;
    
    while (!fulfilled && attempts < maxAttempts) {
      attempts++;
      await sleep(2000);
      
      const result = await simpleVRF.getMyResult();
      fulfilled = result.fulfilled;
      
      if (fulfilled) {
        console.log("\n🎉 成功獲取隨機數！");
        console.log("隨機數:", result.randomWords[0].toString());
        console.log("\n✅ 超簡化 VRF 測試成功！");
      } else {
        if (attempts % 5 === 0) {
          console.log(`等待中... (${attempts * 2} 秒)`);
        }
      }
    }
    
    if (!fulfilled) {
      console.log("\n⚠️ 等待超時");
      console.log("如果 VRF 請求成功，稍後會收到回調");
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
    
    // 如果失敗，嘗試設置更高費用
    console.log("\n嘗試增加費用...");
    const newFee = ethers.parseEther("0.02"); // 0.02 BNB
    
    const setFeeTx = await simpleVRF.setFee(newFee);
    await setFeeTx.wait();
    console.log("✅ 費用已更新為 0.02 BNB");
    console.log("請重新嘗試");
  }
  
  // 保存信息
  const info = {
    UltraSimpleVRF: address,
    wrapper: wrapperAddress,
    fee: ethers.formatEther(fee) + " BNB",
    deployedAt: new Date().toISOString(),
    network: "BSC Mainnet"
  };
  
  fs.writeFileSync('ultra-simple-vrf.json', JSON.stringify(info, null, 2));
  
  console.log("\n部署信息已保存");
  console.log("合約地址:", address);
  console.log("BSCScan:", `https://bscscan.com/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });