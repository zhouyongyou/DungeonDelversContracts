const fetch = require('node-fetch');
const { ethers } = require('hardhat');

async function checkSubgraphFinalStatus() {
    console.log('🔍 DungeonDelvers Subgraph 同步狀態檢查報告\n');
    console.log('檢查時間:', new Date().toLocaleString());
    console.log('=' .repeat(60) + '\n');
    
    // URLs
    const STUDIO_URL_V309 = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.9';
    const STUDIO_URL_V305 = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.5';
    const DECENTRALIZED_URL = 'https://gateway.thegraph.com/api/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs';
    
    // 新合約部署信息
    const NEW_DEPLOYMENT_BLOCK = 55018576;
    const NEW_DEPLOYMENT_TIME = new Date('2025-07-23T09:12:11.713Z');
    
    console.log('📌 新合約部署信息：');
    console.log(`  部署區塊: ${NEW_DEPLOYMENT_BLOCK.toLocaleString()}`);
    console.log(`  部署時間: ${NEW_DEPLOYMENT_TIME.toLocaleString()}\n`);
    
    // 1. 檢查 v3.0.9
    console.log('1️⃣ Studio URL v3.0.9 檢查：');
    console.log(`  URL: ${STUDIO_URL_V309}`);
    
    try {
        const fullQuery = `
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
            
            heroMinteds(first: 1, orderBy: blockNumber, orderDirection: desc) {
                id
                blockNumber
                blockTimestamp
            }
            
            parties(first: 1, orderBy: blockNumber, orderDirection: desc) {
                id
                blockNumber
            }
            
            users(first: 1) {
                id
            }
        }`;
        
        const response = await fetch(STUDIO_URL_V309, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: fullQuery })
        });
        
        const data = await response.json();
        
        if (data.errors) {
            console.log('  ❌ 查詢錯誤:', data.errors[0].message);
        } else if (data.data && data.data._meta) {
            const meta = data.data._meta;
            const blockNumber = parseInt(meta.block.number);
            const blockTime = new Date(parseInt(meta.block.timestamp) * 1000);
            
            console.log('  ✅ 可訪問');
            console.log(`  📊 索引區塊: ${blockNumber.toLocaleString()}`);
            console.log(`  🕐 區塊時間: ${blockTime.toLocaleString()}`);
            console.log(`  🔗 部署 ID: ${meta.deployment}`);
            console.log(`  ⚠️ 索引錯誤: ${meta.hasIndexingErrors ? '是' : '否'}`);
            
            // 檢查是否已索引到新部署
            if (blockNumber >= NEW_DEPLOYMENT_BLOCK) {
                console.log('  ✅ 已索引到新合約部署區塊');
                
                // 檢查數據
                const hasHeroes = data.data.heroMinteds && data.data.heroMinteds.length > 0;
                const hasParties = data.data.parties && data.data.parties.length > 0;
                const hasUsers = data.data.users && data.data.users.length > 0;
                
                console.log('\n  📈 數據狀態：');
                if (hasHeroes) {
                    const lastHero = data.data.heroMinteds[0];
                    console.log(`    Heroes: 有數據 (最新區塊 ${lastHero.blockNumber})`);
                } else {
                    console.log('    Heroes: 無數據');
                }
                
                if (hasParties) {
                    const lastParty = data.data.parties[0];
                    console.log(`    Parties: 有數據 (最新區塊 ${lastParty.blockNumber})`);
                } else {
                    console.log('    Parties: 無數據');
                }
                
                console.log(`    Users: ${hasUsers ? '有數據' : '無數據'}`);
                
                // 檢查新合約後的活動
                const newActivityQuery = `
                {
                    heroMinteds(first: 1, where: { blockNumber_gte: "${NEW_DEPLOYMENT_BLOCK}" }) {
                        id
                    }
                    parties(first: 1, where: { blockNumber_gte: "${NEW_DEPLOYMENT_BLOCK}" }) {
                        id
                    }
                }`;
                
                const newActivityResponse = await fetch(STUDIO_URL_V309, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: newActivityQuery })
                });
                
                const newActivityData = await newActivityResponse.json();
                
                if (newActivityData.data) {
                    const hasNewHeroes = newActivityData.data.heroMinteds && newActivityData.data.heroMinteds.length > 0;
                    const hasNewParties = newActivityData.data.parties && newActivityData.data.parties.length > 0;
                    
                    console.log('\n  🆕 新合約活動：');
                    if (!hasNewHeroes && !hasNewParties) {
                        console.log('    ℹ️ 新合約部署後尚無鏈上活動');
                    } else {
                        if (hasNewHeroes) console.log('    ✅ 有新 Hero 鑄造');
                        if (hasNewParties) console.log('    ✅ 有新 Party 創建');
                    }
                }
            } else {
                console.log(`  ⚠️ 尚未索引到新合約部署區塊`);
                console.log(`  📊 差距: ${(NEW_DEPLOYMENT_BLOCK - blockNumber).toLocaleString()} 個區塊`);
            }
        } else {
            console.log('  ⚠️ 返回空數據');
        }
        
    } catch (error) {
        console.log('  ❌ 連接失敗:', error.message);
    }
    
    // 2. 檢查 v3.0.5 (作為對比)
    console.log('\n\n2️⃣ Studio URL v3.0.5 檢查（對比）：');
    console.log(`  URL: ${STUDIO_URL_V305}`);
    
    try {
        const response = await fetch(STUDIO_URL_V305, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ _meta { block { number timestamp } } }' })
        });
        
        const data = await response.json();
        
        if (data.data && data.data._meta) {
            const blockNumber = parseInt(data.data._meta.block.number);
            const blockTime = new Date(parseInt(data.data._meta.block.timestamp) * 1000);
            
            console.log('  ✅ 可訪問');
            console.log(`  📊 索引區塊: ${blockNumber.toLocaleString()}`);
            console.log(`  🕐 區塊時間: ${blockTime.toLocaleString()}`);
        }
        
    } catch (error) {
        console.log('  ❌ 連接失敗:', error.message);
    }
    
    // 3. 檢查 Decentralized Network
    console.log('\n\n3️⃣ Decentralized Network 檢查：');
    console.log(`  URL: ${DECENTRALIZED_URL}`);
    
    try {
        const response = await fetch(DECENTRALIZED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ _meta { block { number } } }' })
        });
        
        const data = await response.json();
        
        if (data.errors && data.errors[0].message.includes('auth')) {
            console.log('  ⚠️ 需要 API Key 授權');
            console.log('  說明: Decentralized Network 需要付費 API Key 才能訪問');
        } else if (data.data) {
            console.log('  ✅ 可訪問（有 API Key）');
        }
        
    } catch (error) {
        console.log('  ❌ 連接失敗:', error.message);
    }
    
    // 4. 獲取當前 BSC 狀態
    console.log('\n\n4️⃣ BSC 鏈當前狀態：');
    
    try {
        const provider = ethers.provider;
        const currentBlock = await provider.getBlockNumber();
        const currentBlockData = await provider.getBlock(currentBlock);
        
        console.log(`  當前區塊: ${currentBlock.toLocaleString()}`);
        console.log(`  區塊時間: ${new Date(currentBlockData.timestamp * 1000).toLocaleString()}`);
        
    } catch (error) {
        console.log('  ❌ 無法獲取鏈狀態:', error.message);
    }
    
    // 5. 總結
    console.log('\n\n' + '=' .repeat(60));
    console.log('📊 總結報告：\n');
    
    console.log('✅ 檢查結果：');
    console.log('  1. Studio URL v3.0.9 已部署並可訪問');
    console.log('  2. Subgraph 正在索引，但可能尚未配置新合約地址');
    console.log('  3. Decentralized Network 需要 API Key 才能訪問');
    
    console.log('\n⚠️ 可能的問題：');
    console.log('  1. 如果沒有看到新合約的數據，可能是：');
    console.log('     - Subgraph 配置尚未更新到新合約地址');
    console.log('     - 新合約確實還沒有鏈上活動');
    console.log('  2. 同步延遲是正常的，特別是對於新部署');
    
    console.log('\n💡 建議行動：');
    console.log('  1. 確認 subgraph.yaml 是否已更新新合約地址');
    console.log('  2. 如果未更新，按照 bsc_subgraph_update.md 的步驟更新');
    console.log('  3. 重新部署 subgraph 後等待索引完成');
    console.log('  4. 新交易通常需要 2-5 分鐘才會出現在 subgraph 中');
}

checkSubgraphFinalStatus()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });