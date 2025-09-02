const { ethers } = require("hardhat");

async function main() {
  const vrfManagerAddress = "0x980d224ec4d198d94f34a8af76a19c00dabe2436";
  
  console.log("🔍 檢查 VRF Manager 基本資訊...\n");
  console.log("VRF Manager 地址:", vrfManagerAddress);
  console.log("=" .repeat(60));
  
  const vrfAbi = [
    "function owner() view returns (address)",
    "function s_subscriptionId() view returns (uint256)",
    "function LINK_ADDRESS() view returns (address)",
    "function coordinator() view returns (address)",
    "function keyHash() view returns (bytes32)",
    "function requestConfirmations() view returns (uint16)",
    "function callbackGasLimit() view returns (uint32)",
    "function authorizedCallers(address) view returns (bool)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, ethers.provider);
  
  console.log("\n📊 基本配置:");
  console.log("-".repeat(60));
  
  try {
    const owner = await vrfManager.owner();
    console.log("Owner:", owner);
  } catch (e) {
    console.log("❌ 無法讀取 owner:", e.message);
  }
  
  try {
    const subId = await vrfManager.s_subscriptionId();
    console.log("Subscription ID:", subId.toString());
  } catch (e) {
    console.log("❌ 無法讀取 subscription ID:", e.message);
  }
  
  try {
    const coordinator = await vrfManager.coordinator();
    console.log("VRF Coordinator:", coordinator);
  } catch (e) {
    console.log("❌ 無法讀取 coordinator:", e.message);
  }
  
  try {
    const link = await vrfManager.LINK_ADDRESS();
    console.log("LINK Token:", link);
  } catch (e) {
    console.log("⚠️ 無法讀取 LINK address (可能使用原生代幣)");
  }
  
  try {
    const keyHash = await vrfManager.keyHash();
    console.log("Key Hash:", keyHash);
  } catch (e) {
    console.log("❌ 無法讀取 keyHash:", e.message);
  }
  
  try {
    const confirmations = await vrfManager.requestConfirmations();
    console.log("Request Confirmations:", confirmations.toString());
  } catch (e) {
    console.log("❌ 無法讀取 requestConfirmations:", e.message);
  }
  
  try {
    const gasLimit = await vrfManager.callbackGasLimit();
    console.log("Callback Gas Limit:", gasLimit.toString());
  } catch (e) {
    console.log("❌ 無法讀取 callbackGasLimit:", e.message);
  }
  
  console.log("\n🔐 授權的合約:");
  console.log("-".repeat(60));
  
  const contractsToCheck = {
    "DungeonMaster": "0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9",
    "Hero": "0x70F1a8336DB60d0E97551339973Fe0d0c8E0EbC8",
    "Relic": "0x0B030a01682b2871950C9994a1f4274da96edBB1",
    "AltarOfAscension": "0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B"
  };
  
  for (const [name, address] of Object.entries(contractsToCheck)) {
    try {
      const isAuthorized = await vrfManager.authorizedCallers(address);
      console.log(`${name}: ${isAuthorized ? "✅ 已授權" : "❌ 未授權"}`);
    } catch (e) {
      console.log(`${name}: ⚠️ 無法檢查授權狀態`);
    }
  }
  
  console.log("\n=" .repeat(60));
  console.log("✅ VRF 基本檢查完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });