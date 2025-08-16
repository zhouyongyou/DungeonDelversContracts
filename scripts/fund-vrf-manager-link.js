const { ethers } = require('hardhat');

async function main() {
  console.log('=== 為 VRF Manager 轉入 LINK 代幣 ===\n');
  
  const vrfManagerAddress = '0xD95d0A29055E810e9f8c64073998832d66538176';
  const linkAddress = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75'; // BSC Mainnet LINK
  
  const [signer] = await ethers.getSigners();
  console.log('執行者:', signer.address);
  
  // LINK 代幣 ABI
  const linkAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)'
  ];
  
  const link = new ethers.Contract(linkAddress, linkAbi, signer);
  
  // 1. 檢查當前餘額
  console.log('1. 檢查 LINK 餘額:');
  const signerBalance = await link.balanceOf(signer.address);
  const vrfBalance = await link.balanceOf(vrfManagerAddress);
  const decimals = await link.decimals();
  
  console.log('   你的 LINK 餘額:', ethers.formatUnits(signerBalance, decimals));
  console.log('   VRF Manager LINK 餘額:', ethers.formatUnits(vrfBalance, decimals));
  
  if (signerBalance == 0n) {
    console.log('\n❌ 你沒有 LINK 代幣！');
    console.log('請先獲取 LINK：');
    console.log('1. 去 PancakeSwap 購買 LINK: https://pancakeswap.finance/swap');
    console.log('2. LINK 合約地址:', linkAddress);
    console.log('3. 建議購買至少 1 LINK 用於測試');
    return;
  }
  
  // 2. 計算轉帳金額
  const transferAmount = ethers.parseUnits('0.5', decimals); // 轉 0.5 LINK
  
  if (signerBalance < transferAmount) {
    console.log('\n⚠️ LINK 餘額不足 0.5，將轉入全部餘額');
    const actualAmount = signerBalance;
    
    console.log('\n2. 轉帳 LINK 到 VRF Manager:');
    console.log('   轉帳金額:', ethers.formatUnits(actualAmount, decimals), 'LINK');
    
    try {
      const tx = await link.transfer(vrfManagerAddress, actualAmount);
      console.log('   交易哈希:', tx.hash);
      console.log('   等待確認...');
      await tx.wait();
      console.log('   ✅ 轉帳成功！');
    } catch (e) {
      console.log('   ❌ 轉帳失敗:', e.message);
      return;
    }
  } else {
    console.log('\n2. 轉帳 LINK 到 VRF Manager:');
    console.log('   轉帳金額:', ethers.formatUnits(transferAmount, decimals), 'LINK');
    
    try {
      const tx = await link.transfer(vrfManagerAddress, transferAmount);
      console.log('   交易哈希:', tx.hash);
      console.log('   等待確認...');
      await tx.wait();
      console.log('   ✅ 轉帳成功！');
    } catch (e) {
      console.log('   ❌ 轉帳失敗:', e.message);
      return;
    }
  }
  
  // 3. 驗證轉帳結果
  console.log('\n3. 驗證轉帳結果:');
  const newSignerBalance = await link.balanceOf(signer.address);
  const newVrfBalance = await link.balanceOf(vrfManagerAddress);
  
  console.log('   你的新 LINK 餘額:', ethers.formatUnits(newSignerBalance, decimals));
  console.log('   VRF Manager 新 LINK 餘額:', ethers.formatUnits(newVrfBalance, decimals));
  
  if (newVrfBalance > 0n) {
    console.log('\n✅ VRF Manager 現在有足夠的 LINK！');
    console.log('可以開始鑄造 NFT 了。');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });