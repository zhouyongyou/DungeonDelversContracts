const hre = require("hardhat");

/**
 * V25.0.3 驗證新部署的 9 個合約
 * 這些合約使用修改後的構造函數（無需參數）
 */

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function verifyContract(name, address, contractPath) {
  console.log(`\n📌 驗證 ${name}...`);
  console.log(`  地址: ${address}`);
  console.log(`  合約路徑: ${contractPath}`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [], // 無參數！
      contract: contractPath // 指定使用 fixed 版本
    });
    console.log(`  ${colors.green}✅ ${name} 驗證成功！${colors.reset}`);
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`  ${colors.yellow}⚠️ ${name} 已經驗證過了${colors.reset}`);
      return true;
    } else {
      console.log(`  ${colors.red}❌ ${name} 驗證失敗: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║            驗證 V25.0.3 新部署的 9 個合約                            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  const contracts = [
    { name: "DungeonStorage", address: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec", path: "contracts/current/fixed/DungeonStorage.sol:DungeonStorage" },
    { name: "DungeonMaster", address: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF", path: "contracts/current/fixed/DungeonMaster.sol:DungeonMaster" },
    { name: "Hero", address: "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19", path: "contracts/current/fixed/Hero.sol:Hero" },
    { name: "Relic", address: "0x91Bf924E9CEF490F7C999C1F083eE1636595220D", path: "contracts/current/fixed/Relic.sol:Relic" },
    { name: "Party", address: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9", path: "contracts/current/fixed/Party.sol:Party" },
    { name: "AltarOfAscension", address: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3", path: "contracts/current/fixed/AltarOfAscension.sol:AltarOfAscension" },
    { name: "PlayerVault", address: "0x446a82f2003484Bdc83f29e094fcb66D01094db0", path: "contracts/current/fixed/PlayerVault.sol:PlayerVault" },
    { name: "PlayerProfile", address: "0x3509d0f0cD6f7b518860f945128205ac4F426090", path: "contracts/current/fixed/PlayerProfile.sol:PlayerProfile" },
    { name: "VIPStaking", address: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661", path: "contracts/current/fixed/VIPStaking.sol:VIPStaking" }
  ];

  let successCount = 0;
  let failedCount = 0;

  for (const contract of contracts) {
    const success = await verifyContract(contract.name, contract.address, contract.path);
    if (success) {
      successCount++;
    } else {
      failedCount++;
    }
    // 延遲避免 API 限制
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}📊 驗證總結${colors.reset}`);
  console.log('=' . repeat(70));
  console.log(`  ✅ 成功: ${successCount} 個合約`);
  console.log(`  ❌ 失敗: ${failedCount} 個合約`);
  console.log('=' . repeat(70));
}

main().catch(console.error);