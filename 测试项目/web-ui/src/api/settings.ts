import { api } from './base';
import type { Config } from '../types';

export const settingsApi = {
  // 获取设置
  getSettings: async (): Promise<Config> => {
    const { data } = await api.get('/settings');
    return data;
  },

  // 更新设置
  updateSettings: async (settings: Config): Promise<void> => {
    await api.put('/settings', settings);
  },

  // 清除缓存
  clearCache: async (): Promise<void> => {
    await api.post('/settings/clear-cache');
  }
}; 