const { app, BrowserWindow, Menu, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false, // For dev; set to true and update preload for prod security
      webSecurity: false // For dev; set to true for prod
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../frontend/build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(startUrl);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create menu template
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Incident',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('menu-new-incident');
        }
      },
      {
        label: 'New Patrol',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('menu-new-patrol');
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          mainWindow.webContents.send('menu-settings');
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Security',
    submenu: [
      {
        label: 'Emergency Alert',
        accelerator: 'F12',
        click: () => {
          mainWindow.webContents.send('menu-emergency-alert');
        }
      },
      {
        label: 'Lockdown',
        accelerator: 'F11',
        click: () => {
          mainWindow.webContents.send('menu-lockdown');
        }
      },
      { type: 'separator' },
      {
        label: 'Security Dashboard',
        accelerator: 'F1',
        click: () => {
          mainWindow.webContents.send('menu-security-dashboard');
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About PROPER 2.9',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About PROPER 2.9',
            message: 'PROPER 2.9 - AI-Enhanced Hotel Security Platform',
            detail: 'Version 1.0.0\nAI-Powered Hotel Security Management System\n\n© 2024 PROPER 2.9 Team'
          });
        }
      },
      {
        label: 'Documentation',
        click: () => {
          require('electron').shell.openExternal('https://proper29.com/docs');
        }
      },
      {
        label: 'Support',
        click: () => {
          require('electron').shell.openExternal('https://proper29.com/support');
        }
      }
    ]
  }
];

// Build menu
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// App event handlers
app.on('ready', () => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers for backend communication
ipcMain.handle('get-backend-status', async () => {
  try {
    const response = await fetch('http://localhost:8000/health');
    return { status: 'connected', data: await response.json() };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
});

ipcMain.handle('start-backend', async () => {
  // This would typically start the Python backend process
  // For now, we'll just return a status
  return { status: 'started' };
});

// Optional: Custom protocol for local files (advanced asset loading)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true } }
]);

app.on('ready', () => {
  if (process.env.NODE_ENV !== 'development') {
    protocol.interceptFileProtocol('file', (request, callback) => {
      let reqUrl = request.url.substr(7); // Strip 'file://'
      if (reqUrl.indexOf('electron/preload.js') > -1) {
        reqUrl = path.join(__dirname, 'preload.js');
      } else if (reqUrl.indexOf('frontend/build') > -1) {
        reqUrl = path.join(__dirname, '../frontend/build', path.basename(reqUrl));
      }
      callback({ path: reqUrl });
    });
  }
}); 