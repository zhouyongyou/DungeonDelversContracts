const fetch = require('node-fetch');

async function checkSubgraphDetails() {
    console.log('🔍 檢查 DungeonDelvers Subgraph v3.0.9 詳細狀態\n');
    
    const STUDIO_URL = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.9';
    
    // 1. 檢查基本連接
    try {
        const testResponse = await fetch(STUDIO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                query: '{ _meta { block { number } } }' 
            })
        });
        
        const testData = await testResponse.json();
        
        console.log('響應狀態:', testResponse.status);
        console.log('響應數據:', JSON.stringify(testData, null, 2));
        
        if (testData.errors) {
            console.log('❌ Studio URL 錯誤:', testData.errors);
            console.log('\n可能原因：');
            console.log('1. Subgraph v3.0.9 尚未部署');
            console.log('2. Subgraph 正在索引中');
            console.log('3. URL 版本號錯誤');
            return;
        }
        
        if (!testData.data || !testData.data._meta) {
            console.log('⚠️ Subgraph 返回空數據');
            console.log('\n可能原因：');
            console.log('1. Subgraph v3.0.9 正在部署中');
            console.log('2. Subgraph 尚未開始索引');
            console.log('3. Subgraph 配置有誤');
            
            // 嘗試檢查其他版本
            console.log('\n檢查其他已知版本...');
            const versions = ['v3.0.8', 'v3.0.7', 'v3.0.6', 'v3.0.5', 'v3.0.4'];
            for (const version of versions) {
                const versionUrl = `https://api.studio.thegraph.com/query/115633/dungeon-delvers/${version}`;
                try {
                    const vResponse = await fetch(versionUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: '{ _meta { block { number } } }' })
                    });
                    const vData = await vResponse.json();
                    if (vData.data && vData.data._meta) {
                        console.log(`✅ ${version} 有數據 - 區塊高度: ${vData.data._meta.block.number}`);
                    } else {
                        console.log(`❌ ${version} 無數據`);
                    }
                } catch (e) {
                    console.log(`❌ ${version} 連接失敗`);
                }
            }
            
            return;
        }
        
        console.log('✅ Studio URL 可訪問 - 區塊高度:', testData.data._meta.block.number, '\n');
        
        // 2. 獲取詳細 meta 信息
        const metaQuery = `
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
            
            # 檢查各個實體的數量
            heroes(first: 1) {
                id
            }
            relics(first: 1) {
                id
            }
            parties(first: 1) {
                id
            }
            users(first: 1) {
                id
            }
        }`;
        
        const metaResponse = await fetch(STUDIO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: metaQuery })
        });
        
        const metaData = await metaResponse.json();
        
        if (metaData.data && metaData.data._meta) {
            const meta = metaData.data._meta;
            const blockNumber = parseInt(meta.block.number);
            const blockTime = new Date(parseInt(meta.block.timestamp) * 1000);
            
            console.log('📊 Subgraph 狀態：');
            console.log(`  索引到區塊: ${blockNumber.toLocaleString()}`);
            console.log(`  區塊時間: ${blockTime.toLocaleString()}`);
            console.log(`  部署 ID: ${meta.deployment}`);
            console.log(`  索引錯誤: ${meta.hasIndexingErrors ? '❌ 有錯誤' : '✅ 無錯誤'}`);
            
            // 檢查是否有數據
            console.log('\n📈 數據統計：');
            console.log(`  Heroes: ${metaData.data.heroes.length > 0 ? '有數據' : '無數據'}`);
            console.log(`  Relics: ${metaData.data.relics.length > 0 ? '有數據' : '無數據'}`);
            console.log(`  Parties: ${metaData.data.parties.length > 0 ? '有數據' : '無數據'}`);
            console.log(`  Users: ${metaData.data.users.length > 0 ? '有數據' : '無數據'}`);
            
            // 檢查最新部署區塊
            const DEPLOYMENT_BLOCK = 55018576; // 從 bsc_subgraph_update.md
            const DEPLOYMENT_TIME = new Date('2025-07-23T09:12:11.713Z');
            
            console.log('\n🚀 部署信息：');
            console.log(`  合約部署區塊: ${DEPLOYMENT_BLOCK.toLocaleString()}`);
            console.log(`  合約部署時間: ${DEPLOYMENT_TIME.toLocaleString()}`);
            
            if (blockNumber < DEPLOYMENT_BLOCK) {
                console.log('\n⚠️ 警告：Subgraph 尚未索引到新合約部署的區塊！');
                console.log(`  需要索引的區塊數: ${(DEPLOYMENT_BLOCK - blockNumber).toLocaleString()}`);
                
                const blocksPerHour = 1200; // BSC 約 3 秒一個區塊
                const hoursNeeded = (DEPLOYMENT_BLOCK - blockNumber) / blocksPerHour;
                console.log(`  預計需要時間: ${hoursNeeded.toFixed(1)} 小時`);
            } else {
                console.log('\n✅ Subgraph 已索引到新合約部署後的區塊');
                
                // 檢查是否有新合約的事件
                const eventQuery = `
                {
                    heroMinteds(first: 1, where: { blockNumber_gte: "${DEPLOYMENT_BLOCK}" }) {
                        id
                        blockNumber
                    }
                    partyCreateds: parties(first: 1, where: { blockNumber_gte: "${DEPLOYMENT_BLOCK}" }) {
                        id
                        blockNumber
                    }
                }`;
                
                const eventResponse = await fetch(STUDIO_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: eventQuery })
                });
                
                const eventData = await eventResponse.json();
                
                if (eventData.data) {
                    console.log('\n🎮 新合約活動：');
                    const hasNewHeroes = eventData.data.heroMinteds && eventData.data.heroMinteds.length > 0;
                    const hasNewParties = eventData.data.partyCreateds && eventData.data.partyCreateds.length > 0;
                    
                    if (!hasNewHeroes && !hasNewParties) {
                        console.log('  ℹ️ 新合約部署後尚無鏈上活動');
                        console.log('  這是正常的，等待用戶開始使用新合約');
                    } else {
                        if (hasNewHeroes) {
                            console.log(`  ✅ 發現新 Hero 鑄造事件`);
                        }
                        if (hasNewParties) {
                            console.log(`  ✅ 發現新 Party 創建事件`);
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error.message);
        console.log('\n調試信息：');
        console.log('錯誤類型:', error.name);
        console.log('錯誤詳情:', error);
    }
    
    // 3. 檢查 Decentralized Network
    console.log('\n\n🌐 檢查 Decentralized Network...');
    const DECENTRALIZED_URL = 'https://gateway.thegraph.com/api/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs';
    
    try {
        const decResponse = await fetch(DECENTRALIZED_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                query: '{ _meta { block { number } } }' 
            })
        });
        
        const decData = await decResponse.json();
        
        if (decData.errors) {
            console.log('⚠️ Decentralized Network 需要 API Key');
            console.log('錯誤:', decData.errors[0].message);
        } else if (decData.data) {
            console.log('✅ Decentralized Network 可訪問（如果有 API Key）');
        }
        
    } catch (error) {
        console.log('❌ Decentralized Network 連接失敗:', error.message);
    }
    
    console.log('\n\n📋 總結：');
    console.log('1. Studio URL (v3.0.9) 狀態已檢查');
    console.log('2. 如果顯示"無數據"，可能是因為：');
    console.log('   - Subgraph 配置尚未更新到新合約地址');
    console.log('   - 新合約尚無鏈上活動');
    console.log('   - Subgraph 正在重新索引中');
    console.log('3. Decentralized Network 需要 API Key 才能訪問');
}

checkSubgraphDetails()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });