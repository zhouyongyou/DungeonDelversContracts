require('dotenv').config();
const { ethers } = require('ethers');

// 配置
const CONFIG = {
    // 地址（從你的交易記錄中提取）
    USD_ADDRESS: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
    SOUL_ADDRESS: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    POOL_ADDRESS: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
    SWAP_ROUTER_ADDRESS: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    
    // 交易參數
    SWAP_AMOUNT_USD: '0.5',      // 買入時使用 0.5 USD
    SWAP_AMOUNT_SOUL: '8000',    // 賣出時使用 8000 SOUL
    POOL_FEE: 10000,             // 1% = 10000
    
    // 時間設定
    WAIT_TIME: 29 * 60 * 1000,   // 29 分鐘
    MAX_RETRIES: 3,
    RETRY_DELAY: 30000           // 30 秒
};

// ABIs
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
];

const SWAP_ROUTER_ABI = [
    'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)'
];

const POOL_ABI = [
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

// 格式化時間
function formatTime() {
    return new Date().toLocaleString();
}

// 執行交易（帶重試）
async function executeSwapWithRetry(swapRouter, params, description) {
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`[${formatTime()}] 📤 嘗試執行 ${description} (第 ${attempt}/${CONFIG.MAX_RETRIES} 次)...`);
            
            const tx = await swapRouter.exactInputSingle(params, { 
                gasLimit: 500000,
                gasPrice: ethers.parseUnits('5', 'gwei')  // 固定 5 gwei
            });
            
            console.log(`[${formatTime()}] 交易哈希: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`[${formatTime()}] ✅ ${description} 成功！區塊: ${receipt.blockNumber}`);
            
            return receipt;
        } catch (error) {
            console.error(`[${formatTime()}] ❌ 第 ${attempt} 次嘗試失敗:`, error.message);
            
            if (attempt < CONFIG.MAX_RETRIES) {
                console.log(`[${formatTime()}] ⏳ 等待 ${CONFIG.RETRY_DELAY/1000} 秒後重試...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            } else {
                throw error;
            }
        }
    }
}

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL || process.env.BSC_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // 合約實例
    const swapRouter = new ethers.Contract(CONFIG.SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, wallet);
    const usdToken = new ethers.Contract(CONFIG.USD_ADDRESS, ERC20_ABI, wallet);
    const soulToken = new ethers.Contract(CONFIG.SOUL_ADDRESS, ERC20_ABI, wallet);
    const pool = new ethers.Contract(CONFIG.POOL_ADDRESS, POOL_ABI, wallet);
    
    // 金額設定
    const SWAP_AMOUNT_USD = ethers.parseUnits(CONFIG.SWAP_AMOUNT_USD, 18);
    const SWAP_AMOUNT_SOUL = ethers.parseUnits(CONFIG.SWAP_AMOUNT_SOUL, 18);
    const MAX_UINT256 = ethers.MaxUint256;

    console.log(`[${formatTime()}] 🧪 開始持續 29 分鐘交替交易測試`);
    console.log(`[${formatTime()}] ⏱️  交易間隔: 29 分鐘`);
    console.log(`[${formatTime()}] 🔄 交替模式：買入 → 等待29分鐘 → 賣出 → 等待29分鐘 → 買入...`);
    console.log(`[${formatTime()}] 🔄 將持續運行直到手動停止 (Ctrl+C) 或連續失敗 3 輪`);
    console.log(`[${formatTime()}] 🔁 每筆交易最多重試 ${CONFIG.MAX_RETRIES} 次`);
    console.log(`[${formatTime()}] `);
    console.log(`🔑 測試地址: ${wallet.address}`);

    // 檢查並授權代幣（一次性）
    console.log(`[${formatTime()}] `);
    console.log(`[${formatTime()}] 檢查代幣授權...`);
    
    const usdAllowance = await usdToken.allowance(wallet.address, CONFIG.SWAP_ROUTER_ADDRESS);
    if (usdAllowance < SWAP_AMOUNT_USD) {
        console.log(`[${formatTime()}] 授權 USD...`);
        const approveTx = await usdToken.approve(CONFIG.SWAP_ROUTER_ADDRESS, MAX_UINT256);
        await approveTx.wait();
        console.log(`[${formatTime()}] ✅ USD 授權完成`);
    }

    const soulAllowance = await soulToken.allowance(wallet.address, CONFIG.SWAP_ROUTER_ADDRESS);
    if (soulAllowance < SWAP_AMOUNT_SOUL) {
        console.log(`[${formatTime()}] 授權 SOUL...`);
        const approveTx = await soulToken.approve(CONFIG.SWAP_ROUTER_ADDRESS, MAX_UINT256);
        await approveTx.wait();
        console.log(`[${formatTime()}] ✅ SOUL 授權完成`);
    }

    let cycleCount = 0;
    let consecutiveFailures = 0;
    let isBuyTurn = true; // true = 買入, false = 賣出

    // 主循環
    while (consecutiveFailures < 3) {
        cycleCount++;
        const operationType = isBuyTurn ? '買入' : '賣出';
        const tradeDirection = isBuyTurn ? 'USD → SOUL' : 'SOUL → USD';
        
        console.log(`[${formatTime()}] `);
        console.log(`[${formatTime()}] 🔄 === 開始第 ${cycleCount} 輪操作：${operationType} (${tradeDirection}) ===`);
        
        try {
            // 顯示當前餘額
            const usdBalance = await usdToken.balanceOf(wallet.address);
            const soulBalance = await soulToken.balanceOf(wallet.address);
            const bnbBalance = await provider.getBalance(wallet.address);
            
            console.log(`[${formatTime()}] `);
            console.log(`💰 當前餘額:`);
            console.log(`[${formatTime()}]    USD:  ${ethers.formatUnits(usdBalance, 18)}`);
            console.log(`[${formatTime()}]    SOUL: ${ethers.formatUnits(soulBalance, 18)}`);
            console.log(`[${formatTime()}]    BNB:  ${ethers.formatEther(bnbBalance)}`);

            // 檢查池子狀態
            console.log(`[${formatTime()}] `);
            console.log(`📊 檢查池子狀態...`);
            const slot0 = await pool.slot0();
            console.log(`[${formatTime()}]    Tick: ${slot0.tick}`);
            console.log(`[${formatTime()}]    Unlocked: ${slot0.unlocked}`);

            // 根據當前輪次執行對應的交易
            if (isBuyTurn) {
                // 執行買入交易：USD → SOUL
                console.log(`[${formatTime()}] `);
                console.log(`🔄 執行買入交易：USD → SOUL`);
                console.log(`[${formatTime()}] 交易金額: ${CONFIG.SWAP_AMOUNT_USD} USD`);
                
                const params = {
                    tokenIn: CONFIG.USD_ADDRESS,
                    tokenOut: CONFIG.SOUL_ADDRESS,
                    fee: CONFIG.POOL_FEE,
                    recipient: wallet.address,
                    amountIn: SWAP_AMOUNT_USD,
                    amountOutMinimum: 0,  // 接受任何數量（實際使用時應該設定合理的滑點）
                    sqrtPriceLimitX96: 0
                };
                
                await executeSwapWithRetry(swapRouter, params, "USD → SOUL 買入交易");
                
            } else {
                // 執行賣出交易：SOUL → USD
                console.log(`[${formatTime()}] `);
                console.log(`🔄 執行賣出交易：SOUL → USD`);
                console.log(`[${formatTime()}] 交易金額: ${CONFIG.SWAP_AMOUNT_SOUL} SOUL`);
                
                const params = {
                    tokenIn: CONFIG.SOUL_ADDRESS,
                    tokenOut: CONFIG.USD_ADDRESS,
                    fee: CONFIG.POOL_FEE,
                    recipient: wallet.address,
                    amountIn: SWAP_AMOUNT_SOUL,
                    amountOutMinimum: 0,  // 接受任何數量
                    sqrtPriceLimitX96: 0
                };
                
                await executeSwapWithRetry(swapRouter, params, "SOUL → USD 賣出交易");
            }

            // 顯示交易後餘額
            const finalUsdBalance = await usdToken.balanceOf(wallet.address);
            const finalSoulBalance = await soulToken.balanceOf(wallet.address);
            const finalBnbBalance = await provider.getBalance(wallet.address);
            
            console.log(`[${formatTime()}] `);
            console.log(`💰 交易後餘額:`);
            console.log(`[${formatTime()}]    USD:  ${ethers.formatUnits(finalUsdBalance, 18)}`);
            console.log(`[${formatTime()}]    SOUL: ${ethers.formatUnits(finalSoulBalance, 18)}`);
            console.log(`[${formatTime()}]    BNB:  ${ethers.formatEther(finalBnbBalance)}`);

            console.log(`[${formatTime()}] `);
            console.log(`[${formatTime()}] ✅ 第 ${cycleCount} 輪${operationType}操作完成`);
            
            // 切換到下一個操作類型
            isBuyTurn = !isBuyTurn;
            const nextOperation = isBuyTurn ? '買入' : '賣出';
            const nextDirection = isBuyTurn ? 'USD → SOUL' : 'SOUL → USD';
            
            console.log(`[${formatTime()}] 🔄 下次操作：${nextOperation} (${nextDirection})`);
            console.log(`[${formatTime()}] ============================`);
            
            // 成功後重置連續失敗次數
            consecutiveFailures = 0;

        } catch (error) {
            console.error(`[${formatTime()}] ❌ 第 ${cycleCount} 輪${operationType}操作發生錯誤:`, error.message);
            consecutiveFailures++;
            console.log(`[${formatTime()}] 連續失敗次數: ${consecutiveFailures}/3`);
            
            if (consecutiveFailures >= 3) {
                console.log(`[${formatTime()}] ❌ 連續失敗 3 輪，停止程式`);
                break;
            }
            console.log(`[${formatTime()}] 將在下一輪重試（操作類型不變）...`);
        }

        // 等待 29 分鐘後開始下一輪
        console.log(`[${formatTime()}] `);
        console.log(`[${formatTime()}] ⏳ 等待 29 分鐘後開始下一輪操作...`);
        
        for (let i = 1; i <= 29; i++) {
            await new Promise(resolve => setTimeout(resolve, 60000)); // 等待 1 分鐘
            console.log(`[${formatTime()}] ⏳ 已等待 ${i} 分鐘，剩餘 ${29 - i} 分鐘...`);
            
            // 每 5 分鐘檢查一次池子狀態
            if (i % 5 === 0) {
                console.log(`[${formatTime()}] `);
                console.log(`📊 檢查池子狀態...`);
                const slot0Check = await pool.slot0();
                console.log(`[${formatTime()}]    Tick: ${slot0Check.tick}`);
                console.log(`[${formatTime()}]    Unlocked: ${slot0Check.unlocked}`);
            }
        }
    }
}

// 處理程式中斷
process.on('SIGINT', () => {
    console.log(`\n[${formatTime()}] 🛑 收到中斷信號，正在優雅地關閉程式...`);
    process.exit(0);
});

main().catch(error => {
    console.error(`[${formatTime()}] ❌ 程式發生錯誤:`, error);
    process.exit(1);
});