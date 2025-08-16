const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function main() {
  console.log('=== 驗證 VRFManagerV2PlusFixed 合約 ===\n');
  
  // 新部署的合約地址
  const vrfManagerAddress = '0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1';
  const wrapperAddress = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  
  console.log('合約地址:', vrfManagerAddress);
  console.log('構造參數:', wrapperAddress);
  
  // 1. 驗證 VRFManagerV2PlusFixed
  console.log('\n1. 驗證 VRFManagerV2PlusFixed...');
  
  const verifyCommand = `npx hardhat verify --network bsc ${vrfManagerAddress} "${wrapperAddress}"`;
  
  console.log('執行命令:', verifyCommand);
  
  try {
    const { stdout, stderr } = await execPromise(verifyCommand);
    
    if (stdout) {
      console.log('輸出:', stdout);
    }
    
    if (stderr && !stderr.includes('Already Verified')) {
      console.log('錯誤:', stderr);
    }
    
    if (stdout.includes('Successfully verified') || stderr.includes('Already Verified')) {
      console.log('✅ VRFManagerV2PlusFixed 驗證成功！');
    }
  } catch (error) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ 合約已經驗證過了');
    } else {
      console.log('❌ 驗證失敗:', error.message);
      
      // 嘗試使用 flatten 方式
      console.log('\n2. 嘗試使用 flatten 方式驗證...');
      
      try {
        // 先生成 flatten 文件
        console.log('生成 flatten 文件...');
        const flattenCommand = `npx hardhat flatten contracts/current/core/VRFManagerV2PlusFixed.sol > VRFManagerV2PlusFixed_flat.sol`;
        await execPromise(flattenCommand);
        console.log('✅ Flatten 文件生成成功');
        
        // 使用 flatten 文件驗證
        const verifyFlatCommand = `npx hardhat verify --network bsc --contract contracts/current/core/VRFManagerV2PlusFixed.sol:VRFManagerV2PlusFixed ${vrfManagerAddress} "${wrapperAddress}"`;
        
        console.log('執行驗證命令:', verifyFlatCommand);
        const { stdout: flatStdout, stderr: flatStderr } = await execPromise(verifyFlatCommand);
        
        if (flatStdout) {
          console.log('輸出:', flatStdout);
        }
        
        if (flatStderr && !flatStderr.includes('Already Verified')) {
          console.log('錯誤:', flatStderr);
        }
      } catch (flatError) {
        console.log('Flatten 驗證也失敗:', flatError.message);
      }
    }
  }
  
  // 3. 檢查 BSCScan
  console.log('\n3. 檢查 BSCScan:');
  console.log(`   查看合約: https://bscscan.com/address/${vrfManagerAddress}#code`);
  console.log('   如果自動驗證失敗，可以手動驗證：');
  console.log('   1. 打開上面的連結');
  console.log('   2. 點擊 "Verify and Publish"');
  console.log('   3. 選擇 Solidity (Single file)');
  console.log('   4. 編譯器版本: v0.8.20+commit.a1b79de6');
  console.log('   5. 優化: 是，200 runs');
  console.log('   6. 上傳 VRFManagerV2PlusFixed_flat.sol');
  console.log('   7. 構造參數 (ABI-encoded):', wrapperAddress);
  
  // 4. 生成構造參數的 ABI 編碼
  const ethers = require('ethers');
  const abiCoder = new ethers.AbiCoder();
  const encodedParams = abiCoder.encode(['address'], [wrapperAddress]);
  
  console.log('\n4. 構造參數 ABI 編碼（去掉 0x）:');
  console.log(encodedParams.slice(2));
  
  // 5. 驗證其他相關合約
  console.log('\n5. 檢查其他合約驗證狀態:');
  
  const contracts = [
    { name: 'Hero', address: '0x575e7407C06ADeb47067AD19663af50DdAe460CF' },
    { name: 'Relic', address: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739' }
  ];
  
  for (const contract of contracts) {
    console.log(`   ${contract.name}: https://bscscan.com/address/${contract.address}#code`);
  }
  
  console.log('\n=== 驗證流程完成 ===');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });