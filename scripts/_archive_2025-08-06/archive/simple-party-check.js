const { ethers } = require('hardhat');

async function checkPartyContract() {
    console.log('🔍 檢查 Party 合約狀態\n');
    
    const PARTY_ADDRESS = '0x847DceaE26aF1CFc09beC195CE87a9b5701863A7';
    const startBlock = 54670894;
    
    try {
        // 檢查合約是否存在
        const code = await ethers.provider.getCode(PARTY_ADDRESS);
        if (code === '0x') {
            console.log('❌ Party 合約不存在於地址:', PARTY_ADDRESS);
            return;
        }
        console.log('✅ Party 合約已部署');
        
        // 獲取當前區塊
        const currentBlock = await ethers.provider.getBlockNumber();
        console.log(`📦 當前區塊: ${currentBlock.toLocaleString()}`);
        console.log(`📦 起始區塊: ${startBlock.toLocaleString()}`);
        
        // 查詢 PartyCreated 事件（使用事件 hash）
        const eventTopic = ethers.id('PartyCreated(uint256,address,uint256[],uint256[],uint256,uint256,uint8)');
        console.log('📜 事件簽名:', eventTopic);
        
        const logs = await ethers.provider.getLogs({
            address: PARTY_ADDRESS,
            topics: [eventTopic],
            fromBlock: startBlock,
            toBlock: currentBlock
        });
        
        console.log(`\n找到 ${logs.length} 個 PartyCreated 事件`);
        
        if (logs.length > 0) {
            console.log('\n📝 最近的事件:');
            logs.forEach((log, index) => {
                console.log(`事件 ${index + 1}:`);
                console.log(`  區塊: ${log.blockNumber}`);
                console.log(`  交易: ${log.transactionHash}`);
                console.log(`  Topics: ${log.topics.length} 個`);
                console.log(`  Data 長度: ${log.data.length}`);
            });
        }
        
        // 檢查是否有任何事件
        const allLogs = await ethers.provider.getLogs({
            address: PARTY_ADDRESS,
            fromBlock: startBlock,
            toBlock: currentBlock
        });
        
        console.log(`\n📊 總共找到 ${allLogs.length} 個事件（所有類型）`);
        
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