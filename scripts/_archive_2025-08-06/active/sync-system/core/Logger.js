/**
 * 結構化日誌系統
 * 統一管理所有同步過程的日誌輸出
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

class Logger {
  constructor(context = 'SYNC') {
    this.context = context;
    this.logs = [];
    this.startTime = Date.now();
  }

  formatTime() {
    return new Date().toLocaleTimeString('zh-TW', { hour12: false });
  }

  log(message, level = 'info', data = null) {
    const timestamp = this.formatTime();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      data
    };

    this.logs.push(logEntry);

    const colorMap = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      debug: colors.magenta
    };

    const color = colorMap[level] || colors.reset;
    const prefix = `${color}[${level.toUpperCase()}]${colors.reset}`;
    
    console.log(`${prefix} ${timestamp} ${message}`);
    
    if (data && level === 'debug') {
      console.log(`${colors.magenta}DEBUG DATA:${colors.reset}`, data);
    }
  }

  info(message, data) { this.log(message, 'info', data); }
  success(message, data) { this.log(message, 'success', data); }
  warning(message, data) { this.log(message, 'warning', data); }
  error(message, data) { this.log(message, 'error', data); }
  debug(message, data) { this.log(message, 'debug', data); }

  section(title) {
    console.log(`\n${colors.cyan}${title}${colors.reset}`);
  }

  getExecutionTime() {
    return ((Date.now() - this.startTime) / 1000).toFixed(2);
  }

  generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    const stats = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    return {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: `${duration}s`,
      stats,
      logs: this.logs
    };
  }

  child(context) {
    return new Logger(`${this.context}:${context}`);
  }
}

module.exports = Logger;