// NFT 合約驗證腳本 (V25.1.5)
// 在 BSCScan 上驗證所有新部署的 NFT 合約

const { run } = require("hardhat");

async function main() {
  console.log("🔍 開始驗證 V25.1.8 NFT 合約");
  console.log("=".repeat(60));

  // V25.1.8 最新部署地址
  const contracts = {
    hero: "0x428486A4860E54e5ACAFEfdD07FF8E23E18877Cc",
    relic: "0xbA7e324c92F81C42E9F639602B1766765E93002d",  
    party: "0xE2609F06E4937816A64Ee8ba53FEC41D1Fa2C468",
    playerProfile: "0x9Dd96B36e38C1e332616Be3Ba9Ff03B90Db4047A",
    vipStaking: "0x7e3a738c14159093b0b39Da6e9b210C27Bf0068b"
  };

  console.log("準備驗證的合約地址:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`${name.padEnd(15)}: ${address || '❌ 地址未設定'}`);
  });

  if (Object.values(contracts).some(addr => !addr)) {
    console.log("\n❌ 請先在 .env 文件中設定所有合約地址");
    process.exit(1);
  }

  console.log("\n開始逐一驗證合約...");

  const results = {};

  try {
    // ==================== 1. 驗證 Hero 合約 ====================
    console.log("\n📝 Step 1: 驗證 Hero 合約...");
    try {
      await run("verify:verify", {
        address: contracts.hero,
        constructorArguments: [], // Hero 構造函數無參數
      });
      console.log("✅ Hero 合約驗證成功");
      results.hero = "✅ 成功";
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Hero 合約已經驗證過");
        results.hero = "✅ 已驗證";
      } else {
        console.log("❌ Hero 合約驗證失敗:", error.message);
        results.hero = "❌ 失敗";
      }
    }

    // ==================== 2. 驗證 Relic 合約 ====================
    console.log("\n📝 Step 2: 驗證 Relic 合約...");
    try {
      await run("verify:verify", {
        address: contracts.relic,
        constructorArguments: [], // Relic 構造函數無參數
      });
      console.log("✅ Relic 合約驗證成功");
      results.relic = "✅ 成功";
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Relic 合約已經驗證過");
        results.relic = "✅ 已驗證";
      } else {
        console.log("❌ Relic 合約驗證失敗:", error.message);
        results.relic = "❌ 失敗";
      }
    }

    // ==================== 3. 驗證 Party 合約 ====================
    console.log("\n📝 Step 3: 驗證 Party 合約...");
    try {
      await run("verify:verify", {
        address: contracts.party,
        constructorArguments: [], // Party 構造函數無參數
      });
      console.log("✅ Party 合約驗證成功");
      results.party = "✅ 成功";
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Party 合約已經驗證過");
        results.party = "✅ 已驗證";
      } else {
        console.log("❌ Party 合約驗證失敗:", error.message);
        results.party = "❌ 失敗";
      }
    }

    // ==================== 4. 驗證 PlayerProfile 合約 ====================
    console.log("\n📝 Step 4: 驗證 PlayerProfile 合約...");
    try {
      await run("verify:verify", {
        address: contracts.playerProfile,
        constructorArguments: [], // PlayerProfile 構造函數無參數
      });
      console.log("✅ PlayerProfile 合約驗證成功");
      results.playerProfile = "✅ 成功";
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ PlayerProfile 合約已經驗證過");
        results.playerProfile = "✅ 已驗證";
      } else {
        console.log("❌ PlayerProfile 合約驗證失敗:", error.message);
        results.playerProfile = "❌ 失敗";
      }
    }

    // ==================== 5. 驗證 VIPStaking 合約 ====================
    console.log("\n📝 Step 5: 驗證 VIPStaking 合約...");
    try {
      await run("verify:verify", {
        address: contracts.vipStaking,
        constructorArguments: [], // VIPStaking 構造函數無參數
      });
      console.log("✅ VIPStaking 合約驗證成功");
      results.vipStaking = "✅ 成功";
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ VIPStaking 合約已經驗證過");
        results.vipStaking = "✅ 已驗證";
      } else {
        console.log("❌ VIPStaking 合約驗證失敗:", error.message);
        results.vipStaking = "❌ 失敗";
      }
    }

    // ==================== 驗證結果總結 ====================
    console.log("\n" + "=".repeat(60));
    console.log("📊 V25.1.8 合約驗證結果總結:");
    console.log("=".repeat(60));
    
    Object.entries(results).forEach(([contract, status]) => {
      console.log(`${contract.padEnd(15)}: ${status}`);
    });

    const successCount = Object.values(results).filter(status => 
      status.includes("成功") || status.includes("已驗證")
    ).length;
    
    console.log(`\n📊 驗證統計: ${successCount}/5 個合約驗證成功`);

    if (successCount === 5) {
      console.log("🎉 所有合約驗證完成!");
      console.log("\n📝 下一步:");
      console.log("運行互連設置腳本: npm run setup-nft-connections");
    } else {
      console.log("⚠️  部分合約驗證失敗，請檢查錯誤信息");
    }

    // 生成 BSCScan 鏈接
    console.log("\n🔗 BSCScan 合約鏈接:");
    Object.entries(contracts).forEach(([name, address]) => {
      console.log(`${name}: https://bscscan.com/address/${address}#code`);
    });

  } catch (error) {
    console.error("❌ 驗證過程中發生錯誤:", error);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ 驗證腳本執行完成!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 驗證腳本執行失敗:", error);
      process.exit(1);
    });
}

module.exports = main;