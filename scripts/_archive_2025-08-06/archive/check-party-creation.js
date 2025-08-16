const { ethers } = require('hardhat');

async function checkPartyCreation() {
    console.log('🔍 檢查 Party 合約創建事件\n');
    
    const PARTY_ADDRESS = '0x847DceaE26aF1CFc09beC195CE87a9b5701863A7';
    const startBlock = 54670894; // V12 部署區塊
    
    try {
        // 獲取 Party 合約
        const partyContract = await ethers.getContractAt([
            'event PartyCreated(uint256 indexed tokenId, address indexed owner, uint256[] heroIds, uint256[] relicIds, uint256 totalPower, uint256 totalCapacity, uint8 partyRarity)',
            'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
            'function totalSupply() external view returns (uint256)'
        ], PARTY_ADDRESS);
        
        // 檢查總供應量
        const totalSupply = await partyContract.totalSupply();
        console.log(`📊 Party 總供應量: ${totalSupply}\n`);
        
        // 獲取當前區塊
        const currentBlock = await ethers.provider.getBlockNumber();
        console.log(`📦 當前區塊: ${currentBlock.toLocaleString()}`);
        console.log(`📦 起始區塊: ${startBlock.toLocaleString()}`);
        console.log(`📦 區塊範圍: ${(currentBlock - startBlock).toLocaleString()} 個區塊\n`);
        
        // 查詢 PartyCreated 事件
        console.log('📜 查詢 PartyCreated 事件...');
        const filter = partyContract.filters.PartyCreated();
        const events = await partyContract.queryFilter(filter, startBlock, currentBlock);
        
        console.log(`找到 ${events.length} 個 Party 創建事件\n`);
        
        if (events.length > 0) {
            console.log('📝 最近的 Party 創建事件:');
            console.log('─'.repeat(60));
            
            // 顯示最多 5 個最近的事件
            const recentEvents = events.slice(-5);
            for (const event of recentEvents) {
                console.log(`\nParty #${event.args.tokenId}:`);
                console.log(`  擁有者: ${event.args.owner}`);
                console.log(`  英雄 IDs: [${event.args.heroIds.join(', ')}]`);
                console.log(`  聖物 IDs: [${event.args.relicIds.join(', ')}]`);
                console.log(`  總戰力: ${event.args.totalPower}`);
                console.log(`  總容量: ${event.args.totalCapacity}`);
                console.log(`  稀有度: ${event.args.partyRarity}`);
                console.log(`  區塊: ${event.blockNumber}`);
                console.log(`  交易: ${event.transactionHash}`);
            }
        }
        
        // 檢查 Transfer 事件（可能有組隊）
        console.log('\n\n📜 查詢 Transfer 事件...');
        const transferFilter = partyContract.filters.Transfer(ethers.ZeroAddress); // 從 0x0 轉移 = 鑄造
        const transferEvents = await partyContract.queryFilter(transferFilter, startBlock, currentBlock);
        
        console.log(`找到 ${transferEvents.length} 個 Party 鑄造（Transfer）事件`);
        
        if (transferEvents.length > 0 && events.length === 0) {
            console.log('\n⚠️  發現 Transfer 事件但沒有 PartyCreated 事件！');
            console.log('這可能表示事件發射有問題');
        }
        
        // 結論
        console.log('\n\n💡 結論:');
        if (totalSupply > 0 && events.length === 0) {
            console.log('❌ Party 已被鑄造但沒有 PartyCreated 事件');
            console.log('   可能的原因：');
            console.log('   1. 合約沒有正確發射 PartyCreated 事件');
            console.log('   2. 事件簽名不匹配');
        } else if (totalSupply === 0n) {
            console.log('✅ 還沒有任何 Party 被創建');
            console.log('   這解釋了為什麼子圖顯示 0 個 Party');
        } else {
            console.log('✅ Party 創建正常，子圖應該能夠索引');
        }
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error.message);
    }
}

checkPartyCreation()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });