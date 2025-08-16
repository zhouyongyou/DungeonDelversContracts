// VIPStaking 子圖映射 - 修正版

import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Staked,
  UnstakeRequested,
  UnstakeClaimed,
  VIPStaking
} from "../generated/VIPStaking/VIPStaking"
import { User, VIPStake, VIPHistory } from "../generated/schema"

// ===== 處理解除質押請求（修正版）=====
export function handleUnstakeRequested(event: UnstakeRequested): void {
  let user = User.load(event.params.user.toHex())
  if (!user) return
  
  let vip = VIPStake.load(event.params.user.toHex())
  if (!vip) return
  
  // 更新質押金額（減少請求的金額，不是清零）
  vip.amount = vip.amount.minus(event.params.amount)
  vip.lastUpdatedAt = event.block.timestamp
  
  // ✅ 正確：基於剩餘金額重新計算 VIP 等級
  // 方案 A：從合約讀取（最準確）
  let vipContract = VIPStaking.bind(event.address)
  let levelResult = vipContract.try_getVipLevel(event.params.user)
  if (!levelResult.reverted) {
    vip.vipLevel = levelResult.value
  } else {
    // 方案 B：本地計算（如果無法從合約讀取）
    vip.vipLevel = calculateVIPLevel(vip.amount)
  }
  
  // 設置待領取信息
  vip.pendingUnstake = event.params.amount
  vip.unstakeAvailableAt = event.params.availableAt
  
  // VIP 卡永久保留
  vip.hasVIPCard = true
  // tokenId 不變
  
  // 更新用戶總質押
  user.totalStaked = user.totalStaked.minus(event.params.amount)
  user.currentVIPLevel = vip.vipLevel
  
  // 創建歷史記錄
  let history = new VIPHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  history.user = user.id
  history.action = "UNSTAKE_REQUEST"
  history.amount = event.params.amount
  history.remainingStake = vip.amount  // 記錄剩餘質押
  history.newVipLevel = vip.vipLevel   // 記錄新等級
  history.timestamp = event.block.timestamp
  history.txHash = event.transaction.hash
  
  user.save()
  vip.save()
  history.save()
}

// ===== 輔助函數：計算 VIP 等級 =====
function calculateVIPLevel(soulAmount: BigInt): i32 {
  // 這裡需要考慮 SOUL 的 USD 價值
  // 簡化版本：假設 1 SOUL = 1 USD
  
  // 轉換為 USD 值（18 位小數）
  let usdValue = soulAmount
  
  // 小於 100 USD 返回 0
  if (usdValue.lt(BigInt.fromI32(100).times(BigInt.fromI32(10).pow(18)))) {
    return 0
  }
  
  // 計算等級：sqrt(usdValue / 100)
  // 簡化計算
  let base = usdValue.div(BigInt.fromI32(100).times(BigInt.fromI32(10).pow(18)))
  let level = sqrt(base).toI32()
  
  return level > 255 ? 255 : level
}

// 簡化的平方根函數
function sqrt(value: BigInt): BigInt {
  if (value.lt(BigInt.fromI32(2))) {
    return value
  }
  
  let x = value
  let y = value.div(BigInt.fromI32(2)).plus(BigInt.fromI32(1))
  
  while (y.lt(x)) {
    x = y
    y = value.div(x).plus(x).div(BigInt.fromI32(2))
  }
  
  return x
}

// ===== 更新 Schema =====
/*
type VIPHistory @entity {
  id: ID!
  user: User!
  action: String!
  amount: BigInt!
  remainingStake: BigInt     # 新增：剩餘質押
  newVipLevel: Int           # 新增：操作後的 VIP 等級
  tokenId: BigInt
  timestamp: BigInt!
  txHash: Bytes!
}
*/