const { ethers } = require('hardhat');

async function main() {
    const vrfManagerAddress = '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1';
    const heroAddress = '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d';
    const relicAddress = '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316';
    
    const vrfManagerAbi = [
        "function authorizedContracts(address) view returns (bool)",
        "function isAuthorized(address) view returns (bool)"
    ];
    
    const vrfManager = await ethers.getContractAt(vrfManagerAbi, vrfManagerAddress);
    
    console.log('Verifying VRF authorizations...\n');
    
    try {
        // 嘗試用 isAuthorized 函數
        const isHeroAuth = await vrfManager.isAuthorized(heroAddress);
        const isRelicAuth = await vrfManager.isAuthorized(relicAddress);
        
        console.log('Hero contract (', heroAddress, ')');
        console.log('  Authorized:', isHeroAuth);
        
        console.log('Relic contract (', relicAddress, ')');
        console.log('  Authorized:', isRelicAuth);
        
        if (isHeroAuth && isRelicAuth) {
            console.log('\n✅ Both contracts are properly authorized for VRF!');
            console.log('Users should now be able to mint NFTs.');
        } else {
            console.log('\n❌ Some contracts are not authorized:');
            if (!isHeroAuth) console.log('  - Hero needs authorization');
            if (!isRelicAuth) console.log('  - Relic needs authorization');
        }
    } catch (e) {
        console.log('Error checking authorization:', e.message);
    }
}

main().catch(console.error);