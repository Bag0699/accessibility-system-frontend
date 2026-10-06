import { api } from './api';
import type { UserPreferences } from '../types';

export const userService = {
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await api.get<UserPreferences>('/users/me/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: UserPreferences): Promise<UserPreferences> => {
    const response = await api.put<UserPreferences>('/users/me/preferences', preferences);
    return response.data;
  },
};
