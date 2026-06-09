const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

let mainWindow = null;

function startBackend() {
  const PORT = 3001;

  process.env.PORT = PORT;
  process.env.ELECTRON = 'true';
  process.env.NODE_ENV = 'production';

  if (!isDev) {
    process.env.DB_PATH = path.join(app.getPath('userData'), 'riverflow.db');
    process.env.FRONTEND_DIST = path.join(process.resourcesPath, 'app', 'frontend', 'dist');

    process.env.NODE_PATH = path.join(__dirname, '..', 'node_modules');
    require('module').Module._initPaths();
  } else {
    process.env.DB_PATH = path.join(__dirname, '..', 'backend', 'riverflow.db');
    process.env.FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
  }

  const backendPath = isDev
    ? path.join(__dirname, '..', 'backend', 'app.js')
    : path.join(process.resourcesPath, 'app', 'backend', 'app.js');

  require(backendPath);
  return PORT;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#f8f9fa',
    icon: path.join(__dirname, '..', 'frontend', 'public', 'favicon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  const port = startBackend();

  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${port}`);
  }, 500);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false);
  });
}

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
