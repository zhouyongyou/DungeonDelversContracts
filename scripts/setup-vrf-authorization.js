const hre = require("hardhat");

async function main() {
  // 配置地址
  const VRF_CONSUMER_ADDRESS = process.env.VRF_CONSUMER_ADDRESS || "0xcb1cbbf6ceac80fc1973ff5db9278d4cb12443b1";
  const HERO_ADDRESS = "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0";
  const RELIC_ADDRESS = "0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366";
  const DUNGEONMASTER_ADDRESS = "0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703";
  const ALTAROFASCENSION_ADDRESS = "0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3";
  
  console.log("🔧 設置 VRF 授權...");
  console.log("VRF Consumer:", VRF_CONSUMER_ADDRESS);
  
  // 連接到 VRFConsumerV2Plus
  const vrfConsumer = await hre.ethers.getContractAt(
    "VRFConsumerV2Plus",
    VRF_CONSUMER_ADDRESS
  );
  
  // 授權合約
  console.log("\n📝 授權合約使用 VRF...");
  
  const contracts = [
    { name: "Hero", address: HERO_ADDRESS },
    { name: "Relic", address: RELIC_ADDRESS },
    { name: "DungeonMaster", address: DUNGEONMASTER_ADDRESS },
    { name: "AltarOfAscension", address: ALTAROFASCENSION_ADDRESS }
  ];
  
  for (const contract of contracts) {
    try {
      const tx = await vrfConsumer.setAuthorizedContract(contract.address, true);
      await tx.wait();
      console.log(`✅ ${contract.name} 授權成功: ${contract.address}`);
    } catch (error) {
      console.log(`❌ ${contract.name} 授權失敗:`, error.message);
    }
  }
  
  console.log("\n🔧 設置各合約的 VRF Manager...");
  
  // 設置 Hero 的 VRF Manager
  try {
    const hero = await hre.ethers.getContractAt("Hero", HERO_ADDRESS);
    const tx = await hero.setVRFManager(VRF_CONSUMER_ADDRESS);
    await tx.wait();
    console.log("✅ Hero VRF Manager 設置成功");
  } catch (error) {
    console.log("❌ Hero VRF Manager 設置失敗:", error.message);
  }
  
  // 設置 Relic 的 VRF Manager
  try {
    const relic = await hre.ethers.getContractAt("Relic", RELIC_ADDRESS);
    const tx = await relic.setVRFManager(VRF_CONSUMER_ADDRESS);
    await tx.wait();
    console.log("✅ Relic VRF Manager 設置成功");
  } catch (error) {
    console.log("❌ Relic VRF Manager 設置失敗:", error.message);
  }
  
  // 設置 DungeonMaster 的 VRF Manager
  try {
    const dungeonMaster = await hre.ethers.getContractAt("DungeonMaster", DUNGEONMASTER_ADDRESS);
    const tx = await dungeonMaster.setVRFManager(VRF_CONSUMER_ADDRESS);
    await tx.wait();
    console.log("✅ DungeonMaster VRF Manager 設置成功");
  } catch (error) {
    console.log("❌ DungeonMaster VRF Manager 設置失敗:", error.message);
  }
  
  // 設置 AltarOfAscension 的 VRF Manager
  try {
    const altar = await hre.ethers.getContractAt("AltarOfAscension", ALTAROFASCENSION_ADDRESS);
    const tx = await altar.setVRFManager(VRF_CONSUMER_ADDRESS);
    await tx.wait();
    console.log("✅ AltarOfAscension VRF Manager 設置成功");
  } catch (error) {
    console.log("❌ AltarOfAscension VRF Manager 設置失敗:", error.message);
  }
  
  console.log("\n✅ VRF 授權設置完成！");
  
  // 查詢當前狀態
  console.log("\n📊 當前授權狀態：");
  for (const contract of contracts) {
    const isAuthorized = await vrfConsumer.authorized(contract.address);
    console.log(`${contract.name}: ${isAuthorized ? "✅ 已授權" : "❌ 未授權"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });