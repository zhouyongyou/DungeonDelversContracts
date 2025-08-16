const { ethers } = require('hardhat');

async function main() {
  console.log('=== 測試 Hero 鑄造 ===\n');
  
  const heroAddress = '0x575e7407C06ADeb47067AD19663af50DdAe460CF';
  const soulShardAddress = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  const vrfManagerAddress = '0xD95d0A29055E810e9f8c64073998832d66538176';
  
  const [signer] = await ethers.getSigners();
  console.log('測試帳號:', signer.address);
  
  // Hero ABI
  const heroAbi = [
    'function mintFromWallet(uint256 quantity) payable',
    'function platformFee() view returns (uint256)',
    'function vrfManager() view returns (address)',
    'function userCommitments(address) view returns (uint256 blockNumber, uint256 quantity, uint256 payment, bytes32 commitment, bool fulfilled, uint8 maxRarity, bool fromVault)'
  ];
  
  // SoulShard ABI
  const soulAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
  ];
  
  // VRF Manager ABI
  const vrfAbi = [
    'function getTotalFee() view returns (uint256)',
    'function authorizedContracts(address) view returns (bool)'
  ];
  
  const hero = new ethers.Contract(heroAddress, heroAbi, signer);
  const soulShard = new ethers.Contract(soulShardAddress, soulAbi, signer);
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, signer);
  
  // 1. 檢查授權狀態
  console.log('1. 檢查 VRF 授權:');
  const isAuthorized = await vrfManager.authorizedContracts(heroAddress);
  console.log('   Hero 授權狀態:', isAuthorized ? '✅ 已授權' : '❌ 未授權');
  
  // 2. 檢查費用
  console.log('\n2. 費用計算:');
  const platformFee = await hero.platformFee();
  const vrfFee = await vrfManager.getTotalFee();
  console.log('   平台費 (每個):', ethers.formatEther(platformFee), 'BNB');
  console.log('   VRF 費用:', ethers.formatEther(vrfFee), 'BNB');
  
  const quantity = 1; // 測試鑄造 1 個
  const totalBnbNeeded = platformFee * BigInt(quantity) + vrfFee;
  console.log('   總 BNB 需求 (1個):', ethers.formatEther(totalBnbNeeded), 'BNB');
  
  // 3. 檢查 SOUL 餘額和授權
  console.log('\n3. SOUL 代幣狀態:');
  const soulBalance = await soulShard.balanceOf(signer.address);
  const soulAllowance = await soulShard.allowance(signer.address, heroAddress);
  
  // 假設每個需要 34,072.9820 SOUL (價值 $2)
  const soulPerNft = ethers.parseEther('34072.9820');
  const soulNeeded = soulPerNft * BigInt(quantity);
  
  console.log('   SOUL 餘額:', ethers.formatEther(soulBalance));
  console.log('   SOUL 授權:', ethers.formatEther(soulAllowance));
  console.log('   SOUL 需求:', ethers.formatEther(soulNeeded));
  
  // 4. 檢查 BNB 餘額
  console.log('\n4. BNB 餘額:');
  const bnbBalance = await ethers.provider.getBalance(signer.address);
  console.log('   BNB 餘額:', ethers.formatEther(bnbBalance));
  console.log('   BNB 需求:', ethers.formatEther(totalBnbNeeded));
  
  // 5. 檢查是否滿足條件
  console.log('\n5. 條件檢查:');
  const canMint = 
    isAuthorized && 
    soulBalance >= soulNeeded && 
    soulAllowance >= soulNeeded && 
    bnbBalance >= totalBnbNeeded;
  
  if (!isAuthorized) {
    console.log('   ❌ Hero 未被 VRF Manager 授權');
  }
  if (soulBalance < soulNeeded) {
    console.log('   ❌ SOUL 餘額不足');
  }
  if (soulAllowance < soulNeeded) {
    console.log('   ❌ SOUL 授權不足');
    console.log('\n   需要執行授權:');
    console.log('   await soulShard.approve(heroAddress, soulNeeded)');
  }
  if (bnbBalance < totalBnbNeeded) {
    console.log('   ❌ BNB 餘額不足');
  }
  
  if (canMint) {
    console.log('   ✅ 所有條件滿足，可以鑄造！');
    
    // 6. 嘗試授權 SOUL (如果需要)
    if (soulAllowance < soulNeeded) {
      console.log('\n6. 授權 SOUL 代幣...');
      try {
        const approveTx = await soulShard.approve(heroAddress, soulNeeded);
        console.log('   交易哈希:', approveTx.hash);
        await approveTx.wait();
        console.log('   ✅ 授權成功');
      } catch (e) {
        console.log('   ❌ 授權失敗:', e.message);
        return;
      }
    }
    
    // 7. 嘗試鑄造
    console.log('\n7. 執行鑄造...');
    try {
      const mintTx = await hero.mintFromWallet(quantity, {
        value: totalBnbNeeded
      });
      console.log('   交易哈希:', mintTx.hash);
      console.log('   等待確認...');
      const receipt = await mintTx.wait();
      console.log('   ✅ 鑄造成功！');
      console.log('   Gas 使用:', receipt.gasUsed.toString());
    } catch (e) {
      console.log('   ❌ 鑄造失敗:', e.message);
      if (e.data) {
        console.log('   錯誤數據:', e.data);
      }
    }
  } else {
    console.log('\n   ⚠️ 不滿足鑄造條件，請先解決上述問題');
  }
  
  // 8. 檢查用戶承諾狀態
  console.log('\n8. 檢查用戶承諾狀態:');
  try {
    const commitment = await hero.userCommitments(signer.address);
    if (commitment.blockNumber > 0) {
      console.log('   區塊號:', commitment.blockNumber.toString());
      console.log('   數量:', commitment.quantity.toString());
      console.log('   已完成:', commitment.fulfilled);
    } else {
      console.log('   無待處理的鑄造');
    }
  } catch (e) {
    console.log('   無法讀取承諾狀態');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });