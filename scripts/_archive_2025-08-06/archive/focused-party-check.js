const { ethers } = require('hardhat');

async function checkPartyContract() {
    console.log('🔍 檢查 Party 合約狀態\n');
    
    const PARTY_ADDRESS = '0x847DceaE26aF1CFc09beC195CE87a9b5701863A7';
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`📦 當前區塊: ${currentBlock.toLocaleString()}`);
    
    // 檢查最近 1000 個區塊
    const fromBlock = currentBlock - 1000;
    console.log(`📦 查詢範圍: ${fromBlock.toLocaleString()} - ${currentBlock.toLocaleString()}`);
    
    try {
        // 查詢 PartyCreated 事件
        const eventTopic = ethers.id('PartyCreated(uint256,address,uint256[],uint256[],uint256,uint256,uint8)');
        console.log('📜 事件簽名:', eventTopic);
        
        const logs = await ethers.provider.getLogs({
            address: PARTY_ADDRESS,
            topics: [eventTopic],
            fromBlock: fromBlock,
            toBlock: currentBlock
        });
        
        console.log(`\n找到 ${logs.length} 個 PartyCreated 事件`);
        
        if (logs.length > 0) {
            console.log('\n📝 事件詳情:');
            logs.forEach((log, index) => {
                console.log(`事件 ${index + 1}:`);
                console.log(`  區塊: ${log.blockNumber}`);
                console.log(`  交易: ${log.transactionHash}`);
                console.log(`  Topics: ${log.topics.join(', ')}`);
                console.log(`  Data: ${log.data}`);
                console.log('');
            });
        } else {
            console.log('❌ 在最近 1000 個區塊中沒有找到 PartyCreated 事件');
            
            // 檢查是否有其他事件
            const allLogs = await ethers.provider.getLogs({
                address: PARTY_ADDRESS,
                fromBlock: fromBlock,
                toBlock: currentBlock
            });
            
            console.log(`\n📊 但找到了 ${allLogs.length} 個其他事件`);
            
            if (allLogs.length > 0) {
                console.log('\n📝 其他事件:');
                allLogs.slice(0, 5).forEach((log, index) => {
                    console.log(`事件 ${index + 1}: ${log.topics[0]}`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ 檢查失敗:', error.message);
    }
}

checkPartyContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });