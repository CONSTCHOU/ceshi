export interface Config {
  AI_SETTINGS: {
    MAX_RETRIES: number;
    RETRY_DELAY: number;
    MAX_TEXT_LENGTH: number;
    SERVICES: {
      [key: string]: {
        ENABLED: boolean;
        PRIORITY: number;
        MAX_TOKENS: number;
        MODEL: string;
      };
    };
  };
  SELECTORS: {
    TITLE: string;
    CONTENT: string;
    TIMESTAMP: string;
    FALLBACK_SELECTORS: {
      TITLE: string[];
      CONTENT: string[];
      TIMESTAMP: string[];
    };
  };
  CACHE_SETTINGS: {
    ENABLED: boolean;
    MAX_AGE: number;
    MAX_ENTRIES: number;
  };
} 