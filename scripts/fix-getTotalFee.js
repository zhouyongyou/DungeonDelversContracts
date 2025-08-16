const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 修復 VRF Manager getTotalFee 函數 ===\n");
  
  // 讀取合約 ABI
  const contractInfo = JSON.parse(fs.readFileSync('artifacts/contracts/current/core/VRFManagerV2PlusFixed.sol/VRFManagerV2PlusFixed.json', 'utf8'));
  
  // 創建新的合約，修改 getTotalFee 函數
  const fixedContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GetTotalFeeFixer {
    address public vrfManager = 0xBCC8821d3727C4339d2917Fb33D708c6C006c034;
    
    // 這個函數會被 delegatecall 調用
    function getTotalFee() public view returns (uint256) {
        // 直接返回設定的費用，不調用 calculateRequestPriceNative
        // vrfRequestPrice (0.0001 BNB) + platformFee (0.00005 BNB)
        return 150000000000000; // 0.00015 BNB in wei
    }
}`;

  // 先檢查當前的 getTotalFee 返回值
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const vrfAbi = [
    "function getTotalFee() view returns (uint256)",
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)"
  ];
  
  const vrfManager = new ethers.Contract("0xBCC8821d3727C4339d2917Fb33D708c6C006c034", vrfAbi, provider);
  
  console.log("1. 當前狀態檢查：");
  const currentTotal = await vrfManager.getTotalFee();
  const vrfPrice = await vrfManager.vrfRequestPrice();
  const platformFee = await vrfManager.platformFee();
  
  console.log("   getTotalFee() 返回:", ethers.formatEther(currentTotal), "BNB");
  console.log("   vrfRequestPrice:", ethers.formatEther(vrfPrice), "BNB");
  console.log("   platformFee:", ethers.formatEther(platformFee), "BNB");
  console.log("   應該返回:", ethers.formatEther(vrfPrice + platformFee), "BNB");
  
  if (currentTotal !== (vrfPrice + platformFee)) {
    console.log("\n   ❌ getTotalFee() 返回值不正確！");
    console.log("   問題：calculateRequestPriceNative 可能返回錯誤的值");
    
    // 部署修復合約
    console.log("\n2. 部署修復方案...");
    console.log("   由於無法直接修改已部署的合約，建議：");
    console.log("\n   方案 A：重新部署 VRF Manager（推薦）");
    console.log("   方案 B：前端直接計算費用");
    
    // 生成修復後的合約
    const fixedVRFManager = fs.readFileSync('contracts/current/core/VRFManagerV2PlusFixed.sol', 'utf8');
    const modifiedContract = fixedVRFManager.replace(
      /function getTotalFee\(\) public view returns \(uint256\) \{[\s\S]*?\}/,
      `function getTotalFee() public view returns (uint256) {
        // 簡化實現：直接返回配置的費用
        return vrfRequestPrice + platformFee;
    }`
    );
    
    // 保存修復後的合約
    fs.writeFileSync('contracts/current/core/VRFManagerV2PlusFixedV2.sol', modifiedContract);
    console.log("\n   ✅ 已生成修復版本: VRFManagerV2PlusFixedV2.sol");
    
    console.log("\n3. 臨時解決方案（前端）：");
    console.log("```javascript");
    console.log("// 不要調用 getTotalFee()，直接計算");
    console.log("const vrfPrice = await vrfManager.vrfRequestPrice();");
    console.log("const vrfPlatformFee = await vrfManager.platformFee();");
    console.log("const totalVrfFee = vrfPrice.add(vrfPlatformFee);");
    console.log("");
    console.log("// 鑄造時使用計算的費用");
    console.log("const quantity = 1;");
    console.log("const totalFee = totalVrfFee.mul(quantity);");
    console.log("await hero.mintFromWallet(quantity, { value: totalFee });");
    console.log("```");
  } else {
    console.log("\n   ✅ getTotalFee() 返回值正確");
    
    // 檢查為什麼交易還是失敗
    console.log("\n2. 檢查交易失敗的其他原因：");
    console.log("   - 前端可能快取了舊的費用值");
    console.log("   - 前端可能沒有正確計算總費用");
    console.log("   - 可能有其他 require 條件失敗");
    
    console.log("\n3. 前端應該發送的金額：");
    const quantity = 1;
    const totalRequired = (vrfPrice + platformFee) * BigInt(quantity);
    console.log(`   1 個 NFT: ${ethers.formatEther(totalRequired)} BNB`);
    console.log(`   5 個 NFT: ${ethers.formatEther(totalRequired * BigInt(5))} BNB`);
    console.log(`   50 個 NFT: ${ethers.formatEther(totalRequired * BigInt(50))} BNB`);
    
    console.log("\n   前端實際發送: 0.005 BNB");
    console.log("   ❌ 發送金額過多！應該只發送", ethers.formatEther(totalRequired), "BNB");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });