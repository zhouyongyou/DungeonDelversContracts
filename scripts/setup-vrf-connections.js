const hre = require("hardhat");

async function setupConnection(contractName, contractAddress, method, params) {
  try {
    console.log(`   ${method}(${params})...`);
    const contract = await hre.ethers.getContractAt(contractName, contractAddress);
    const tx = await contract[method](...(Array.isArray(params) ? params : [params]));
    await tx.wait();
    console.log(`   ✅ 成功`);
    return true;
  } catch (error) {
    if (error.message && error.message.includes("invalid value")) {
      const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
      if (match) {
        console.log(`   ✅ 交易已發送: ${match[1]}`);
        return true;
      }
    }
    console.log(`   ❌ 失敗:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 設置 VRF 合約連接...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  // 所有合約地址
  const contracts = {
    VRFConsumerV2Plus: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    AltarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"
  };
  
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  const SOULSHARD = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  
  console.log("📋 合約地址:");
  console.log("=====================================");
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`${name.padEnd(20)} ${address}`);
  }
  console.log("=====================================\n");
  
  // 1. 設置 VRF Manager
  console.log("🔗 設置 VRF Manager 地址...");
  
  console.log("\nHero:");
  await setupConnection("Hero", contracts.Hero, "setVRFManager", contracts.VRFConsumerV2Plus);
  
  console.log("\nRelic:");
  await setupConnection("Relic", contracts.Relic, "setVRFManager", contracts.VRFConsumerV2Plus);
  
  console.log("\nDungeonMaster:");
  await setupConnection("DungeonMaster", contracts.DungeonMaster, "setVRFManager", contracts.VRFConsumerV2Plus);
  
  console.log("\nAltarOfAscension:");
  await setupConnection("AltarOfAscension", contracts.AltarOfAscension, "setVRFManager", contracts.VRFConsumerV2Plus);
  
  // 2. 授權合約使用 VRF
  console.log("\n🔐 授權合約使用 VRF...");
  
  console.log("\n授權 Hero:");
  await setupConnection("VRFConsumerV2Plus", contracts.VRFConsumerV2Plus, "setAuthorizedContract", [contracts.Hero, true]);
  
  console.log("\n授權 Relic:");
  await setupConnection("VRFConsumerV2Plus", contracts.VRFConsumerV2Plus, "setAuthorizedContract", [contracts.Relic, true]);
  
  console.log("\n授權 DungeonMaster:");
  await setupConnection("VRFConsumerV2Plus", contracts.VRFConsumerV2Plus, "setAuthorizedContract", [contracts.DungeonMaster, true]);
  
  console.log("\n授權 AltarOfAscension:");
  await setupConnection("VRFConsumerV2Plus", contracts.VRFConsumerV2Plus, "setAuthorizedContract", [contracts.AltarOfAscension, true]);
  
  // 3. 設置 DungeonCore 和其他連接
  console.log("\n🏛️ 設置合約互連...");
  
  // Hero
  console.log("\nHero 連接:");
  await setupConnection("Hero", contracts.Hero, "setDungeonCore", DUNGEON_CORE);
  await setupConnection("Hero", contracts.Hero, "setSoulShardToken", SOULSHARD);
  
  // Relic
  console.log("\nRelic 連接:");
  await setupConnection("Relic", contracts.Relic, "setDungeonCore", DUNGEON_CORE);
  await setupConnection("Relic", contracts.Relic, "setSoulShardToken", SOULSHARD);
  await setupConnection("Relic", contracts.Relic, "setAscensionAltarAddress", contracts.AltarOfAscension);
  
  // DungeonMaster
  console.log("\nDungeonMaster 連接:");
  await setupConnection("DungeonMaster", contracts.DungeonMaster, "setDungeonCore", DUNGEON_CORE);
  await setupConnection("DungeonMaster", contracts.DungeonMaster, "setDungeonStorage", DUNGEON_STORAGE);
  
  // AltarOfAscension
  console.log("\nAltarOfAscension 連接:");
  await setupConnection("AltarOfAscension", contracts.AltarOfAscension, "setDungeonCore", DUNGEON_CORE);
  await setupConnection("AltarOfAscension", contracts.AltarOfAscension, "setHeroContract", contracts.Hero);
  await setupConnection("AltarOfAscension", contracts.AltarOfAscension, "setRelicContract", contracts.Relic);
  
  console.log("\n=====================================");
  console.log("🎉 所有設置完成！");
  console.log("=====================================");
  
  console.log("\n📋 最後步驟：");
  console.log("1. 在 Chainlink VRF 網站添加消費者：");
  console.log(`   https://vrf.chain.link/bsc/29062`);
  console.log(`   添加地址: ${contracts.VRFConsumerV2Plus}`);
  console.log("\n2. 確保訂閱有足夠的 LINK (建議 10+ LINK)");
  console.log("\n3. 驗證新部署的合約：");
  console.log(`   npx hardhat verify --network bsc ${contracts.DungeonMaster} ${deployer.address}`);
  console.log(`   npx hardhat verify --network bsc ${contracts.AltarOfAscension} ${deployer.address}`);
  console.log("\n4. 測試 VRF 鑄造功能");
  
  // 保存最終配置
  const fs = require("fs");
  const finalConfig = {
    network: "BSC Mainnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: contracts,
    configuration: {
      DUNGEON_CORE,
      DUNGEON_STORAGE,
      SOULSHARD,
      VRF_COORDINATOR: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
      SUBSCRIPTION_ID: 29062,
      KEY_HASH: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4"
    }
  };
  
  const filename = `deployments/vrf-final-config-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(finalConfig, null, 2));
  console.log(`\n💾 最終配置已保存到: ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });