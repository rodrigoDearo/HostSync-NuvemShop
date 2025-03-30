const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('node:path')

const { saveInfos, returnValueFromJson } = require('./utils/manageInfoUser.js')
const { createDependencies, limparTabela } = require('./utils/dependenciesFDB.js')
const { copyJsonFilesToUserData, returnConfigToAccessDB, gravarLog, deleteErrorsRecords } = require('./utils/auxFunctions.js')
const { requireAllProducts } = require('./utils/managerProducts.js')
const { readNewRecords } = require('./utils/managerHostTableNotify.js')
const { creatingAndUpdateAccessToken } = require('./utils/managerAccessTokenTray.js')

var win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 650,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'ipc/preload.js')
    },
    movable: false,
    resizable: false,
    autoHideMenuBar: true,
    frame: false,
    icon: path.join(__dirname, 'img/icon.png')
  })

  win.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.on('window-all-closed', () => {
  app.quit()
})

app.whenReady().then(() => {
  copyJsonFilesToUserData()
  createWindow()

  const icon = path.join(__dirname, 'img/icon.png')
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir', click: function(){
      win.show()
    }},
    { label: 'Minimizar', click: function(){
      win.hide();
    }},
    { label: 'Fechar', click: function(){
      app.quit() 
    }}
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setToolTip('Hostsync - PedOk')
})



// IPC

ipcMain.on('close', (events) => {
  events.preventDefault();
  app.quit()
})

ipcMain.on('minimize', (events) => {
  events.preventDefault();
  win.hide();
})

ipcMain.handle('saveInfoHost', async (events, args) => {
  events.preventDefault();
  await saveInfos('host', args)
  .then(() => {
    return
  })
})

ipcMain.handle('saveInfoTray', async (events, args) => {
  events.preventDefault();
  await saveInfos('tray', args)
  .then(() => {
    return
  })
})


ipcMain.handle('getInfoUser', async (events, args) => {
  const valueField = await returnValueFromJson(args)
  return valueField
})


ipcMain.handle('startProgram', async () => {
  gravarLog(' . . . Starting HostSync  . . .')

  await mainProcess()
  .then((response) => {
    return response
  })
})


async function mainProcess(){
  return new Promise(async (resolve, reject) => {
    var config;
    await creatingAndUpdateAccessToken()

    await returnConfigToAccessDB()
    .then(async (response) => {
      config = response;
      await deleteErrorsRecords()
      let mensageReturn = await createDependencies(config)
      if(mensageReturn.code == 500){
        reject(mensageReturn)
      }
    })
    .then(async () => {
      let mensageReturn = await limparTabela(config)
      if(mensageReturn.code == 500){
        reject(mensageReturn)
      }
    })
    .then(async () => {
      let mensageReturn = await requireAllProducts(config)
      if(mensageReturn.code == 500){
        reject(mensageReturn)
      }
    })
    .then(async () => {
      setInterval(async () => {
        await readNewRecords(config)
        .then(() => {
          gravarLog('---------------------------------------------------------------------')
          gravarLog('REALIZADO A LEITURA PERIODICA DA TABELA DE NOTIFICACOES')
          gravarLog('---------------------------------------------------------------------')
        })
      
      }, 600000);
    })
  })
}



/**
 * VER MELHORIAS QUE COLOQUEI NO CELULAR SE VALEM A PENA

 */

