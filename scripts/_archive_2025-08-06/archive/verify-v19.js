const hre = require("hardhat");

// V19 部署地址
const addresses = {
  ORACLE: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9',
  DUNGEONCORE: '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  HERO: '0x141F081922D4015b3157cdA6eE970dff34bb8AAb',
  RELIC: '0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3',
  PARTY: '0xf240c4fD2651Ba41ff09eB26eE01b21f42dD9957',
  PLAYERVAULT: '0xF68cEa7E171A5caF151A85D7BEb2E862B83Ccf78',
  PLAYERPROFILE: '0x1d36C2F3f0C9212422B94608cAA72080CBf34A41',
  VIPSTAKING: '0x43A6C6cC9D15f2C68C7ec98deb01f2b69a618470',
  DUNGEONSTORAGE: '0x6B85882ab32471Ce4a6599A7256E50B8Fb1fD43e',
  DUNGEONMASTER: '0xd34ddc336071FE7Da3c636C3Df7C3BCB77B1044a',
  ALTAROFASCENSION: '0xb53c51Dc426c2Bd29da78Ac99426c55A6D6a51Ab'
};

// 既有代幣地址
const tokenAddresses = {
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE'
};

async function main() {
  console.log("🔍 開始驗證 V19 合約...\n");

  const contracts = [
    {
      name: "Oracle",
      address: addresses.ORACLE,
      contract: "contracts/Oracle.sol:Oracle",
      args: [
        addresses.DUNGEONCORE,
        addresses.USD,
        "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82" // Uniswap V3 Pool
      ]
    },
    {
      name: "DungeonCore",
      address: addresses.DUNGEONCORE,
      contract: "contracts/DungeonCore.sol:DungeonCore",
      args: [
        addresses.HERO,
        addresses.RELIC,
        addresses.PARTY,
        addresses.DUNGEONMASTER,
        addresses.PLAYERVAULT,
        addresses.PLAYERPROFILE,
        addresses.VIPSTAKING,
        addresses.ORACLE,
        addresses.ALTAROFASCENSION,
        addresses.DUNGEONSTORAGE
      ]
    },
    {
      name: "Hero",
      address: addresses.HERO,
      contract: "contracts/Hero.sol:Hero",
      args: [
        addresses.DUNGEONCORE,
        tokenAddresses.SOULSHARD,
        "10925A7138649C7E1794CE646182eeb5BF8ba647", // dungeonMasterWallet
        3000 // platformFee
      ]
    },
    {
      name: "Relic",
      address: addresses.RELIC,
      contract: "contracts/Relic.sol:Relic",
      args: [
        addresses.DUNGEONCORE,
        tokenAddresses.SOULSHARD,
        "10925A7138649C7E1794CE646182eeb5BF8ba647", // dungeonMasterWallet
        3000 // platformFee
      ]
    },
    {
      name: "Party",
      address: addresses.PARTY,
      contract: "contracts/Party.sol:Party",
      args: [
        addresses.DUNGEONCORE,
        tokenAddresses.SOULSHARD,
        "10925A7138649C7E1794CE646182eeb5BF8ba647", // dungeonMasterWallet
        3000 // platformFee
      ]
    },
    {
      name: "PlayerVault",
      address: addresses.PLAYERVAULT,
      contract: "contracts/PlayerVault.sol:PlayerVault",
      args: [
        addresses.DUNGEONCORE,
        tokenAddresses.SOULSHARD
      ]
    },
    {
      name: "PlayerProfile",
      address: addresses.PLAYERPROFILE,
      contract: "contracts/PlayerProfile.sol:PlayerProfile",
      args: [addresses.DUNGEONCORE]
    },
    {
      name: "VIPStaking",
      address: addresses.VIPSTAKING,
      contract: "contracts/VIPStaking.sol:VIPStaking",
      args: [addresses.DUNGEONCORE]
    },
    {
      name: "DungeonStorage",
      address: addresses.DUNGEONSTORAGE,
      contract: "contracts/DungeonStorage.sol:DungeonStorage",
      args: [addresses.DUNGEONCORE]
    },
    {
      name: "DungeonMaster",
      address: addresses.DUNGEONMASTER,
      contract: "contracts/DungeonMaster.sol:DungeonMaster",
      args: [
        addresses.DUNGEONCORE,
        addresses.DUNGEONSTORAGE,
        tokenAddresses.SOULSHARD
      ]
    },
    {
      name: "AltarOfAscension",
      address: addresses.ALTAROFASCENSION,
      contract: "contracts/AltarOfAscension.sol:AltarOfAscensionV2Fixed",
      args: [
        addresses.DUNGEONCORE,
        tokenAddresses.SOULSHARD
      ]
    }
  ];

  const results = [];
  
  for (const contract of contracts) {
    try {
      console.log(`\n📝 驗證 ${contract.name}...`);
      console.log(`   地址: ${contract.address}`);
      
      await hre.run("verify:verify", {
        address: contract.address,
        contract: contract.contract,
        constructorArguments: contract.args,
      });
      
      results.push({
        name: contract.name,
        status: "✅ 成功",
        address: contract.address
      });
      
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`   ✅ ${contract.name} 已經驗證過了`);
        results.push({
          name: contract.name,
          status: "✅ 已驗證",
          address: contract.address
        });
      } else {
        console.error(`   ❌ 錯誤: ${error.message}`);
        results.push({
          name: contract.name,
          status: "❌ 失敗",
          address: contract.address,
          error: error.message
        });
      }
    }
  }

  // 顯示總結
  console.log("\n\n📊 驗證結果總結：");
  console.log("=====================================");
  results.forEach(result => {
    console.log(`${result.status} ${result.name}: ${result.address}`);
    if (result.error) {
      console.log(`   錯誤: ${result.error}`);
    }
  });
  console.log("=====================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });