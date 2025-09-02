// 修復 Party 連接
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 修復 DungeonCore → Party 連接");
  
  const [deployer] = await ethers.getSigners();
  console.log("操作錢包:", deployer.address);

  const dungeonCoreAddress = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
  const partyAddress = "0x68AA71bab4fca9Bca2f5c299C2d99F0dd974422B";

  const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
  
  console.log("設置 DungeonCore.setPartyContract()...");
  const tx = await dungeonCore.setPartyContract(partyAddress);
  await tx.wait();
  console.log("✅ DungeonCore → Party 設置完成");
  console.log("   交易 Hash:", tx.hash);
  
  // 驗證
  const setParty = await dungeonCore.partyContractAddress();
  console.log("驗證結果:", setParty === partyAddress ? "✅ 正確" : "❌ 錯誤");
}

main().catch(console.error);