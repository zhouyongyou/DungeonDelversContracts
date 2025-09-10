// verify-remaining-v1.3.8.0.js - 驗證剩餘的合約
const { run } = require("hardhat");

const remainingContracts = [
  {
    name: "Party",
    address: "0x0D93b2c10d5FF944b3BB47c75b52fca75c92A4CC",
    constructorArgs: []
  },
  {
    name: "PlayerProfile",
    address: "0xa7AAB98223268F8049430Bdba6d1ba36CBEF424A",
    constructorArgs: []
  },
  {
    name: "VIPStaking",
    address: "0x0440634aa6e4028efAFEFe7683B39E3a7BEC0EBC",
    constructorArgs: []
  },
  {
    name: "AltarOfAscension",
    address: "0xda7Fb30CB2a2311cA3326aD2a4f826dcdAC8BD7b",
    constructorArgs: []
  },
  {
    name: "DungeonMaster",
    address: "0x35A765D767d3FC2dFd6968e6faA7fFe7a303A77e",
    constructorArgs: []
  }
];

async function verifyRemaining() {
  console.log("🔍 驗證剩餘的 v1.3.8.0 合約");
  console.log("=".repeat(50));
  
  for (const contract of remainingContracts) {
    console.log(`\\n📋 驗證 ${contract.name} (${contract.address})`);
    
    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArgs,
      });
      
      console.log(`✅ ${contract.name} 驗證成功`);
      
    } catch (error) {
      if (error.message.includes("already verified")) {
        console.log(`✅ ${contract.name} 已經驗證過`);
      } else {
        console.error(`❌ ${contract.name} 驗證失敗:`, error.message);
      }
    }
    
    // 等待3秒避免API限制
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log("\\n🎉 剩餘合約驗證完成!");
}

verifyRemaining().catch(console.error);