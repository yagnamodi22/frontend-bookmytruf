import api from './api';

export const siteSettingsService = {
  getAll: async () => {
    const res = await api.get('/site-settings');
    return res.data;
  },

  getMap: async () => {
    const res = await api.get('/site-settings/map');
    return res.data; // { key: value }
  },

  upsert: async (key, value, type = 'text') => {
    // Prefer JSON body to avoid URL-length/coding issues
    const res = await api.put(`/site-settings/${encodeURIComponent(key)}`, { value, type });
    return res.data;
  },

  upsertBulk: async (map) => {
    const res = await api.put('/site-settings/bulk', map);
    return res.data;
  }
};


