const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 部署並測試簡化版 VRF Manager ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("部署者:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // 編譯合約
  console.log("📦 步驟 1：編譯合約");
  console.log("─".repeat(50));
  
  const { execSync } = require('child_process');
  try {
    console.log("編譯 SimpleVRFManager...");
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log("✅ 編譯成功\n");
  } catch (error) {
    console.log("❌ 編譯失敗:", error.message);
    return;
  }
  
  // 讀取編譯後的合約
  const contractPath = 'artifacts/contracts/current/core/SimpleVRFManager.sol/SimpleVRFManager.json';
  if (!fs.existsSync(contractPath)) {
    console.log("❌ 找不到編譯後的合約文件");
    return;
  }
  
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // 部署合約
  console.log("🚀 步驟 2：部署 SimpleVRFManager");
  console.log("─".repeat(50));
  
  const wrapperAddress = "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94"; // BSC VRF V2.5 Wrapper
  
  console.log("VRF Wrapper:", wrapperAddress);
  console.log("部署中...");
  
  const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  
  try {
    const contract = await factory.deploy(wrapperAddress, {
      gasLimit: 3000000
    });
    
    console.log("交易哈希:", contract.deploymentTransaction().hash);
    console.log("等待確認...");
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log("✅ 部署成功:", address);
    
    // 等待更多確認
    console.log("等待 3 個區塊確認...");
    await contract.deploymentTransaction().wait(3);
    
    // 測試合約
    console.log("\n🧪 步驟 3：測試基本功能");
    console.log("─".repeat(50));
    
    const simpleVRF = new ethers.Contract(address, contractJson.abi, wallet);
    
    // 檢查配置
    const fee = await simpleVRF.fee();
    const gasLimit = await simpleVRF.callbackGasLimit();
    const confirmations = await simpleVRF.requestConfirmations();
    
    console.log("合約配置：");
    console.log("- 費用:", ethers.formatEther(fee), "BNB");
    console.log("- Gas 限制:", gasLimit.toString());
    console.log("- 確認數:", confirmations.toString());
    
    // 測試請求隨機數
    console.log("\n📊 步驟 4：請求隨機數");
    console.log("─".repeat(50));
    
    const numWords = 3; // 請求 3 個隨機數
    console.log("請求", numWords, "個隨機數");
    console.log("支付費用:", ethers.formatEther(fee), "BNB");
    
    try {
      const requestTx = await simpleVRF.requestRandom(numWords, {
        value: fee,
        gasLimit: 1000000
      });
      
      console.log("交易哈希:", requestTx.hash);
      const receipt = await requestTx.wait();
      console.log("✅ 請求成功！");
      console.log("Gas 使用:", receipt.gasUsed.toString());
      
      // 從事件獲取 requestId
      const event = receipt.logs.find(log => {
        try {
          const parsed = simpleVRF.interface.parseLog(log);
          return parsed && parsed.name === 'RandomRequested';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = simpleVRF.interface.parseLog(event);
        console.log("請求 ID:", parsed.args.requestId.toString());
      }
      
      // 等待隨機數
      console.log("\n⏳ 步驟 5：等待 Chainlink 回調");
      console.log("─".repeat(50));
      console.log("通常需要 1-3 個區塊（10-30 秒）...");
      
      let attempts = 0;
      const maxAttempts = 60;
      let fulfilled = false;
      
      while (!fulfilled && attempts < maxAttempts) {
        attempts++;
        await sleep(2000);
        
        const result = await simpleVRF.getMyRandom();
        fulfilled = result.fulfilled;
        
        if (fulfilled) {
          console.log("\n🎉 成功獲取隨機數！");
          console.log("隨機數數量:", result.randomWords.length);
          
          result.randomWords.forEach((word, i) => {
            console.log(`隨機數 ${i + 1}: ${word.toString()}`);
          });
          
          console.log("\n✅ 簡化版 VRF Manager 完全正常！");
        } else {
          if (attempts % 5 === 0) {
            console.log(`等待中... (${attempts * 2} 秒)`);
          }
        }
      }
      
      if (!fulfilled) {
        console.log("\n⚠️ 等待超時，但請求已成功發送");
        console.log("可能需要更長時間，稍後可以查詢結果");
      }
      
    } catch (error) {
      console.log("❌ 請求失敗:", error.message);
      
      // 如果失敗，嘗試降低費用或增加費用
      console.log("\n嘗試調整費用...");
      
      // 嘗試設置更高費用
      const newFee = ethers.parseEther("0.01"); // 0.01 BNB
      console.log("設置新費用: 0.01 BNB");
      
      const setFeeTx = await simpleVRF.setFee(newFee);
      await setFeeTx.wait();
      console.log("✅ 費用已更新");
      
      console.log("\n請使用新費用重新嘗試");
    }
    
    // 保存部署信息
    console.log("\n💾 步驟 6：保存部署信息");
    console.log("─".repeat(50));
    
    const deploymentInfo = {
      SimpleVRFManager: address,
      wrapper: wrapperAddress,
      deployedAt: new Date().toISOString(),
      network: "BSC Mainnet",
      fee: ethers.formatEther(fee) + " BNB",
      status: "測試中"
    };
    
    fs.writeFileSync(
      'simple-vrf-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("部署信息已保存到 simple-vrf-deployment.json");
    console.log("\n合約地址:", address);
    console.log("BSCScan:", `https://bscscan.com/address/${address}`);
    
  } catch (error) {
    console.log("❌ 部署失敗:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });