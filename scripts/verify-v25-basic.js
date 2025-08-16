// 驗證 V25 基本功能
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🔍 驗證 V25 基本功能...\n");

  // V25 合約地址
  const addresses = {
    HERO: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    RELIC: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    DUNGEONMASTER: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    VRFMANAGER: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
    ALTAROFASCENSION: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"
  };

  const [signer] = await ethers.getSigners();
  console.log("🔑 執行者:", signer.address);

  // 簡單的 ERC721 ABI
  const ERC721_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function owner() view returns (address)"
  ];

  console.log("\n📊 基本合約資訊:\n");

  // 檢查每個 NFT 合約
  for (const [name, address] of Object.entries(addresses)) {
    if (["HERO", "RELIC", "PARTY"].includes(name)) {
      try {
        const contract = new ethers.Contract(address, ERC721_ABI, signer);
        
        const tokenName = await contract.name();
        const symbol = await contract.symbol();
        const totalSupply = await contract.totalSupply();
        const owner = await contract.owner();
        
        console.log(`✅ ${name}:`);
        console.log(`   名稱: ${tokenName}`);
        console.log(`   符號: ${symbol}`);
        console.log(`   總供應量: ${totalSupply}`);
        console.log(`   擁有者: ${owner}`);
        console.log("");
      } catch (error) {
        console.log(`❌ ${name}: 無法讀取基本資訊`);
        console.log(`   錯誤: ${error.message.substring(0, 100)}`);
        console.log("");
      }
    }
  }

  // 檢查 VRF Manager
  console.log("\n🎲 VRF Manager 檢查:");
  try {
    const VRF_ABI = [
      "function owner() view returns (address)",
      "function vrfPrice() view returns (uint256)",
      "function platformFee() view returns (uint256)"
    ];
    
    const vrfContract = new ethers.Contract(addresses.VRFMANAGER, VRF_ABI, signer);
    const owner = await vrfContract.owner();
    const vrfPrice = await vrfContract.vrfPrice();
    const platformFee = await vrfContract.platformFee();
    
    console.log(`✅ VRF Manager:`);
    console.log(`   擁有者: ${owner}`);
    console.log(`   VRF 價格: ${ethers.formatEther(vrfPrice)} BNB`);
    console.log(`   平台費: ${ethers.formatEther(platformFee)} BNB`);
  } catch (error) {
    console.log(`❌ VRF Manager: ${error.message.substring(0, 100)}`);
  }

  console.log("\n✨ 基本驗證完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });