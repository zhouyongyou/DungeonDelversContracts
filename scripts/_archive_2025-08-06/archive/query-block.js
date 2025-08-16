const fetch = require('node-fetch');

async function queryBlock() {
  const txHash = "0x35ee9ab5d96b0c0ad72d77154cf2ee5e90c95f47b5037b59c30e5f982a5c20ea";
  
  try {
    const response = await fetch('https://bsc-dataseed1.binance.org/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1
      })
    });

    const data = await response.json();
    
    if (data.result) {
      const blockNumber = parseInt(data.result.blockNumber, 16);
      console.log(`Oracle V22 部署區塊號: ${blockNumber}`);
      
      // 寫入文件
      const fs = require('fs');
      fs.writeFileSync('deployments/v22-block.txt', blockNumber.toString());
      
      return blockNumber;
    } else {
      console.log("無法獲取交易信息");
    }
  } catch (error) {
    console.error("查詢失敗:", error);
  }
}

queryBlock();