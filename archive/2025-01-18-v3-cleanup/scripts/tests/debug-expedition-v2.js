// 診斷遠征失敗原因 - 針對地城 #8

const hre = require("hardhat");
const { ethers } = require("hardhat");
const { formatEther } = require("ethers");

async function main() {
  console.log("🔍 診斷地城 #8 遠征失敗原因...\n");

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
  const partyId = 1;
  const dungeonId = 8; // 使用失敗交易中的地城 ID
  
  console.log("1️⃣ 檢查隊伍 #1 所有權:");
  console.log("================================");
  
  try {
    const owner = await party.ownerOf(partyId);
    console.log(`隊伍 #${partyId} 擁有者: ${owner}`);
    console.log(`是否為當前用戶: ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅ 是' : '❌ 否'}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("\n❌ 失敗原因：你不是隊伍 #1 的擁有者！");
      return;
    }
  } catch (e) {
    console.log(`❌ 隊伍 #${partyId} 不存在！`);
    return;
  }
  
  console.log("\n2️⃣ 檢查地城 #8 是否存在:");
  console.log("================================");
  
  try {
    const dungeon = await dungeonStorage.getDungeon(dungeonId);
    console.log(`地城 #${dungeonId}:`, {
      name: dungeon.name || '無名稱',
      isInitialized: dungeon.isInitialized,
      requiredPower: dungeon.requiredPower.toString(),
      baseSuccessRate: dungeon.baseSuccessRate.toString()
    });
    
    if (!dungeon.isInitialized) {
      console.log("\n❌ 失敗原因：地城 #8 未初始化！");
      return;
    }
  } catch (e) {
    console.log(`❌ 無法讀取地城 #${dungeonId}:`, e.message);
    console.log("\n❌ 失敗原因：地城 #8 不存在！");
    return;
  }
  
  console.log("\n3️⃣ 檢查隊伍狀態:");
  console.log("================================");
  
  try {
    const partyStatus = await dungeonStorage.getPartyStatus(partyId);
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log("隊伍狀態:", {
      cooldownEndsAt: partyStatus.cooldownEndsAt.toString(),
      fatigueLevel: partyStatus.fatigueLevel.toString()
    });
    
    console.log(`\n當前時間: ${currentTime}`);
    console.log(`冷卻結束時間: ${partyStatus.cooldownEndsAt}`);
    console.log(`是否在冷卻中: ${currentTime < partyStatus.cooldownEndsAt ? '❌ 是' : '✅ 否'}`);
    
    if (currentTime < partyStatus.cooldownEndsAt) {
      const remainingTime = Number(partyStatus.cooldownEndsAt) - currentTime;
      console.log(`\n❌ 失敗原因：隊伍仍在冷卻中！剩餘 ${Math.floor(remainingTime / 60)} 分鐘`);
      return;
    }
  } catch (e) {
    console.log("❌ 無法讀取隊伍狀態:", e.message);
  }
  
  console.log("\n4️⃣ 檢查隊伍戰力:");
  console.log("================================");
  
  try {
    // 使用 getPartyComposition 獲取戰力
    const [maxPower] = await party.getPartyComposition(partyId);
    console.log(`隊伍總戰力: ${maxPower}`);
    
    // 計算有效戰力
    const partyStatus = await dungeonStorage.getPartyStatus(partyId);
    const fatigueLevel = partyStatus.fatigueLevel;
    const fatiguePercentage = Number(fatigueLevel) * 2;
    const effectivePower = (maxPower * BigInt(100 - fatiguePercentage)) / 100n;
    
    console.log(`疲勞度: ${fatigueLevel} (降低 ${fatiguePercentage}% 戰力)`);
    console.log(`有效戰力: ${effectivePower}`);
    
    // 檢查地城要求
    const dungeon = await dungeonStorage.getDungeon(dungeonId);
    console.log(`\n地城 #${dungeonId} 需求戰力: ${dungeon.requiredPower}`);
    console.log(`戰力是否足夠: ${effectivePower >= dungeon.requiredPower ? '✅ 是' : '❌ 否'}`);
    
    if (effectivePower < dungeon.requiredPower) {
      console.log(`\n❌ 失敗原因：戰力不足！需要 ${dungeon.requiredPower}，但只有 ${effectivePower}`);
      return;
    }
  } catch (e) {
    console.log("❌ 無法檢查戰力:", e.message);
  }
  
  console.log("\n5️⃣ 檢查費用:");
  console.log("================================");
  
  try {
    const explorationFee = await dungeonMaster.explorationFee();
    console.log(`探索費用: ${formatEther(explorationFee)} BNB`);
    
    const balance = await ethers.provider.getBalance(signer.address);
    console.log(`用戶餘額: ${formatEther(balance)} BNB`);
    console.log(`餘額是否足夠: ${balance >= explorationFee ? '✅ 是' : '❌ 否'}`);
  } catch (e) {
    console.log("❌ 無法檢查費用:", e.message);
  }
  
  console.log("\n6️⃣ 檢查所有地城:");
  console.log("================================");
  
  try {
    // 獲取地城數量
    const dungeonCount = await dungeonStorage.getDungeonCount();
    console.log(`總地城數量: ${dungeonCount}`);
    
    console.log("\n所有地城列表:");
    for (let i = 1; i <= dungeonCount && i <= 10; i++) {
      try {
        const d = await dungeonStorage.getDungeon(i);
        console.log(`地城 #${i}: ${d.name || '無名稱'} - 需求戰力: ${d.requiredPower} - 初始化: ${d.isInitialized ? '✅' : '❌'}`);
      } catch (e) {
        console.log(`地城 #${i}: 讀取失敗`);
      }
    }
  } catch (e) {
    console.log("❌ 無法獲取地城列表:", e.message);
  }
  
  console.log("\n📋 診斷完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exit(1);
  });