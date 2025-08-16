const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 查詢 V22 合約部署區塊...\n");

  const txHash = "0x35ee9ab5d96b0c0ad72d77154cf2ee5e90c95f47b5037b59c30e5f982a5c20ea";
  
  try {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    
    // 獲取交易收據
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (receipt && receipt.blockNumber) {
      console.log(`Oracle V22 部署交易: ${txHash}`);
      console.log(`部署區塊號: ${receipt.blockNumber}`);
      console.log(`合約地址: ${receipt.contractAddress}`);
      
      // 將區塊號寫入文件供其他腳本使用
      const fs = require('fs');
      const deploymentInfo = {
        oracleV22: {
          address: receipt.contractAddress || "0xb9317179466fd7fb253669538dE1c4635E81eAc4",
          deploymentBlock: Number(receipt.blockNumber),
          transactionHash: txHash
        }
      };
      
      fs.writeFileSync(
        'deployments/v22-deployment-blocks.json',
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log("\n✅ 部署區塊信息已保存到 deployments/v22-deployment-blocks.json");
    } else {
      console.log("❌ 無法獲取交易收據");
    }
  } catch (error) {
    console.error("❌ 查詢失敗:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });