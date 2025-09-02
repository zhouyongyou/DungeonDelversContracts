// V25 Final - NFT 合約重新部署腳本
// 包括：Hero, Relic, Party, PlayerProfile, VIPStaking
// 功能：部署 + 設置雙向連接 + 記錄結果

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('\n🚀 V25 Final - NFT 合約重新部署開始');
    console.log('=' .repeat(60));
    
    // 獲取部署者錢包
    const [deployer] = await ethers.getSigners();
    console.log('📦 部署錢包:', deployer.address);
    
    // 獲取餘額
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log('💰 錢包餘額:', ethers.formatEther(balance), 'BNB');
    
    if (balance < ethers.parseEther('0.1')) {
        throw new Error('❌ 錢包餘額不足，需要至少 0.1 BNB');
    }
    
    // DungeonCore 地址 (從 .env 讀取)
    const DUNGEONCORE_ADDRESS = process.env.VITE_DUNGEONCORE_ADDRESS;
    if (!DUNGEONCORE_ADDRESS) {
        throw new Error('❌ 找不到 DUNGEONCORE_ADDRESS，請檢查 .env 文件');
    }
    
    console.log('🏛️ DungeonCore 地址:', DUNGEONCORE_ADDRESS);
    
    // 準備部署記錄
    const deploymentRecord = {
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        version: 'V25.0.6',
        description: 'NFT 合約重新部署 - 修復 contractURI 問題',
        dungeonCore: DUNGEONCORE_ADDRESS,
        contracts: {},
        gasUsed: {},
        transactions: []
    };
    
    // 部署合約列表
    const contracts = [
        { name: 'Hero', displayName: 'Hero NFT' },
        { name: 'Relic', displayName: 'Relic NFT' },  
        { name: 'Party', displayName: 'Party NFT' },
        { name: 'PlayerProfile', displayName: 'Player Profile SBT' },
        { name: 'VIPStaking', displayName: 'VIP Staking SBT' }
    ];
    
    console.log('\n📋 準備部署的合約:');
    contracts.forEach((contract, i) => {
        console.log(`${i + 1}. ${contract.displayName} (${contract.name})`);
    });
    
    // 1. 部署所有合約
    console.log('\n🔨 Step 1: 部署所有 NFT 合約');
    console.log('-'.repeat(40));
    
    for (const contract of contracts) {
        try {
            console.log(`\n部署 ${contract.displayName}...`);
            
            const ContractFactory = await ethers.getContractFactory(contract.name);
            const contractInstance = await ContractFactory.deploy({
                gasLimit: 8000000,  // 增加 Gas limit 到 8M
                gasPrice: ethers.parseUnits('0.1', 'gwei')  // 設置 gas price 為 0.1 gwei
            });
            
            console.log(`⏳ 等待 ${contract.name} 部署完成...`);
            await contractInstance.waitForDeployment();
            
            const contractAddress = await contractInstance.getAddress();
            console.log(`✅ ${contract.displayName} 部署成功: ${contractAddress}`);
            
            // 獲取部署交易詳情
            const deployTx = contractInstance.deploymentTransaction();
            if (deployTx) {
                const receipt = await deployTx.wait();
                deploymentRecord.gasUsed[contract.name] = receipt.gasUsed.toString();
                deploymentRecord.transactions.push({
                    contract: contract.name,
                    type: 'deploy',
                    hash: receipt.hash,
                    gasUsed: receipt.gasUsed.toString()
                });
                console.log(`⛽ Gas 使用: ${receipt.gasUsed.toString()}`);
            }
            
            // 保存合約地址
            deploymentRecord.contracts[contract.name] = {
                address: contractAddress,
                displayName: contract.displayName
            };
            
            // 驗證部署
            const code = await deployer.provider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error(`${contract.name} 部署失敗：無合約代碼`);
            }
            
        } catch (error) {
            console.error(`❌ ${contract.name} 部署失敗:`, error.message);
            throw error;
        }
    }
    
    // 2. 設置雙向連接
    console.log('\n🔗 Step 2: 設置合約間的雙向連接');
    console.log('-'.repeat(40));
    
    // 2.1 設置 NFT 合約 → DungeonCore
    console.log('\n設置 NFT 合約指向 DungeonCore...');
    for (const contract of contracts) {
        try {
            const contractAddress = deploymentRecord.contracts[contract.name].address;
            const contractInstance = await ethers.getContractAt(contract.name, contractAddress);
            
            console.log(`設置 ${contract.name}.setDungeonCore(${DUNGEONCORE_ADDRESS})...`);
            const tx = await contractInstance.setDungeonCore(DUNGEONCORE_ADDRESS, {
                gasLimit: 100000,
                gasPrice: ethers.parseUnits('0.1', 'gwei')  // 設置 gas price 為 0.1 gwei
            });
            
            console.log(`⏳ 交易已發送: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ ${contract.name} → DungeonCore 連接成功`);
            
            deploymentRecord.transactions.push({
                contract: contract.name,
                type: 'setDungeonCore',
                hash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            });
            
        } catch (error) {
            console.error(`❌ ${contract.name} → DungeonCore 連接失敗:`, error.message);
            throw error;
        }
    }
    
    // 2.2 設置 DungeonCore → NFT 合約
    console.log('\n設置 DungeonCore 指向 NFT 合約...');
    const dungeonCore = await ethers.getContractAt('DungeonCore', DUNGEONCORE_ADDRESS);
    
    const coreSetupMappings = [
        { contract: 'Hero', method: 'setHeroContract' },
        { contract: 'Relic', method: 'setRelicContract' },
        { contract: 'Party', method: 'setPartyContract' },
        { contract: 'PlayerProfile', method: 'setPlayerProfile' },
        { contract: 'VIPStaking', method: 'setVipStaking' }
    ];
    
    for (const mapping of coreSetupMappings) {
        try {
            const contractAddress = deploymentRecord.contracts[mapping.contract].address;
            console.log(`設置 DungeonCore.${mapping.method}(${contractAddress})...`);
            
            const tx = await dungeonCore[mapping.method](contractAddress, {
                gasLimit: 100000,
                gasPrice: ethers.parseUnits('0.1', 'gwei')  // 設置 gas price 為 0.1 gwei
            });
            
            console.log(`⏳ 交易已發送: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ DungeonCore → ${mapping.contract} 連接成功`);
            
            deploymentRecord.transactions.push({
                contract: 'DungeonCore',
                type: mapping.method,
                targetContract: mapping.contract,
                hash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            });
            
        } catch (error) {
            console.error(`❌ DungeonCore → ${mapping.contract} 連接失敗:`, error.message);
            throw error;
        }
    }
    
    // 3. 驗證連接
    console.log('\n🔍 Step 3: 驗證所有連接');
    console.log('-'.repeat(40));
    
    let allConnectionsValid = true;
    
    // 驗證 NFT → Core 連接
    for (const contract of contracts) {
        try {
            const contractAddress = deploymentRecord.contracts[contract.name].address;
            const contractInstance = await ethers.getContractAt(contract.name, contractAddress);
            
            const connectedCore = await contractInstance.dungeonCore();
            const isValid = connectedCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase();
            
            console.log(`${contract.name} → DungeonCore: ${isValid ? '✅ 正確' : '❌ 錯誤'}`);
            if (!isValid) {
                console.log(`  預期: ${DUNGEONCORE_ADDRESS}`);
                console.log(`  實際: ${connectedCore}`);
                allConnectionsValid = false;
            }
            
        } catch (error) {
            console.log(`${contract.name} → DungeonCore: ❌ 無法驗證 (${error.message})`);
            allConnectionsValid = false;
        }
    }
    
    // 驗證 Core → NFT 連接
    const coreVerifyMappings = [
        { contract: 'Hero', method: 'heroContractAddress' },
        { contract: 'Relic', method: 'relicContractAddress' },
        { contract: 'Party', method: 'partyContractAddress' },
        { contract: 'PlayerProfile', method: 'playerProfileAddress' },
        { contract: 'VIPStaking', method: 'vipStakingAddress' }
    ];
    
    for (const mapping of coreVerifyMappings) {
        try {
            const expectedAddress = deploymentRecord.contracts[mapping.contract].address;
            const actualAddress = await dungeonCore[mapping.method]();
            const isValid = actualAddress.toLowerCase() === expectedAddress.toLowerCase();
            
            console.log(`DungeonCore → ${mapping.contract}: ${isValid ? '✅ 正確' : '❌ 錯誤'}`);
            if (!isValid) {
                console.log(`  預期: ${expectedAddress}`);
                console.log(`  實際: ${actualAddress}`);
                allConnectionsValid = false;
            }
            
        } catch (error) {
            console.log(`DungeonCore → ${mapping.contract}: ❌ 無法驗證 (${error.message})`);
            allConnectionsValid = false;
        }
    }
    
    // 4. 保存部署記錄
    console.log('\n💾 Step 4: 保存部署記錄');
    console.log('-'.repeat(40));
    
    deploymentRecord.allConnectionsValid = allConnectionsValid;
    deploymentRecord.completedAt = new Date().toISOString();
    
    // 計算總 Gas 使用量
    const totalGasUsed = deploymentRecord.transactions.reduce(
        (sum, tx) => sum + BigInt(tx.gasUsed), BigInt(0)
    );
    deploymentRecord.totalGasUsed = totalGasUsed.toString();
    
    // 保存 JSON 記錄
    const recordFileName = `deployment-nft-v25-final-${Date.now()}.json`;
    const recordPath = path.join(__dirname, '..', 'deployments', recordFileName);
    
    // 確保目錄存在
    const deployDir = path.dirname(recordPath);
    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir, { recursive: true });
    }
    
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    console.log(`📁 部署記錄已保存: ${recordPath}`);
    
    // 生成 .env 更新建議
    console.log('\n📝 建議的 .env 更新:');
    console.log('-'.repeat(40));
    Object.entries(deploymentRecord.contracts).forEach(([name, info]) => {
        const envKey = `VITE_${name.toUpperCase()}_ADDRESS`;
        console.log(`${envKey}=${info.address}`);
    });
    
    // 最終報告
    console.log('\n🎉 部署完成報告');
    console.log('=' .repeat(60));
    console.log(`✅ 部署合約數量: ${contracts.length}`);
    console.log(`⛽ 總 Gas 使用量: ${ethers.formatUnits(totalGasUsed, 'gwei')} Gwei`);
    console.log(`🔗 連接驗證: ${allConnectionsValid ? '✅ 全部正確' : '❌ 有錯誤'}`);
    console.log(`📄 部署記錄: ${recordFileName}`);
    
    if (!allConnectionsValid) {
        console.log('\n⚠️ 警告: 部分連接驗證失敗，請檢查上述錯誤');
    }
    
    console.log('\n📋 部署的合約地址:');
    Object.entries(deploymentRecord.contracts).forEach(([name, info]) => {
        console.log(`  ${info.displayName}: ${info.address}`);
    });
    
    console.log('\n🔄 下一步建議:');
    console.log('1. 運行驗證腳本開源合約');
    console.log('2. 更新 .env 文件中的合約地址');  
    console.log('3. 同步前端、後端、子圖配置');
    console.log('4. 測試合約功能');
    
    return deploymentRecord;
}

// 錯誤處理
main()
    .then((record) => {
        console.log('\n✅ NFT 合約部署腳本執行成功！');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ 部署失敗:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    });