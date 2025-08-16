// 診斷遠征失敗原因

const hre = require("hardhat");
const { ethers } = require("hardhat");
const { formatEther } = require("ethers");

async function main() {
  console.log("🔍 診斷遠征失敗原因...\n");

  // V3 合約地址
  const dungeonMasterAddress = "0x5D4ae4275A5173A52EF32F42F21F13794dcFD95d";
  const partyAddress = "0xBFcfB4e00EF020b30A602e982026e54617dAfd44";
  const dungeonStorageAddress = "0x43b9745063c488781bBE45373E1d539A4a00d52e";
  
  const [signer] = await ethers.getSigners();
  console.log(`使用地址: ${signer.address}\n`);
  
  // 連接合約
  const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
  const party = await ethers.getContractAt("Party", partyAddress);
  const dungeonStorage = await ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
  
  // 測試參數
  const partyId = 1; // 假設使用隊伍 #1
  const dungeonId = 1; // 假設使用地城 #1
  
  console.log("1️⃣ 檢查隊伍所有權:");
  console.log("================================");
  
  try {
    const owner = await party.ownerOf(partyId);
    console.log(`隊伍 #${partyId} 擁有者: ${owner}`);
    console.log(`是否為當前用戶: ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);
  } catch (e) {
    console.log(`❌ 無法讀取隊伍 #${partyId}:`, e.message);
    console.log("可能隊伍不存在");
  }
  
  console.log("\n2️⃣ 檢查隊伍狀態:");
  console.log("================================");
  
  try {
    const partyStatus = await dungeonStorage.getPartyStatus(partyId);
    console.log("隊伍狀態:", {
      dungeon: partyStatus[0].toString(),
      cooldownEndsAt: partyStatus[1].toString(),
      expeditionPendingUntil: partyStatus[2].toString(),
      fatigueLevel: partyStatus[3].toString()
    });
    
    const currentTime = Math.floor(Date.now() / 1000);
    console.log(`\n當前時間: ${currentTime}`);
    console.log(`冷卻結束時間: ${partyStatus[1]}`);
    console.log(`是否在冷卻中: ${currentTime < partyStatus[1] ? '❌ 是' : '✅ 否'}`);
    
    console.log(`\n遠征待定時間: ${partyStatus[2]}`);
    console.log(`是否有待定遠征: ${partyStatus[2] > 0 ? '❌ 是' : '✅ 否'}`);
  } catch (e) {
    console.log("❌ 無法讀取隊伍狀態:", e.message);
  }
  
  console.log("\n3️⃣ 檢查隊伍戰力:");
  console.log("================================");
  
  try {
    const partyData = await party.parties(partyId);
    console.log("隊伍數據:", {
      totalPower: partyData.totalPower.toString(),
      heroCount: partyData.heroCount.toString()
    });
    
    // 計算有效戰力
    const fatigueLevel = (await dungeonStorage.getPartyStatus(partyId))[3];
    const effectivePower = partyData.totalPower * (100n - fatigueLevel * 2n) / 100n;
    console.log(`\n疲勞度: ${fatigueLevel}`);
    console.log(`有效戰力: ${effectivePower} (原始: ${partyData.totalPower})`);
  } catch (e) {
    console.log("❌ 無法讀取隊伍數據:", e.message);
  }
  
  console.log("\n4️⃣ 檢查地城要求:");
  console.log("================================");
  
  try {
    const dungeon = await dungeonStorage.getDungeon(dungeonId);
    console.log(`地城 #${dungeonId}:`, {
      name: dungeon.name,
      requiredPower: dungeon.requiredPower.toString(),
      baseSuccessRate: dungeon.baseSuccessRate.toString()
    });
    
    // 比較戰力
    const partyData = await party.parties(partyId);
    const fatigueLevel = (await dungeonStorage.getPartyStatus(partyId))[3];
    const effectivePower = partyData.totalPower * (100n - fatigueLevel * 2n) / 100n;
    
    console.log(`\n戰力檢查:`);
    console.log(`需求戰力: ${dungeon.requiredPower}`);
    console.log(`有效戰力: ${effectivePower}`);
    console.log(`是否滿足: ${effectivePower >= dungeon.requiredPower ? '✅' : '❌'}`);
  } catch (e) {
    console.log("❌ 無法讀取地城數據:", e.message);
  }
  
  console.log("\n5️⃣ 檢查費用:");
  console.log("================================");
  
  try {
    const explorationFee = await dungeonMaster.explorationFee();
    console.log(`探索費用: ${formatEther(explorationFee)} BNB`);
    
    const balance = await ethers.provider.getBalance(signer.address);
    console.log(`用戶餘額: ${formatEther(balance)} BNB`);
    console.log(`餘額是否足夠: ${balance >= explorationFee ? '✅' : '❌'}`);
  } catch (e) {
    console.log("❌ 無法檢查費用:", e.message);
  }
  
  console.log("\n6️⃣ 模擬交易:");
  console.log("================================");
  
  try {
    const explorationFee = await dungeonMaster.explorationFee();
    console.log(`嘗試發送遠征 (隊伍 #${partyId} -> 地城 #${dungeonId})...`);
    
    // 使用 staticCall 模擬
    try {
      await dungeonMaster.requestExpedition.staticCall(partyId, dungeonId, { value: explorationFee });
      console.log("✅ 模擬成功！交易應該可以執行");
    } catch (error) {
      console.log("❌ 模擬失敗!");
      console.log("錯誤訊息:", error.message);
      
      // 解析錯誤原因
      if (error.message.includes("DM: Insufficient power")) {
        console.log("原因: 戰力不足");
      } else if (error.message.includes("DM: Party on cooldown")) {
        console.log("原因: 隊伍在冷卻中");
      } else if (error.message.includes("DM: Expedition pending")) {
        console.log("原因: 有待定的遠征");
      } else if (error.message.includes("ERC721: caller is not token owner")) {
        console.log("原因: 不是隊伍擁有者");
      } else if (error.message.includes("DM: Incorrect fee")) {
        console.log("原因: 費用不正確");
      } else {
        console.log("未知原因，請檢查合約");
      }
    }
  } catch (e) {
    console.log("❌ 無法模擬交易:", e.message);
  }
  
  console.log("\n📋 診斷完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exit(1);
  });