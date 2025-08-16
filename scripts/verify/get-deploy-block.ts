import { ethers } from "hardhat";

async function main() {
  const provider = ethers.provider;
  
  // 新部署的合約地址
  const contracts = {
    "DungeonMaster V2": "0xd13250E0F0766006816d7AfE95EaEEc5e215d082",
    "DungeonCore": "0xd03d3D7456ba3B52E6E0112eBc2494dB1cB34524",
    "Hero": "0xB882915F4fD4C3773e0E8eeBB65088CB584A0Bdf"
  };

  // 獲取當前區塊
  const currentBlock = await provider.getBlockNumber();
  console.log("當前區塊號:", currentBlock);
  
  // 今天的部署應該在最近的區塊
  // BSC 平均 3 秒一個區塊，一天大約 28,800 個區塊
  // 如果是今天部署的，應該在過去 28,800 個區塊內
  
  const suggestedStartBlock = currentBlock - 1000; // 保守估計，往前 1000 個區塊
  
  console.log("\n建議的起始區塊號:", suggestedStartBlock);
  console.log("這大約是", Math.round(1000 * 3 / 60), "分鐘前");
  
  // 檢查合約是否已部署
  for (const [name, address] of Object.entries(contracts)) {
    const code = await provider.getCode(address);
    console.log(`\n${name} (${address}):`, code.length > 2 ? "✅ 已部署" : "❌ 未部署");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});