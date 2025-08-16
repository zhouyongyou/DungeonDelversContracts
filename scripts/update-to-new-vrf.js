const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 更新 NFT 合約到新 VRF Manager ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 新的 VRF V2Plus Manager（已測試成功）
  const NEW_VRF_MANAGER = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  
  console.log("操作者:", wallet.address);
  console.log("新 VRF Manager:", NEW_VRF_MANAGER);
  console.log("（已測試成功，費用 0.00005 BNB/請求）\n");
  
  // NFT 合約列表
  const contracts = [
    { 
      name: "Hero", 
      address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF",
      artifact: "nft/Hero"
    },
    { 
      name: "Relic", 
      address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739",
      artifact: "nft/Relic"
    },
    { 
      name: "DungeonMaster", 
      address: "0xE391261741Fad5FCC2D298d00e8c684767021253",
      artifact: "core/DungeonMaster"
    }
  ];
  
  console.log("📋 要更新的合約：");
  console.log("─".repeat(60));
  
  const results = [];
  
  for (const contract of contracts) {
    console.log(`\n🔄 更新 ${contract.name}`);
    console.log("合約地址:", contract.address);
    
    try {
      // 讀取合約 ABI
      const contractName = contract.artifact.split('/').pop();
      const artifactPath = `artifacts/contracts/current/${contract.artifact}.sol/${contractName}.json`;
      
      if (!fs.existsSync(artifactPath)) {
        console.log(`⚠️ 找不到 ABI 文件: ${artifactPath}`);
        results.push({ name: contract.name, status: "ABI not found" });
        continue;
      }
      
      const contractJson = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const instance = new ethers.Contract(contract.address, contractJson.abi, wallet);
      
      // 檢查當前 VRF Manager
      if (instance.vrfManager) {
        const currentVRF = await instance.vrfManager();
        console.log("當前 VRF Manager:", currentVRF);
        
        if (currentVRF.toLowerCase() === NEW_VRF_MANAGER.toLowerCase()) {
          console.log("✅ 已經是新的 VRF Manager");
          results.push({ name: contract.name, status: "Already updated" });
          continue;
        }
      }
      
      // 更新 VRF Manager
      if (instance.setVRFManager) {
        console.log("設置新的 VRF Manager...");
        const tx = await instance.setVRFManager(NEW_VRF_MANAGER, {
          gasLimit: 100000
        });
        
        console.log("交易哈希:", tx.hash);
        await tx.wait();
        console.log("✅ 成功更新");
        
        // 驗證更新
        if (instance.vrfManager) {
          const updatedVRF = await instance.vrfManager();
          if (updatedVRF.toLowerCase() === NEW_VRF_MANAGER.toLowerCase()) {
            console.log("✅ 驗證成功");
            results.push({ name: contract.name, status: "Updated successfully" });
          } else {
            console.log("⚠️ 驗證失敗");
            results.push({ name: contract.name, status: "Verification failed" });
          }
        }
      } else {
        console.log("⚠️ 合約沒有 setVRFManager 函數");
        results.push({ name: contract.name, status: "No setVRFManager function" });
      }
      
    } catch (error) {
      console.log(`❌ 更新失敗: ${error.message}`);
      results.push({ name: contract.name, status: `Error: ${error.message}` });
    }
  }
  
  // 總結
  console.log("\n" + "=".repeat(60));
  console.log("📊 更新總結");
  console.log("─".repeat(60));
  
  for (const result of results) {
    const emoji = result.status.includes("success") ? "✅" : 
                  result.status.includes("Already") ? "✅" : 
                  result.status.includes("Error") ? "❌" : "⚠️";
    console.log(`${emoji} ${result.name}: ${result.status}`);
  }
  
  console.log("\n🎯 新 VRF Manager 優勢：");
  console.log("- 費用極低：0.00005 BNB/請求（節省 99%）");
  console.log("- 速度快：約 10 秒回調");
  console.log("- 穩定可靠：使用官方 VRFConsumerBaseV2Plus");
  
  console.log("\n📝 下一步：");
  console.log("1. 測試 NFT 鑄造：node scripts/test-nft-minting.js");
  console.log("2. 檢查前端是否需要更新 VRF Manager 地址");
  console.log("3. 更新子圖配置（如果有）");
  
  // 保存更新記錄
  const updateRecord = {
    timestamp: new Date().toISOString(),
    newVRFManager: NEW_VRF_MANAGER,
    previousVRFManager: "0xb772e15dF8aB4B38c1D4Ba1F4b0451B3e2B7B0C6",
    results: results,
    network: "BSC Mainnet"
  };
  
  fs.writeFileSync(
    'vrf-update-record.json',
    JSON.stringify(updateRecord, null, 2)
  );
  
  console.log("\n📁 更新記錄已保存到 vrf-update-record.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });