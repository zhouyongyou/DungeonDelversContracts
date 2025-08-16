const fetch = require('node-fetch');

async function checkNFTSyncStatus() {
    console.log('🔍 檢查各類 NFT 在子圖中的同步狀態\n');
    
    const GRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.5';
    
    // 查詢各種 NFT 的總數和最新記錄
    const query = `
    {
        _meta {
            block {
                number
                timestamp
            }
        }
        
        heroStats: heros(first: 1, orderBy: createdAt, orderDirection: desc) {
            id
            tokenId
            createdAt
        }
        heroCount: heros(first: 1000) {
            id
        }
        
        relicStats: relics(first: 1, orderBy: createdAt, orderDirection: desc) {
            id
            tokenId
            createdAt
        }
        relicCount: relics(first: 1000) {
            id
        }
        
        partyStats: parties(first: 1, orderBy: createdAt, orderDirection: desc) {
            id
            tokenId
            createdAt
        }
        partyCount: parties(first: 1000) {
            id
        }
        
        # 查詢特定 ID
        hero1: hero(id: "1") {
            id
            owner {
                id
            }
            createdAt
        }
        
        relic1: relic(id: "1") {
            id
            owner {
                id
            }
            createdAt
        }
        
        party1: party(id: "1") {
            id
            owner {
                id
            }
            createdAt
        }
    }`;
    
    try {
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
        
        const result = data.data;
        const subgraphBlock = parseInt(result._meta.block.number);
        const subgraphTime = new Date(parseInt(result._meta.block.timestamp) * 1000);
        
        console.log('📊 子圖狀態:');
        console.log(`  同步區塊: ${subgraphBlock.toLocaleString()}`);
        console.log(`  區塊時間: ${subgraphTime.toLocaleString()}\n`);
        
        // 顯示各類 NFT 統計
        console.log('📈 NFT 同步統計:');
        console.log('─'.repeat(60));
        
        // Hero
        console.log('⚔️  英雄 (Hero):');
        console.log(`  總數: ${result.heroCount.length}`);
        if (result.heroStats.length > 0) {
            const latest = result.heroStats[0];
            console.log(`  最新: #${latest.tokenId}`);
            console.log(`  時間: ${new Date(parseInt(latest.createdAt) * 1000).toLocaleString()}`);
        }
        
        // Relic
        console.log('\n💎 聖物 (Relic):');
        console.log(`  總數: ${result.relicCount.length}`);
        if (result.relicStats.length > 0) {
            const latest = result.relicStats[0];
            console.log(`  最新: #${latest.tokenId}`);
            console.log(`  時間: ${new Date(parseInt(latest.createdAt) * 1000).toLocaleString()}`);
        }
        
        // Party
        console.log('\n👥 隊伍 (Party):');
        console.log(`  總數: ${result.partyCount.length}`);
        if (result.partyStats.length > 0) {
            const latest = result.partyStats[0];
            console.log(`  最新: #${latest.tokenId}`);
            console.log(`  時間: ${new Date(parseInt(latest.createdAt) * 1000).toLocaleString()}`);
        }
        
        // 檢查特定 ID
        console.log('\n🔍 特定 NFT 檢查 (#1):');
        console.log('─'.repeat(60));
        
        if (result.hero1) {
            console.log(`✅ Hero #1: 擁有者 ${result.hero1.owner.id}`);
            console.log(`   時間: ${new Date(parseInt(result.hero1.createdAt) * 1000).toLocaleString()}`);
        } else {
            console.log('❌ Hero #1: 未找到');
        }
        
        if (result.relic1) {
            console.log(`✅ Relic #1: 擁有者 ${result.relic1.owner.id}`);
            console.log(`   時間: ${new Date(parseInt(result.relic1.createdAt) * 1000).toLocaleString()}`);
        } else {
            console.log('❌ Relic #1: 未找到');
        }
        
        if (result.party1) {
            console.log(`✅ Party #1: 擁有者 ${result.party1.owner.id}`);
            console.log(`   時間: ${new Date(parseInt(result.party1.createdAt) * 1000).toLocaleString()}`);
        } else {
            console.log('❌ Party #1: 未找到');
        }
        
        console.log('\n💡 結論:');
        if (result.partyCount.length < result.heroCount.length / 10) {
            console.log('⚠️  Party 數量明顯少於預期，可能存在同步延遲');
        }
        if (!result.party1 && result.relic1) {
            console.log('⚠️  Party #1 未同步，但 Relic #1 已同步');
            console.log('   這表明 Party 事件處理可能較慢');
        }
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error.message);
    }
}

checkNFTSyncStatus()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });