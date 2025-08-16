const { ethers } = require("ethers");
require("dotenv").config();

async function setVRF() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const heroAddress = "0xfA8D78A9245F19B42529f7C17DFaA7152860aB5A";
  const vrfManager = "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD";
  
  // 使用低層級調用
  const data = "0x7a33eabc" + vrfManager.slice(2).padStart(64, '0');
  
  try {
    const tx = await wallet.sendTransaction({
      to: heroAddress,
      data: data,
      gasLimit: 100000
    });
    
    console.log("交易發送:", tx.hash);
    const receipt = await tx.wait();
    console.log("交易確認:", receipt.status === 1 ? "成功" : "失敗");
    
  } catch (error) {
    console.log("錯誤:", error.message);
    if (error.data) {
      console.log("錯誤數據:", error.data);
    }
  }
}

setVRF();
