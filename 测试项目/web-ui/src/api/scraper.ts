import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

export interface ScrapingTask {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    title: string;
    content: string;
    url: string;
    timestamp: string;
  };
  error?: string;
  createdAt: string;
}

export const scraperApi = {
  // 提交新的爬取任务
  submitTask: async (url: string): Promise<ScrapingTask> => {
    const { data } = await api.post('/tasks', { url });
    return data;
  },

  // 获取任务列表
  getTasks: async (): Promise<ScrapingTask[]> => {
    const { data } = await api.get('/tasks');
    return data;
  },

  // 获取单个任务详情
  getTask: async (id: string): Promise<ScrapingTask> => {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  // 下载结果
  downloadResult: async (id: string): Promise<Blob> => {
    const { data } = await api.get(`/tasks/${id}/download`, {
      responseType: 'blob'
    });
    return data;
  }
}; 