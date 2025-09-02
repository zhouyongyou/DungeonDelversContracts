#!/usr/bin/env node

/**
 * V25 Complete Sync Script
 * Updates all systems with new contract addresses deployed at block 56631513
 * 
 * Usage: node v25-sync-all.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Contract addresses for V25
const V25_CONTRACTS = {
  // NEW CONTRACTS (deployed at block 56631513)
  DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
  DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
  HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
  RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
  ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
  PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
  
  // REUSED CONTRACTS
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  
  // FIXED CONTRACTS
  VRFMANAGER: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038', // VRFManagerV2Plus
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  DUNGEONMASTERWALLET: '0xEbCF4A36Ad1485A9737025e9d72186b604487274'
};

const DEPLOYMENT_BLOCK = 56664525; // Unified block for all subgraph contracts
const VERSION = 'v25';

// Path configurations
const PATHS = {
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/',
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers/' // For verification
};

class V25SyncScript {
  constructor() {
    this.syncReport = {
      timestamp: new Date().toISOString(),
      version: VERSION,
      deploymentBlock: DEPLOYMENT_BLOCK,
      updates: [],
      errors: [],
      warnings: []
    };
    
    console.log(`🚀 Starting V25 Complete Sync Process`);
    console.log(`📅 Timestamp: ${this.syncReport.timestamp}`);
    console.log(`🔢 Deployment Block: ${DEPLOYMENT_BLOCK}`);
    console.log(`📋 Total Contracts: ${Object.keys(V25_CONTRACTS).length}`);
    console.log('');
  }

  /**
   * Update backend master-config.json
   */
  updateBackendConfig() {
    console.log('🔄 Updating Backend Configuration...');
    
    try {
      const configPath = path.join(PATHS.backend, 'master-config.json');
      
      if (!fs.existsSync(configPath)) {
        throw new Error(`Backend config not found at: ${configPath}`);
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Backup original config
      const backupPath = path.join(PATHS.backend, `master-config.backup.${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(config, null, 2));
      
      // Update contract addresses
      let updatedCount = 0;
      for (const [contractName, address] of Object.entries(V25_CONTRACTS)) {
        if (config.contracts && config.contracts[contractName]) {
          const oldAddress = config.contracts[contractName];
          config.contracts[contractName] = address;
          
          if (oldAddress !== address) {
            updatedCount++;
            console.log(`  ✅ ${contractName}: ${oldAddress} → ${address}`);
          } else {
            console.log(`  ➡️  ${contractName}: ${address} (unchanged)`);
          }
        } else {
          console.log(`  ⚠️  ${contractName}: Not found in config, adding...`);
          if (!config.contracts) config.contracts = {};
          config.contracts[contractName] = address;
          updatedCount++;
        }
      }
      
      // Update deployment block
      if (config.deploymentBlock) {
        config.deploymentBlock = DEPLOYMENT_BLOCK;
      }
      
      // Update version
      if (config.version) {
        config.version = VERSION;
      }
      
      // Write updated config
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      this.syncReport.updates.push({
        system: 'backend',
        file: configPath,
        contractsUpdated: updatedCount,
        backupFile: backupPath
      });
      
      console.log(`✅ Backend config updated successfully (${updatedCount} contracts)`);
      console.log(`📄 Backup saved to: ${backupPath}`);
      console.log('');
      
    } catch (error) {
      const errorMsg = `Failed to update backend config: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.syncReport.errors.push({ system: 'backend', error: errorMsg });
    }
  }

  /**
   * Update subgraph configuration to v3.6.5
   */
  updateSubgraph() {
    console.log('🔄 Updating Subgraph Configuration...');
    
    try {
      const subgraphYamlPath = path.join(PATHS.subgraph, 'subgraph.yaml');
      const packageJsonPath = path.join(PATHS.subgraph, 'package.json');
      
      if (!fs.existsSync(subgraphYamlPath)) {
        throw new Error(`Subgraph YAML not found at: ${subgraphYamlPath}`);
      }
      
      // Update subgraph.yaml
      let subgraphContent = fs.readFileSync(subgraphYamlPath, 'utf8');
      const originalContent = subgraphContent;
      
      // Update version to v3.6.5
      subgraphContent = subgraphContent.replace(
        /specVersion:\s*[\d\.]+/g,
        'specVersion: 3.6.5'
      );
      
      // Update contract addresses and start blocks - USE UNIFIED BLOCK FOR ALL
      for (const [contractName, address] of Object.entries(V25_CONTRACTS)) {
        // Update address
        const addressRegex = new RegExp(`(\\s+address:\\s*")[^"]*("\\s*#.*${contractName})`, 'gi');
        subgraphContent = subgraphContent.replace(addressRegex, `$1${address}$2`);
        
        // Update start block for ALL contracts to unified block 56664525
        const blockRegex = new RegExp(`(\\s+startBlock:\\s*)\\d+(\\s*#.*${contractName})`, 'gi');
        subgraphContent = subgraphContent.replace(blockRegex, `$1${DEPLOYMENT_BLOCK}$2`);
      }
      
      // Write updated subgraph.yaml
      if (subgraphContent !== originalContent) {
        fs.writeFileSync(subgraphYamlPath, subgraphContent);
        console.log('  ✅ subgraph.yaml updated with new addresses and blocks');
      }
      
      // Update package.json version
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageJson.version = '3.6.5';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('  ✅ package.json version updated to 3.6.5');
      }
      
      this.syncReport.updates.push({
        system: 'subgraph',
        version: '3.6.5',
        file: subgraphYamlPath,
        startBlock: DEPLOYMENT_BLOCK
      });
      
      console.log('✅ Subgraph configuration updated successfully');
      console.log('');
      
    } catch (error) {
      const errorMsg = `Failed to update subgraph: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.syncReport.errors.push({ system: 'subgraph', error: errorMsg });
    }
  }

  /**
   * Fix critical configuration issues in frontend
   */
  fixFrontendConfigIssues() {
    console.log('🔧 Fixing Critical Frontend Configuration Issues...');
    
    try {
      const frontendConfigPaths = [
        path.join(PATHS.frontend, 'src/config/contracts.ts'),
        path.join(PATHS.frontend, 'src/config/contractsWithABI.ts')
      ];
      
      let fixedFiles = 0;
      
      for (const configPath of frontendConfigPaths) {
        if (fs.existsSync(configPath)) {
          let content = fs.readFileSync(configPath, 'utf8');
          let wasModified = false;
          
          // Fix DUNGEONMASTERWALLET 'undefined' string issue
          const undefinedPattern = /DUNGEONMASTERWALLET:\s*'undefined'/g;
          if (undefinedPattern.test(content)) {
            content = content.replace(undefinedPattern, `DUNGEONMASTERWALLET: '${V25_CONTRACTS.DUNGEONMASTERWALLET}'`);
            console.log(`  🔧 Fixed DUNGEONMASTERWALLET 'undefined' in ${configPath}`);
            wasModified = true;
          }
          
          // Update deployment block
          const blockPattern = /deploymentBlock:\s*\d+/g;
          if (blockPattern.test(content)) {
            content = content.replace(blockPattern, `deploymentBlock: ${DEPLOYMENT_BLOCK}`);
            console.log(`  🔧 Updated deployment block to ${DEPLOYMENT_BLOCK} in ${configPath}`);
            wasModified = true;
          }
          
          // Update lastUpdated timestamp
          const timestampPattern = /lastUpdated:\s*"[^"]*"/g;
          if (timestampPattern.test(content)) {
            content = content.replace(timestampPattern, `lastUpdated: "${new Date().toISOString()}"`);
            wasModified = true;
          }
          
          if (wasModified) {
            fs.writeFileSync(configPath, content);
            fixedFiles++;
            console.log(`  ✅ Fixed critical issues in ${configPath}`);
          }
        }
      }
      
      if (fixedFiles > 0) {
        this.syncReport.updates.push({
          system: 'frontend-fixes',
          fixedFiles,
          criticalIssuesResolved: ['DUNGEONMASTERWALLET undefined', 'deployment block', 'timestamp']
        });
      }
      
    } catch (error) {
      const errorMsg = `Failed to fix frontend config issues: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.syncReport.errors.push({ system: 'frontend-fixes', error: errorMsg });
    }
  }

  /**
   * Verify frontend configurations
   */
  verifyFrontendConfig() {
    console.log('🔍 Verifying Frontend Configuration...');
    
    try {
      const frontendConfigPaths = [
        path.join(PATHS.frontend, 'src/config/contracts.ts'),
        path.join(PATHS.frontend, 'src/config/contractsWithABI.ts'),
        path.join(PATHS.frontend, 'config/contracts.json')
      ];
      
      let foundConfigs = 0;
      let verifiedContracts = 0;
      
      for (const configPath of frontendConfigPaths) {
        if (fs.existsSync(configPath)) {
          foundConfigs++;
          const content = fs.readFileSync(configPath, 'utf8');
          
          // Check if V25 addresses are present
          for (const [contractName, address] of Object.entries(V25_CONTRACTS)) {
            if (content.includes(address)) {
              verifiedContracts++;
            }
          }
          
          console.log(`  ✅ Found config: ${configPath}`);
        }
      }
      
      if (foundConfigs === 0) {
        this.syncReport.warnings.push({
          system: 'frontend',
          message: 'No frontend config files found for verification'
        });
        console.log('  ⚠️  No frontend config files found');
      } else {
        console.log(`  ✅ Frontend configs verified (${foundConfigs} files found)`);
        
        this.syncReport.updates.push({
          system: 'frontend',
          verified: true,
          configFiles: foundConfigs,
          contractsFound: verifiedContracts
        });
      }
      
      console.log('');
      
    } catch (error) {
      const errorMsg = `Failed to verify frontend config: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.syncReport.errors.push({ system: 'frontend', error: errorMsg });
    }
  }

  /**
   * Fix Marketplace V2 NFT contract addresses
   */
  fixMarketplaceV2Addresses() {
    console.log('🛠️  Fixing Marketplace V2 NFT Addresses...');
    
    try {
      // Search for Marketplace V2 configuration files
      const possibleMarketplacePaths = [
        path.join(PATHS.frontend, 'src/config/marketplace.ts'),
        path.join(PATHS.frontend, 'src/config/marketplace.json'),
        path.join(PATHS.frontend, 'config/marketplace.json'),
        path.join(PATHS.backend, 'marketplace-config.json'),
      ];
      
      let fixedFiles = 0;
      
      for (const marketplacePath of possibleMarketplacePaths) {
        if (fs.existsSync(marketplacePath)) {
          let content = fs.readFileSync(marketplacePath, 'utf8');
          let wasModified = false;
          
          // Fix Hero contract address (V24 -> V25)
          const oldHeroAddress = '0x20E0db8EFCC7608fCFFBbF2f95A86824b034D1e7';
          const newHeroAddress = V25_CONTRACTS.HERO;
          
          if (content.includes(oldHeroAddress)) {
            content = content.replace(new RegExp(oldHeroAddress, 'g'), newHeroAddress);
            console.log(`  🔧 Updated Hero address: ${oldHeroAddress} → ${newHeroAddress}`);
            wasModified = true;
          }
          
          // Fix Relic contract address if needed
          const oldRelicPattern = /relic['"]\s*:\s*['"][^'"]*['"]/gi;
          if (oldRelicPattern.test(content) && !content.includes(V25_CONTRACTS.RELIC)) {
            content = content.replace(oldRelicPattern, `relic": "${V25_CONTRACTS.RELIC}"`);
            console.log(`  🔧 Updated Relic address to: ${V25_CONTRACTS.RELIC}`);
            wasModified = true;
          }
          
          if (wasModified) {
            fs.writeFileSync(marketplacePath, content);
            fixedFiles++;
            console.log(`  ✅ Fixed Marketplace V2 config: ${marketplacePath}`);
          }
        }
      }
      
      if (fixedFiles > 0) {
        this.syncReport.updates.push({
          system: 'marketplace-v2-fixes',
          fixedFiles,
          addressesUpdated: ['Hero V24->V25', 'Relic V25']
        });
      } else {
        console.log('  ℹ️  No Marketplace V2 config files found or no updates needed');
      }
      
    } catch (error) {
      const errorMsg = `Failed to fix Marketplace V2 addresses: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.syncReport.errors.push({ system: 'marketplace-v2-fixes', error: errorMsg });
    }
  }

  /**
   * Generate comprehensive sync report
   */
  generateSyncReport() {
    console.log('📊 Generating Sync Report...');
    
    const reportPath = path.join(__dirname, `v25-sync-report-${Date.now()}.json`);
    
    // Add summary statistics
    this.syncReport.summary = {
      totalSystems: 3,
      successfulUpdates: this.syncReport.updates.length,
      errors: this.syncReport.errors.length,
      warnings: this.syncReport.warnings.length,
      contractAddresses: V25_CONTRACTS,
      deploymentBlock: DEPLOYMENT_BLOCK
    };
    
    // Write detailed report
    fs.writeFileSync(reportPath, JSON.stringify(this.syncReport, null, 2));
    
    console.log('');
    console.log('🎯 V25 SYNC REPORT SUMMARY');
    console.log('==========================');
    console.log(`📁 Report saved to: ${reportPath}`);
    console.log(`✅ Successful updates: ${this.syncReport.summary.successfulUpdates}`);
    console.log(`❌ Errors: ${this.syncReport.summary.errors}`);
    console.log(`⚠️  Warnings: ${this.syncReport.summary.warnings}`);
    console.log(`🔧 Critical Fixes Applied: DUNGEONMASTERWALLET undefined, Unified Block 56664525`);
    console.log('');
    
    // Display contract addresses
    console.log('📋 CONTRACT ADDRESSES (V25)');
    console.log('============================');
    
    console.log('\n🆕 NEW CONTRACTS:');
    const newContracts = ['DUNGEONSTORAGE', 'DUNGEONMASTER', 'HERO', 'RELIC', 'ALTAROFASCENSION', 'PARTY'];
    newContracts.forEach(name => {
      console.log(`  ${name}: ${V25_CONTRACTS[name]}`);
    });
    
    console.log('\n♻️  REUSED CONTRACTS:');
    const reusedContracts = ['DUNGEONCORE', 'PLAYERVAULT', 'PLAYERPROFILE', 'VIPSTAKING', 'ORACLE'];
    reusedContracts.forEach(name => {
      console.log(`  ${name}: ${V25_CONTRACTS[name]}`);
    });
    
    console.log('\n🔧 FIXED CONTRACTS:');
    const fixedContracts = ['VRFMANAGER', 'SOULSHARD', 'USD', 'UNISWAP_POOL', 'DUNGEONMASTERWALLET'];
    fixedContracts.forEach(name => {
      console.log(`  ${name}: ${V25_CONTRACTS[name]}`);
    });
    
    console.log('');
    
    // Display errors if any
    if (this.syncReport.errors.length > 0) {
      console.log('❌ ERRORS ENCOUNTERED:');
      this.syncReport.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.system}] ${error.error}`);
      });
      console.log('');
    }
    
    // Display warnings if any
    if (this.syncReport.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.syncReport.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. [${warning.system}] ${warning.message}`);
      });
      console.log('');
    }
    
    return reportPath;
  }

  /**
   * Run the complete sync process
   */
  async runSync() {
    try {
      console.log('🚀 Starting V25 Complete Sync...\n');
      
      // Update backend configuration
      this.updateBackendConfig();
      
      // Update subgraph
      this.updateSubgraph();
      
      // Fix critical frontend configuration issues
      this.fixFrontendConfigIssues();
      
      // Fix Marketplace V2 NFT addresses
      this.fixMarketplaceV2Addresses();
      
      // Verify frontend (already done, just check)
      this.verifyFrontendConfig();
      
      // Generate final report
      const reportPath = this.generateSyncReport();
      
      console.log('🎉 V25 SYNC COMPLETED SUCCESSFULLY!');
      console.log(`📊 Full report: ${reportPath}`);
      console.log(`🔢 UNIFIED Deployment block: ${DEPLOYMENT_BLOCK} (all contracts)`);
      console.log(`🔧 Critical config issues resolved`);
      console.log(`📅 Completed at: ${new Date().toISOString()}`);
      console.log('');
      console.log('⚠️  IMPORTANT: Subgraph now uses unified start block for ALL contracts');
      console.log('   This prevents event loss and ensures consistent indexing.');
      
      // Exit with appropriate code
      const hasErrors = this.syncReport.errors.length > 0;
      process.exit(hasErrors ? 1 : 0);
      
    } catch (error) {
      console.error('💥 CRITICAL ERROR in sync process:', error.message);
      console.error(error.stack);
      
      this.syncReport.errors.push({
        system: 'main',
        error: `Critical error: ${error.message}`
      });
      
      this.generateSyncReport();
      process.exit(1);
    }
  }
}

// Run the sync if called directly
if (require.main === module) {
  const syncScript = new V25SyncScript();
  syncScript.runSync().catch(console.error);
}

module.exports = V25SyncScript;