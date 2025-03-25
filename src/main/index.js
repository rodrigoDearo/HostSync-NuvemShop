const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('node:path')

const { saveInfos, returnValueFromJson } = require('./utils/manageInfoUser.js')
const { createDependencies, limparTabela } = require('./utils/dependenciesFDB.js')
const { copyJsonFilesToUserData, returnConfigToAccessDB, gravarLog, deleteErrorsRecords } = require('./utils/auxFunctions.js')
const { requireAllProducts } = require('./utils/managerProducts.js')
const { requireAllCustomers } = require('./utils/managerCustomers.js')
const { readNewRecords } = require('./utils/managerHostTableNotify.js')
const { managementRequestsSales } = require('./utils/managerSales.js')

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
 // copyJsonFilesToUserData()
  createWindow()

  const icon = path.join(__dirname, './img/icon_noBG.png')
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

ipcMain.handle('saveInfoNuvemShop', async (events, args) => {
  events.preventDefault();
  await saveInfos('nuvemshop', args)
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
      let mensageReturn = await requireAllCustomers(config)
      if(mensageReturn.code == 500){
        reject(mensageReturn)
      }
    }) 
    .then(async () => {
      setInterval(async () => {
        await readNewRecords(config)
        .then(async () => {
            await managementRequestsSales(config)
        })
        .then(() => {
          gravarLog('---------------------------------------------------------------------')
          gravarLog('REALIZADO A LEITURA PERIODICA DA TABELA DE NOTIFICACOES E DAS VENDAS')
          gravarLog('---------------------------------------------------------------------')
        })
      
      }, 600000);
    })
  })
}
