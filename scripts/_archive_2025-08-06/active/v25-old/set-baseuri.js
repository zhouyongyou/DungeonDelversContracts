const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 設置 NFT 合約 BaseURI ===\n");

  // 確認 signer
  const [signer] = await ethers.getSigners();
  console.log("執行地址:", signer.address);

  // V22 合約地址
  const contracts = {
    Hero: "0x141F081922D4015b3157cdA6eE970dff34bb8AAb",
    Relic: "0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3",
    Party: "0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee"
  };

  // 元數據服務器 URL
  const METADATA_SERVER_URL = "https://dungeon-delvers-metadata-server.onrender.com";
  
  // 設置每個合約的 baseURI
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`\n處理 ${name} 合約 (${address}):`);
    
    try {
      let contract;
      
      if (name === "Party") {
        // Party 合約使用 ABI
        const abi = [
          "function setBaseURI(string memory _newBaseURI) external",
          "function setContractURI(string memory newContractURI) external",
          "function baseURI() view returns (string)",
          "function contractURI() view returns (string)",
          "function owner() view returns (address)"
        ];
        contract = new ethers.Contract(address, abi, signer);
      } else {
        // Hero 和 Relic 使用完整路徑
        const contractPath = name === "Hero" 
          ? "contracts/current/nft/Hero.sol:Hero"
          : "contracts/current/nft/Relic.sol:Relic";
        contract = await ethers.getContractAt(contractPath, address, signer);
      }
      
      // 檢查 owner
      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`  ✗ 跳過：當前帳戶 (${signer.address}) 不是合約 owner (${owner})`);
        continue;
      }
      
      // 設置 baseURI
      const baseURI = `${METADATA_SERVER_URL}/api/${name.toLowerCase()}/`;
      console.log(`  設置 baseURI: ${baseURI}`);
      
      const tx1 = await contract.setBaseURI(baseURI);
      console.log(`  交易發送: ${tx1.hash}`);
      await tx1.wait();
      console.log(`  ✓ baseURI 設置成功`);
      
      // 設置 contractURI (用於 collection 級別的元數據)
      const contractURI = `${METADATA_SERVER_URL}/api/${name.toLowerCase()}/contract`;
      console.log(`  設置 contractURI: ${contractURI}`);
      
      const tx2 = await contract.setContractURI(contractURI);
      console.log(`  交易發送: ${tx2.hash}`);
      await tx2.wait();
      console.log(`  ✓ contractURI 設置成功`);
      
      // 驗證設置
      const newBaseURI = await contract.baseURI();
      const newContractURI = await contract.contractURI();
      console.log(`  驗證 baseURI: ${newBaseURI}`);
      console.log(`  驗證 contractURI: ${newContractURI}`);
      
    } catch (error) {
      console.log(`  ✗ 錯誤: ${error.message}`);
    }
  }
  
  console.log("\n=== 設置完成 ===\n");
  console.log("注意事項：");
  console.log("1. 確保元數據服務器正在運行：", METADATA_SERVER_URL);
  console.log("2. NFT 市場可能需要幾分鐘來更新緩存");
  console.log("3. 可以使用 check-baseuri.js 腳本驗證設置");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });