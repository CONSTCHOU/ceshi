import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export const BUILD_CONFIG = {
  // 必需的系统组件
  REQUIRED_COMPONENTS: {
    CHROME: {
      name: "Chromium",
      check: async () => {
        try {
          execSync('chromium --version');
          return true;
        } catch {
          return false;
        }
      },
      install: async () => {
        const { chromium } = require('playwright');
        await chromium.download();
      }
    },
    NODE_MODULES: {
      name: "依赖模块",
      check: () => {
        return fs.existsSync('node_modules');
      },
      install: async () => {
        execSync('npm install --production');
      }
    }
  },

  // 内置资源
  BUNDLED_RESOURCES: {
    CONFIG: {
      source: 'config.json',
      target: 'config/config.json'
    },
    TEMPLATES: {
      source: 'templates',
      target: 'resources/templates'
    },
    WEB_UI: {
      source: 'web-ui/dist',
      target: 'public'
    }
  },

  // 运行时检查
  RUNTIME_CHECKS: {
    MIN_MEMORY: 1024 * 1024 * 1024, // 1GB
    MIN_DISK_SPACE: 500 * 1024 * 1024, // 500MB
    MIN_NODE_VERSION: '14.0.0'
  },

  // 打包配置
  PACKAGING: {
    OUTPUT_DIR: 'dist',
    TEMP_DIR: '.temp',
    INSTALLER_NAME: 'ai-extractor-setup.exe',
    EXECUTABLE_NAME: 'ai-extractor.exe',
    INCLUDE_FILES: [
      'config/**/*',
      'resources/**/*',
      'public/**/*',
      'LICENSE',
      'README.md'
    ],
    EXCLUDE_PATTERNS: [
      '**/*.map',
      '**/*.ts',
      '**/tests/**',
      '**/node_modules/.cache/**'
    ]
  },

  // 添加错误处理配置
  ERROR_HANDLING: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 30000
  },

  // 添加日志配置
  LOGGING: {
    ENABLED: true,
    LEVEL: 'info',
    FILE: 'build.log'
  }
}; 