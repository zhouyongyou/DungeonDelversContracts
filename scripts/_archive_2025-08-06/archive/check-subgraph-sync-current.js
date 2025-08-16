const fetch = require('node-fetch');
const { ethers } = require('hardhat');

async function checkSubgraphSync() {
    console.log('🔍 檢查 DungeonDelvers 子圖同步狀態\n');
    
    // The Graph 查詢 URL
    const GRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.9';
    
    // 查詢子圖的 meta 信息
    const query = `
    {
        _meta {
            block {
                number
                hash
                timestamp
            }
            deployment
            hasIndexingErrors
        }
    }`;
    
    try {
        // 1. 檢查子圖狀態
        const response = await fetch(GRAPH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (data.errors) {
            console.error('❌ 子圖查詢錯誤:', data.errors);
            return;
        }
        
        const meta = data.data._meta;
        const subgraphBlock = parseInt(meta.block.number);
        const subgraphTimestamp = parseInt(meta.block.timestamp);
        
        console.log('📊 子圖狀態:');
        console.log(`  區塊高度: ${subgraphBlock.toLocaleString()}`);
        console.log(`  區塊哈希: ${meta.block.hash}`);
        console.log(`  區塊時間: ${new Date(subgraphTimestamp * 1000).toLocaleString()}`);
        console.log(`  部署 ID: ${meta.deployment}`);
        console.log(`  索引錯誤: ${meta.hasIndexingErrors ? '❌ 有錯誤' : '✅ 無錯誤'}`);
        
        // 2. 獲取 BSC 當前區塊
        const provider = ethers.provider;
        const currentBlock = await provider.getBlockNumber();
        const currentBlockData = await provider.getBlock(currentBlock);
        
        console.log('\n🔗 BSC 鏈狀態:');
        console.log(`  當前區塊: ${currentBlock.toLocaleString()}`);
        console.log(`  區塊時間: ${new Date(currentBlockData.timestamp * 1000).toLocaleString()}`);
        
        // 3. 計算延遲
        const blocksBehind = currentBlock - subgraphBlock;
        const timeBehind = currentBlockData.timestamp - subgraphTimestamp;
        const avgBlockTime = 3; // BSC 平均 3 秒一個區塊
        
        console.log('\n⏱️ 同步延遲:');
        console.log(`  落後區塊: ${blocksBehind.toLocaleString()} 個`);
        console.log(`  時間延遲: ${Math.floor(timeBehind / 60)} 分 ${timeBehind % 60} 秒`);
        console.log(`  預估延遲: ${(blocksBehind * avgBlockTime / 60).toFixed(1)} 分鐘`);
        
        // 4. 同步速度分析
        if (blocksBehind < 10) {
            console.log('\n✅ 子圖幾乎完全同步！新交易將在 1-2 分鐘內顯示。');
        } else if (blocksBehind < 100) {
            console.log('\n⚡ 子圖輕微延遲，新交易可能需要 3-5 分鐘才能顯示。');
        } else if (blocksBehind < 1000) {
            console.log('\n⏳ 子圖有一定延遲，新交易可能需要 10-30 分鐘才能顯示。');
        } else {
            console.log('\n⚠️ 子圖延遲較大，新交易可能需要 1 小時以上才能顯示。');
        }
        
        // 5. 查詢最近的交易
        const recentQuery = `
        {
            partyCreateds(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
                id
                blockNumber
                blockTimestamp
                transactionHash
            }
            heroMinteds(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
                id
                blockNumber
                blockTimestamp
                transactionHash
            }
        }`;
        
        const recentResponse = await fetch(GRAPH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: recentQuery })
        });
        
        const recentData = await recentResponse.json();
        
        if (recentData.data) {
            console.log('\n📝 最近的活動:');
            
            if (recentData.data.partyCreateds && recentData.data.partyCreateds.length > 0) {
                const lastParty = recentData.data.partyCreateds[0];
                const partyTime = new Date(parseInt(lastParty.blockTimestamp) * 1000);
                console.log(`  最後組隊: ${partyTime.toLocaleString()} (區塊 ${lastParty.blockNumber})`);
            }
            
            if (recentData.data.heroMinteds && recentData.data.heroMinteds.length > 0) {
                const lastHero = recentData.data.heroMinteds[0];
                const heroTime = new Date(parseInt(lastHero.blockTimestamp) * 1000);
                console.log(`  最後鑄造: ${heroTime.toLocaleString()} (區塊 ${lastHero.blockNumber})`);
            }
        }
        
        console.log('\n💡 建議:');
        console.log('  - 新鑄造的 NFT 通常需要 2-5 分鐘才會出現在子圖中');
        console.log('  - 組隊後需要等待 3-5 分鐘才會顯示新隊伍');
        console.log('  - 如果長時間未看到更新，請手動刷新頁面');
        console.log('  - 高峰期可能會有額外的延遲');
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error.message);
    }
}

checkSubgraphSync()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });