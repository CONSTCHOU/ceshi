const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 复制必要的文件
const filesToCopy = [
  'config.json',
  'README.md',
  'LICENSE'
];

filesToCopy.forEach(file => {
  fs.copyFileSync(
    path.join(__dirname, '..', file),
    path.join(__dirname, '../dist', file)
  );
});

// 创建安装包
execSync('node scripts/create-installer.js'); 