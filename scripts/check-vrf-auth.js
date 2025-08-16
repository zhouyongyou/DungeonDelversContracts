const { ethers } = require('hardhat');

async function main() {
    const vrfManagerAddress = '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1';
    const heroAddress = '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d';
    const relicAddress = '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316';
    
    // 使用完整的 ABI
    const vrfManagerAbi = [
        "function owner() view returns (address)",
        "function authorizedContracts(address) view returns (bool)",
        "function setAuthorizedContract(address, bool)"
    ];
    
    const [signer] = await ethers.getSigners();
    console.log('Current signer:', signer.address);
    
    const vrfManager = await ethers.getContractAt(vrfManagerAbi, vrfManagerAddress);
    
    try {
        const owner = await vrfManager.owner();
        console.log('VRF Manager owner:', owner);
        
        // 嘗試檢查授權狀態
        try {
            const isHeroAuthorized = await vrfManager.authorizedContracts(heroAddress);
            console.log('Hero authorized:', isHeroAuthorized);
        } catch (e) {
            console.log('Error checking Hero authorization:', e.message);
        }
        
        try {
            const isRelicAuthorized = await vrfManager.authorizedContracts(relicAddress);
            console.log('Relic authorized:', isRelicAuthorized);
        } catch (e) {
            console.log('Error checking Relic authorization:', e.message);
        }
        
        // 如果是 owner，嘗試授權
        if (owner.toLowerCase() === signer.address.toLowerCase()) {
            console.log('\nYou are the owner. Attempting to authorize contracts...');
            
            try {
                console.log('Authorizing Hero contract...');
                const tx1 = await vrfManager.setAuthorizedContract(heroAddress, true);
                console.log('TX hash:', tx1.hash);
                await tx1.wait();
                console.log('Hero authorized!');
            } catch (e) {
                console.log('Error authorizing Hero:', e.message);
            }
            
            try {
                console.log('Authorizing Relic contract...');
                const tx2 = await vrfManager.setAuthorizedContract(relicAddress, true);
                console.log('TX hash:', tx2.hash);
                await tx2.wait();
                console.log('Relic authorized!');
            } catch (e) {
                console.log('Error authorizing Relic:', e.message);
            }
        } else {
            console.log('\nYou are not the owner. Cannot authorize contracts.');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main().catch(console.error);