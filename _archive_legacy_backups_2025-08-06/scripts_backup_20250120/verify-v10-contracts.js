// scripts/verify-v10-contracts.js
// 驗證 V10 部署的所有合約

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔍 開始驗證合約...\n");
  
  const network = hre.network.name;
  
  // 讀取部署地址
  const addressesFile = path.join(__dirname, `../deployments/${network}_all_addresses.json`);
  if (!fs.existsSync(addressesFile)) {
    console.error("❌ 找不到部署地址文件！");
    console.error(`請確保已運行部署腳本並生成: ${addressesFile}`);
    process.exit(1);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
  const addresses = deploymentData.addresses;
  
  console.log(`📍 網路: ${network}`);
  console.log(`📅 部署時間: ${deploymentData.deployedAt}`);
  console.log(`📦 區塊號: ${deploymentData.blockNumber}\n`);
  
  // 定義需要驗證的合約
  const contracts = [
    {
      name: "Oracle",
      address: addresses.ORACLE_ADDRESS,
      constructorArguments: []
    },
    {
      name: "DungeonStorage",
      address: addresses.DUNGEONSTORAGE_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "Hero",
      address: addresses.HERO_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "Relic",
      address: addresses.RELIC_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "Party",
      address: addresses.PARTY_ADDRESS,
      contract: "contracts/Party_V3.sol:Party",
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "PlayerVault",
      address: addresses.PLAYERVAULT_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "PlayerProfile",
      address: addresses.PLAYERPROFILE_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "AltarOfAscension",
      address: addresses.ALTAROFASCENSION_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "VIPStaking",
      address: addresses.VIPSTAKING_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "DungeonCore",
      address: addresses.DUNGEONCORE_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    },
    {
      name: "DungeonMasterV7",
      address: addresses.DUNGEONMASTER_ADDRESS,
      constructorArguments: [addresses.DUNGEONMASTERWALLET_ADDRESS || "0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
    }
  ];
  
  // 逐個驗證合約
  const results = [];
  
  for (const contract of contracts) {
    console.log(`\n🔧 驗證 ${contract.name}...`);
    console.log(`📍 地址: ${contract.address}`);
    
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments,
        contract: contract.contract
      });
      
      console.log(`✅ ${contract.name} 驗證成功！`);
      results.push({ name: contract.name, status: "success" });
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`⚠️  ${contract.name} 已經驗證過了`);
        results.push({ name: contract.name, status: "already verified" });
      } else {
        console.error(`❌ ${contract.name} 驗證失敗:`, error.message);
        results.push({ name: contract.name, status: "failed", error: error.message });
      }
    }
  }
  
  // 顯示總結
  console.log("\n" + "=".repeat(60));
  console.log("📊 驗證結果總結");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.status === "success").length;
  const alreadyVerified = results.filter(r => r.status === "already verified").length;
  const failed = results.filter(r => r.status === "failed").length;
  
  console.log(`✅ 成功驗證: ${successful}`);
  console.log(`⚠️  已驗證: ${alreadyVerified}`);
  console.log(`❌ 驗證失敗: ${failed}`);
  
  if (failed > 0) {
    console.log("\n失敗的合約:");
    results.filter(r => r.status === "failed").forEach(r => {
      console.log(`- ${r.name}: ${r.error}`);
    });
  }
  
  // 保存驗證結果
  const verificationReport = {
    network: network,
    timestamp: new Date().toISOString(),
    addresses: addresses,
    results: results
  };
  
  const reportPath = path.join(__dirname, `../deployments/${network}_verification_report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
  console.log(`\n📄 驗證報告已保存至: ${reportPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });