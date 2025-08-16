// Ethers v6 修復腳本
// 解決 Hardhat 與 ethers v6 的兼容性問題

const { ethers } = require("hardhat");

// 包裝部署函數以處理 ethers v6 問題
async function deployContractSafe(contractName, args = []) {
  const factory = await ethers.getContractFactory(contractName);
  
  // 創建部署交易
  const deployTransaction = await factory.getDeployTransaction(...args);
  
  // 獲取 signer
  const [signer] = await ethers.getSigners();
  
  // 發送交易
  const tx = await signer.sendTransaction(deployTransaction);
  
  // 等待交易被打包
  const receipt = await tx.wait();
  
  // 從收據獲取合約地址
  const contractAddress = receipt.contractAddress;
  
  // 返回合約實例
  const contract = factory.attach(contractAddress);
  
  return {
    address: contractAddress,
    contract: contract,
    deployTransaction: tx,
    receipt: receipt
  };
}

// 修復 waitForDeployment 問題
async function waitForDeploymentSafe(contract) {
  try {
    // 嘗試標準方法
    await contract.waitForDeployment();
    return await contract.getAddress();
  } catch (error) {
    // 如果失敗，從部署交易獲取地址
    const deployTx = contract.deploymentTransaction();
    if (deployTx) {
      const receipt = await deployTx.wait();
      return receipt.contractAddress;
    }
    throw error;
  }
}

// 導出修復函數
module.exports = {
  deployContractSafe,
  waitForDeploymentSafe
};