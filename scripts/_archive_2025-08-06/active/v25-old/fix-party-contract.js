const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 修復 Party 合約配置 ===\n");

  // 確認 signer
  const [signer] = await ethers.getSigners();
  console.log("執行地址:", signer.address);

  // V22 配置
  const config = {
    PARTY: "0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee",
    HERO: "0x141F081922D4015b3157cdA6eE970dff34bb8AAb",
    RELIC: "0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3",
    DUNGEONCORE: "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9",
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };

  // 元數據服務器 URL
  const METADATA_SERVER_URL = "https://dungeon-delvers-metadata-server.onrender.com";

  console.log("\n檢查 Party 合約狀態...");
  
  // 使用正確的合約路徑
  const party = await ethers.getContractAt(
    "contracts/current/nft/Party.sol:Party", 
    config.PARTY, 
    signer
  );
  
  // 檢查 owner
  const owner = await party.owner();
  console.log(`  Owner: ${owner}`);
  
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log(`  ✗ 錯誤：當前帳戶不是 Party 合約的 owner`);
    console.log(`  請使用 owner 帳戶 (${owner}) 執行此腳本`);
    return;
  }
  
  // 檢查 Hero 合約
  const currentHero = await party.heroContract();
  console.log(`  當前 Hero 合約: ${currentHero}`);
  
  if (currentHero === ethers.ZeroAddress || currentHero.toLowerCase() !== config.HERO.toLowerCase()) {
    console.log(`  ✗ Hero 合約需要更新！正在設置...`);
    const tx = await party.setHeroContract(config.HERO);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ Hero 合約設置成功: ${config.HERO}`);
  } else {
    console.log(`  ✓ Hero 合約已正確設置`);
  }
  
  // 檢查 Relic 合約
  const currentRelic = await party.relicContract();
  console.log(`  當前 Relic 合約: ${currentRelic}`);
  
  if (currentRelic === ethers.ZeroAddress || currentRelic.toLowerCase() !== config.RELIC.toLowerCase()) {
    console.log(`  ✗ Relic 合約需要更新！正在設置...`);
    const tx = await party.setRelicContract(config.RELIC);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ Relic 合約設置成功: ${config.RELIC}`);
  } else {
    console.log(`  ✓ Relic 合約已正確設置`);
  }
  
  // 檢查 DungeonCore 合約
  const currentCore = await party.dungeonCoreContract();
  console.log(`  當前 DungeonCore 合約: ${currentCore}`);
  
  if (currentCore === ethers.ZeroAddress || currentCore.toLowerCase() !== config.DUNGEONCORE.toLowerCase()) {
    console.log(`  ✗ DungeonCore 合約需要更新！正在設置...`);
    const tx = await party.setDungeonCoreContract(config.DUNGEONCORE);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ DungeonCore 合約設置成功: ${config.DUNGEONCORE}`);
  } else {
    console.log(`  ✓ DungeonCore 合約已正確設置`);
  }
  
  // 檢查並設置 baseURI
  const currentBaseURI = await party.baseURI();
  console.log(`  當前 baseURI: ${currentBaseURI || "(未設置)"}`);
  
  if (!currentBaseURI || !currentBaseURI.includes("dungeon-delvers-metadata-server")) {
    const baseURI = `${METADATA_SERVER_URL}/api/party/`;
    console.log(`  ✗ baseURI 需要更新！正在設置: ${baseURI}`);
    const tx = await party.setBaseURI(baseURI);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ baseURI 設置成功`);
  } else {
    console.log(`  ✓ baseURI 已正確設置`);
  }
  
  // 檢查並設置 contractURI
  const currentContractURI = await party.contractURI();
  console.log(`  當前 contractURI: ${currentContractURI || "(未設置)"}`);
  
  if (!currentContractURI || !currentContractURI.includes("dungeon-delvers-metadata-server")) {
    const contractURI = `${METADATA_SERVER_URL}/api/party/contract`;
    console.log(`  ✗ contractURI 需要更新！正在設置: ${contractURI}`);
    const tx = await party.setContractURI(contractURI);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ contractURI 設置成功`);
  } else {
    console.log(`  ✓ contractURI 已正確設置`);
  }
  
  console.log("\n=== 修復完成！===");
  console.log("\n驗證最終狀態：");
  console.log(`  Hero 合約: ${await party.heroContract()}`);
  console.log(`  Relic 合約: ${await party.relicContract()}`);
  console.log(`  DungeonCore 合約: ${await party.dungeonCoreContract()}`);
  console.log(`  BaseURI: ${await party.baseURI()}`);
  console.log(`  ContractURI: ${await party.contractURI()}`);
  
  console.log("\n✅ Party 合約已完全設置好！");
  console.log("\n後續步驟：");
  console.log("1. 確保元數據服務器正在運行並使用 V22 配置");
  console.log("2. 測試組隊功能是否正常");
  console.log("3. 等待 NFT 市場緩存更新（可能需要幾分鐘）");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });