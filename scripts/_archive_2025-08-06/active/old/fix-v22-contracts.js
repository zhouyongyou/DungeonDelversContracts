const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 修復 V22 合約配置問題 ===\n");

  // 確認 signer
  const [signer] = await ethers.getSigners();
  console.log("執行地址:", signer.address);

  // V22 配置
  const config = {
    // 核心代幣
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    
    // 核心合約
    DUNGEONCORE: "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9",
    
    // NFT 合約
    HERO: "0x141F081922D4015b3157cdA6eE970dff34bb8AAb",
    RELIC: "0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3",
    PARTY: "0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee",
    VIPSTAKING: "0xc59B9944a9CbB947F4067F941EbFB0a5A2564eb9",
    
    // Owner 地址
    OWNER: "0xEbCF4A36Ad1485A9737025e9d72186b604487274"
  };

  // 元數據服務器 URL
  const METADATA_SERVER_URL = "https://dungeon-delvers-metadata-server.onrender.com";

  console.log("\n1. 檢查 VIPStaking 合約狀態...");
  
  // VIPStaking ABI
  const vipABI = [
    "function soulShardToken() view returns (address)",
    "function dungeonCore() view returns (address)",
    "function setSoulShardToken(address _newAddress) external",
    "function setDungeonCore(address _newAddress) external",
    "function setBaseURI(string memory _newBaseURI) external",
    "function setContractURI(string memory newContractURI) external",
    "function baseURI() view returns (string)",
    "function contractURI() view returns (string)",
    "function owner() view returns (address)"
  ];
  
  const vipStaking = new ethers.Contract(config.VIPSTAKING, vipABI, signer);
  
  // 檢查 owner
  const vipOwner = await vipStaking.owner();
  console.log(`  Owner: ${vipOwner}`);
  
  if (vipOwner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log(`  ✗ 錯誤：當前帳戶不是 VIPStaking 合約的 owner`);
    console.log(`  請使用 owner 帳戶 (${vipOwner}) 執行此腳本`);
    return;
  }
  
  // 檢查 soulShardToken
  const currentToken = await vipStaking.soulShardToken();
  console.log(`  當前 SoulShardToken: ${currentToken}`);
  
  if (currentToken === ethers.ZeroAddress) {
    console.log(`  ✗ SoulShardToken 未設置！正在設置...`);
    const tx = await vipStaking.setSoulShardToken(config.SOULSHARD);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ SoulShardToken 設置成功: ${config.SOULSHARD}`);
  } else {
    console.log(`  ✓ SoulShardToken 已設置`);
  }
  
  // 檢查 dungeonCore
  const currentCore = await vipStaking.dungeonCore();
  console.log(`  當前 DungeonCore: ${currentCore}`);
  
  if (currentCore === ethers.ZeroAddress) {
    console.log(`  ✗ DungeonCore 未設置！正在設置...`);
    const tx = await vipStaking.setDungeonCore(config.DUNGEONCORE);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ DungeonCore 設置成功: ${config.DUNGEONCORE}`);
  } else {
    console.log(`  ✓ DungeonCore 已設置`);
  }
  
  // 檢查並設置 baseURI
  const currentBaseURI = await vipStaking.baseURI();
  console.log(`  當前 baseURI: ${currentBaseURI || "(未設置)"}`);
  
  if (!currentBaseURI) {
    const baseURI = `${METADATA_SERVER_URL}/api/vip/`;
    console.log(`  ✗ baseURI 未設置！正在設置: ${baseURI}`);
    const tx = await vipStaking.setBaseURI(baseURI);
    console.log(`  交易發送: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ baseURI 設置成功`);
  } else {
    console.log(`  ✓ baseURI 已設置`);
  }
  
  console.log("\n2. 檢查其他 NFT 合約的依賴關係...");
  
  // 檢查 Hero, Relic 合約
  const nftContracts = [
    { name: "Hero", address: config.HERO },
    { name: "Relic", address: config.RELIC }
  ];
  
  for (const { name, address } of nftContracts) {
    console.log(`\n檢查 ${name} 合約 (${address}):`);
    
    const contractPath = name === "Hero" 
      ? "contracts/current/nft/Hero.sol:Hero"
      : "contracts/current/nft/Relic.sol:Relic";
    
    const contract = await ethers.getContractAt(contractPath, address, signer);
    
    // 檢查 owner
    const owner = await contract.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log(`  ✗ 跳過：當前帳戶不是 owner`);
      continue;
    }
    
    // 檢查 soulShardToken
    const token = await contract.soulShardToken();
    console.log(`  SoulShardToken: ${token}`);
    
    if (token === ethers.ZeroAddress) {
      console.log(`  ✗ SoulShardToken 未設置！正在設置...`);
      const tx = await contract.setSoulShardToken(config.SOULSHARD);
      console.log(`  交易發送: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✓ SoulShardToken 設置成功`);
    }
    
    // 檢查 dungeonCore
    const core = await contract.dungeonCore();
    console.log(`  DungeonCore: ${core}`);
    
    if (core === ethers.ZeroAddress) {
      console.log(`  ✗ DungeonCore 未設置！正在設置...`);
      const tx = await contract.setDungeonCore(config.DUNGEONCORE);
      console.log(`  交易發送: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✓ DungeonCore 設置成功`);
    }
    
    // 檢查 baseURI
    const baseURI = await contract.baseURI();
    console.log(`  baseURI: ${baseURI || "(未設置)"}`);
    
    if (!baseURI) {
      const newBaseURI = `${METADATA_SERVER_URL}/api/${name.toLowerCase()}/`;
      console.log(`  ✗ baseURI 未設置！正在設置: ${newBaseURI}`);
      const tx = await contract.setBaseURI(newBaseURI);
      console.log(`  交易發送: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✓ baseURI 設置成功`);
    }
  }
  
  console.log("\n3. 總結合約設置狀態...");
  console.log("=".repeat(60));
  console.log("合約地址:");
  console.log(`  SOULSHARD: ${config.SOULSHARD}`);
  console.log(`  DUNGEONCORE: ${config.DUNGEONCORE}`);
  console.log(`  HERO: ${config.HERO}`);
  console.log(`  RELIC: ${config.RELIC}`);
  console.log(`  PARTY: ${config.PARTY}`);
  console.log(`  VIPSTAKING: ${config.VIPSTAKING}`);
  console.log("\n元數據服務器: " + METADATA_SERVER_URL);
  console.log("=".repeat(60));
  
  console.log("\n✅ 修復完成！");
  console.log("\n後續步驟：");
  console.log("1. 確保元數據服務器正在運行並使用 V22 配置");
  console.log("2. 測試 VIP 質押功能是否正常");
  console.log("3. 等待 NFT 市場緩存更新（可能需要幾分鐘）");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });