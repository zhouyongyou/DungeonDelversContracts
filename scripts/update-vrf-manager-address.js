const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 更新 VRF Manager 地址到 NFT 合約 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 新的 VRF Manager 地址
  const NEW_VRF_MANAGER = "0xb772e15dF8aB4B38c1D4Ba1F4b0451B3e2B7B0C6";
  
  console.log("操作者:", wallet.address);
  console.log("新 VRF Manager:", NEW_VRF_MANAGER);
  
  // NFT 合約地址（已更正）
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
    },
    { 
      name: "AltarOfAscension", 
      address: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33",
      artifact: "core/AltarOfAscension"
    }
  ];
  
  console.log("\n📋 要更新的合約：");
  console.log("─".repeat(60));
  
  for (const contract of contracts) {
    console.log(`\n🔄 更新 ${contract.name}`);
    console.log("合約地址:", contract.address);
    
    try {
      // 讀取合約 ABI
      const contractName = contract.artifact.split('/').pop();
      const artifactPath = `artifacts/contracts/current/${contract.artifact}.sol/${contractName}.json`;
      
      if (!fs.existsSync(artifactPath)) {
        console.log(`⚠️ 找不到 ABI 文件: ${artifactPath}`);
        continue;
      }
      
      const contractJson = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const instance = new ethers.Contract(contract.address, contractJson.abi, wallet);
      
      // 檢查是否有 setVRFManager 函數
      if (instance.setVRFManager) {
        console.log("設置新的 VRF Manager...");
        const tx = await instance.setVRFManager(NEW_VRF_MANAGER, {
          gasLimit: 100000
        });
        
        console.log("交易哈希:", tx.hash);
        await tx.wait();
        console.log("✅ 成功更新 VRF Manager");
        
        // 驗證更新
        if (instance.vrfManager) {
          const currentVRF = await instance.vrfManager();
          console.log("當前 VRF Manager:", currentVRF);
          
          if (currentVRF.toLowerCase() === NEW_VRF_MANAGER.toLowerCase()) {
            console.log("✅ 驗證成功");
          } else {
            console.log("⚠️ 地址不匹配");
          }
        }
      } else {
        console.log("⚠️ 合約沒有 setVRFManager 函數");
      }
      
    } catch (error) {
      console.log(`❌ 更新失敗: ${error.message}`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ 更新流程完成");
  console.log("\n📊 總結：");
  console.log("─".repeat(60));
  console.log("新 VRF Manager:", NEW_VRF_MANAGER);
  console.log("BSCScan:", `https://bscscan.com/address/${NEW_VRF_MANAGER}`);
  
  console.log("\n⚠️ 重要提醒：");
  console.log("1. 請確認已在 Chainlink 網站添加 Consumer");
  console.log("2. 訪問: https://vrf.chain.link/bsc/114131353280130458891383141995968474440293173552039681622016393393251650814328");
  console.log("3. 添加 Consumer:", NEW_VRF_MANAGER);
  console.log("\n完成後執行: node scripts/test-vrf-subscription.js 測試");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });