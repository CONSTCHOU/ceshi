import { chromium, type Page, type Browser, type BrowserContext } from 'playwright';
import { Configuration, OpenAIApi } from 'openai';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { CONFIG } from './config';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// OpenAI 配置
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 缓存系统
const cache = new Map<string, ScrapedData>();
const CACHE_FILE = 'cache.json';

// 加载缓存
try {
  if (fs.existsSync(CACHE_FILE)) {
    const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    Object.entries(cacheData).forEach(([key, value]) => cache.set(key, value as ScrapedData));
  }
} catch (error) {
  console.error('加载缓存失败:', error);
}

// 保存缓存
function saveCache() {
  const cacheObj = Object.fromEntries(cache.entries());
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObj, null, 2));
}

// 文本预处理
function preprocessText(text: string): string {
  // 移除 HTML 标签
  text = text.replace(/<[^>]*>/g, ' ');
  // 移除多余空白
  text = text.replace(/\s+/g, ' ');
  // 移除特殊字符
  text = text.replace(/[^\w\s\u4e00-\u9fa5]/g, ' ');
  // 限制文本长度
  return text.slice(0, 1000);
}

// 使用选择器提取内容
async function extractWithSelectors(page: any): Promise<Partial<ScrapedData>> {
  const data: Partial<ScrapedData> = {};
  
  try {
    if (await page.$(CONFIG.SELECTORS.TITLE)) {
      data.title = await page.$eval(CONFIG.SELECTORS.TITLE, (el: any) => el.textContent.trim());
    }
    
    if (await page.$(CONFIG.SELECTORS.CONTENT)) {
      data.content = await page.$eval(CONFIG.SELECTORS.CONTENT, (el: any) => el.textContent.trim());
    }
    
    if (await page.$(CONFIG.SELECTORS.TIMESTAMP)) {
      data.timestamp = await page.$eval(CONFIG.SELECTORS.TIMESTAMP, (el: any) => el.textContent.trim());
    }
    
    data.url = await page.url();
  } catch (error) {
    console.error('选择器提取失败:', error);
  }
  
  return data;
}

// 重试机制
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`重试第 ${i + 1} 次...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('重试失败');
}

// AI 服务接口
interface AIService {
  extractContent(text: string): Promise<ScrapedData>;
}

// OpenAI 服务实现
class OpenAIService implements AIService {
  private openai: OpenAIApi;

  constructor(apiKey: string) {
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
  }

  async extractContent(text: string): Promise<ScrapedData> {
    const response = await this.openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个网页内容提取助手。请从提供的文本中提取标题、主要内容、URL和时间戳。"
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const result = response.data.choices[0].message?.content;
    return JSON.parse(result || '{}');
  }
}

// DeepSeek 服务实现
class DeepSeekService implements AIService {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL || 'https://api.deepseek.com/v1';
  }

  async extractContent(text: string): Promise<ScrapedData> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个网页内容提取助手。请从提供的文本中提取标题、主要内容、URL和时间戳。"
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('DeepSeek API 调用失败:', error);
      throw error;
    }
  }
}

// Gemini 服务实现
class GeminiService implements AIService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-pro') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async extractContent(text: string): Promise<ScrapedData> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      const prompt = `
        请从以下网页内容中提取关键信息，并以JSON格式返回：
        - title: 标题
        - content: 主要内容（限制在500字以内）
        - timestamp: 时间戳（如果有）
        
        网页内容：
        ${text}
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonStr = response.text();
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini API 调用失败:', error);
      throw error;
    }
  }
}

// AI 服务工厂
class AIServiceFactory {
  /**
   * 创建 AI 服务实例
   * @param type 服务类型 ('openai' | 'deepseek' | 'gemini')
   * @param options 可选配置
   * @returns AIService 实例
   * @throws 如果服务类型不支持或 API 密钥未设置
   */
  static createService(
    type: 'openai' | 'deepseek' | 'gemini',
    options?: { apiKey?: string; baseURL?: string; model?: string }
  ): AIService {
    const apiKey = options?.apiKey || process.env[`${type.toUpperCase()}_API_KEY`];
    
    if (!apiKey) {
      throw new Error(`${type.toUpperCase()}_API_KEY 未设置`);
    }

    switch (type) {
      case 'openai':
        return new OpenAIService(apiKey);
      case 'deepseek':
        return new DeepSeekService(apiKey, options?.baseURL);
      case 'gemini':
        return new GeminiService(apiKey, options?.model);
      default:
        throw new Error(`不支持的 AI 服务类型: ${type}`);
    }
  }
}

// 修改 extractContentWithAI 函数
async function extractContentWithAI(text: string, url: string): Promise<ScrapedData> {
  const cacheKey = text.slice(0, 100);
  if (cache.has(cacheKey)) {
    console.log('使用缓存数据');
    return cache.get(cacheKey)!;
  }

  const processedText = preprocessText(text);

  // 创建 AI 服务实例列表
  const services = [
    { name: 'openai', service: AIServiceFactory.createService('openai') },
    { name: 'deepseek', service: AIServiceFactory.createService('deepseek') },
    { name: 'gemini', service: AIServiceFactory.createService('gemini') }
  ].filter(({ name }) => CONFIG.AI_SETTINGS.SERVICES[name.toUpperCase()].ENABLED)
   .sort((a, b) => {
     const priorityA = CONFIG.AI_SETTINGS.SERVICES[a.name.toUpperCase()].PRIORITY;
     const priorityB = CONFIG.AI_SETTINGS.SERVICES[b.name.toUpperCase()].PRIORITY;
     return priorityA - priorityB;
   });

  let lastError: Error | null = null;

  // 依次尝试不同的 AI 服务
  for (const { name, service } of services) {
    try {
      console.log(`尝试使用 ${name} 服务...`);
      const extractedData = await withRetry(() => service.extractContent(processedText));
      
      // 补充 URL 信息
      extractedData.url = url;
      if (!extractedData.timestamp) {
        extractedData.timestamp = new Date().toISOString();
      }

      // 保存到缓存
      cache.set(cacheKey, extractedData);
      saveCache();

      console.log(`${name} 服务提取成功`);
      return extractedData;
    } catch (error) {
      console.error(`${name} 服务失败:`, error);
      lastError = error as Error;
      continue;
    }
  }

  // 所有服务都失败时返回默认值
  console.error('所有 AI 服务都失败了:', lastError);
  return {
    title: '',
    content: '',
    url: url,
    timestamp: new Date().toISOString()
  };
}

export interface ScrapedData {
  title: string;
  content: string;
  url: string;
  timestamp: string;
}

// 添加类型定义
interface PageExtractor {
  page: Page;
  browser: Browser;
  context: BrowserContext;
}

// 优化浏览器实例管理
class BrowserManager {
  private static instance: Browser | null = null;

  static async getInstance(): Promise<Browser> {
    if (!this.instance) {
      this.instance = await chromium.launch({
        headless: true // 生产环境使用无头模式
      });
    }
    return this.instance;
  }

  static async cleanup() {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }
}

// 优化页面提取逻辑
async function createPageExtractor(url: string): Promise<PageExtractor> {
  const browser = await BrowserManager.getInstance();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  return { page, browser, context };
}

export async function scrapeWebsite(url: string): Promise<ScrapedData[]> {
  let extractor: PageExtractor | null = null;
  const results: ScrapedData[] = [];

  try {
    extractor = await createPageExtractor(url);
    const { page } = extractor;

    // 设置页面超时
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);

    // 添加重试逻辑
    await withRetry(async () => {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    });

    // 等待关键元素
    try {
      await page.waitForSelector(CONFIG.SELECTORS.TITLE, { timeout: 5000 });
    } catch {
      // 尝试备用选择器
      for (const selector of CONFIG.SELECTORS.FALLBACK_SELECTORS.TITLE) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          break;
        } catch {
          continue;
        }
      }
    }

    // 智能滚动
    await autoScroll(page);

    // 截图（可配置）
    if (CONFIG.CAPTURE_SCREENSHOT) {
      await page.screenshot({ 
        path: `screenshots/${new Date().toISOString()}.png`,
        fullPage: true 
      });
    }

    const content = await page.content();
    const extractedData = await extractContentWithAI(content, url);
    results.push(extractedData);

    // 优化 Excel 生成
    await generateExcelReport(results);

  } catch (error) {
    console.error('爬取失败:', error);
    throw error;
  } finally {
    if (extractor) {
      await extractor.context.close();
    }
  }

  return results;
}

// 智能滚动函数
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// 优化 Excel 生成
async function generateExcelReport(data: ScrapedData[]): Promise<void> {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 优化列宽
  const columnWidths = [
    { wch: 30 }, // 标题列宽
    { wch: 50 }, // 内容列宽
    { wch: 30 }, // URL列宽
    { wch: 20 }, // 时间戳列宽
  ];
  worksheet['!cols'] = columnWidths;

  // 添加样式
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4A90E2" } },
    alignment: { horizontal: "center", vertical: "center" }
  };

  // 设置表头样式
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    worksheet[address].s = headerStyle;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scraped Data');
  
  // 使用时间戳作为文件名
  const filename = `results_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
  XLSX.writeFile(workbook, filename);
} 