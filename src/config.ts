export const CONFIG = {
  URLS: [
    'https://example.com/page1',
    'https://example.com/page2'
  ],
  OUTPUT_FILE: 'results.xlsx',
  SELECTORS: {
    TITLE: 'h1, .article-title, .post-title',
    CONTENT: '.main-content, .article-content, .post-content, article',
    TIMESTAMP: '.timestamp, .date, time, .published-date',
    FALLBACK_SELECTORS: {
      TITLE: ['header h1', '.header h1', '#title'],
      CONTENT: ['#content', '.content', 'main'],
      TIMESTAMP: ['.meta time', '.meta-date', '.post-meta time']
    }
  },
  CACHE_SETTINGS: {
    ENABLED: true,
    MAX_AGE: 24 * 60 * 60 * 1000, // 24小时
    MAX_ENTRIES: 1000
  },
  AI_SETTINGS: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    MAX_TEXT_LENGTH: 1000,
    SERVICES: {
      OPENAI: {
        ENABLED: true,
        PRIORITY: 1,
        MAX_TOKENS: 150,
        MODEL: 'gpt-3.5-turbo'
      },
      DEEPSEEK: {
        ENABLED: true,
        PRIORITY: 2,
        MAX_TOKENS: 150,
        MODEL: 'deepseek-chat'
      },
      GEMINI: {
        ENABLED: true,
        PRIORITY: 3,
        MODEL: 'gemini-pro'
      }
    }
  },
  PERFORMANCE: {
    MAX_CONCURRENT_TASKS: 3,
    TASK_TIMEOUT: 60000,
    MEMORY_LIMIT: 512 * 1024 * 1024, // 512MB
    CAPTURE_SCREENSHOT: false,
    CLEANUP_INTERVAL: 3600000 // 1小时
  },
  BROWSER: {
    VIEWPORT: {
      WIDTH: 1280,
      HEIGHT: 800
    },
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    HEADERS: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  }
}; 