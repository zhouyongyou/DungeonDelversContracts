// 驗證 V25.1.1 的 Hero 和 Relic 合約
// 用於 BSCscan 開源驗證

const hre = require("hardhat");

async function main() {
  console.log("\n🚀 開始驗證 V25.1.1 Hero 和 Relic 合約");
  console.log("================================");
  
  // V25.1.1 新地址
  // 注意：Hero 和 Relic 合約的建構函數不需要參數（parameterless constructors）
  const contracts = {
    Hero: {
      address: "0x27E3A73a4d7DDD8Dea6cBF9e152173CcC04b7505",
      constructorArgs: [] // 無參數建構函數
    },
    Relic: {
      address: "0x8676174F82A9e5006B33976430D91d752fa90E3e",
      constructorArgs: [] // 無參數建構函數
    }
  };
  
  // 檢查 BSCscan API Key
  const apiKey = process.env.BSCSCAN_API_KEY;
  if (!apiKey) {
    console.error("❌ 錯誤：未設置 BSCSCAN_API_KEY 環境變數");
    console.log("請設置: export BSCSCAN_API_KEY=你的API密鑰");
    process.exit(1);
  }
  
  console.log("✅ BSCscan API Key 已設置");
  console.log("📍 網路: BSC Mainnet");
  console.log("");
  
  // 驗證每個合約
  for (const [name, config] of Object.entries(contracts)) {
    console.log(`\n🔍 驗證 ${name} 合約`);
    console.log(`地址: ${config.address}`);
    console.log(`構造參數: ${config.constructorArgs.length === 0 ? "無（parameterless constructor）" : config.constructorArgs.join(", ")}`);
    
    try {
      // 先檢查是否已驗證
      const checkUrl = `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${config.address}&apikey=${apiKey}`;
      const response = await fetch(checkUrl);
      const data = await response.json();
      
      if (data.result && data.result[0] && data.result[0].SourceCode) {
        console.log(`✅ ${name} 已經在 BSCscan 上驗證`);
        console.log(`查看: https://bscscan.com/address/${config.address}#code`);
        continue;
      }
      
      console.log(`⏳ 開始驗證 ${name}...`);
      
      // 執行驗證
      await hre.run("verify:verify", {
        address: config.address,
        constructorArguments: config.constructorArgs,
        contract: `contracts/current/nft/${name}.sol:${name}`
      });
      
      console.log(`✅ ${name} 驗證成功！`);
      console.log(`查看: https://bscscan.com/address/${config.address}#code`);
      
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${name} 已經驗證過了`);
        console.log(`查看: https://bscscan.com/address/${config.address}#code`);
      } else {
        console.error(`❌ ${name} 驗證失敗:`, error.message);
        
        // 提供手動驗證指令
        console.log("\n💡 手動驗證指令:");
        if (config.constructorArgs.length === 0) {
          console.log(`npx hardhat verify --network bsc ${config.address}`);
        } else {
          console.log(`npx hardhat verify --network bsc ${config.address} ${config.constructorArgs.join(" ")}`);
        }
        
        // 如果是編譯器版本問題
        if (error.message.includes("compiler")) {
          console.log("\n⚠️ 可能是編譯器版本問題，請檢查:");
          console.log("1. contracts/current/nft/" + name + ".sol 的 pragma solidity 版本");
          console.log("2. hardhat.config.js 中的 solidity.compilers 設置");
        }
      }
    }
    
    // 延遲避免 API 限制
    console.log("等待 5 秒...");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log("\n================================");
  console.log("🎉 驗證流程完成！");
  console.log("\n📊 驗證結果總結:");
  
  for (const [name, config] of Object.entries(contracts)) {
    console.log(`${name}: https://bscscan.com/address/${config.address}#code`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });