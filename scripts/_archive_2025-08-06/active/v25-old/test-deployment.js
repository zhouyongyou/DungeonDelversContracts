const hre = require("hardhat");

async function testDeployment() {
  console.log("測試部署環境...\n");
  
  try {
    // 1. 檢查 ethers 版本
    console.log("Ethers 版本:", hre.ethers.version);
    
    // 2. 獲取部署者
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    // 3. 檢查餘額
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("餘額:", hre.ethers.formatEther(balance), "BNB");
    
    // 4. 測試簡單合約部署
    console.log("\n測試部署簡單合約...");
    
    // 部署一個最簡單的合約 - 使用 PlayerVault 來測試實際情況
    const TestContract = await hre.ethers.getContractFactory("PlayerVault");
    console.log("合約工廠創建成功");
    
    // 估算 gas
    const deployTx = await TestContract.getDeployTransaction(deployer.address);
    const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);
    console.log("預估 Gas:", estimatedGas.toString());
    
    // 獲取 gas 價格
    const feeData = await hre.ethers.provider.getFeeData();
    console.log("Gas 價格:", {
      gasPrice: feeData.gasPrice?.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
    });
    
    // 嘗試部署
    console.log("\n開始部署...");
    const contract = await TestContract.deploy(deployer.address);
    console.log("交易已發送，等待確認...");
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("✅ 合約部署成功:", address);
    
  } catch (error) {
    console.error("\n❌ 錯誤詳情:");
    console.error("錯誤類型:", error.constructor.name);
    console.error("錯誤訊息:", error.message);
    if (error.code) console.error("錯誤代碼:", error.code);
    if (error.transaction) {
      console.error("交易詳情:", JSON.stringify(error.transaction, null, 2));
    }
    console.error("\n完整錯誤:", error);
  }
}

testDeployment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });