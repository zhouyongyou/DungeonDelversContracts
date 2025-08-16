const { ethers } = require('hardhat');

async function main() {
    const vrfManagerAddress = '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1';
    const heroAddress = '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d';
    const relicAddress = '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316';
    
    const vrfManagerAbi = [
        "event AuthorizationUpdated(address indexed contract_, bool authorized)"
    ];
    
    const provider = ethers.provider;
    const vrfManager = new ethers.Contract(vrfManagerAddress, vrfManagerAbi, provider);
    
    console.log('Checking VRF authorization events...\n');
    
    // 獲取最近的區塊
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 100; // 查看最近 100 個區塊
    
    // 查詢授權事件
    const filter = vrfManager.filters.AuthorizationUpdated();
    const events = await vrfManager.queryFilter(filter, fromBlock, currentBlock);
    
    console.log(`Found ${events.length} authorization events in recent blocks:\n`);
    
    for (const event of events) {
        const { contract_, authorized } = event.args;
        const blockNumber = event.blockNumber;
        const txHash = event.transactionHash;
        
        if (contract_.toLowerCase() === heroAddress.toLowerCase()) {
            console.log(`Hero Contract Authorization:`);
            console.log(`  Block: ${blockNumber}`);
            console.log(`  TX: ${txHash}`);
            console.log(`  Authorized: ${authorized}`);
            console.log('');
        }
        
        if (contract_.toLowerCase() === relicAddress.toLowerCase()) {
            console.log(`Relic Contract Authorization:`);
            console.log(`  Block: ${blockNumber}`);
            console.log(`  TX: ${txHash}`);
            console.log(`  Authorized: ${authorized}`);
            console.log('');
        }
    }
    
    console.log('\n📋 Summary:');
    console.log('Hero contract:', heroAddress);
    console.log('Relic contract:', relicAddress);
    console.log('VRF Manager:', vrfManagerAddress);
    console.log('\nBoth contracts should now be authorized for VRF operations.');
}

main().catch(console.error);