require('dotenv').config();
const { ethers } = require('ethers');

// 合約地址
const ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOUL: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  PANCAKE_V3_ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  ORACLE: '0xb9317179466fd7fb253669538dE1c4635E81eAc4'
};

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)'
];

const POOL_ABI = [
  'function fee() view returns (uint24)'
];

async function testSellOnly() {
  console.log('測試單獨賣出交易...\n');
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
  const router = new ethers.Contract(ADDRESSES.PANCAKE_V3_ROUTER, ROUTER_ABI, signer);
  const pool = new ethers.Contract(ADDRESSES.POOL, POOL_ABI, provider);
  
  try {
    // 測試不同金額
    const testAmounts = ['100', '500', '1000', '5000', '8000'];
    
    for (const amount of testAmounts) {
      console.log(`\n測試賣出 ${amount} SOUL...`);
      
      const soulAmount = ethers.parseUnits(amount, 18);
      const balance = await soulToken.balanceOf(signer.address);
      
      if (balance < soulAmount) {
        console.log(`餘額不足，跳過 ${amount} SOUL`);
        continue;
      }
      
      // 檢查授權
      const allowance = await soulToken.allowance(signer.address, ADDRESSES.PANCAKE_V3_ROUTER);
      if (allowance < soulAmount) {
        console.log('設置授權...');
        const approveTx = await soulToken.approve(ADDRESSES.PANCAKE_V3_ROUTER, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      const fee = await pool.fee();
      
      // 測試不同的 minOutput
      const minOutputTests = [
        { name: '0 (無滑點保護)', value: 0n },
        { name: '0.01 USD', value: ethers.parseUnits('0.01', 18) },
        { name: '0.1 USD', value: ethers.parseUnits('0.1', 18) },
        { name: '0.4 USD', value: ethers.parseUnits('0.4', 18) }
      ];
      
      for (const test of minOutputTests) {
        console.log(`\n  測試 minOutput: ${test.name}`);
        
        const params = {
          tokenIn: ADDRESSES.SOUL,
          tokenOut: ADDRESSES.USD,
          fee: fee,
          recipient: signer.address,
          amountIn: soulAmount,
          amountOutMinimum: test.value,
          sqrtPriceLimitX96: 0
        };
        
        try {
          // 先估算 gas
          const estimatedGas = await router.exactInputSingle.estimateGas(params);
          console.log(`  預估 Gas: ${estimatedGas.toString()}`);
          
          const tx = await router.exactInputSingle(params, {
            gasLimit: estimatedGas * 120n / 100n  // 加 20% buffer
          });
          
          console.log(`  交易哈希: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`  ✅ 成功！區塊: ${receipt.blockNumber}`);
          
          // 如果成功，跳出測試
          return;
          
        } catch (error) {
          console.log(`  ❌ 失敗: ${error.reason || error.message}`);
          if (error.data) {
            console.log(`  錯誤數據: ${error.data}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('測試失敗:', error);
  }
}

testSellOnly();