const { contextBridge, ipcRenderer } = require('electron/renderer')

const WINDOW_API = {
    closeApp: () => ipcRenderer.send('close'),
    minimizeApp: () => ipcRenderer.send('minimize'),

    saveHost: (pathdb) => ipcRenderer.invoke('saveInfoHost', pathdb),
    saveNuvemShop: (code) => ipcRenderer.invoke('saveInfoNuvemShop', code),
    getInfoUser: (field) => ipcRenderer.invoke('getInfoUser', field),
    start: () => ipcRenderer.invoke('startProgram'),
    align: () => ipcRenderer.invoke('alignBase')
}

contextBridge.exposeInMainWorld('api', WINDOW_API)