// verify-v1.3.8.0-contracts.js - 批量驗證腳本
const { run } = require("hardhat");

const contracts = [
  {
    name: "DungeonStorage",
    address: "0x063A9De0daC8B68C03C9D77f41FE8B20A2fe7683",
    constructorArgs: []
  },
  {
    name: "VRFConsumerV2Plus",
    address: "0xFC88901B6BB94d677884EDC1dad143c2Add2a1C5",
    constructorArgs: []
  },
  {
    name: "PlayerVault",
    address: "0x72205a7DCA3Dbd7A8656107797B0B0604E781413",
    constructorArgs: []
  },
  {
    name: "Hero",
    address: "0x6d4393AD1507012039A6f1364f70B8De3AfCB3Bd",
    constructorArgs: []
  },
  {
    name: "Relic",
    address: "0x3bCB4Af9d94B343B1F154a253a6047b707Ba74BD",
    constructorArgs: []
  },
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

async function verifyAll() {
  console.log("🔍 開始批量驗證 DungeonDelvers v1.3.8.0 合約");
  console.log("=".repeat(60));
  
  const results = [];
  
  for (const contract of contracts) {
    console.log(`\\n📋 驗證 ${contract.name} (${contract.address})`);
    
    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArgs,
      });
      
      console.log(`✅ ${contract.name} 驗證成功`);
      results.push({ contract: contract.name, status: "success" });
      
      // 等待2秒避免API限制
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      if (error.message.includes("already verified")) {
        console.log(`✅ ${contract.name} 已經驗證過`);
        results.push({ contract: contract.name, status: "already_verified" });
      } else {
        console.error(`❌ ${contract.name} 驗證失敗:`, error.message);
        results.push({ contract: contract.name, status: "failed", error: error.message });
      }
    }
  }
  
  console.log("\\n" + "=".repeat(60));
  console.log("📊 驗證結果摘要");
  console.log("=".repeat(60));
  
  results.forEach(result => {
    const status = result.status === "success" ? "✅ 成功" :
                   result.status === "already_verified" ? "✅ 已驗證" :
                   "❌ 失敗";
    console.log(`${result.contract.padEnd(20)}: ${status}`);
  });
  
  const successCount = results.filter(r => 
    r.status === "success" || r.status === "already_verified"
  ).length;
  
  console.log(`\\n🎯 驗證完成: ${successCount}/${contracts.length} 個合約`);
  
  if (successCount === contracts.length) {
    console.log("🎉 所有合約驗證成功！");
  } else {
    console.log("⚠️ 部分合約驗證失敗，需要手動處理");
  }
}

verifyAll().catch(console.error);