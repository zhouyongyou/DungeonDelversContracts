#!/usr/bin/env node

/**
 * 自動揭示服務 - 後端定時任務
 * 監聽待揭示的 NFT 並在截止前自動幫用戶揭示
 */

const ethers = require('ethers');
require('dotenv').config();

// 配置
const CONFIG = {
    RPC_URL: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/',
    PRIVATE_KEY: process.env.AUTO_REVEAL_PRIVATE_KEY,
    HERO_ADDRESS: process.env.HERO_CONTRACT_ADDRESS,
    RELIC_ADDRESS: process.env.RELIC_CONTRACT_ADDRESS,
    
    // 時間設定
    CHECK_INTERVAL: 15000,      // 15 秒檢查一次
    AUTO_REVEAL_BLOCKS: 40,     // 最後 40 個區塊（30秒）觸發
    MAX_GAS_PRICE: '10',        // 最高 gas price (gwei)
    
    // 功能開關
    DRY_RUN: false,            // 測試模式，不實際發送交易
};

// ABI（只包含需要的函數）
const CONTRACT_ABI = [
    'event MintCommitted(address indexed player, uint256 quantity, uint256 blockNumber, bool fromVault)',
    'event RevealedByProxy(address indexed user, address indexed proxy)',
    'function userCommitments(address) view returns (uint256 blockNumber, uint256 quantity, uint256 payment, bytes32 commitment, bool fulfilled, uint8 maxRarity, bool fromVault)',
    'function revealMintFor(address user)',
    'function canReveal(address user) view returns (bool)'
];

class AutoRevealService {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);
        this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
        
        // 合約實例
        this.heroContract = new ethers.Contract(CONFIG.HERO_ADDRESS, CONTRACT_ABI, this.wallet);
        this.relicContract = new ethers.Contract(CONFIG.RELIC_ADDRESS, CONTRACT_ABI, this.wallet);
        
        // 待揭示追蹤
        this.pendingReveals = new Map(); // user => { contract, blockNumber, deadline }
        
        console.log('🤖 自動揭示服務啟動');
        console.log(`📍 錢包地址: ${this.wallet.address}`);
        console.log(`⏰ 檢查間隔: ${CONFIG.CHECK_INTERVAL / 1000} 秒`);
        console.log(`🎯 觸發時機: 最後 ${CONFIG.AUTO_REVEAL_BLOCKS} 區塊`);
    }

    async start() {
        // 初始化：掃描現有待揭示
        await this.scanExistingCommitments();
        
        // 監聽新的承諾
        this.listenToCommitments();
        
        // 定時檢查並執行揭示
        this.startAutoRevealLoop();
        
        console.log('✅ 服務已啟動，開始監控...\n');
    }

    // 掃描現有的待揭示承諾
    async scanExistingCommitments() {
        console.log('🔍 掃描現有待揭示承諾...');
        
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = currentBlock - 1000; // 掃描最近 1000 個區塊
        
        // 掃描 Hero 合約
        const heroEvents = await this.heroContract.queryFilter(
            'MintCommitted',
            fromBlock,
            currentBlock
        );
        
        // 掃描 Relic 合約
        const relicEvents = await this.relicContract.queryFilter(
            'MintCommitted',
            fromBlock,
            currentBlock
        );
        
        // 處理事件
        for (const event of [...heroEvents, ...relicEvents]) {
            await this.handleCommitEvent(event, event.address === CONFIG.HERO_ADDRESS ? 'hero' : 'relic');
        }
        
        console.log(`📊 找到 ${this.pendingReveals.size} 個待揭示承諾\n`);
    }

    // 監聽新的承諾事件
    listenToCommitments() {
        // 監聽 Hero
        this.heroContract.on('MintCommitted', (player, quantity, blockNumber, fromVault, event) => {
            console.log(`🎯 新的 Hero 承諾: ${player}`);
            this.handleCommitEvent(event, 'hero');
        });
        
        // 監聽 Relic
        this.relicContract.on('MintCommitted', (player, quantity, blockNumber, fromVault, event) => {
            console.log(`🎯 新的 Relic 承諾: ${player}`);
            this.handleCommitEvent(event, 'relic');
        });
        
        // 監聽代理揭示事件（用於清理）
        this.heroContract.on('RevealedByProxy', (user, proxy) => {
            if (proxy === this.wallet.address) {
                console.log(`✅ 成功代理揭示 Hero: ${user}`);
            }
            this.pendingReveals.delete(user);
        });
        
        this.relicContract.on('RevealedByProxy', (user, proxy) => {
            if (proxy === this.wallet.address) {
                console.log(`✅ 成功代理揭示 Relic: ${user}`);
            }
            this.pendingReveals.delete(user);
        });
    }

    // 處理承諾事件
    async handleCommitEvent(event, contractType) {
        const user = event.args.player;
        const blockNumber = event.args.blockNumber.toNumber();
        const deadline = blockNumber + 3 + 255; // 258 區塊
        
        // 檢查是否已揭示
        const contract = contractType === 'hero' ? this.heroContract : this.relicContract;
        const commitment = await contract.userCommitments(user);
        
        if (!commitment.fulfilled) {
            this.pendingReveals.set(user, {
                contract: contractType,
                blockNumber,
                deadline,
                quantity: event.args.quantity.toNumber()
            });
            
            console.log(`📝 記錄待揭示: ${user} (${contractType}), 截止區塊: ${deadline}`);
        }
    }

    // 主循環：檢查並執行自動揭示
    startAutoRevealLoop() {
        setInterval(async () => {
            try {
                await this.checkAndReveal();
            } catch (error) {
                console.error('❌ 檢查循環錯誤:', error.message);
            }
        }, CONFIG.CHECK_INTERVAL);
    }

    // 檢查並執行揭示
    async checkAndReveal() {
        const currentBlock = await this.provider.getBlockNumber();
        const gasPrice = await this.provider.getGasPrice();
        
        // 檢查 gas price
        if (gasPrice.gt(ethers.utils.parseUnits(CONFIG.MAX_GAS_PRICE, 'gwei'))) {
            console.log('⚠️ Gas price 過高，暫停自動揭示');
            return;
        }
        
        for (const [user, data] of this.pendingReveals) {
            const blocksRemaining = data.deadline - currentBlock;
            
            // 在最後 N 個區塊內觸發
            if (blocksRemaining > 0 && blocksRemaining <= CONFIG.AUTO_REVEAL_BLOCKS) {
                console.log(`⏰ 即將到期: ${user}, 剩餘 ${blocksRemaining} 區塊`);
                
                try {
                    const contract = data.contract === 'hero' ? this.heroContract : this.relicContract;
                    
                    // 再次確認可以揭示
                    const canReveal = await contract.canReveal(user);
                    if (!canReveal) {
                        console.log(`⚠️ ${user} 無法揭示（可能已完成）`);
                        this.pendingReveals.delete(user);
                        continue;
                    }
                    
                    if (CONFIG.DRY_RUN) {
                        console.log(`🧪 測試模式: 將為 ${user} 執行揭示`);
                    } else {
                        // 執行揭示
                        console.log(`🚀 執行自動揭示: ${user}`);
                        const tx = await contract.revealMintFor(user, {
                            gasPrice: gasPrice.mul(110).div(100), // 加 10% 確保快速確認
                            gasLimit: 300000
                        });
                        
                        console.log(`📤 交易已發送: ${tx.hash}`);
                        
                        // 等待確認
                        const receipt = await tx.wait();
                        console.log(`✅ 交易確認: ${receipt.transactionHash}`);
                    }
                    
                    // 從待處理列表移除
                    this.pendingReveals.delete(user);
                    
                } catch (error) {
                    console.error(`❌ 揭示失敗 ${user}:`, error.message);
                    
                    // 如果是已揭示錯誤，移除
                    if (error.message.includes('Already revealed')) {
                        this.pendingReveals.delete(user);
                    }
                }
            }
            
            // 清理過期的
            if (blocksRemaining < -10) {
                console.log(`🗑️ 清理過期記錄: ${user}`);
                this.pendingReveals.delete(user);
            }
        }
        
        // 狀態報告
        if (this.pendingReveals.size > 0 && currentBlock % 40 === 0) {
            console.log(`\n📊 狀態報告 - 區塊 ${currentBlock}`);
            console.log(`待揭示數量: ${this.pendingReveals.size}`);
            console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei\n`);
        }
    }
}

// 錯誤處理
process.on('unhandledRejection', (error) => {
    console.error('❌ 未處理的錯誤:', error);
});

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n👋 正在關閉服務...');
    process.exit(0);
});

// 啟動服務
async function main() {
    // 檢查配置
    if (!CONFIG.PRIVATE_KEY) {
        console.error('❌ 錯誤: 請設置 AUTO_REVEAL_PRIVATE_KEY 環境變數');
        process.exit(1);
    }
    
    if (!CONFIG.HERO_ADDRESS || !CONFIG.RELIC_ADDRESS) {
        console.error('❌ 錯誤: 請設置合約地址環境變數');
        process.exit(1);
    }
    
    // 啟動服務
    const service = new AutoRevealService();
    await service.start();
}

// 執行
main().catch((error) => {
    console.error('❌ 啟動失敗:', error);
    process.exit(1);
});

/**
 * 使用說明：
 * 
 * 1. 設置環境變數 (.env 文件):
 *    AUTO_REVEAL_PRIVATE_KEY=0x...
 *    HERO_CONTRACT_ADDRESS=0x...
 *    RELIC_CONTRACT_ADDRESS=0x...
 *    BSC_RPC_URL=https://bsc-dataseed1.binance.org/
 * 
 * 2. 安裝依賴:
 *    npm install ethers dotenv
 * 
 * 3. 啟動服務:
 *    node auto-reveal-service.js
 * 
 * 4. 使用 PM2 管理 (推薦):
 *    pm2 start auto-reveal-service.js --name "auto-reveal"
 *    pm2 logs auto-reveal
 *    pm2 save
 *    pm2 startup
 */