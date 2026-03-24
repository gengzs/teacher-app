const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// 让 Chromium 对回环地址不走系统代理（Clash 等否则可能拦掉 127.0.0.1）
app.commandLine.appendSwitch('proxy-bypass-list', '<loopback>');
if (!process.env.NO_PROXY) process.env.NO_PROXY = '127.0.0.1,localhost';
if (!process.env.no_proxy) process.env.no_proxy = process.env.NO_PROXY;

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';

let mainWindow = null;

/**
 * 桌面端 API 根地址（不含 /api，axios 会再拼 /api/...）
 * 优先级：环境变量 TEACHER_API_ORIGIN > 用户目录 api-origin.txt > 安装目录 resources/api-origin.txt > 本机默认
 */
function resolveDesktopApiOrigin() {
  const env = (process.env.TEACHER_API_ORIGIN || '').trim();
  if (env.startsWith('http')) return env.replace(/\/$/, '');

  const readFirstUrl = (filePath) => {
    if (!fs.existsSync(filePath)) return null;
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('http')) return line.replace(/\/$/, '');
    }
    return null;
  };

  try {
    const userFile = path.join(app.getPath('userData'), 'api-origin.txt');
    const fromUser = readFirstUrl(userFile);
    if (fromUser) return fromUser;
  } catch (_) {}

  if (app.isPackaged) {
    try {
      const resFile = path.join(process.resourcesPath, 'api-origin.txt');
      const fromRes = readFirstUrl(resFile);
      if (fromRes) return fromRes;
    } catch (_) {}
  }

  return 'http://127.0.0.1:3010';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '教师助手',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false,
    backgroundColor: '#f8f6f9'
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexHtml = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexHtml);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[Electron] 页面加载失败', code, desc, url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.on('get-api-origin-sync', (event) => {
    event.returnValue = resolveDesktopApiOrigin();
  });

  ipcMain.handle('get-api-origin', () => resolveDesktopApiOrigin());

  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('open-external', (event, url) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});

ipcMain.handle('get-app-path', () => app.getPath('userData'));
