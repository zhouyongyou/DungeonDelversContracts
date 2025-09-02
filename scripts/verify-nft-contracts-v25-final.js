// V25 Final - NFT 合約 BSCScan 開源驗證腳本
// 驗證：Hero, Relic, Party, PlayerProfile, VIPStaking

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function main() {
    console.log('\n🔍 V25 Final - NFT 合約 BSCScan 驗證開始');
    console.log('=' .repeat(60));
    
    // 檢查 BSCSCAN_API_KEY
    const bscscanApiKey = process.env.BSCSCAN_API_KEY;
    if (!bscscanApiKey) {
        throw new Error('❌ 找不到 BSCSCAN_API_KEY，請檢查 .env 文件');
    }
    console.log('🔑 BSCScan API Key:', bscscanApiKey.slice(0, 8) + '...');
    
    // 從最新部署記錄讀取合約地址
    let contractAddresses = {};
    
    // 方法1: 從最新的部署記錄讀取
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (fs.existsSync(deploymentsDir)) {
        const deploymentFiles = fs.readdirSync(deploymentsDir)
            .filter(file => file.startsWith('deployment-nft-v25-final-') && file.endsWith('.json'))
            .sort()
            .reverse();
        
        if (deploymentFiles.length > 0) {
            const latestFile = deploymentFiles[0];
            const deploymentRecord = JSON.parse(
                fs.readFileSync(path.join(deploymentsDir, latestFile), 'utf8')
            );
            
            console.log('📄 使用部署記錄:', latestFile);
            contractAddresses = Object.entries(deploymentRecord.contracts).reduce((acc, [name, info]) => {
                acc[name] = info.address;
                return acc;
            }, {});
        }
    }
    
    // 方法2: 從 .env 文件讀取 (備用)
    if (Object.keys(contractAddresses).length === 0) {
        console.log('📄 從 .env 文件讀取合約地址...');
        contractAddresses = {
            Hero: process.env.VITE_HERO_ADDRESS,
            Relic: process.env.VITE_RELIC_ADDRESS,
            Party: process.env.VITE_PARTY_ADDRESS,
            PlayerProfile: process.env.VITE_PLAYERPROFILE_ADDRESS,
            VIPStaking: process.env.VITE_VIPSTAKING_ADDRESS
        };
    }
    
    // 驗證合約地址
    const contracts = [
        { name: 'Hero', displayName: 'Hero NFT', constructorArgs: '[]' },
        { name: 'Relic', displayName: 'Relic NFT', constructorArgs: '[]' },
        { name: 'Party', displayName: 'Party NFT', constructorArgs: '[]' },
        { name: 'PlayerProfile', displayName: 'Player Profile SBT', constructorArgs: '[]' },
        { name: 'VIPStaking', displayName: 'VIP Staking SBT', constructorArgs: '[]' }
    ];
    
    console.log('\n📋 準備驗證的合約:');
    for (const contract of contracts) {
        const address = contractAddresses[contract.name];
        if (!address) {
            throw new Error(`❌ 找不到 ${contract.name} 合約地址`);
        }
        console.log(`${contract.displayName}: ${address}`);
    }
    
    // 驗證結果記錄
    const verificationResults = {
        timestamp: new Date().toISOString(),
        bscscanApiKey: bscscanApiKey.slice(0, 8) + '...',
        results: {},
        successCount: 0,
        failureCount: 0
    };
    
    // 開始驗證
    console.log('\n🔨 開始 BSCScan 驗證');
    console.log('-'.repeat(40));
    
    for (const contract of contracts) {
        const address = contractAddresses[contract.name];
        
        try {
            console.log(`\n驗證 ${contract.displayName} (${address})...`);
            
            // 構建驗證命令
            const cmd = `npx hardhat verify --network bsc ${address}`;
            
            console.log(`⏳ 執行: ${cmd}`);
            
            // 執行驗證命令
            const { stdout, stderr } = await execAsync(cmd, {
                timeout: 120000,  // 2分鐘超時
                env: { ...process.env, BSCSCAN_API_KEY: bscscanApiKey }
            });
            
            // 檢查輸出
            const output = stdout + stderr;
            
            if (output.includes('Successfully verified') || output.includes('Already Verified')) {
                console.log(`✅ ${contract.displayName} 驗證成功`);
                verificationResults.results[contract.name] = {
                    status: 'success',
                    address: address,
                    output: output.trim()
                };
                verificationResults.successCount++;
            } else if (output.includes('Already verified')) {
                console.log(`✅ ${contract.displayName} 已驗證`);
                verificationResults.results[contract.name] = {
                    status: 'already_verified',
                    address: address,
                    output: output.trim()
                };
                verificationResults.successCount++;
            } else {
                console.log(`❌ ${contract.displayName} 驗證失敗`);
                console.log('輸出:', output);
                verificationResults.results[contract.name] = {
                    status: 'failed',
                    address: address,
                    error: output.trim()
                };
                verificationResults.failureCount++;
            }
            
        } catch (error) {
            console.log(`❌ ${contract.displayName} 驗證異常:`, error.message);
            verificationResults.results[contract.name] = {
                status: 'error',
                address: address,
                error: error.message
            };
            verificationResults.failureCount++;
        }
        
        // 防止過於頻繁請求
        console.log('⏳ 等待 3 秒...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 保存驗證結果
    console.log('\n💾 保存驗證結果');
    console.log('-'.repeat(40));
    
    verificationResults.completedAt = new Date().toISOString();
    
    const resultFileName = `verification-nft-v25-final-${Date.now()}.json`;
    const resultPath = path.join(__dirname, '..', 'deployments', resultFileName);
    
    // 確保目錄存在
    const deployDir = path.dirname(resultPath);
    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir, { recursive: true });
    }
    
    fs.writeFileSync(resultPath, JSON.stringify(verificationResults, null, 2));
    console.log(`📁 驗證結果已保存: ${resultPath}`);
    
    // 最終報告
    console.log('\n🎉 驗證完成報告');
    console.log('=' .repeat(60));
    console.log(`✅ 驗證成功: ${verificationResults.successCount}/${contracts.length}`);
    console.log(`❌ 驗證失敗: ${verificationResults.failureCount}/${contracts.length}`);
    console.log(`📄 結果記錄: ${resultFileName}`);
    
    // 顯示詳細結果
    console.log('\n📋 詳細結果:');
    for (const contract of contracts) {
        const result = verificationResults.results[contract.name];
        if (result) {
            const statusIcon = result.status === 'success' || result.status === 'already_verified' ? '✅' : '❌';
            console.log(`  ${statusIcon} ${contract.displayName}: ${result.status}`);
            if (result.status === 'success' || result.status === 'already_verified') {
                console.log(`    BSCScan: https://bscscan.com/address/${result.address}#code`);
            }
        }
    }
    
    // 檢查是否全部成功
    if (verificationResults.failureCount > 0) {
        console.log('\n⚠️ 警告: 部分合約驗證失敗，請檢查錯誤信息');
        return false;
    } else {
        console.log('\n🎊 所有合約驗證成功！');
        return true;
    }
}

// 錯誤處理
main()
    .then((success) => {
        if (success) {
            console.log('\n✅ NFT 合約驗證腳本執行成功！');
            process.exit(0);
        } else {
            console.log('\n⚠️ NFT 合約驗證部分失敗，請檢查結果');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n❌ 驗證失敗:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    });