// VIPStaking 子圖 mapping 更新

import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Staked,
  UnstakeRequested,
  UnstakeClaimed,
} from "../generated/VIPStaking/VIPStaking"
import { User, VIPStake, VIPHistory } from "../generated/schema"

// ===== 處理質押事件 =====
export function handleStaked(event: Staked): void {
  // 獲取或創建用戶
  let user = User.load(event.params.user.toHex())
  if (!user) {
    user = new User(event.params.user.toHex())
    user.totalStaked = BigInt.zero()
    user.vipFirstStakedAt = event.block.timestamp
  }
  
  // 獲取或創建 VIP 質押記錄
  let vipStake = VIPStake.load(event.params.user.toHex())
  if (!vipStake) {
    vipStake = new VIPStake(event.params.user.toHex())
    vipStake.user = user.id
    vipStake.amount = BigInt.zero()
    vipStake.firstStakedAt = event.block.timestamp
  }
  
  // 更新質押信息
  vipStake.amount = vipStake.amount.plus(event.params.amount)
  vipStake.tokenId = event.params.tokenId
  vipStake.lastUpdatedAt = event.block.timestamp
  
  // ✅ 重要：不再在 unstake 時清除 tokenId
  // VIP 卡永久保留
  
  // 計算 VIP 等級（需要從合約讀取或計算）
  vipStake.vipLevel = calculateVIPLevel(vipStake.amount)
  
  // 更新用戶總質押
  user.totalStaked = user.totalStaked.plus(event.params.amount)
  user.currentVIPLevel = vipStake.vipLevel
  user.hasVIPCard = true  // ✅ 新增：標記擁有 VIP 卡
  
  // 創建歷史記錄
  let history = new VIPHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  history.user = user.id
  history.action = "STAKE"
  history.amount = event.params.amount
  history.tokenId = event.params.tokenId
  history.timestamp = event.block.timestamp
  history.txHash = event.transaction.hash
  
  // 保存實體
  user.save()
  vipStake.save()
  history.save()
}

// ===== 處理解除質押請求 =====
export function handleUnstakeRequested(event: UnstakeRequested): void {
  let user = User.load(event.params.user.toHex())
  if (!user) return
  
  let vipStake = VIPStake.load(event.params.user.toHex())
  if (!vipStake) return
  
  // 更新質押金額
  vipStake.amount = vipStake.amount.minus(event.params.amount)
  vipStake.lastUpdatedAt = event.block.timestamp
  
  // 設置待領取信息
  vipStake.pendingUnstake = event.params.amount
  vipStake.unstakeAvailableAt = event.params.availableAt
  
  // ✅ 重要變更：即使 amount 變為 0，也不清除 tokenId
  // 舊邏輯：
  // if (vipStake.amount.equals(BigInt.zero())) {
  //   vipStake.tokenId = BigInt.zero()  ❌ 不再這樣做
  // }
  
  // 新邏輯：只更新等級
  vipStake.vipLevel = calculateVIPLevel(vipStake.amount)
  
  // 更新用戶信息
  user.totalStaked = user.totalStaked.minus(event.params.amount)
  user.currentVIPLevel = vipStake.vipLevel
  // user.hasVIPCard 保持 true，因為卡片不會被銷毀
  
  // 創建歷史記錄
  let history = new VIPHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  history.user = user.id
  history.action = "UNSTAKE_REQUEST"
  history.amount = event.params.amount
  history.timestamp = event.block.timestamp
  history.txHash = event.transaction.hash
  
  user.save()
  vipStake.save()
  history.save()
}

// ===== 處理解除質押領取 =====
export function handleUnstakeClaimed(event: UnstakeClaimed): void {
  let user = User.load(event.params.user.toHex())
  if (!user) return
  
  let vipStake = VIPStake.load(event.params.user.toHex())
  if (!vipStake) return
  
  // 清除待領取信息
  vipStake.pendingUnstake = BigInt.zero()
  vipStake.unstakeAvailableAt = BigInt.zero()
  vipStake.lastUpdatedAt = event.block.timestamp
  
  // 創建歷史記錄
  let history = new VIPHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  history.user = user.id
  history.action = "UNSTAKE_CLAIM"
  history.amount = event.params.amount
  history.timestamp = event.block.timestamp
  history.txHash = event.transaction.hash
  
  user.save()
  vipStake.save()
  history.save()
}

// ===== 輔助函數 =====

function calculateVIPLevel(amount: BigInt): i32 {
  // 簡化的計算邏輯
  // 實際應該考慮 USD 價值
  if (amount.lt(BigInt.fromI32(100).times(BigInt.fromI32(10).pow(18)))) {
    return 0
  }
  
  // 簡化計算：每 100 SOUL = 1 級
  let level = amount
    .div(BigInt.fromI32(100).times(BigInt.fromI32(10).pow(18)))
    .toI32()
  
  return level > 255 ? 255 : level
}

// ===== GraphQL Schema 更新 =====
/*
type User @entity {
  id: ID!
  totalStaked: BigInt!
  currentVIPLevel: Int!
  hasVIPCard: Boolean!  # 新增：是否擁有 VIP 卡
  vipFirstStakedAt: BigInt  # 新增：首次質押時間
  vipStake: VIPStake @derivedFrom(field: "user")
  vipHistory: [VIPHistory!]! @derivedFrom(field: "user")
}

type VIPStake @entity {
  id: ID!  # 用戶地址
  user: User!
  amount: BigInt!
  tokenId: BigInt!  # 不再清零
  vipLevel: Int!
  pendingUnstake: BigInt!
  unstakeAvailableAt: BigInt!
  firstStakedAt: BigInt!  # 新增：首次質押時間
  lastUpdatedAt: BigInt!
}

type VIPHistory @entity {
  id: ID!
  user: User!
  action: String!  # STAKE, UNSTAKE_REQUEST, UNSTAKE_CLAIM
  amount: BigInt!
  tokenId: BigInt
  timestamp: BigInt!
  txHash: Bytes!
}
*/