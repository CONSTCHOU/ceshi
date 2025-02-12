import { BUILD_CONFIG } from './build-config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { compare } from 'semver';

export class InstallChecker {
  static async checkAndInstall() {
    console.log('正在检查系统环境...');

    try {
      // 检查 Node.js 版本
      this.checkNodeVersion();

      // 检查系统资源
      await this.checkSystemResources();

      // 检查必需组件
      await this.checkComponents();

      // 创建必要的目录
      this.createDirectories();

      // 解压内置资源
      await this.extractBundledResources();

      console.log('环境检查完成！');
    } catch (error) {
      console.error('环境检查失败:', error);
      throw error;
    }
  }

  private static checkNodeVersion() {
    const currentVersion = process.version;
    if (compare(currentVersion, BUILD_CONFIG.RUNTIME_CHECKS.MIN_NODE_VERSION) < 0) {
      throw new Error(`Node.js 版本过低，需要 ${BUILD_CONFIG.RUNTIME_CHECKS.MIN_NODE_VERSION} 或更高版本`);
    }
  }

  private static async checkSystemResources() {
    // 检查内存
    const { freemem } = require('os');
    const availableMemory = freemem();
    if (availableMemory < BUILD_CONFIG.RUNTIME_CHECKS.MIN_MEMORY) {
      throw new Error(`系统内存不足，需要至少 ${BUILD_CONFIG.RUNTIME_CHECKS.MIN_MEMORY / 1024 / 1024}MB 可用内存`);
    }

    // 检查磁盘空间
    const { checkDiskSpace } = require('check-disk-space');
    const { free: freeDiskSpace } = await checkDiskSpace(process.cwd());
    if (freeDiskSpace < BUILD_CONFIG.RUNTIME_CHECKS.MIN_DISK_SPACE) {
      throw new Error(`磁盘空间不足，需要至少 ${BUILD_CONFIG.RUNTIME_CHECKS.MIN_DISK_SPACE / 1024 / 1024}MB 可用空间`);
    }
  }

  private static async checkComponents() {
    for (const [key, component] of Object.entries(BUILD_CONFIG.REQUIRED_COMPONENTS)) {
      console.log(`检查 ${component.name}...`);
      try {
        if (!await component.check()) {
          console.log(`${component.name} 未安装，正在安装...`);
          await component.install();
          console.log(`${component.name} 安装完成`);
        }
      } catch (error) {
        throw new Error(`安装 ${component.name} 失败: ${error.message}`);
      }
    }
  }

  private static createDirectories() {
    const dirs = [
      'logs',
      'data',
      'screenshots',
      'temp',
      'config',
      'resources',
      'public'
    ];

    dirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  private static async extractBundledResources() {
    const { extract } = require('extract-zip');
    const resourcesPath = path.join(process.cwd(), 'resources.zip');

    if (fs.existsSync(resourcesPath)) {
      console.log('正在解压资源文件...');
      try {
        await extract(resourcesPath, { 
          dir: process.cwd(),
          onEntry: (entry: any) => {
            console.log(`解压: ${entry.fileName}`);
          }
        });
        console.log('资源文件解压完成');
      } catch (error) {
        throw new Error(`解压资源文件失败: ${error.message}`);
      }
    }
  }

  private static checkVersions() {
    const versions = {
      node: process.version,
      npm: execSync('npm --version').toString().trim(),
      chrome: execSync('chromium --version').toString().trim()
    };
    console.log('环境版本:', versions);
    return versions;
  }
} 