const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 測試直接調用 Coordinator ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const subId = "114131353280130458891383141995968474440293173552039681622016393393251650814328";
  
  // Coordinator ABI (只包含需要的函數)
  const coordinatorAbi = [
    "function requestRandomWords(bytes32 keyHash, uint256 subId, uint16 requestConfirmations, uint32 callbackGasLimit, uint32 numWords) returns (uint256 requestId)",
    "function getSubscription(uint256 subId) view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] consumers)"
  ];
  
  const coordinator = new ethers.Contract(coordinatorAddress, coordinatorAbi, wallet);
  
  console.log("📊 測試參數");
  console.log("─".repeat(50));
  console.log("Coordinator:", coordinatorAddress);
  console.log("訂閱 ID:", subId);
  console.log("Key Hash:", "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4");
  console.log("調用者:", wallet.address);
  
  // 檢查訂閱
  console.log("\n📊 訂閱狀態");
  console.log("─".repeat(50));
  
  try {
    const subscription = await coordinator.getSubscription(subId);
    console.log("✅ 訂閱存在");
    console.log("LINK 餘額:", ethers.formatEther(subscription.balance), "LINK");
    console.log("BNB 餘額:", ethers.formatEther(subscription.nativeBalance), "BNB");
    console.log("Consumers:", subscription.consumers);
  } catch (error) {
    console.log("❌ 無法獲取訂閱:", error.message);
  }
  
  // 嘗試直接調用 Coordinator
  console.log("\n🧪 直接調用 Coordinator requestRandomWords");
  console.log("─".repeat(50));
  
  try {
    console.log("執行靜態調用測試...");
    
    const keyHash = "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4";
    const requestConfirmations = 3;
    const callbackGasLimit = 500000;
    const numWords = 1;
    
    // 注意：這會失敗，因為 wallet.address 不是 Consumer
    // 但可以幫助診斷問題
    const requestId = await coordinator.requestRandomWords.staticCall(
      keyHash,
      subId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
    
    console.log("✅ 靜態調用成功！");
    console.log("預期 requestId:", requestId.toString());
    
  } catch (error) {
    console.log("❌ 靜態調用失敗:", error.message);
    
    if (error.message.includes("InvalidConsumer")) {
      console.log("原因：調用者不是有效的 Consumer");
      console.log("解決：必須通過 VRF Manager 合約調用");
    } else if (error.message.includes("InsufficientBalance")) {
      console.log("原因：訂閱餘額不足");
    } else {
      console.log("其他錯誤");
    }
  }
  
  // 測試從 VRF Manager 調用
  console.log("\n🧪 通過 VRF Manager 調用");
  console.log("─".repeat(50));
  
  const managerAddress = "0xb772e15dF8aB4B38c1D4Ba1F4b0451B3e2B7B0C6";
  console.log("VRF Manager:", managerAddress);
  console.log("該地址已添加為 Consumer ✅");
  
  // 創建簡單的測試合約來直接調用 coordinator
  const testContractCode = `
    // 這是一個簡化的測試合約
    contract TestVRF {
      address coordinator = ${coordinatorAddress};
      uint256 subId = ${subId};
      
      function testRequest() external returns (uint256) {
        // 直接調用 coordinator
        return ICoordinator(coordinator).requestRandomWords(
          0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4,
          subId,
          3,
          500000,
          1
        );
      }
    }
  `;
  
  console.log("\n建議：");
  console.log("1. VRF Manager 已正確添加為 Consumer");
  console.log("2. 訂閱有充足的 LINK 和 BNB");
  console.log("3. 可能是合約內部邏輯問題");
  console.log("4. 讓我們檢查 VRF Manager 合約的具體錯誤");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });