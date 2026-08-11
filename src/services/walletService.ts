import { apiGet, apiPost, apiPut } from '../lib/api';

export interface CoinTransaction {
  id: string;
  user_id: string;
  order_id?: string;
  type: 'EARN' | 'REDEEM' | 'REFUND' | 'EXPIRE' | 'ADJUSTMENT';
  coins: number;
  description?: string;
  created_at: string;
}

export interface RewardSettings {
  reward_system_enabled: boolean;
  spend_per_coin: number;
  coins_per_rupee: number;
  max_redemption_percentage: number;
}

export interface UserWallet {
  id: string;
  user_id: string;
  coin_balance: number;
  rupee_value: number;
  settings: RewardSettings;
  recent_transactions: CoinTransaction[];
}

export interface CalculateRedemptionRequest {
  subtotal: number;
  coupon_discount?: number;
  coins_to_use?: number;
}

export interface CalculateRedemptionResponse {
  user_balance: number;
  coins_requested: number;
  allowed_coins: number;
  coin_discount: number;
  max_usable_coins: number;
  max_coin_discount: number;
  message: string;
}

export const walletService = {
  getWallet: (): Promise<UserWallet> =>
    apiGet<UserWallet>('/wallet'),

  getTransactions: (limit = 50, offset = 0): Promise<CoinTransaction[]> =>
    apiGet<CoinTransaction[]>(`/wallet/transactions?limit=${limit}&offset=${offset}`),

  calculateRedemption: (payload: CalculateRedemptionRequest): Promise<CalculateRedemptionResponse> =>
    apiPost<CalculateRedemptionResponse>('/wallet/calculate-redemption', payload),

  getRewardSettings: (): Promise<RewardSettings> =>
    apiGet<RewardSettings>('/admin/rewards/settings'),

  updateRewardSettings: (settings: RewardSettings): Promise<RewardSettings> =>
    apiPut<RewardSettings>('/admin/rewards/settings', settings),

  adminAdjustCoins: (user_id: string, coins: number, reason: string): Promise<CoinTransaction> =>
    apiPost<CoinTransaction>('/admin/rewards/adjust', { user_id, coins, reason }),
};
