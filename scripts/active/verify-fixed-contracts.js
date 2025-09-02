const hre = require("hardhat");

async function main() {
  console.log('🔍 驗證修復後的合約');
  console.log('==================\n');
  
  const contracts = [
    {
      name: 'VRFManagerV2Plus',
      address: '0xD95d0A29055E810e9f8c64073998832d66538176',
      constructorArgs: [
        '0x404460C6A5EdE2D891e8297795264fDe62ADBB75', // LINK Token
        '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94'  // VRF Wrapper
      ]
    },
    {
      name: 'Hero',
      address: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
      constructorArgs: [
        '0xEbCF4A36Ad1485A9737025e9d72186b604487274' // Owner address
      ]
    },
    {
      name: 'Relic', 
      address: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
      constructorArgs: [
        '0xEbCF4A36Ad1485A9737025e9d72186b604487274' // Owner address
      ]
    }
  ];
  
  console.log('等待 10 秒讓 BSCScan 完全索引合約...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  for (const contract of contracts) {
    try {
      console.log(`\n🔍 驗證 ${contract.name}...`);
      console.log(`地址: ${contract.address}`);
      console.log(`構造參數: ${JSON.stringify(contract.constructorArgs)}`);
      
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArgs,
      });
      
      console.log(`✅ ${contract.name} 驗證成功`);
      
    } catch (error) {
      if (error.message.includes("already verified")) {
        console.log(`⚠️ ${contract.name} 已經驗證過`);
      } else if (error.message.includes("does not have bytecode")) {
        console.log(`❌ ${contract.name} 合約地址無效或未部署`);
      } else if (error.message.includes("Reason: Already Verified")) {
        console.log(`⚠️ ${contract.name} 已經驗證過`);
      } else {
        console.log(`❌ ${contract.name} 驗證失敗: ${error.message}`);
      }
    }
  }
  
  console.log('\n📝 驗證完成！');
  console.log('🔗 查看驗證結果:');
  console.log(`VRFManagerV2Plus: https://bscscan.com/address/${contracts[0].address}#code`);
  console.log(`Hero: https://bscscan.com/address/${contracts[1].address}#code`);
  console.log(`Relic: https://bscscan.com/address/${contracts[2].address}#code`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });