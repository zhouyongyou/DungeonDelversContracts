// utils/deployment-utils.ts
import * as fs from 'fs';
import * as path from 'path';

export interface DeploymentAddresses {
    DungeonCore?: string;
    DungeonStorage?: string;
    DungeonMaster?: string;
    DungeonMasterOld?: string;
    Hero?: string;
    Relic?: string;
    Party?: string;
    PlayerVault?: string;
    PlayerProfile?: string;
    VIPStaking?: string;
    SoulShard?: string;
    Oracle?: string;
    AltarOfAscension?: string;
}

const DEPLOYMENTS_FILE = path.join(__dirname, '../deployments.json');

export function readDeployments(): DeploymentAddresses {
    try {
        if (fs.existsSync(DEPLOYMENTS_FILE)) {
            const data = fs.readFileSync(DEPLOYMENTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn('無法讀取部署文件，返回空對象');
    }
    return {};
}

export function writeDeployments(deployments: DeploymentAddresses): void {
    try {
        fs.writeFileSync(DEPLOYMENTS_FILE, JSON.stringify(deployments, null, 2));
        console.log('部署地址已保存到:', DEPLOYMENTS_FILE);
    } catch (error) {
        console.error('保存部署地址失敗:', error);
    }
}

export function logDeployment(contractName: string, address: string): void {
    console.log(`${contractName} 部署在: ${address}`);
    const deployments = readDeployments();
    (deployments as any)[contractName] = address;
    writeDeployments(deployments);
}