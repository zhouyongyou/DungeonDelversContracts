const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 檢查 NFT 合約 BaseURI 設置 ===\n");

  // V22 合約地址
  const contracts = {
    Hero: "0x141F081922D4015b3157cdA6eE970dff34bb8AAb",
    Relic: "0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3",
    Party: "0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee"
  };

  for (const [name, address] of Object.entries(contracts)) {
    console.log(`\n檢查 ${name} 合約 (${address}):`);
    
    try {
      // 獲取合約實例 - 使用完整路徑
      let contractPath;
      if (name === "Hero") {
        contractPath = "contracts/current/nft/Hero.sol:Hero";
      } else if (name === "Relic") {
        contractPath = "contracts/current/nft/Relic.sol:Relic";
      } else if (name === "Party") {
        // Party 合約需要單獨處理
        const abi = [
          "function baseURI() view returns (string)",
          "function contractURI() view returns (string)",
          "function tokenURI(uint256) view returns (string)",
          "function owner() view returns (address)"
        ];
        const contract = new ethers.Contract(address, abi, ethers.provider);
        
        // 檢查 baseURI
        try {
          const baseURI = await contract.baseURI();
          console.log(`  ✓ baseURI: ${baseURI || "(未設置)"}`);
        } catch (e) {
          console.log(`  ✗ 無法讀取 baseURI: ${e.message}`);
        }
        
        // 檢查 contractURI
        try {
          const contractURI = await contract.contractURI();
          console.log(`  ✓ contractURI: ${contractURI || "(未設置)"}`);
        } catch (e) {
          console.log(`  ✗ 無法讀取 contractURI: ${e.message}`);
        }
        
        // 測試 tokenURI (使用 tokenId = 1)
        try {
          const tokenURI = await contract.tokenURI(1);
          console.log(`  ✓ tokenURI(1): ${tokenURI}`);
        } catch (e) {
          console.log(`  ✗ 無法讀取 tokenURI(1): ${e.message}`);
        }
        
        // 檢查 owner
        try {
          const owner = await contract.owner();
          console.log(`  ✓ Owner: ${owner}`);
        } catch (e) {
          console.log(`  ✗ 無法讀取 owner: ${e.message}`);
        }
        
        continue;
      }
      
      const contract = await ethers.getContractAt(contractPath, address);
      
      // 檢查 baseURI
      try {
        const baseURI = await contract.baseURI();
        console.log(`  ✓ baseURI: ${baseURI || "(未設置)"}`);
      } catch (e) {
        console.log(`  ✗ 無法讀取 baseURI: ${e.message}`);
      }
      
      // 檢查 contractURI
      try {
        const contractURI = await contract.contractURI();
        console.log(`  ✓ contractURI: ${contractURI || "(未設置)"}`);
      } catch (e) {
        console.log(`  ✗ 無法讀取 contractURI: ${e.message}`);
      }
      
      // 測試 tokenURI (使用 tokenId = 1)
      try {
        const tokenURI = await contract.tokenURI(1);
        console.log(`  ✓ tokenURI(1): ${tokenURI}`);
      } catch (e) {
        console.log(`  ✗ 無法讀取 tokenURI(1): ${e.message}`);
      }
      
      // 檢查 owner
      try {
        const owner = await contract.owner();
        console.log(`  ✓ Owner: ${owner}`);
      } catch (e) {
        console.log(`  ✗ 無法讀取 owner: ${e.message}`);
      }
      
    } catch (error) {
      console.log(`  ✗ 錯誤: ${error.message}`);
    }
  }
  
  console.log("\n=== 檢查完成 ===\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });