const hre = require("hardhat");

async function verifyContract(address, name, args) {
  console.log(`\n🔍 驗證 ${name} (${address})...`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: args,
    });
    console.log(`✅ ${name} 驗證成功！`);
    return true;
  } catch (error) {
    if (error.message && error.message.includes("Already Verified")) {
      console.log(`ℹ️ ${name} 已經驗證過了`);
      return true;
    } else if (error.message && error.message.includes("does not have bytecode")) {
      console.log(`⏳ ${name} 尚未被索引，請稍後重試`);
      return false;
    } else {
      console.log(`❌ ${name} 驗證失敗:`, error.message);
      return false;
    }
  }
}

async function main() {
  console.log("🚀 開始驗證 VRF 相關合約...\n");
  
  const deployer = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  
  // 已部署的合約地址
  const contracts = [
    {
      name: "VRFConsumerV2Plus",
      address: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
      args: [29062, "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"]
    },
    {
      name: "Hero",
      address: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
      args: [deployer]
    },
    {
      name: "Relic",
      address: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
      args: [deployer]
    }
  ];
  
  // 如果 DungeonMaster 和 AltarOfAscension 已部署，添加它們
  // contracts.push({
  //   name: "DungeonMaster",
  //   address: "合約地址",
  //   args: [deployer, DUNGEON_CORE, DUNGEON_STORAGE]
  // });
  // contracts.push({
  //   name: "AltarOfAscension",
  //   address: "合約地址",
  //   args: [deployer]
  // });
  
  console.log("📋 待驗證合約數量:", contracts.length);
  
  const results = [];
  for (const contract of contracts) {
    const success = await verifyContract(contract.address, contract.name, contract.args);
    results.push({ ...contract, success });
    
    // 等待一下避免速率限制
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // 顯示總結
  console.log("\n=====================================");
  console.log("📊 驗證總結");
  console.log("=====================================");
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log("\n✅ 成功驗證:");
    successful.forEach(r => {
      console.log(`   - ${r.name}: ${r.address}`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n❌ 需要重試:");
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.address}`);
    });
    
    console.log("\n💡 提示: 如果合約剛部署，請等待幾分鐘後重試");
  }
  
  console.log("\n🔗 查看已驗證的合約:");
  contracts.forEach(c => {
    console.log(`   ${c.name}: https://bscscan.com/address/${c.address}#code`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });