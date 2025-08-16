// 查找用戶擁有的隊伍

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 查找用戶擁有的隊伍...\n");

  const partyAddress = "0xBFcfB4e00EF020b30A602e982026e54617dAfd44";
  const [signer] = await ethers.getSigners();
  
  console.log(`用戶地址: ${signer.address}\n`);
  
  const party = await ethers.getContractAt("Party", partyAddress);
  
  try {
    // 獲取用戶的隊伍餘額
    const balance = await party.balanceOf(signer.address);
    console.log(`擁有的隊伍數量: ${balance}\n`);
    
    if (balance > 0) {
      console.log("隊伍列表:");
      console.log("================================");
      
      for (let i = 0; i < balance; i++) {
        try {
          // 獲取第 i 個隊伍的 tokenId
          const tokenId = await party.tokenOfOwnerByIndex(signer.address, i);
          console.log(`\n隊伍 #${tokenId}:`);
          
          // 獲取隊伍詳情
          const uri = await party.tokenURI(tokenId);
          console.log(`URI: ${uri}`);
          
          // 嘗試獲取隊伍數據（如果有相關函數）
          try {
            // 這裡假設有 getParty 或類似函數
            const partyData = await party.getParty(tokenId);
            console.log("戰力:", partyData.totalPower.toString());
            console.log("英雄數量:", partyData.heroCount.toString());
          } catch (e) {
            // 如果沒有這個函數，忽略
          }
        } catch (e) {
          console.log(`讀取第 ${i} 個隊伍時出錯:`, e.message);
        }
      }
    } else {
      console.log("❌ 該用戶沒有任何隊伍！");
      console.log("\n建議：");
      console.log("1. 先去鑄造頁面鑄造英雄和聖物");
      console.log("2. 然後去隊伍頁面組建隊伍");
      console.log("3. 最後才能進行遠征");
    }
    
    // 也檢查一些常見的隊伍 ID
    console.log("\n\n檢查一些常見隊伍的擁有者:");
    console.log("================================");
    
    for (let id = 1; id <= 5; id++) {
      try {
        const owner = await party.ownerOf(id);
        console.log(`隊伍 #${id}: ${owner}`);
      } catch (e) {
        console.log(`隊伍 #${id}: 不存在`);
      }
    }
    
  } catch (e) {
    console.log("❌ 錯誤:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exit(1);
  });