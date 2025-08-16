const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 檢查 AltarOfAscension VRF Manager 設定 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  // AltarOfAscension 合約
  const altarAddress = "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33";
  const altarAbi = [
    "function vrfManager() view returns (address)",
    "function owner() view returns (address)"
  ];
  
  const altar = new ethers.Contract(altarAddress, altarAbi, provider);
  
  try {
    const currentVrfManager = await altar.vrfManager();
    const owner = await altar.owner();
    
    console.log("AltarOfAscension 資訊:");
    console.log("- 合約地址:", altarAddress);
    console.log("- Owner:", owner);
    console.log("- 當前 VRF Manager:", currentVrfManager);
    console.log("- 新 VRF Manager 應該是:", "0xBCC8821d3727C4339d2917Fb33D708c6C006c034");
    
    if (currentVrfManager.toLowerCase() === "0xBCC8821d3727C4339d2917Fb33D708c6C006c034".toLowerCase()) {
      console.log("\n✅ AltarOfAscension 已經使用新的 VRF Manager!");
    } else {
      console.log("\n⚠️ AltarOfAscension 需要更新 VRF Manager");
    }
    
    // 檢查新 VRF Manager 的授權狀態
    const newVrfAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
    const vrfAbi = [
      "function authorizedContracts(address) view returns (bool)"
    ];
    
    const vrfManager = new ethers.Contract(newVrfAddress, vrfAbi, provider);
    const isAuthorized = await vrfManager.authorizedContracts(altarAddress);
    
    console.log("\n新 VRF Manager 授權狀態:");
    console.log("- AltarOfAscension 已授權:", isAuthorized);
    
    // 檢查其他已授權合約
    const contracts = [
      { name: "Hero", address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF" },
      { name: "Relic", address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739" },
      { name: "DungeonMaster", address: "0xE391261741Fad5FCC2D298d00e8c684767021253" }
    ];
    
    console.log("\n其他合約授權狀態:");
    for (const c of contracts) {
      const authorized = await vrfManager.authorizedContracts(c.address);
      console.log(`- ${c.name}: ${authorized ? "✅" : "❌"}`);
    }
    
  } catch (error) {
    console.error("錯誤:", error.message);
  }
}

main();