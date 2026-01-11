import { MiningPlan, Transaction } from './types';

export const APP_NAME = "Xphere Mining";
export const COIN_NAME = "XP";
export const MACHINE_NAME = "ASIC XP1";

export const MOCK_PLANS: MiningPlan[] = [
  {
    id: 'p1',
    name: 'Starter Node',
    machineName: 'ASIC XP1 Mini',
    priceUSDT: 100,
    hashrate: 10,
    dailyReturnXP: 1.2,
    description: '크라우드 마이닝 입문자를 위한 소규모 해시파워입니다.',
    imageUrl: 'https://picsum.photos/400/300?random=1'
  },
  {
    id: 'p2',
    name: 'Standard Node',
    machineName: 'ASIC XP1 Standard',
    priceUSDT: 500,
    hashrate: 55,
    dailyReturnXP: 7.5,
    description: '가장 인기 있는 스탠다드 플랜입니다. 안정적인 채굴량을 보장합니다.',
    imageUrl: 'https://picsum.photos/400/300?random=2'
  },
  {
    id: 'p3',
    name: 'Pro Cluster',
    machineName: 'ASIC XP1 Cluster',
    priceUSDT: 2000,
    hashrate: 230,
    dailyReturnXP: 32.0,
    description: '전문 채굴자를 위한 대용량 클러스터입니다. 높은 효율을 자랑합니다.',
    imageUrl: 'https://picsum.photos/400/300?random=3'
  },
  {
    id: 'p4',
    name: 'Xphere Master Node',
    machineName: 'ASIC XP1 Ultra',
    priceUSDT: 5000,
    hashrate: 650,
    dailyReturnXP: 92.5,
    description: '엔터프라이즈급 성능을 제공하는 마스터 노드입니다. 최고의 효율을 자랑합니다.',
    imageUrl: 'https://picsum.photos/400/300?random=4'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx_1', type: 'MINING_REWARD', amount: 7.5, currency: 'XP', status: 'COMPLETED', date: '2023-10-25' },
  { id: 'tx_2', type: 'MINING_REWARD', amount: 7.5, currency: 'XP', status: 'COMPLETED', date: '2023-10-24' },
  { id: 'tx_3', type: 'PURCHASE', amount: 500, currency: 'USDT', status: 'COMPLETED', date: '2023-10-23' },
  { id: 'tx_4', type: 'DEPOSIT', amount: 1000, currency: 'USDT', status: 'COMPLETED', date: '2023-10-23' },
];

export const CHART_DATA = [
  { name: '10/20', xp: 4.2 },
  { name: '10/21', xp: 5.1 },
  { name: '10/22', xp: 4.8 },
  { name: '10/23', xp: 7.5 }, // Purchased plan
  { name: '10/24', xp: 7.6 },
  { name: '10/25', xp: 7.5 },
  { name: '10/26', xp: 7.7 },
];