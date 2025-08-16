#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';

async function checkOracleBytecode() {
  console.log('🔍 檢查 Oracle 合約 bytecode\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const oracles = [
    { name: 'V21 Oracle', address: '0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B' },
    { name: 'V20 Oracle', address: '0x570ab1b068FB8ca51c995e78d2D62189B6201284' },
    { name: 'V19 Oracle', address: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9' }
  ];
  
  for (const oracle of oracles) {
    console.log(`📊 ${oracle.name} (${oracle.address})`);
    
    try {
      // 獲取 bytecode
      const code = await provider.getCode(oracle.address);
      
      if (code === '0x') {
        console.log('   ❌ 合約不存在');
      } else {
        console.log(`   ✅ 合約存在，bytecode 長度: ${code.length}`);
        
        // 檢查是否包含 "OLD" 字符串 (hex: 0x4f4c44)
        if (code.includes('4f4c44')) {
          console.log('   ⚠️  Bytecode 中包含 "OLD" 字符串！');
          
          // 找出位置
          const index = code.indexOf('4f4c44');
          console.log(`   位置: 0x${(index/2).toString(16)}`);
        } else {
          console.log('   ℹ️  Bytecode 中沒有 "OLD" 字符串');
        }
      }
    } catch (error) {
      console.log(`   ❌ 檢查失敗: ${error.message}`);
    }
    
    console.log('');
  }
}

checkOracleBytecode().catch(console.error);