require('dotenv').config();
const { ethers } = require('ethers');

// Use Pancake V3 Universal Router
const UNIVERSAL_ROUTER_ADDRESS = '0x5Dc88340E1c5c6366864Ee415d6034cadd1A9897';
const USD_ADDRESS = '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE';
const SOUL_ADDRESS = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
const POOL_ADDRESS = '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82';

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
];

// Universal Router commands
const COMMANDS = {
    V3_SWAP_EXACT_IN: '0x00'
};

// Universal Router ABI
const UNIVERSAL_ROUTER_ABI = [
    'function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable'
];

const POOL_ABI = [
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, bool unlocked)',
    'function fee() external view returns (uint24)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)'
];

async function encodeV3SwapExactIn(recipient, amountIn, amountOutMin, path, payerIsUser) {
    // Encode path: tokenIn + fee + tokenOut
    const encodedPath = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint24', 'address'],
        path
    );
    
    // Encode the V3 swap parameters
    return ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'uint256', 'bytes', 'bool'],
        [recipient, amountIn, amountOutMin, encodedPath, payerIsUser]
    );
}

async function executeSwapWithRetry(router, commands, inputs, deadline, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[${new Date().toLocaleString()}] 📤 嘗試執行交易 (第 ${attempt}/${maxRetries} 次)...`);
            const tx = await router.execute(commands, inputs, deadline, { gasLimit: 500000 });
            console.log(`[${new Date().toLocaleString()}] 交易哈希: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`[${new Date().toLocaleString()}] ✅ 交易成功！區塊: ${receipt.blockNumber}`);
            return receipt;
        } catch (error) {
            console.error(`[${new Date().toLocaleString()}] ❌ 第 ${attempt} 次嘗試失敗:`, error.message);
            if (attempt < maxRetries) {
                console.log(`[${new Date().toLocaleString()}] ⏳ 等待 30 秒後重試...`);
                await new Promise(resolve => setTimeout(resolve, 30000));
            } else {
                throw error;
            }
        }
    }
}

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL || process.env.BSC_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const universalRouter = new ethers.Contract(UNIVERSAL_ROUTER_ADDRESS, UNIVERSAL_ROUTER_ABI, wallet);
    const usdToken = new ethers.Contract(USD_ADDRESS, ERC20_ABI, wallet);
    const soulToken = new ethers.Contract(SOUL_ADDRESS, ERC20_ABI, wallet);
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, wallet);

    const SWAP_AMOUNT = ethers.parseUnits('0.5', 18);
    const SOUL_AMOUNT = ethers.parseUnits('8000', 18);
    const MAX_UINT256 = ethers.MaxUint256;

    console.log(`[${new Date().toLocaleString()}] 🧪 開始持續 20 分鐘循環測試 (Universal Router)`);
    console.log(`[${new Date().toLocaleString()}] ⏱️  交易間隔: 20 分鐘`);
    console.log(`[${new Date().toLocaleString()}] 🔄 將持續運行直到手動停止 (Ctrl+C) 或連續失敗 3 輪`);
    console.log(`[${new Date().toLocaleString()}] 🔁 每筆交易最多重試 3 次`);
    console.log(`[${new Date().toLocaleString()}] `);
    console.log(`🔑 測試地址: ${wallet.address}`);

    // Get pool fee
    const poolFee = await pool.fee();
    console.log(`[${new Date().toLocaleString()}] 📊 池子手續費: ${poolFee / 10000}%`);

    // Check and approve tokens to Universal Router
    const usdAllowance = await usdToken.allowance(wallet.address, UNIVERSAL_ROUTER_ADDRESS);
    if (usdAllowance < SWAP_AMOUNT) {
        console.log(`[${new Date().toLocaleString()}] 授權 USD 到 Universal Router...`);
        const approveTx = await usdToken.approve(UNIVERSAL_ROUTER_ADDRESS, MAX_UINT256);
        await approveTx.wait();
        console.log(`[${new Date().toLocaleString()}] ✅ USD 授權完成`);
    }

    const soulAllowance = await soulToken.allowance(wallet.address, UNIVERSAL_ROUTER_ADDRESS);
    if (soulAllowance < SOUL_AMOUNT) {
        console.log(`[${new Date().toLocaleString()}] 授權 SOUL 到 Universal Router...`);
        const approveTx = await soulToken.approve(UNIVERSAL_ROUTER_ADDRESS, MAX_UINT256);
        await approveTx.wait();
        console.log(`[${new Date().toLocaleString()}] ✅ SOUL 授權完成`);
    }

    let cycleCount = 0;
    let consecutiveFailures = 0;

    // Main loop
    while (consecutiveFailures < 3) {
        cycleCount++;
        console.log(`[${new Date().toLocaleString()}] `);
        console.log(`[${new Date().toLocaleString()}] 🔄 === 開始第 ${cycleCount} 輪循環 ===`);
        
        try {
            // Display current balances
            const usdBalance = await usdToken.balanceOf(wallet.address);
            const soulBalance = await soulToken.balanceOf(wallet.address);
            const bnbBalance = await provider.getBalance(wallet.address);
            
            console.log(`[${new Date().toLocaleString()}] `);
            console.log(`💰 當前餘額:`);
            console.log(`[${new Date().toLocaleString()}]    USD:  ${ethers.formatUnits(usdBalance, 18)}`);
            console.log(`[${new Date().toLocaleString()}]    SOUL: ${ethers.formatUnits(soulBalance, 18)}`);
            console.log(`[${new Date().toLocaleString()}]    BNB:  ${ethers.formatEther(bnbBalance)}`);

            // Check pool status
            console.log(`[${new Date().toLocaleString()}] `);
            console.log(`📊 檢查池子狀態...`);
            const slot0 = await pool.slot0();
            console.log(`[${new Date().toLocaleString()}]    Tick: ${slot0.tick}`);
            console.log(`[${new Date().toLocaleString()}]    Unlocked: ${slot0.unlocked}`);

            // Execute first swap: USD → SOUL
            console.log(`[${new Date().toLocaleString()}] `);
            console.log(`🔄 執行第 1 筆交易：買入 USD → SOUL`);
            const minAmountOut1 = ethers.parseUnits('100', 18);
            console.log(`[${new Date().toLocaleString()}] 最小接受: ${ethers.formatUnits(minAmountOut1, 18)} SOUL`);
            
            const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
            const path1 = [USD_ADDRESS, poolFee, SOUL_ADDRESS];
            const input1 = await encodeV3SwapExactIn(
                wallet.address,
                SWAP_AMOUNT,
                minAmountOut1,
                path1,
                true // payer is user
            );
            
            await executeSwapWithRetry(universalRouter, COMMANDS.V3_SWAP_EXACT_IN, [input1], deadline);

            // Wait 20 minutes with progress updates
            console.log(`[${new Date().toLocaleString()}] `);
            console.log(`⏳ 等待 20 分鐘後執行第二筆交易...`);
            
            for (let i = 1; i <= 20; i++) {
                await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
                console.log(`[${new Date().toLocaleString()}] ⏳ 已等待 ${i} 分鐘，剩餘 ${20 - i} 分鐘...`);
                
                // Check pool status every 5 minutes
                if (i % 5 === 0) {
                    console.log(`[${new Date().toLocaleString()}] `);
                    console.log(`📊 檢查池子狀態...`);
                    const slot0Check = await pool.slot0();
                    console.log(`[${new Date().toLocaleString()}]    Tick: ${slot0Check.tick}`);
                    console.log(`[${new Date().toLocaleString()}]    Unlocked: ${slot0Check.unlocked}`);
                }
            }

            // Execute second swap: SOUL → USD
            console.log(`[${new Date().toLocaleString()}] `);
            console.log(`🔄 執行第 2 筆交易：賣出 SOUL → USD`);
            const currentSoulBalance = await soulToken.balanceOf(wallet.address);
            console.log(`[${new Date().toLocaleString()}] SOUL 餘額: ${ethers.formatUnits(currentSoulBalance, 18)}`);
            const minAmountOut2 = ethers.parseUnits('0.01', 18);
            console.log(`[${new Date().toLocaleString()}] 最小接受: ${ethers.formatUnits(minAmountOut2, 18)} USD`);
            
            const deadline2 = Math.floor(Date.now() / 1000) + 300;
            const path2 = [SOUL_ADDRESS, poolFee, USD_ADDRESS];
            const input2 = await encodeV3SwapExactIn(
                wallet.address,
                SOUL_AMOUNT,
                minAmountOut2,
                path2,
                true
            );
            
            await executeSwapWithRetry(universalRouter, COMMANDS.V3_SWAP_EXACT_IN, [input2], deadline2);

            // Display final balances
            const finalUsdBalance = await usdToken.balanceOf(wallet.address);
            const finalSoulBalance = await soulToken.balanceOf(wallet.address);
            const finalBnbBalance = await provider.getBalance(wallet.address);
            
            console.log(`[${new Date().toLocaleString()}] `);
            console.log(`💰 最終餘額:`);
            console.log(`[${new Date().toLocaleString()}]    USD:  ${ethers.formatUnits(finalUsdBalance, 18)}`);
            console.log(`[${new Date().toLocaleString()}]    SOUL: ${ethers.formatUnits(finalSoulBalance, 18)}`);
            console.log(`[${new Date().toLocaleString()}]    BNB:  ${ethers.formatEther(finalBnbBalance)}`);

            console.log(`[${new Date().toLocaleString()}] `);
            console.log(`[${new Date().toLocaleString()}] ✅ 第 ${cycleCount} 輪循環完成`);
            console.log(`[${new Date().toLocaleString()}] ============================`);
            
            // Reset consecutive failures on success
            consecutiveFailures = 0;

        } catch (error) {
            console.error(`[${new Date().toLocaleString()}] ❌ 第 ${cycleCount} 輪循環發生錯誤:`, error.message);
            consecutiveFailures++;
            console.log(`[${new Date().toLocaleString()}] 連續失敗次數: ${consecutiveFailures}/3`);
            
            if (consecutiveFailures >= 3) {
                console.log(`[${new Date().toLocaleString()}] ❌ 連續失敗 3 輪，停止程式`);
                break;
            }
            console.log(`[${new Date().toLocaleString()}] 將在下一輪重試...`);
        }

        // Wait a bit before starting next cycle
        console.log(`[${new Date().toLocaleString()}] `);
        console.log(`[${new Date().toLocaleString()}] ⏳ 等待 1 分鐘後開始下一輪循環...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
    }
}

main().catch(console.error);