const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 更新 AltarOfAscension VRF Manager ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  const newVrfManager = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  const altarAddress = "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33";
  
  // 1. 更新 AltarOfAscension 的 VRF Manager
  console.log("\n1. 更新 AltarOfAscension 的 VRF Manager...");
  const altarAbi = ["function setVRFManager(address)"];
  const altar = new ethers.Contract(altarAddress, altarAbi, wallet);
  
  const feeData = await provider.getFeeData();
  console.log("   Gas 價格:", ethers.formatUnits(feeData.gasPrice, 'gwei'), "gwei");
  
  try {
    const tx1 = await altar.setVRFManager(newVrfManager, {
      gasLimit: 100000,
      gasPrice: feeData.gasPrice
    });
    console.log("   交易哈希:", tx1.hash);
    await tx1.wait();
    console.log("   ✅ AltarOfAscension VRF Manager 已更新");
  } catch (error) {
    console.log("   ❌ 更新失敗:", error.message);
  }
  
  // 2. 在新 VRF Manager 中授權 AltarOfAscension
  console.log("\n2. 在新 VRF Manager 中授權 AltarOfAscension...");
  const vrfAbi = ["function setAuthorizedContract(address,bool)"];
  const vrfManager = new ethers.Contract(newVrfManager, vrfAbi, wallet);
  
  try {
    const tx2 = await vrfManager.setAuthorizedContract(altarAddress, true, {
      gasLimit: 100000,
      gasPrice: feeData.gasPrice
    });
    console.log("   交易哈希:", tx2.hash);
    await tx2.wait();
    console.log("   ✅ AltarOfAscension 已在新 VRF Manager 中授權");
  } catch (error) {
    console.log("   ❌ 授權失敗:", error.message);
  }
  
  // 3. 驗證設置
  console.log("\n3. 驗證設置...");
  const altarReadAbi = ["function vrfManager() view returns (address)"];
  const altarRead = new ethers.Contract(altarAddress, altarReadAbi, provider);
  const currentVrf = await altarRead.vrfManager();
  
  const vrfReadAbi = ["function authorizedContracts(address) view returns (bool)"];
  const vrfRead = new ethers.Contract(newVrfManager, vrfReadAbi, provider);
  const isAuthorized = await vrfRead.authorizedContracts(altarAddress);
  
  console.log("   AltarOfAscension 當前 VRF Manager:", currentVrf);
  console.log("   是否正確:", currentVrf.toLowerCase() === newVrfManager.toLowerCase() ? "✅" : "❌");
  console.log("   是否已授權:", isAuthorized ? "✅" : "❌");
  
  console.log("\n=== 完成 ===");
  console.log("所有合約現在都使用新的 VRF Manager:");
  console.log("- VRF Manager:", newVrfManager);
  console.log("- Hero: ✅");
  console.log("- Relic: ✅");
  console.log("- DungeonMaster: ✅");
  console.log("- AltarOfAscension: ✅");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });