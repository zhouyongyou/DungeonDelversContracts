// V25 Final - NFT 合約一鍵部署、驗證、設置腳本
// 整合：部署 → 驗證 → 配置同步

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function main() {
    console.log('\n🚀 V25 Final - NFT 合約一鍵部署流程');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
        // Step 1: 部署合約
        console.log('🔨 Step 1: 部署 NFT 合約');
        console.log('-'.repeat(40));
        
        console.log('⏳ 執行: node scripts/deploy-nft-contracts-v25-final.js');
        const { stdout: deployOutput, stderr: deployError } = await execAsync(
            'node scripts/deploy-nft-contracts-v25-final.js',
            { timeout: 600000 }  // 10分鐘超時
        );
        
        console.log('部署輸出:', deployOutput);
        if (deployError) {
            console.log('部署警告:', deployError);
        }
        
        // 檢查部署是否成功
        if (!deployOutput.includes('✅ NFT 合約部署腳本執行成功！')) {
            throw new Error('部署腳本執行失敗');
        }
        
        console.log('✅ Step 1 完成: NFT 合約部署成功');
        
        // Step 2: 等待區塊確認
        console.log('\n⏳ Step 2: 等待區塊確認 (30秒)');
        console.log('-'.repeat(40));
        
        await new Promise(resolve => setTimeout(resolve, 30000));
        console.log('✅ Step 2 完成: 等待完成');
        
        // Step 3: 驗證合約
        console.log('\n🔍 Step 3: BSCScan 驗證合約');
        console.log('-'.repeat(40));
        
        console.log('⏳ 執行: node scripts/verify-nft-contracts-v25-final.js');
        const { stdout: verifyOutput, stderr: verifyError } = await execAsync(
            'node scripts/verify-nft-contracts-v25-final.js',
            { timeout: 900000 }  // 15分鐘超時
        );
        
        console.log('驗證輸出:', verifyOutput);
        if (verifyError) {
            console.log('驗證警告:', verifyError);
        }
        
        const verificationSuccess = verifyOutput.includes('✅ NFT 合約驗證腳本執行成功！');
        if (verificationSuccess) {
            console.log('✅ Step 3 完成: 合約驗證成功');
        } else {
            console.log('⚠️ Step 3 警告: 合約驗證部分失敗');
        }
        
        // Step 4: 提取合約地址
        console.log('\n📋 Step 4: 提取新部署的合約地址');
        console.log('-'.repeat(40));
        
        // 從最新的部署記錄提取地址
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        const deploymentFiles = fs.readdirSync(deploymentsDir)
            .filter(file => file.startsWith('deployment-nft-v25-final-') && file.endsWith('.json'))
            .sort()
            .reverse();
        
        if (deploymentFiles.length === 0) {
            throw new Error('找不到部署記錄文件');
        }
        
        const latestFile = deploymentFiles[0];
        const deploymentRecord = JSON.parse(
            fs.readFileSync(path.join(deploymentsDir, latestFile), 'utf8')
        );
        
        console.log('📄 使用部署記錄:', latestFile);
        
        // 顯示新地址
        const newAddresses = {};
        Object.entries(deploymentRecord.contracts).forEach(([name, info]) => {
            const envKey = `VITE_${name.toUpperCase()}_ADDRESS`;
            newAddresses[envKey] = info.address;
            console.log(`${envKey}=${info.address}`);
        });
        
        console.log('✅ Step 4 完成: 合約地址提取完成');
        
        // Step 5: 生成配置更新建議
        console.log('\n📝 Step 5: 生成配置更新建議');
        console.log('-'.repeat(40));
        
        // 創建配置更新文件
        const updateScript = `#!/bin/bash
# V25 Final NFT 合約地址更新腳本
# 生成時間: ${new Date().toISOString()}

echo "🔄 更新 .env 文件中的 NFT 合約地址..."

# 備份原始 .env 文件
cp .env .env.backup.$(date +%s)

# 更新合約地址
${Object.entries(newAddresses).map(([key, value]) => 
    `sed -i '' 's/^${key}=.*/${key}=${value}/' .env`
).join('\n')}

echo "✅ NFT 合約地址更新完成"
echo "📄 原始文件已備份"

echo "🔄 建議執行的後續步驟:"
echo "1. node scripts/ultimate-config-system.js sync  # 同步到所有項目"
echo "2. npm run build                                 # 重新編譯前端"
echo "3. 重新部署子圖                                   # 更新子圖配置"
`;
        
        const updateScriptPath = path.join(__dirname, '..', 'update-nft-addresses.sh');
        fs.writeFileSync(updateScriptPath, updateScript);
        
        // 設置執行權限
        try {
            await execAsync(`chmod +x ${updateScriptPath}`);
        } catch (error) {
            console.log('設置執行權限失敗，請手動執行: chmod +x update-nft-addresses.sh');
        }
        
        console.log('📁 配置更新腳本已創建: update-nft-addresses.sh');
        console.log('✅ Step 5 完成: 配置更新建議已生成');
        
        // 最終報告
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        console.log('\n🎉 一鍵部署流程完成報告');
        console.log('=' .repeat(60));
        console.log(`⏱️ 總用時: ${duration} 秒`);
        console.log(`📦 部署合約: 5個 NFT 合約`);
        console.log(`🔍 驗證狀態: ${verificationSuccess ? '✅ 全部成功' : '⚠️ 部分失敗'}`);
        console.log(`📄 部署記錄: ${latestFile}`);
        
        console.log('\n📋 新部署的合約地址:');
        Object.entries(deploymentRecord.contracts).forEach(([name, info]) => {
            console.log(`  ${info.displayName}: ${info.address}`);
            console.log(`    BSCScan: https://bscscan.com/address/${info.address}`);
        });
        
        console.log('\n🔄 下一步操作建議:');
        console.log('1. 執行: ./update-nft-addresses.sh             # 更新配置文件');
        console.log('2. 執行: node scripts/ultimate-config-system.js sync  # 同步到所有項目');
        console.log('3. 重新編譯並部署前端');
        console.log('4. 更新子圖配置並重新部署');
        console.log('5. 測試所有 NFT 功能');
        
        console.log('\n✅ 所有步驟完成！NFT 合約已準備就緒');
        
        return true;
        
    } catch (error) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        console.error('\n❌ 一鍵部署流程失敗');
        console.error(`⏱️ 失敗時間: ${duration} 秒`);
        console.error('錯誤:', error.message);
        
        console.log('\n🔧 故障排除建議:');
        console.log('1. 檢查錢包 BNB 餘額是否充足');
        console.log('2. 檢查 .env 文件中的 PRIVATE_KEY 和 BSCSCAN_API_KEY');
        console.log('3. 檢查網絡連接是否正常');
        console.log('4. 查看詳細錯誤信息進行排除');
        
        return false;
    }
}

// 錯誤處理
main()
    .then((success) => {
        if (success) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n💥 腳本執行異常:', error.message);
        process.exit(1);
    });