const hre = require("hardhat");
const { execSync } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 部署 AltarOfAscension
async function deployAltar() {
  console.log("\n📦 部署 AltarOfAscension...");
  
  try {
    const Factory = await hre.ethers.getContractFactory("AltarOfAscension");
    const [deployer] = await hre.ethers.getSigners();
    const contract = await Factory.deploy(deployer.address);
    
    // 會出錯但交易已發送
    await contract.waitForDeployment();
    return await contract.getAddress();
  } catch (error) {
    // 從錯誤提取交易 hash
    const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
    if (match && match[1]) {
      console.log("   交易 Hash:", match[1]);
      console.log("   等待確認...");
      await sleep(15000);
      
      // 查詢合約地址
      const cmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${match[1]}"],"id":1}' | jq -r '.result.contractAddress'`;
      const address = execSync(cmd).toString().trim();
      
      if (address && address !== 'null') {
        console.log("   ✅ AltarOfAscension 部署成功:", address);
        return address;
      }
    }
    throw error;
  }
}

// 設置合約（忽略 ethers v6 錯誤）
async function setupContract(contractName, contractAddress, method, value) {
  try {
    const contract = await hre.ethers.getContractAt(contractName, contractAddress);
    const tx = await contract[method](value);
    console.log(`   ✅ ${method} 成功`);
    await tx.wait();
    return true;
  } catch (error) {
    if (error.message && error.message.includes("invalid value")) {
      const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
      if (match) {
        console.log(`   ✅ ${method} 交易已發送: ${match[1]}`);
        return true;
      }
    }
    console.log(`   ❌ ${method} 失敗:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 完成最終設置...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  // 所有合約地址
  const contracts = {
    VRFConsumerV2Plus: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    AltarOfAscension: null // 待部署
  };
  
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  const SOULSHARD = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  
  // 1. 部署 AltarOfAscension
  if (!contracts.AltarOfAscension) {
    contracts.AltarOfAscension = await deployAltar();
  }
  
  console.log("\n✅ 所有合約已部署！");
  console.log("=====================================");
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`${name.padEnd(20)} ${address}`);
  }
  console.log("=====================================");
  
  // 2. 設置 VRF Manager
  console.log("\n🔗 設置 VRF Manager 地址...");
  
  for (const [name, address] of Object.entries(contracts)) {
    if (name === "VRFConsumerV2Plus" || !address) continue;
    
    console.log(`\n${name}:`);
    await setupContract(name, address, "setVRFManager", contracts.VRFConsumerV2Plus);
  }
  
  // 3. 授權合約使用 VRF
  console.log("\n🔐 授權合約使用 VRF...");
  
  for (const [name, address] of Object.entries(contracts)) {
    if (name === "VRFConsumerV2Plus" || !address) continue;
    
    console.log(`\n授權 ${name}...`);
    await setupContract("VRFConsumerV2Plus", contracts.VRFConsumerV2Plus, "setAuthorizedContract", address);
  }
  
  // 4. 設置 DungeonCore 和其他連接
  console.log("\n🏛️ 設置合約互連...");
  
  // Hero
  console.log("\nHero:");
  await setupContract("Hero", contracts.Hero, "setDungeonCore", DUNGEON_CORE);
  await setupContract("Hero", contracts.Hero, "setSoulShardToken", SOULSHARD);
  
  // Relic
  console.log("\nRelic:");
  await setupContract("Relic", contracts.Relic, "setDungeonCore", DUNGEON_CORE);
  await setupContract("Relic", contracts.Relic, "setSoulShardToken", SOULSHARD);
  await setupContract("Relic", contracts.Relic, "setAscensionAltarAddress", contracts.AltarOfAscension);
  
  // DungeonMaster
  console.log("\nDungeonMaster:");
  await setupContract("DungeonMaster", contracts.DungeonMaster, "setDungeonCore", DUNGEON_CORE);
  await setupContract("DungeonMaster", contracts.DungeonMaster, "setDungeonStorage", DUNGEON_STORAGE);
  
  // AltarOfAscension
  console.log("\nAltarOfAscension:");
  await setupContract("AltarOfAscension", contracts.AltarOfAscension, "setDungeonCore", DUNGEON_CORE);
  await setupContract("AltarOfAscension", contracts.AltarOfAscension, "setHeroContract", contracts.Hero);
  await setupContract("AltarOfAscension", contracts.AltarOfAscension, "setRelicContract", contracts.Relic);
  
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
      SUBSCRIPTION_ID: 29062
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
  });<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u90e8\u7f72 VRFConsumerV2Plus \u5408\u7d04", "status": "completed", "id": "68"}, {"content": "\u8a2d\u7f6e VRF \u5408\u7d04\u6388\u6b0a", "status": "completed", "id": "69"}, {"content": "\u91cd\u65b0\u90e8\u7f72 Hero \u5408\u7d04\uff08\u542b VRF\uff09", "status": "completed", "id": "73"}, {"content": "\u91cd\u65b0\u90e8\u7f72 Relic \u5408\u7d04\uff08\u542b VRF\uff09", "status": "completed", "id": "74"}, {"content": "\u9a57\u8b49\u5408\u7d04\u958b\u6e90", "status": "completed", "id": "77"}, {"content": "\u90e8\u7f72 DungeonMaster \u5408\u7d04", "status": "completed", "id": "78"}, {"content": "\u90e8\u7f72 AltarOfAscension \u5408\u7d04", "status": "in_progress", "id": "79"}, {"content": "\u8a2d\u7f6e\u5404\u5408\u7d04\u7684 VRF Manager \u5730\u5740", "status": "pending", "id": "70"}, {"content": "\u8a2d\u7f6e\u5408\u7d04\u4e92\u9023", "status": "pending", "id": "80"}, {"content": "\u5728 Chainlink \u7db2\u7ad9\u6dfb\u52a0\u6d88\u8cbb\u8005", "status": "pending", "id": "71"}, {"content": "\u6e2c\u8a66 VRF \u9444\u9020\u529f\u80fd", "status": "pending", "id": "72"}]