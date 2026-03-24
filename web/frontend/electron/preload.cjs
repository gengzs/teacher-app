const { contextBridge, ipcRenderer } = require('electron');

let API_ORIGIN = 'http://127.0.0.1:3010';
try {
  const v = ipcRenderer.sendSync('get-api-origin-sync');
  if (typeof v === 'string' && v.startsWith('http')) {
    API_ORIGIN = v.replace(/\/$/, '');
  }
} catch (_) {}

contextBridge.exposeInMainWorld('__TEACHER_API_ORIGIN__', API_ORIGIN);
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getApiOrigin: () => ipcRenderer.invoke('get-api-origin')
});
