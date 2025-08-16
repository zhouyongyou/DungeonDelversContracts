const hre = require("hardhat");

async function main() {
  console.log("🔧 更新 DungeonCore 中的 DungeonMaster 地址...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 操作者地址:", deployer.address);

  const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
  const newDungeonMasterAddress = process.env.DUNGEONMASTER_ADDRESS;

  if (!dungeonCoreAddress || !newDungeonMasterAddress) {
    throw new Error("請確保 .env 中設定了 DUNGEONCORE_ADDRESS 和 DUNGEONMASTER_ADDRESS");
  }

  console.log("📄 DungeonCore 地址:", dungeonCoreAddress);
  console.log("📄 新 DungeonMaster 地址:", newDungeonMasterAddress);

  // 獲取 DungeonCore 合約實例
  const dungeonCore = await hre.ethers.getContractAt("DungeonCore", dungeonCoreAddress);

  // 更新 DungeonMaster 地址
  console.log("\n🔄 正在更新 DungeonMaster 地址...");
  const tx = await dungeonCore.setDungeonMaster(newDungeonMasterAddress);
  await tx.wait();

  console.log("✅ DungeonMaster 地址已成功更新！");
  console.log("📝 交易哈希:", tx.hash);

  // 驗證更新
  const updatedAddress = await dungeonCore.dungeonMasterAddress();
  console.log("\n✅ 驗證：新的 DungeonMaster 地址為:", updatedAddress);

  if (updatedAddress.toLowerCase() !== newDungeonMasterAddress.toLowerCase()) {
    throw new Error("地址更新失敗！");
  }

  console.log("\n🎉 DungeonCore 更新完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });