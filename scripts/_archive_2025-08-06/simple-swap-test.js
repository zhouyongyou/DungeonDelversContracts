require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // PancakeSwap V3 Router
    const ROUTER_ADDRESS = '0x13f4ea83d0bd40e75c8222255bc855a974568dd4';
    
    // 使用之前成功的地址
    const USD_ADDRESS = '0x9d4f02bd51b0db87caf4e7ed0ccc81e963dbf0a2';
    const SOUL_ADDRESS = '0xb1c1f6f9c487e86f8a51a7accfc58c97294df791';
    
    // 簡單的 Router ABI - 只包含 exactInputSingle
    const routerAbi = [
        'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, wallet);
    
    try {
        console.log('測試地址:', wallet.address);
        
        // 嘗試不同的 fee tiers
        const feeTiers = [100, 500, 3000, 10000]; // 0.01%, 0.05%, 0.3%, 1%
        
        for (const fee of feeTiers) {
            console.log(`\n嘗試 fee tier: ${fee} (${fee/10000}%)`);
            
            try {
                // 測試小額交易
                const amountIn = ethers.parseUnits('0.1', 18); // 0.1 USD
                const minAmountOut = ethers.parseUnits('10', 18); // 至少 10 SOUL
                
                const params = {
                    tokenIn: USD_ADDRESS,
                    tokenOut: SOUL_ADDRESS,
                    fee: fee,
                    recipient: wallet.address,
                    amountIn: amountIn,
                    amountOutMinimum: minAmountOut,
                    sqrtPriceLimitX96: 0
                };
                
                console.log('參數:', params);
                
                // 先用 callStatic 測試
                const result = await router.exactInputSingle.staticCall(params);
                console.log(`✅ Fee tier ${fee} 可用！預期輸出: ${ethers.formatUnits(result, 18)} SOUL`);
                
                // 找到可用的 fee tier 就停止
                console.log(`\n正確的 fee tier 是: ${fee}`);
                break;
                
            } catch (error) {
                console.log(`❌ Fee tier ${fee} 失敗:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('錯誤:', error);
    }
}

main().catch(console.error);