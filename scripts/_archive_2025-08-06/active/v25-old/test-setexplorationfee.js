const ethers = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 測試 setExplorationFee 交易 ===\n");
  
  // 設置 provider 和 signer
  const provider = new ethers.JsonRpcProvider(process.env.VITE_ALCHEMY_BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org/");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("使用錢包:", wallet.address);
  
  // 合約地址和 ABI
  const dungeonMasterAddress = "0x9ccF46E49DdA7D2DF7cE8064FB879D786D8b12D0";
  const abi = [
    "function owner() view returns (address)",
    "function explorationFee() view returns (uint256)",
    "function setExplorationFee(uint256 _newFee)",
    "function paused() view returns (bool)"
  ];
  
  const contract = new ethers.Contract(dungeonMasterAddress, abi, wallet);
  
  try {
    // 1. 檢查當前狀態
    const owner = await contract.owner();
    const currentFee = await contract.explorationFee();
    const paused = await contract.paused();
    
    console.log("合約 Owner:", owner);
    console.log("當前探索費:", ethers.formatEther(currentFee), "BNB");
    console.log("合約暫停狀態:", paused);
    console.log("您是 Owner 嗎?", owner.toLowerCase() === wallet.address.toLowerCase());
    
    if (!owner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log("\n❌ 您不是合約 Owner!");
      return;
    }
    
    // 2. 設置新費用 (0.002 BNB)
    const newFee = ethers.parseEther("0.002");
    console.log("\n準備設置新費用:", ethers.formatEther(newFee), "BNB");
    
    // 3. 估算 Gas
    console.log("\n估算 Gas...");
    const estimatedGas = await contract.setExplorationFee.estimateGas(newFee);
    console.log("預估 Gas:", estimatedGas.toString());
    
    // 4. 獲取當前 gas 價格
    const gasPrice = await provider.getFeeData();
    console.log("Gas 價格:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    
    // 5. 計算總費用
    const totalCost = estimatedGas * gasPrice.gasPrice;
    console.log("預估交易費用:", ethers.formatEther(totalCost), "BNB");
    
    // 6. 檢查餘額
    const balance = await provider.getBalance(wallet.address);
    console.log("錢包餘額:", ethers.formatEther(balance), "BNB");
    
    if (balance < totalCost) {
      console.log("\n❌ 餘額不足!");
      return;
    }
    
    // 7. 詢問是否執行
    console.log("\n是否執行交易? (取消請 Ctrl+C)");
    console.log("等待 5 秒後自動執行...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 8. 執行交易
    console.log("\n執行交易...");
    const tx = await contract.setExplorationFee(newFee, {
      gasLimit: estimatedGas * 120n / 100n, // 增加 20% 餘量
      gasPrice: gasPrice.gasPrice
    });
    
    console.log("交易已發送:", tx.hash);
    console.log("等待確認...");
    
    const receipt = await tx.wait();
    console.log("\n✅ 交易成功!");
    console.log("區塊號:", receipt.blockNumber);
    console.log("Gas 使用:", receipt.gasUsed.toString());
    
    // 9. 驗證結果
    const updatedFee = await contract.explorationFee();
    console.log("\n更新後的探索費:", ethers.formatEther(updatedFee), "BNB");
    
  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);
    
    if (error.data) {
      console.log("錯誤數據:", error.data);
    }
    
    if (error.reason) {
      console.log("錯誤原因:", error.reason);
    }
    
    if (error.code) {
      console.log("錯誤代碼:", error.code);
    }
  }
}

main();