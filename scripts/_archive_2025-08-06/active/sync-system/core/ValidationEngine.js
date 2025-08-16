/**
 * 驗證引擎
 * 統一處理所有配置和一致性驗證
 */

const { PathResolver } = require('../config/project-paths');

class ValidationEngine {
  constructor(logger, fileOps, configLoader) {
    this.logger = logger;
    this.fileOps = fileOps;
    this.configLoader = configLoader;
  }

  async validateAll() {
    this.logger.section('🔍 執行全面驗證...');
    
    const results = {
      addressValidation: await this.validateAddresses(),
      configConsistency: await this.validateConfigConsistency(),
      codeConsistency: await this.validateCodeConsistency(),
      fileIntegrity: await this.validateFileIntegrity()
    };

    const issues = [
      ...results.addressValidation.issues,
      ...results.configConsistency.issues,
      ...results.codeConsistency.issues,
      ...results.fileIntegrity.issues
    ];

    if (issues.length === 0) {
      this.logger.success('✅ 所有驗證通過');
    } else {
      this.logger.warning(`⚠️ 發現 ${issues.length} 個問題`);
      issues.forEach(issue => this.logger.warning(`  - ${issue}`));
    }

    return {
      success: issues.length === 0,
      issues,
      details: results
    };
  }

  async validateAddresses() {
    const issues = [];
    
    try {
      const config = this.configLoader.loadMasterConfig();
      this.configLoader.validateAddresses(config);
      
      return { success: true, issues: [] };
    } catch (error) {
      issues.push(`地址驗證失敗: ${error.message}`);
      return { success: false, issues };
    }
  }

  async validateConfigConsistency() {
    const issues = [];
    
    try {
      const masterAddresses = this.configLoader.getContractAddresses();
      
      // 檢查前端配置
      const frontendIssues = await this.checkFrontendConfig(masterAddresses);
      issues.push(...frontendIssues);
      
      // 檢查後端配置
      const backendIssues = await this.checkBackendConfig(masterAddresses);
      issues.push(...backendIssues);
      
      // 檢查子圖配置
      const subgraphIssues = await this.checkSubgraphConfig(masterAddresses);
      issues.push(...subgraphIssues);
      
    } catch (error) {
      issues.push(`配置一致性檢查失敗: ${error.message}`);
    }

    return { success: issues.length === 0, issues };
  }

  async checkFrontendConfig(masterAddresses) {
    const issues = [];
    
    try {
      // 檢查 contracts.ts
      const contractsPath = PathResolver.getConfigFilePath('frontend', 'contracts');
      if (this.fileOps.exists(contractsPath)) {
        const content = this.fileOps.readFile(contractsPath);
        
        for (const [contractName, expectedAddress] of Object.entries(masterAddresses)) {
          const regex = new RegExp(`${contractName}:\\s*['"\`]([^'"\`]+)['"\`]`);
          const match = content.match(regex);
          
          if (match && match[1] !== expectedAddress) {
            issues.push(`前端配置: ${contractName} 地址不一致 ${match[1]} ≠ ${expectedAddress}`);
          }
        }
      }
      
      // 檢查環境變數
      const envPath = PathResolver.getConfigFilePath('frontend', 'env');
      if (this.fileOps.exists(envPath)) {
        const envContent = this.fileOps.readFile(envPath);
        
        // 檢查子圖 URL 版本
        const config = this.configLoader.loadMasterConfig();
        const expectedVersion = config.subgraphVersion || 'v3.6.1';
        const urlMatch = envContent.match(/VITE_THE_GRAPH.*?_URL=.*v(\d+\.\d+\.\d+)/);
        
        if (urlMatch && `v${urlMatch[1]}` !== expectedVersion) {
          issues.push(`前端環境變數: 子圖版本 v${urlMatch[1]} ≠ ${expectedVersion}`);
        }
      }
      
    } catch (error) {
      issues.push(`前端配置檢查失敗: ${error.message}`);
    }

    return issues;
  }

  async checkBackendConfig(masterAddresses) {
    const issues = [];
    
    try {
      const backendConfigPath = PathResolver.getConfigFilePath('backend', 'contracts');
      
      if (this.fileOps.exists(backendConfigPath)) {
        const content = this.fileOps.readFile(backendConfigPath);
        
        for (const [contractName, expectedAddress] of Object.entries(masterAddresses)) {
          if (content.includes(expectedAddress)) {
            continue; // 地址存在
          }
          
          // 檢查是否有舊地址
          const addressPattern = /0x[a-fA-F0-9]{40}/g;
          const foundAddresses = content.match(addressPattern) || [];
          
          if (foundAddresses.length > 0 && !foundAddresses.includes(expectedAddress)) {
            issues.push(`後端配置: ${contractName} 可能使用舊地址`);
          }
        }
      }
      
    } catch (error) {
      issues.push(`後端配置檢查失敗: ${error.message}`);
    }

    return issues;
  }

  async checkSubgraphConfig(masterAddresses) {
    const issues = [];
    
    try {
      // 檢查子圖 YAML
      const yamlPath = PathResolver.getConfigFilePath('subgraph', 'yaml');
      if (this.fileOps.exists(yamlPath)) {
        const yamlContent = this.fileOps.readFile(yamlPath);
        
        for (const [contractName, expectedAddress] of Object.entries(masterAddresses)) {
          if (yamlContent.includes(expectedAddress)) {
            continue;
          }
          
          // 如果合約名稱出現但地址不匹配
          if (yamlContent.toLowerCase().includes(contractName.toLowerCase())) {
            issues.push(`子圖配置: ${contractName} 地址可能過期`);
          }
        }
      }
      
      // 檢查 networks.json
      const networksPath = PathResolver.getConfigFilePath('subgraph', 'networks');
      if (this.fileOps.exists(networksPath)) {
        const networks = this.fileOps.readJSON(networksPath);
        const bscConfig = networks.bsc;
        
        if (bscConfig) {
          for (const [contractName, expectedAddress] of Object.entries(masterAddresses)) {
            const configKey = `${contractName}_ADDRESS`;
            if (bscConfig[configKey] && bscConfig[configKey] !== expectedAddress) {
              issues.push(`子圖網絡配置: ${contractName} 地址不一致`);
            }
          }
        }
      }
      
    } catch (error) {
      issues.push(`子圖配置檢查失敗: ${error.message}`);
    }

    return issues;
  }

  async validateCodeConsistency() {
    const issues = [];
    
    try {
      // 檢查 getContract 使用模式
      const getContractIssues = await this.checkGetContractUsage();
      issues.push(...getContractIssues);
      
      // 檢查直接地址訪問
      const directAccessIssues = await this.checkDirectAddressAccess();
      issues.push(...directAccessIssues);
      
    } catch (error) {
      issues.push(`代碼一致性檢查失敗: ${error.message}`);
    }

    return { success: issues.length === 0, issues };
  }

  async checkGetContractUsage() {
    const issues = [];
    const frontendSrcPath = PathResolver.getProjectPath('frontend') + '/src';
    
    // 查找所有 TypeScript 文件
    const tsFiles = this.fileOps.findFiles(frontendSrcPath, /\.(ts|tsx)$/);
    
    for (const filePath of tsFiles) {
      // 跳過歸檔文件
      if (filePath.includes('/archived/')) continue;
      
      try {
        const content = this.fileOps.readFile(filePath);
        
        // 檢查 getContract() 調用
        const getContractMatches = content.match(/getContract\s*\(\s*['"`](\w+)['"`]\s*\)/g);
        if (getContractMatches) {
          // 判斷是否應該使用 getContractWithABI
          const needsABI = this.shouldUseABI(content);
          if (needsABI) {
            issues.push(`${filePath.replace(frontendSrcPath, 'src')}: 可能需要使用 getContractWithABI()`);
          }
        }
        
      } catch (error) {
        // 跳過無法讀取的文件
        continue;
      }
    }

    return issues;
  }

  shouldUseABI(content) {
    const abiIndicators = [
      /\.write/, /\.read/, /\.simulate/,
      /writeContract/, /readContract/, /simulateContract/,
      /useContractWrite/, /useContractRead/
    ];
    
    return abiIndicators.some(pattern => pattern.test(content));
  }

  async checkDirectAddressAccess() {
    const issues = [];
    const frontendSrcPath = PathResolver.getProjectPath('frontend') + '/src';
    
    const tsFiles = this.fileOps.findFiles(frontendSrcPath, /\.(ts|tsx)$/);
    
    for (const filePath of tsFiles) {
      if (filePath.includes('/archived/')) continue;
      
      try {
        const content = this.fileOps.readFile(filePath);
        
        // 檢查直接 CONTRACT_ADDRESSES 訪問
        const directMatches = content.match(/CONTRACT_ADDRESSES\s*\[\s*['"`](\w+)['"`]\s*\]/g);
        if (directMatches && directMatches.length > 0) {
          issues.push(`${filePath.replace(frontendSrcPath, 'src')}: 使用直接地址訪問 (${directMatches.length} 處)`);
        }
        
      } catch (error) {
        continue;
      }
    }

    return issues;
  }

  async validateFileIntegrity() {
    const issues = [];
    
    try {
      // 檢查必要配置文件是否存在
      const requiredFiles = [
        { project: 'contracts', config: 'masterConfig', description: '主配置文件' },
        { project: 'frontend', config: 'contracts', description: '前端合約配置' },
        { project: 'subgraph', config: 'yaml', description: '子圖配置文件' }
      ];

      for (const { project, config, description } of requiredFiles) {
        try {
          const filePath = PathResolver.getConfigFilePath(project, config);
          if (!this.fileOps.exists(filePath)) {
            issues.push(`缺少必要文件: ${description} (${filePath})`);
          }
        } catch (error) {
          issues.push(`文件完整性檢查失敗: ${description} - ${error.message}`);
        }
      }
      
    } catch (error) {
      issues.push(`文件完整性驗證失敗: ${error.message}`);
    }

    return { success: issues.length === 0, issues };
  }

  async generateValidationReport() {
    const validation = await this.validateAll();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        success: validation.success,
        totalIssues: validation.issues.length,
        categories: {
          address: validation.details.addressValidation.issues.length,
          config: validation.details.configConsistency.issues.length,
          code: validation.details.codeConsistency.issues.length,
          files: validation.details.fileIntegrity.issues.length
        }
      },
      issues: validation.issues,
      details: validation.details
    };

    return report;
  }
}

module.exports = ValidationEngine;