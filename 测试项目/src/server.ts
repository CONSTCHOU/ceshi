import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { scrapeWebsite } from './browser-automation';
import * as fs from 'fs';
import { CONFIG } from './config';
import { scheduleJob } from 'node-schedule';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

interface Task {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ScrapedData;
  error?: string;
  resultFile?: string;
  createdAt: string;
}

// 存储任务
const tasks = new Map<string, Task>();

// 加载设置
let currentSettings = { ...CONFIG };
try {
  if (fs.existsSync('settings.json')) {
    currentSettings = JSON.parse(fs.readFileSync('settings.json', 'utf-8'));
  }
} catch (error) {
  console.error('加载设置失败:', error);
}

// 创建新任务
app.post('/api/tasks', async (req, res) => {
  const { url } = req.body;
  const taskId = uuidv4();
  
  const task = {
    id: taskId,
    url,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  tasks.set(taskId, task);

  // 异步执行爬取任务
  processScraping(taskId, url);

  res.json(task);
});

// 获取任务列表
app.get('/api/tasks', (req, res) => {
  res.json(Array.from(tasks.values()));
});

// 获取单个任务
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  res.json(task);
});

// 下载结果
app.get('/api/tasks/:id/download', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task || task.status !== 'completed') {
    res.status(404).json({ error: '结果不可用' });
    return;
  }
  
  res.download(task.resultFile);
});

// 获取设置
app.get('/api/settings', (req, res) => {
  res.json(currentSettings);
});

// 更新设置
app.put('/api/settings', (req, res) => {
  const newSettings = req.body;
  currentSettings = newSettings;
  
  try {
    fs.writeFileSync('settings.json', JSON.stringify(newSettings, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '保存设置失败' });
  }
});

// 清除缓存
app.post('/api/settings/clear-cache', (req, res) => {
  try {
    if (fs.existsSync('cache.json')) {
      fs.unlinkSync('cache.json');
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '清除缓存失败' });
  }
});

async function processScraping(taskId: string, url: string) {
  const task = tasks.get(taskId);
  if (!task) return;

  task.status = 'processing';
  tasks.set(taskId, task);

  try {
    const results = await scrapeWebsite(url);
    task.status = 'completed';
    task.result = results[0];
    task.resultFile = 'results.xlsx';
  } catch (error) {
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : 'Unknown error';
  }

  tasks.set(taskId, task);
}

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 定时清理任务
scheduleJob('0 * * * *', async () => {
  try {
    // 清理过期缓存
    const now = Date.now();
    const cacheEntries = Array.from(cache.entries());
    for (const [key, value] of cacheEntries) {
      if (now - value.timestamp > CONFIG.CACHE_SETTINGS.MAX_AGE) {
        cache.delete(key);
      }
    }
    
    // 清理旧的截图
    const screenshotsDir = 'screenshots';
    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir);
      for (const file of files) {
        const filePath = path.join(screenshotsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) { // 24小时
          fs.unlinkSync(filePath);
        }
      }
    }

    // 清理过期任务
    const taskEntries = Array.from(tasks.entries());
    for (const [id, task] of taskEntries) {
      if (task.status === 'completed' && 
          now - new Date(task.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000) { // 7天
        tasks.delete(id);
      }
    }

    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.error('清理任务失败:', error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 