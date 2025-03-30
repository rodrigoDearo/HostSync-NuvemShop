const { contextBridge, ipcRenderer } = require('electron/renderer')

const WINDOW_API = {
    closeApp: () => ipcRenderer.send('close'),
    minimizeApp: () => ipcRenderer.send('minimize'),

    saveHost: (pathdb) => ipcRenderer.invoke('saveInfoHost', pathdb),
    saveTray: (url, code) => ipcRenderer.invoke('saveInfoTray', [url, code]),
    getInfoUser: (field) => ipcRenderer.invoke('getInfoUser', field),
    start: () => ipcRenderer.invoke('startProgram')
}

contextBridge.exposeInMainWorld('api', WINDOW_API)