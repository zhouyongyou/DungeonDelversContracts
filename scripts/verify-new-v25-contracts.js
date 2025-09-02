const hre = require("hardhat");

/**
 * 驗證 V25.0.3 新部署的合約（使用 fixed 版本）
 * 9個重新部署的合約需要驗證
 */

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║         V25.0.3 新部署合約驗證 - Fixed 版本                         ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  // 9個重新部署的合約（使用 fixed 版本，無需構造參數）
  const newContracts = [
    {
      name: "DungeonStorage",
      address: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
      contractPath: "contracts/current/core/DungeonStorage.sol:DungeonStorage",
      constructorArgs: []
    },
    {
      name: "DungeonMaster", 
      address: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
      contractPath: "contracts/current/core/DungeonMaster.sol:DungeonMaster",
      constructorArgs: []
    },
    {
      name: "Hero",
      address: "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19",
      contractPath: "contracts/current/nft/Hero.sol:Hero",
      constructorArgs: []
    },
    {
      name: "Relic",
      address: "0x91Bf924E9CEF490F7C999C1F083eE1636595220D", 
      contractPath: "contracts/current/nft/Relic.sol:Relic",
      constructorArgs: []
    },
    {
      name: "Party",
      address: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
      contractPath: "contracts/current/nft/Party.sol:Party", 
      constructorArgs: []
    },
    {
      name: "AltarOfAscension",
      address: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
      contractPath: "contracts/current/core/AltarOfAscension.sol:AltarOfAscension",
      constructorArgs: []
    },
    {
      name: "PlayerVault", 
      address: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
      contractPath: "contracts/current/defi/PlayerVault.sol:PlayerVault",
      constructorArgs: []
    },
    {
      name: "PlayerProfile",
      address: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
      contractPath: "contracts/current/nft/PlayerProfile.sol:PlayerProfile", 
      constructorArgs: []
    },
    {
      name: "VIPStaking",
      address: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661",
      contractPath: "contracts/current/nft/VIPStaking.sol:VIPStaking",
      constructorArgs: []
    }
  ];

  console.log(`\n📋 待驗證合約列表 (${newContracts.length} 個):`);
  newContracts.forEach((contract, index) => {
    console.log(`  ${index + 1}. ${contract.name}: ${contract.address}`);
  });

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const contract of newContracts) {
    console.log(`\n${colors.yellow}🔍 驗證 ${contract.name}...${colors.reset}`);
    console.log(`  合約地址: ${contract.address}`);
    console.log(`  合約路徑: ${contract.contractPath}`);
    console.log(`  構造參數: ${contract.constructorArgs.length === 0 ? '無' : contract.constructorArgs.join(', ')}`);

    try {
      await hre.run("verify:verify", {
        address: contract.address,
        contract: contract.contractPath,
        constructorArguments: contract.constructorArgs,
      });

      console.log(`  ${colors.green}✅ ${contract.name} 驗證成功！${colors.reset}`);
      successCount++;
      results.push({ name: contract.name, status: 'success', address: contract.address });

    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`  ${colors.blue}ℹ️ ${contract.name} 已經驗證過${colors.reset}`);
        successCount++;
        results.push({ name: contract.name, status: 'already_verified', address: contract.address });
      } else {
        console.log(`  ${colors.red}❌ ${contract.name} 驗證失敗: ${error.message}${colors.reset}`);
        failCount++;
        results.push({ name: contract.name, status: 'failed', address: contract.address, error: error.message });
      }
    }

    // 添加延遲避免 API 限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}驗證結果總結${colors.reset}`);
  console.log('='.repeat(70));

  console.log(`\n📊 統計結果:`);
  console.log(`  ✅ 成功: ${successCount} 個`);
  console.log(`  ❌ 失敗: ${failCount} 個`);
  console.log(`  📝 總計: ${newContracts.length} 個`);

  console.log(`\n📋 詳細結果:`);
  results.forEach((result, index) => {
    const statusIcon = result.status === 'success' ? '✅' : 
                      result.status === 'already_verified' ? '🔄' : '❌';
    const statusText = result.status === 'success' ? '驗證成功' :
                      result.status === 'already_verified' ? '已驗證' : '驗證失敗';
    
    console.log(`  ${index + 1}. ${statusIcon} ${result.name} - ${statusText}`);
    console.log(`     地址: ${result.address}`);
    if (result.error) {
      console.log(`     錯誤: ${result.error.substring(0, 100)}...`);
    }
  });

  if (failCount === 0) {
    console.log(`\n${colors.green}🎉 所有新部署的合約都已成功驗證！${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️ 有 ${failCount} 個合約驗證失敗，請檢查錯誤信息${colors.reset}`);
  }

  console.log('\n🔗 BSCScan 連結:');
  results.forEach((result) => {
    console.log(`  ${result.name}: https://bscscan.com/address/${result.address}#code`);
  });
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 驗證過程完成！${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 驗證過程失敗:${colors.reset}`, error);
    process.exit(1);
  });