// PlayerVault 子圖映射文件設計
// 文件：src/player-vault.ts

import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  Deposited,
  Withdrawn, 
  GameSpending,
  ReferralSet,
  CommissionPaid,
  ReferralSetByUsername,
  UsernameRegistered,
  UsernameUpdated
} from "../generated/PlayerVault/PlayerVault"

import { 
  VaultTransaction, 
  ReferralRelation, 
  UsernameRegistry,
  Player 
} from "../generated/schema"

// ===== 資金流事件處理器 =====

export function handleDeposited(event: Deposited): void {
  // 創建存款交易記錄
  let transaction = new VaultTransaction(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  
  let player = getOrCreatePlayer(event.params.player)
  
  transaction.player = player.id
  transaction.type = "DEPOSIT"
  transaction.amount = event.params.amount
  transaction.taxAmount = BigInt.fromI32(0)
  transaction.timestamp = event.block.timestamp
  transaction.blockNumber = event.block.number
  transaction.txHash = event.transaction.hash
  
  // 更新玩家統計
  player.totalDeposited = player.totalDeposited.plus(event.params.amount)
  player.currentVaultBalance = player.currentVaultBalance.plus(event.params.amount)
  
  transaction.save()
  player.save()
}

export function handleWithdrawn(event: Withdrawn): void {
  let player = getOrCreatePlayer(event.params.player)
  
  // 創建提款交易記錄
  let transaction = new VaultTransaction(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  
  transaction.player = player.id
  transaction.amount = event.params.amount
  transaction.taxAmount = event.params.taxAmount
  transaction.timestamp = event.block.timestamp
  transaction.blockNumber = event.block.number
  transaction.txHash = event.transaction.hash
  
  // 判斷是普通提款還是推薦獎勵提款（根據 taxAmount）
  if (event.params.taxAmount.equals(BigInt.fromI32(0))) {
    // 推薦獎勵提款（免稅）
    transaction.type = "COMMISSION_WITHDRAW"
    player.totalCommissionWithdrawn = player.totalCommissionWithdrawn.plus(event.params.amount)
    player.currentCommissionBalance = player.currentCommissionBalance.minus(event.params.amount)
  } else {
    // 普通提款（有稅）
    transaction.type = "WITHDRAW"
    player.totalWithdrawn = player.totalWithdrawn.plus(event.params.amount)
    player.currentVaultBalance = player.currentVaultBalance.minus(event.params.amount.plus(event.params.taxAmount))
  }
  
  transaction.save()
  player.save()
}

export function handleGameSpending(event: GameSpending): void {
  let player = getOrCreatePlayer(event.params.player)
  
  // 創建遊戲消費記錄
  let transaction = new VaultTransaction(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  
  transaction.player = player.id
  transaction.type = "GAME_SPENDING"
  transaction.amount = event.params.amount
  transaction.taxAmount = BigInt.fromI32(0)
  transaction.spender = event.params.spender
  transaction.timestamp = event.block.timestamp
  transaction.blockNumber = event.block.number
  transaction.txHash = event.transaction.hash
  
  // 更新玩家統計
  player.totalGameSpent = player.totalGameSpent.plus(event.params.amount)
  player.currentVaultBalance = player.currentVaultBalance.minus(event.params.amount)
  
  transaction.save()
  player.save()
}

// ===== 推薦系統事件處理器 =====

export function handleReferralSet(event: ReferralSet): void {
  let user = getOrCreatePlayer(event.params.user)
  let referrer = getOrCreatePlayer(event.params.referrer)
  
  // 創建推薦關係
  let relation = new ReferralRelation(event.params.user.toHex())
  relation.user = user.id
  relation.referrer = referrer.id
  relation.setByUsername = false
  relation.createdAt = event.block.timestamp
  relation.totalCommissionEarned = BigInt.fromI32(0)
  
  // 更新玩家推薦者
  user.referrer = referrer.id
  
  relation.save()
  user.save()
}

export function handleReferralSetByUsername(event: ReferralSetByUsername): void {
  let user = getOrCreatePlayer(event.params.user)
  let referrer = getOrCreatePlayer(event.params.referrer)
  
  // 創建推薦關係（用戶名方式）
  let relation = new ReferralRelation(event.params.user.toHex())
  relation.user = user.id
  relation.referrer = referrer.id
  relation.setByUsername = true
  relation.referrerUsername = event.params.username
  relation.createdAt = event.block.timestamp
  relation.totalCommissionEarned = BigInt.fromI32(0)
  
  // 更新玩家推薦者
  user.referrer = referrer.id
  
  relation.save()
  user.save()
}

export function handleCommissionPaid(event: CommissionPaid): void {
  let referrer = getOrCreatePlayer(event.params.referrer)
  
  // 更新推薦關係的累計獎勵
  let relation = ReferralRelation.load(event.params.user.toHex())
  if (relation != null) {
    relation.totalCommissionEarned = relation.totalCommissionEarned.plus(event.params.amount)
    relation.save()
  }
  
  // 更新推薦者統計
  referrer.totalCommissionEarned = referrer.totalCommissionEarned.plus(event.params.amount)
  referrer.currentCommissionBalance = referrer.currentCommissionBalance.plus(event.params.amount)
  referrer.save()
}

// ===== 用戶名系統事件處理器 =====

export function handleUsernameRegistered(event: UsernameRegistered): void {
  let player = getOrCreatePlayer(event.params.user)
  let usernameLower = event.params.username.toLowerCase()
  
  // 創建用戶名註冊記錄
  let registry = new UsernameRegistry(usernameLower)
  registry.username = event.params.username
  registry.owner = player.id
  registry.registrationFee = BigInt.fromI32(10000000000000000) // 0.01 BNB in wei
  registry.createdAt = event.block.timestamp
  registry.updatedAt = event.block.timestamp
  registry.isActive = true
  
  // 更新玩家用戶名
  player.username = event.params.username
  
  registry.save()
  player.save()
}

export function handleUsernameUpdated(event: UsernameUpdated): void {
  let player = getOrCreatePlayer(event.params.user)
  
  // 停用舊用戶名
  let oldRegistry = UsernameRegistry.load(event.params.oldUsername.toLowerCase())
  if (oldRegistry != null) {
    oldRegistry.isActive = false
    oldRegistry.save()
  }
  
  // 創建新用戶名記錄
  let newUsernameLower = event.params.newUsername.toLowerCase()
  let newRegistry = new UsernameRegistry(newUsernameLower)
  newRegistry.username = event.params.newUsername
  newRegistry.owner = player.id
  newRegistry.registrationFee = BigInt.fromI32(10000000000000000) // 0.01 BNB
  newRegistry.createdAt = event.block.timestamp
  newRegistry.updatedAt = event.block.timestamp
  newRegistry.isActive = true
  
  // 更新玩家用戶名
  player.username = event.params.newUsername
  
  newRegistry.save()
  player.save()
}

// ===== 工具函數 =====

function getOrCreatePlayer(address: Bytes): Player {
  let player = Player.load(address)
  
  if (player == null) {
    player = new Player(address)
    // 初始化資金統計
    player.totalDeposited = BigInt.fromI32(0)
    player.totalWithdrawn = BigInt.fromI32(0)
    player.totalCommissionWithdrawn = BigInt.fromI32(0)
    player.totalGameSpent = BigInt.fromI32(0)
    player.currentVaultBalance = BigInt.fromI32(0)
    player.currentCommissionBalance = BigInt.fromI32(0)
    player.totalCommissionEarned = BigInt.fromI32(0)
    player.save()
  }
  
  return player as Player
}