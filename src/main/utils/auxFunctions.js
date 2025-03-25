const fs = require('fs')
const { app } = require('electron')
const path = require('node:path')

const { returnInfo } = require('../envManager');
const { returnValueFromJson } = require('./manageInfoUser');
const { error } = require('node:console');

const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const pathLog = path.join(userDataPath, 'logs');
const pathConfigApp = path.join(userDataPath, 'configApp.json');
const pathProducts = path.join(userDataPath, 'products.json');
const pathCustomers = path.join(userDataPath, 'customers.json');
const pathSales = path.join(userDataPath, 'sales.json');
const pathErrorsDB = path.join(userDataPath, 'errorsDB.json');


async function returnConfigToAccessDB(){
    return new Promise(async (resolve, reject) => {
        await returnValueFromJson('pathdbhost')
        .then(async (response) => {
            config = {
                host: 'localhost',
                port: 3050,
                database: `${response}/HOST.FDB`,
                charset: 'UTF8'
            }
        })
        .then(async () => {
            let envInfo = await returnInfo('user_database')
            config.user = `${envInfo}`;
        })
        .then(async () => {
            let envInfo = await returnInfo('password_database')
            config.password = `${envInfo}`;
        })
        .finally(() => {
            resolve(config)
        })
    })
}


function gravarLog(mensagem) {
  if (!fs.existsSync(pathLog)) {
      fs.mkdirSync(pathLog, { recursive: true }); // Adicionado recursive: true
  }

  const data = new Date();
  data.setHours(data.getHours() - 3);
  const dataFormatada = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const logMessage = `[${data.toISOString()}]: ${mensagem}\n`;
  const logFileName = `log_${dataFormatada}.txt`;
  const logFilePath = path.join(pathLog, logFileName);

  fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
          console.error('Erro ao gravar o log:', err);
      } else {
          console.log('Log gravado com sucesso!');
      }
  });
}
  


async function incrementIdRequestPost(){
  return new Promise(async (resolve, reject) => {
    const configApp = JSON.parse(fs.readFileSync(pathConfigApp, 'utf-8'));
    configApp.pedidoOk.idRequestPost++;
    fs.writeFileSync(pathConfigApp, JSON.stringify(configApp), 'utf-8')
    resolve()
  })
}



async function succesHandlingRequests(destiny, resource, idHost, idPedOk){
  return new Promise(async (resolve, reject) => {

    if(destiny=="product"){
      let productsDB = JSON.parse(fs.readFileSync(pathProducts))

      switch (resource) {
        case "post":
          productsDB[`${idHost}`] = {
            "idPedidoOk": `${idPedOk}`,
            "status": "ATIVO"
          }
          await incrementIdRequestPost()
          .then(async () => {
            await verifyToDeleteErrorRecord(destiny, idHost)
          })
          break;

        case "update":
          
          break;

        case "delete":
          productsDB[`${idHost}`].status = "INATIVO";
          break;

        case "undelete":
          productsDB[`${idHost}`].status = "ATIVO";
          break;
      }

      fs.writeFileSync(pathProducts, JSON.stringify(productsDB), 'utf-8')
      gravarLog('Gravado registro no banco de ' + destiny);
      resolve()
    }else
    if(destiny=="customer"){
      let customersDB = JSON.parse(fs.readFileSync(pathCustomers))

      switch (resource) {
        case "post":
          customersDB[`${idHost}`] = {
            "idPedidoOk": `${idPedOk}`,
            "status": "ATIVO"
          }
          await incrementIdRequestPost()
          .then(async () => {
            await verifyToDeleteErrorRecord(destiny, idHost)
          })
          break;

          case "update":
          
          break;

        case "delete":
          customersDB[`${idHost}`].status = "INATIVO";
          break;

        case "undelete":
          customersDB[`${idHost}`].status = "ATIVO";
          break;
      }
      
      fs.writeFileSync(pathCustomers, JSON.stringify(customersDB), 'utf-8')
      gravarLog('Gravado registro no banco de ' + destiny);
      resolve()
    }else
    if(destiny=="sale"){
      let salesDB = JSON.parse(fs.readFileSync(pathSales))

      salesDB[idPedOk] = idHost;
      
      fs.writeFileSync(pathSales, JSON.stringify(salesDB), 'utf-8')
      gravarLog('Gravado registro no banco de ' + destiny);
      resolve()
    }
  })
}



async function updateDatetimeOfLastRequest(dateTime){
  return new Promise(async (resolve, reject) => {
      let appDB = JSON.parse(fs.readFileSync(pathConfigApp));

      appDB.pedidoOk.last_request = dateTime;

      fs.writeFileSync(pathConfigApp, JSON.stringify(appDB), 'utf-8');
      gravarLog('Atualizado registro da ultima request no banco')
      resolve()
  })
}



async function errorHandlingRequest(destiny, resource, idHost, idPedidoOk, errors, body){
  return new Promise(async (resolve, reject) => {
      let errorsDB = JSON.parse(fs.readFileSync(pathErrorsDB))

      const data = new Date();
      data.setHours(data.getHours() - 3);
      const dataFormatada = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;

      errorsDB[destiny][idHost] = {
        "typeRequest": resource,
        "idPedidoOk": idPedidoOk,
        "timeRequest": dataFormatada,
        "returnRequest": errors,
        "bodyRequest": body
      }

      fs.writeFileSync(pathErrorsDB, JSON.stringify(errorsDB), 'utf-8');
      gravarLog('Gravado registro no banco de erros')
      resolve()
  })
}


async function verifyToDeleteErrorRecord(destiny, idHost){
  return new Promise(async (resolve, reject) => {
    let errorsDB = JSON.parse(fs.readFileSync(pathErrorsDB));

    if(errorsDB[destiny][idHost]&&errorsDB[destiny][idHost].typeRequest == 'POST'){
        delete errorsDB[destiny][idHost]
    }

    fs.writeFileSync(pathErrorsDB, JSON.stringify(errorsDB), 'utf-8');
    gravarLog('Retirado registro no banco de erros')
    resolve()
  })
}


async function deleteErrorsRecords(){
  return new Promise(async (resolve, reject) => {
    let errorsDB = JSON.parse(fs.readFileSync(pathErrorsDB));

    errorsDB.product = {}
    errorsDB.customer = {}
    errorsDB.sale = {}

    fs.writeFileSync(pathErrorsDB, JSON.stringify(errorsDB), 'utf-8');
    gravarLog('RESETADO BANCO DE ERROS')
    resolve()
  })
}


async function getActualDatetime(){
  return new Promise(async (resolve, reject) => {
    const now = new Date();

    now.setMinutes(now.getMinutes() - 1);

    let actualTime = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, '0') + "-" +
    String(now.getDate()).padStart(2, '0') + "T" +
    String(now.getHours()).padStart(2, '0') + ":" +
    String(now.getMinutes()).padStart(2, '0') + ":00";

    resolve(actualTime)
  })
}


async function returnCustomerIdHostFromIdPed(idCustomerPed){
  return new Promise(async (resolve, reject) => {
      let customersDB = JSON.parse(fs.readFileSync(pathCustomers))

    for (const idCustomerHost in customersDB) {
      if (customersDB.hasOwnProperty(idCustomerHost)) {
          const customer = customersDB[idCustomerHost];
          if (customer.idPedidoOk == idCustomerPed) {
              resolve(idCustomerHost) 
          }
      }
    }
    return null;
  })
}


async function returnProductIdHostFromIdPed(idProductPed){
  return new Promise(async (resolve, reject) => {
    let productsDB = JSON.parse(fs.readFileSync(pathProducts))

    for (const idProductHost in productsDB) {
      if (productsDB.hasOwnProperty(idProductHost)) {
          const product = productsDB[idProductHost];
          if (product.idPedidoOk == idProductPed) {
              resolve(idProductHost) 
          }
      }
    }

    return null;
  })
}


function copyJsonFilesToUserData() {
  // Caminho correto onde os arquivos são empacotados
  const resourcesPath = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);

  const filesToCopy = [
      'configApp.json',
      'products.json',
      'customers.json',
      'sales.json',
      'errorsDB.json',
      '.env'
  ];

  filesToCopy.forEach(file => {
      const sourcePath = path.join(resourcesPath, file);
      const destinationPath = path.join(userDataPath, file);

      console.log(`📂 Copiando: ${file}`);

      if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
      }

      if (!fs.existsSync(destinationPath)) {
          if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, destinationPath);
              console.log(`Copiado ${file} para ${userDataPath}`);
          } else {
              console.warn(`Arquivo nao encontrado: ${sourcePath}`);
          }
      } else {
          console.log(`${file} ja existe em ${userDataPath}`);
      }
  });
}


module.exports = {
    copyJsonFilesToUserData,
    returnConfigToAccessDB,
    incrementIdRequestPost,
    succesHandlingRequests,
    updateDatetimeOfLastRequest,
    errorHandlingRequest,
    deleteErrorsRecords,
    getActualDatetime,
    returnCustomerIdHostFromIdPed,
    returnProductIdHostFromIdPed,
    gravarLog
}
