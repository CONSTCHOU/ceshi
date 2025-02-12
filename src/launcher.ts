import { InstallChecker } from './install-checker';
import { app } from './app';

async function launch() {
  try {
    // 检查环境
    await InstallChecker.checkAndInstall();

    // 启动应用
    app.start();
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

launch(); 