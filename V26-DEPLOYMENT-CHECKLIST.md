
# V26 Deployment Checklist
======================================================================

## Pre-Deployment
- [ ] Fund all wallets according to instructions
- [ ] Backup .env.v26 and v26-keys-backup.json
- [ ] Verify no old private keys in codebase
- [ ] Update hardhat.config.js with new deployer key

## Deployment
- [ ] Deploy core contracts (Hero, Relic, Party)
- [ ] Deploy game contracts (DungeonMaster, Storage, Vault)
- [ ] Deploy utility contracts (PlayerProfile, VIP)
- [ ] Deploy VRF Manager
- [ ] Configure all contract connections
- [ ] Transfer ownership to OWNER wallet

## Post-Deployment
- [ ] Verify all contracts on BSCScan
- [ ] Update frontend with new addresses
- [ ] Test all major functions
- [ ] Set up monitoring for new contracts
- [ ] Revoke deployer permissions

## Security
- [ ] Store private keys in password manager
- [ ] Delete local .env.v26 after deployment
- [ ] Enable 2FA on all related services
- [ ] Set up Gnosis Safe for multi-sig (optional)
