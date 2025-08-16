// 驗證 V7 版本合約
const hre = require("hardhat");

async function main() {
  console.log("🔍 開始驗證 V7 合約...");

  const [deployer] = await hre.ethers.getSigners();
  
  const contracts = [
    {
      name: "PartyV3",
      address: "0xe4A55375f7Aba70785f958E2661E08F9FD5f7ab1",
      constructorArgs: [deployer.address]
    },
    {
      name: "DungeonMasterV7", 
      address: "0x108ed6B38D30099E1d2D141Ef0813938E279C0Fe",
      constructorArgs: [deployer.address]
    }
  ];

  for (const contract of contracts) {
    try {
      console.log(`\n🔍 驗證 ${contract.name} at ${contract.address}...`);
      
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArgs,
      });
      
      console.log(`✅ ${contract.name} 驗證成功!`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`⚠️ ${contract.name} 已經驗證過了`);
      } else {
        console.log(`❌ ${contract.name} 驗證失敗:`, error.message);
      }
    }
  }

  console.log("\n🎉 合約驗證完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });