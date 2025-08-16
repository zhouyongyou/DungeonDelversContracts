const chalk = require('chalk');

// ======================== 核心：超時但繼續執行 ========================

// 1. 不會中斷的交易執行器
async function executeSafely(description, txPromise, options = {}) {
  const { 
    timeoutMs = 15000,
    throwOnError = false,  // false = 超時後繼續
    retries = 0
  } = options;
  
  try {
    console.log(chalk.blue(`\n執行: ${description}`));
    
    // 發送交易
    const tx = await txPromise();
    console.log(`交易發送: ${tx.hash}`);
    
    // 等待確認（帶超時）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    });
    
    try {
      const receipt = await Promise.race([tx.wait(), timeoutPromise]);
      console.log(chalk.green(`✅ ${description} 成功`));
      return { success: true, receipt, tx };
    } catch (error) {
      if (error.message === 'TIMEOUT') {
        console.log(chalk.yellow(`⏱️ ${description} 超時了！`));
        console.log(chalk.yellow(`但交易可能仍在處理中: ${tx.hash}`));
        console.log(chalk.yellow(`請稍後在 BSCScan 檢查`));
        
        // 記錄待確認交易
        return { 
          success: false, 
          timeout: true, 
          tx,
          hash: tx.hash,
          description 
        };
      }
      throw error;
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ ${description} 失敗: ${error.message}`));
    
    if (throwOnError) {
      throw error;
    }
    
    // 錯誤但不中斷
    return { 
      success: false, 
      error: error.message,
      description 
    };
  }
}

// 2. 批次執行器 - 超時後繼續
async function executeBatchSafely(tasks) {
  console.log(chalk.cyan(`\n開始執行 ${tasks.length} 個任務...\n`));
  
  const results = [];
  const pendingTxs = [];
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(chalk.blue(`[${i + 1}/${tasks.length}] ${task.name}`));
    
    const result = await executeSafely(
      task.name,
      task.execute,
      { 
        timeoutMs: task.timeoutMs || 15000,
        throwOnError: task.critical || false
      }
    );
    
    results.push(result);
    
    if (result.timeout) {
      pendingTxs.push(result);
    }
    
    // 短暫延遲避免 nonce 問題
    if (i < tasks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 顯示總結
  console.log(chalk.cyan('\n=================================================='));
  console.log(chalk.cyan('📊 執行總結'));
  console.log(chalk.cyan('==================================================\n'));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.timeout).length;
  const timedOut = results.filter(r => r.timeout).length;
  
  console.log(chalk.green(`✅ 成功: ${successful}`));
  console.log(chalk.red(`❌ 失敗: ${failed}`));
  console.log(chalk.yellow(`⏱️ 超時: ${timedOut}`));
  
  if (pendingTxs.length > 0) {
    console.log(chalk.yellow('\n⚠️ 以下交易超時但可能仍在處理：'));
    pendingTxs.forEach(tx => {
      console.log(`- ${tx.description}: ${tx.hash}`);
    });
    console.log(chalk.cyan('\n建議稍後檢查這些交易的狀態'));
  }
  
  return { results, pendingTxs };
}

// ======================== 實際使用範例 ========================

// 改進您的地城設置
async function setupDungeonsWithTimeout(dungeonMaster, dungeons) {
  const tasks = dungeons.map(dungeon => ({
    name: `設置地城 ${dungeon.id} - ${dungeon.name}`,
    execute: () => dungeonMaster.setDungeon(
      dungeon.id,
      dungeon.requiredPower,
      ethers.parseUnits(dungeon.rewardUSD.toString(), 18),
      dungeon.successRate
    ),
    timeoutMs: 15000,
    critical: false  // 不是關鍵任務，失敗繼續
  }));
  
  const { results, pendingTxs } = await executeBatchSafely(tasks);
  
  // 可選：稍後檢查超時的交易
  if (pendingTxs.length > 0) {
    console.log(chalk.yellow('\n等待 30 秒後檢查超時交易...'));
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    for (const pending of pendingTxs) {
      try {
        const receipt = await pending.tx.wait();
        console.log(chalk.green(`✅ ${pending.description} 最終成功！`));
      } catch (error) {
        console.log(chalk.red(`❌ ${pending.description} 最終失敗`));
      }
    }
  }
}

// 改進您的模組設置
async function setupModulesWithTimeout(contracts) {
  const modulesToSetup = [
    'HERO', 'RELIC', 'PARTY', 'VIPSTAKING', 
    'PLAYERPROFILE', 'PLAYERVAULT', 'DUNGEONMASTER'
  ];
  
  const tasks = [];
  
  for (const moduleName of modulesToSetup) {
    const module = contracts[moduleName]?.contract;
    if (!module || !module.setDungeonCore) continue;
    
    tasks.push({
      name: `${moduleName}.setDungeonCore`,
      execute: () => module.setDungeonCore(contracts.DUNGEONCORE.address),
      timeoutMs: 15000,
      critical: moduleName === 'DUNGEONMASTER' // 只有 DungeonMaster 是關鍵的
    });
  }
  
  return executeBatchSafely(tasks);
}

// ======================== 完整範例 ========================

async function improvedDeploymentFlow() {
  console.log(chalk.cyan('🚀 開始部署（超時保護版）\n'));
  
  try {
    // 1. 部署合約（關鍵步驟，超時會停止）
    const oracle = await executeSafely(
      '部署 Oracle',
      () => deployContract('Oracle'),
      { throwOnError: true, timeoutMs: 30000 }
    );
    
    if (!oracle.success) {
      console.log(chalk.red('Oracle 部署失敗，停止部署'));
      return;
    }
    
    // 2. 設置地城（非關鍵，超時繼續）
    await setupDungeonsWithTimeout(dungeonMaster, GAME_PARAMS.dungeons);
    
    // 3. 設置模組（混合關鍵性）
    await setupModulesWithTimeout(contracts);
    
    // 4. 其他設置（非關鍵）
    const otherTasks = [
      {
        name: '設置 Party 費用',
        execute: () => party.setPlatformFee(ethers.parseEther('0.001')),
        critical: false
      },
      {
        name: '設置 VIP 冷卻期',
        execute: () => vipStaking.setUnstakeCooldown(86400),
        critical: false
      }
    ];
    
    await executeBatchSafely(otherTasks);
    
    console.log(chalk.green('\n✅ 部署流程完成！'));
    console.log(chalk.yellow('請檢查 BSCScan 確認所有交易狀態'));
    
  } catch (error) {
    console.log(chalk.red('\n❌ 部署中斷:', error.message));
  }
}

// ======================== 檢查超時交易的工具 ========================

async function checkPendingTransactions(txHashes) {
  console.log(chalk.cyan('\n檢查待確認交易...\n'));
  
  for (const hash of txHashes) {
    try {
      const receipt = await ethers.provider.getTransactionReceipt(hash);
      if (receipt) {
        const status = receipt.status === 1 ? '✅ 成功' : '❌ 失敗';
        console.log(`${status} ${hash}`);
      } else {
        console.log(`⏳ 仍在處理 ${hash}`);
      }
    } catch (error) {
      console.log(`❓ 無法檢查 ${hash}`);
    }
  }
}

module.exports = {
  executeSafely,
  executeBatchSafely,
  setupDungeonsWithTimeout,
  setupModulesWithTimeout,
  checkPendingTransactions
};