import { BUILD_CONFIG } from '../src/build-config';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import { create as createArchiver } from 'archiver';
import { create as createInstaller } from 'electron-winstaller';

async function buildProject() {
  try {
    console.log('开始构建项目...');

    // 检查环境
    await checkEnvironment();

    // 清理目录
    await cleanDirectories();

    // 构建前端
    await buildFrontend();

    // 构建后端
    await buildBackend();

    // 打包资源
    await packageResources();

    // 创建可执行文件
    await createExecutable();

    // 创建安装程序
    await createInstallerPackage();

    console.log('构建完成！');
  } catch (error) {
    console.error('构建失败:', error);
    // 清理临时文件
    await cleanup();
    process.exit(1);
  }
}

async function checkEnvironment() {
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  if (compare(nodeVersion, BUILD_CONFIG.RUNTIME_CHECKS.MIN_NODE_VERSION) < 0) {
    throw new Error(`需要 Node.js ${BUILD_CONFIG.RUNTIME_CHECKS.MIN_NODE_VERSION} 或更高版本`);
  }

  // 检查必要工具
  try {
    execSync('npm --version');
    execSync('node --version');
  } catch {
    throw new Error('请确保安装了 Node.js 和 npm');
  }
}

async function cleanDirectories() {
  const { OUTPUT_DIR, TEMP_DIR } = BUILD_CONFIG.PACKAGING;
  await fs.remove(OUTPUT_DIR);
  await fs.remove(TEMP_DIR);
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(TEMP_DIR);
}

async function buildFrontend() {
  console.log('构建前端...');
  execSync('cd web-ui && npm run build', { stdio: 'inherit' });
  await fs.copy('web-ui/dist', path.join(BUILD_CONFIG.PACKAGING.TEMP_DIR, 'public'));
}

async function buildBackend() {
  console.log('构建后端...');
  execSync('npm run build', { stdio: 'inherit' });
  await fs.copy('dist', BUILD_CONFIG.PACKAGING.TEMP_DIR);
}

async function packageResources() {
  console.log('打包资源...');
  const output = fs.createWriteStream('resources.zip');
  const archive = createArchiver('zip');

  archive.pipe(output);

  // 添加资源文件
  for (const [key, resource] of Object.entries(BUILD_CONFIG.BUNDLED_RESOURCES)) {
    archive.directory(resource.source, resource.target);
  }

  await archive.finalize();
}

async function createExecutable() {
  console.log('创建可执行文件...');
  execSync(`pkg . --targets node16-win-x64 --output ${path.join(BUILD_CONFIG.PACKAGING.OUTPUT_DIR, BUILD_CONFIG.PACKAGING.EXECUTABLE_NAME)}`, {
    stdio: 'inherit'
  });
}

async function createInstallerPackage() {
  console.log('创建安装程序...');
  await createInstaller({
    appDirectory: BUILD_CONFIG.PACKAGING.OUTPUT_DIR,
    outputDirectory: BUILD_CONFIG.PACKAGING.OUTPUT_DIR,
    exe: BUILD_CONFIG.PACKAGING.EXECUTABLE_NAME,
    setupExe: BUILD_CONFIG.PACKAGING.INSTALLER_NAME,
    noMsi: true,
    setupIcon: path.join('resources', 'icon.ico'),
    loadingGif: path.join('resources', 'installing.gif')
  });
}

async function cleanup() {
  const { TEMP_DIR } = BUILD_CONFIG.PACKAGING;
  if (fs.existsSync(TEMP_DIR)) {
    await fs.remove(TEMP_DIR);
  }
}

buildProject(); 