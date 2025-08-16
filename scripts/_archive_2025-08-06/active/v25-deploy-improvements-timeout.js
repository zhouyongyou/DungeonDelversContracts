// 改進的部署腳本模板 - 加入超時和進度追蹤

const chalk = require('chalk');

// 1. 交易超時包裝器
async function executeWithTimeout(promise, timeoutMs = 60000, description = '交易') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${description} 超時 (${timeoutMs/1000}秒)`)), timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } catch (error) {
    if (error.message.includes('超時')) {
      console.log(chalk.red(`\n⏱️ ${description} 執行超時！`));
      console.log(chalk.yellow('可能原因：'));
      console.log('1. 網路擁塞');
      console.log('2. Gas Price 太低');
      console.log('3. 合約執行卡住');
      console.log(chalk.cyan('\n建議檢查 BSCScan 上的交易狀態'));
    }
    throw error;
  }
}

// 2. 進度追蹤器
class ProgressTracker {
  constructor() {
    this.steps = [];
    this.currentStep = null;
    this.startTime = Date.now();
  }
  
  startStep(name) {
    if (this.currentStep) {
      this.completeStep();
    }
    this.currentStep = {
      name,
      startTime: Date.now(),
      status: 'running'
    };
    console.log(chalk.blue(`\n▶️ 開始: ${name}`));
  }
  
  completeStep(success = true) {
    if (!this.currentStep) return;
    
    this.currentStep.endTime = Date.now();
    this.currentStep.duration = this.currentStep.endTime - this.currentStep.startTime;
    this.currentStep.status = success ? 'completed' : 'failed';
    
    this.steps.push(this.currentStep);
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} 完成: ${this.currentStep.name} (耗時: ${this.currentStep.duration/1000}秒)`);
    
    this.currentStep = null;
  }
  
  printSummary() {
    console.log(chalk.cyan('\n📊 執行總結:'));
    console.log(`總耗時: ${(Date.now() - this.startTime)/1000}秒`);
    
    const completed = this.steps.filter(s => s.status === 'completed').length;
    const failed = this.steps.filter(s => s.status === 'failed').length;
    
    console.log(`成功: ${completed}, 失敗: ${failed}`);
    
    if (this.currentStep) {
      console.log(chalk.yellow(`\n⚠️ 未完成的步驟: ${this.currentStep.name}`));
    }
  }
}

// 3. 改進的設置函數示例
async function setupParametersWithTimeout() {
  const tracker = new ProgressTracker();
  
  try {
    // 設置地城
    tracker.startStep('初始化地城');
    
    for (const dungeon of GAME_PARAMS.dungeons) {
      try {
        const tx = await dungeonMaster.setDungeon(
          dungeon.id,
          dungeon.requiredPower,
          ethers.parseUnits(dungeon.rewardUSD.toString(), 18),
          dungeon.successRate
        );
        
        // 使用超時等待
        await executeWithTimeout(
          tx.wait(),
          30000, // 30秒超時
          `地城 ${dungeon.id} 設置`
        );
        
        console.log(`✅ 地城 ${dungeon.id} - ${dungeon.name} 設置成功`);
      } catch (error) {
        console.log(`❌ 地城 ${dungeon.id} 設置失敗: ${error.message}`);
        tracker.completeStep(false);
        throw error; // 重要步驟失敗應該停止
      }
    }
    
    tracker.completeStep(true);
    
    // 設置其他參數
    tracker.startStep('設置 Party 費用');
    
    try {
      const tx = await party.setPlatformFee(ethers.parseEther('0.001'));
      await executeWithTimeout(tx.wait(), 30000, 'Party 費用設置');
      tracker.completeStep(true);
    } catch (error) {
      console.log(`⚠️ Party 費用設置失敗: ${error.message}`);
      tracker.completeStep(false);
      // 非關鍵錯誤，繼續執行
    }
    
    // 更多設置...
    
  } catch (error) {
    console.error(chalk.red('\n❌ 部署過程中發生錯誤:'), error);
  } finally {
    tracker.printSummary();
  }
}

// 4. 心跳檢測（防止靜默卡住）
class HeartbeatMonitor {
  constructor(intervalMs = 10000) {
    this.intervalMs = intervalMs;
    this.lastActivity = Date.now();
    this.timer = null;
  }
  
  start() {
    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.lastActivity;
      if (elapsed > this.intervalMs * 3) {
        console.log(chalk.red(`\n⚠️ 警告：已經 ${elapsed/1000} 秒沒有活動！`));
        console.log('可能卡住了，建議：');
        console.log('1. 按 Ctrl+C 中斷');
        console.log('2. 運行診斷腳本檢查狀態');
        console.log('3. 檢查 BSCScan 上的最後交易');
      } else {
        console.log(chalk.gray(`💓 運行中... (${new Date().toLocaleTimeString()})`));
      }
    }, this.intervalMs);
  }
  
  activity() {
    this.lastActivity = Date.now();
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

// 5. 批次執行器（帶進度顯示）
async function executeBatch(tasks, options = {}) {
  const { 
    concurrent = false, 
    continueOnError = false,
    timeoutMs = 60000 
  } = options;
  
  console.log(chalk.cyan(`\n📦 執行 ${tasks.length} 個任務...`));
  
  const results = [];
  const heartbeat = new HeartbeatMonitor();
  heartbeat.start();
  
  try {
    if (concurrent) {
      // 並行執行
      const promises = tasks.map((task, index) => 
        executeWithTimeout(
          task.execute(),
          timeoutMs,
          task.name || `任務 ${index + 1}`
        ).then(result => {
          heartbeat.activity();
          console.log(`✅ [${index + 1}/${tasks.length}] ${task.name} 完成`);
          return { success: true, result };
        }).catch(error => {
          heartbeat.activity();
          console.log(`❌ [${index + 1}/${tasks.length}] ${task.name} 失敗: ${error.message}`);
          if (!continueOnError) throw error;
          return { success: false, error };
        })
      );
      
      results.push(...await Promise.all(promises));
    } else {
      // 順序執行
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        console.log(`\n[${i + 1}/${tasks.length}] 執行: ${task.name}`);
        
        try {
          const result = await executeWithTimeout(
            task.execute(),
            timeoutMs,
            task.name
          );
          heartbeat.activity();
          results.push({ success: true, result });
          console.log(`✅ ${task.name} 完成`);
        } catch (error) {
          heartbeat.activity();
          results.push({ success: false, error });
          console.log(`❌ ${task.name} 失敗: ${error.message}`);
          if (!continueOnError) break;
        }
      }
    }
  } finally {
    heartbeat.stop();
  }
  
  // 顯示總結
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(chalk.cyan('\n📊 批次執行總結:'));
  console.log(`成功: ${successCount}/${tasks.length}`);
  if (failureCount > 0) {
    console.log(chalk.red(`失敗: ${failureCount}`));
  }
  
  return results;
}

// 使用示例
async function improvedDeployment() {
  const tasks = [
    {
      name: '設置地城 1',
      execute: async () => {
        const tx = await dungeonMaster.setDungeon(1, 100, ethers.parseUnits('10', 18), 80);
        return tx.wait();
      }
    },
    {
      name: '設置地城 2',
      execute: async () => {
        const tx = await dungeonMaster.setDungeon(2, 200, ethers.parseUnits('20', 18), 70);
        return tx.wait();
      }
    },
    // ... 更多任務
  ];
  
  await executeBatch(tasks, {
    concurrent: false,
    continueOnError: true,
    timeoutMs: 30000
  });
}

module.exports = {
  executeWithTimeout,
  ProgressTracker,
  HeartbeatMonitor,
  executeBatch
};