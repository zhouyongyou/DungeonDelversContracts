const { ethers } = require("hardhat");
const config = require("../../config/v22-config");

async function main() {
  console.log("=== 診斷 setExplorationFee 交易失敗 ===\n");
  
  const [signer] = await ethers.getSigners();
  console.log("使用錢包:", signer.address);
  
  // DungeonMaster 合約
  const dungeonMasterAddress = config.contracts.DUNGEONMASTER.address;
  console.log("DungeonMaster 地址:", dungeonMasterAddress);
  
  const dungeonMaster = await ethers.getContractAt("DungeonMasterV2_Fixed", dungeonMasterAddress);
  
  // 檢查 owner
  try {
    const owner = await dungeonMaster.owner();
    console.log("合約 Owner:", owner);
    console.log("是否為 Owner:", owner.toLowerCase() === signer.address.toLowerCase());
  } catch (error) {
    console.log("無法讀取 owner:", error.message);
  }
  
  // 檢查當前探索費
  try {
    const currentFee = await dungeonMaster.explorationFee();
    console.log("\n當前探索費:", ethers.formatEther(currentFee), "BNB");
  } catch (error) {
    console.log("無法讀取探索費:", error.message);
  }
  
  // 檢查合約是否暫停
  try {
    const paused = await dungeonMaster.paused();
    console.log("合約是否暫停:", paused);
  } catch (error) {
    console.log("無法檢查暫停狀態:", error.message);
  }
  
  // 嘗試模擬設置新費用
  const newFee = ethers.parseEther("0.002"); // 0.002 BNB
  console.log("\n嘗試設置新費用:", ethers.formatEther(newFee), "BNB");
  
  try {
    // 估算 gas
    const estimatedGas = await dungeonMaster.setExplorationFee.estimateGas(newFee);
    console.log("預估 Gas:", estimatedGas.toString());
    
    // 檢查函數是否存在
    const functionExists = typeof dungeonMaster.setExplorationFee === 'function';
    console.log("setExplorationFee 函數存在:", functionExists);
    
  } catch (error) {
    console.log("\n錯誤詳情:");
    console.log("錯誤訊息:", error.message);
    
    if (error.data) {
      console.log("錯誤數據:", error.data);
    }
    
    if (error.reason) {
      console.log("錯誤原因:", error.reason);
    }
    
    // 解碼錯誤
    if (error.errorName) {
      console.log("錯誤名稱:", error.errorName);
    }
  }
  
  // 檢查合約 bytecode
  const code = await ethers.provider.getCode(dungeonMasterAddress);
  console.log("\n合約是否已部署:", code !== "0x");
  
  // 檢查合約接口
  console.log("\n檢查合約接口:");
  const abi = dungeonMaster.interface;
  const setExplorationFeeFunction = abi.getFunction("setExplorationFee");
  if (setExplorationFeeFunction) {
    console.log("函數簽名:", setExplorationFeeFunction.format());
    console.log("函數選擇器:", setExplorationFeeFunction.selector);
  } else {
    console.log("找不到 setExplorationFee 函數!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });