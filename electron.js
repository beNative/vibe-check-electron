const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  ipcMain.handle('get-api-key', () => process.env.API_KEY);

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
