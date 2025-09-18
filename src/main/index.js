const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('node:path')

const { saveInfos, returnValueFromJson } = require('./utils/manageInfoUser.js')
const { createDependencies, limparTabela } = require('./utils/dependenciesFDB.js')
const { copyJsonFilesToUserData, returnConfigToAccessDB, gravarLog, deleteErrorsRecords } = require('./utils/auxFunctions.js')
const { requireAllRegistersNuvem, requireAllProducts } = require('./utils/managerProducts.js')
const { readNewRecords } = require('./utils/managerHostTableNotify.js');
const { preparingGenerateToken } = require('./utils/preparingRequests.js')

var win;

let watchdogStarted = false;
let isRestarting = false;

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
  tray.setToolTip('Hostsync - Nuvem')
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
  const success = await preparingGenerateToken(args)
  return success
})


ipcMain.handle('getInfoUser', async (events, args) => {
  const valueField = await returnValueFromJson(args)
  return valueField
})

ipcMain.handle('startProgram', async () => {
  gravarLog(' . . . Starting HostSync  . . .')

  await mainProcess(true)
  .then((response) => {
    return response
  })
})


ipcMain.handle('startReadNotifyTable', async () => {
  gravarLog(' . . . Starting HostSync  . . .')

  await mainProcess(false)
  .then((response) => {
    return response
  })
})


ipcMain.handle('alignBase', async () => {
  gravarLog(' . . . Aligning Base  . . .')

  let numeroProdutosDeletados = await alignBase()
  return numeroProdutosDeletados
})


async function mainProcess(syncFull) {
  try {
    let config = await returnConfigToAccessDB();

    await deleteErrorsRecords();

    let mensageReturn = await createDependencies(config);
    if (mensageReturn.code == 500) {
      console.log(mensageReturn);
      throw mensageReturn;
    } else {
      console.log('1. DEPENDENCIAS CRIADAS COM SUCESSO!');
      gravarLog('1. DEPENDENCIAS CRIADAS COM SUCESSO!');
    }

    // ---------------- WATCHDOG ----------------
    if (!watchdogStarted) {
      watchdogStarted = true;
      setInterval(async () => {
        try {
          const data = new Date();
          data.setHours(data.getHours() - 3);
          const dataFormatada = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
          const logFileName = `log_${dataFormatada}.txt`;
          const logFilePath = path.join(pathLog, logFileName);

          if (fs.existsSync(logFilePath)) {
            const stats = fs.statSync(logFilePath);
            const lastModified = stats.mtime;
            const diffMinutes = (Date.now() - lastModified.getTime()) / 1000 / 60;

            if (diffMinutes > 10 && !isRestarting) {
              isRestarting = true; // trava para evitar múltiplas execuções
              gravarLog('WATCHDOG: Nenhuma atividade detectada nos últimos 10 minutos. Reiniciando integrador...');
              console.log('WATCHDOG: Reiniciando integrador...');

              try {
                await mainProcess(false); // reinicia sem limpar/sincronizar full
                gravarLog('WATCHDOG: Reinício concluído com sucesso.');
              } catch (err) {
                gravarLog(`WATCHDOG: Erro ao reiniciar - ${err.message}`);
              } finally {
                isRestarting = false; // libera para futuros reinícios
              }
            }
          }
        } catch (err) {
          console.error('Erro no watchdog:', err);
          gravarLog(`Erro no watchdog: ${err.message}`);
        }
      }, 15 * 60 * 1000); // 15 minutos
    }

    if (syncFull) {
      mensageReturn = await limparTabela(config);
      if (mensageReturn.code == 500) {
        console.log(mensageReturn);
        throw mensageReturn;
      } else {
        console.log('2. TABELA LIMPA COM SUCESSO!');
        gravarLog('2. TABELA LIMPA COM SUCESSO!');
      }

      mensageReturn = await requireAllProducts(config);
      if (mensageReturn.code == 500) {
        console.log(mensageReturn);
        throw mensageReturn;
      } else {
        console.log('PRODUTOS SINCRONIZADOS COM SUCESSO');
        gravarLog('PRODUTOS SINCRONIZADOS COM SUCESSO');
      }
    }

    // leitura periódica
    setInterval(async () => {
      await readNewRecords(config);
      gravarLog('---------------------------------------------------------------------');
      gravarLog('REALIZADO A LEITURA PERIODICA DA TABELA DE NOTIFICACOES');
      gravarLog('---------------------------------------------------------------------');
    }, 300000);

  } catch (err) {
    console.error('Erro no mainProcess:', err);
    gravarLog(`Erro no mainProcess: ${err.message}`);
    throw err;
  }
}


async function alignBase(){
  return new Promise(async (resolve, reject) => {
    await requireAllRegistersNuvem(0)
    .then(async (produtos) => {
      resolve(produtos)
    })
  })
}

//ver se esta subindo imagem
//ver se esta subindo variantes
//se nao tentar arrumar
