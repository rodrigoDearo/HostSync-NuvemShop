const util = require('util');
const fs = require('fs');
const { app } = require('electron')
const path = require('node:path')


const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

//const userDataPath = 'src/build';
const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const pathConfigApp = path.join(userDataPath, 'configApp.json');

async function saveInfos(systemSave, infos) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await readFileAsync(pathConfigApp, 'utf-8');
      let dadosApp = JSON.parse(data);

      switch (systemSave) {
        case 'host':
          dadosApp.host.pathdb = infos;
          break;

        case 'tray':
          dadosApp.tray.url = infos[0];
          dadosApp.tray.code = infos[1];
          break;
      }

      let novoJson = JSON.stringify(dadosApp, null, 2);

      await writeFileAsync(pathConfigApp, novoJson, 'utf-8');
      resolve();
    } catch (err) {
      reject('Erro ao atualizar dados');
      console.error('Erro ao processar o arquivo JSON:', err);
    }
  });
}


async function returnValueFromJson(campo){
  return new Promise((resolve, reject) => {
    fs.readFile(pathConfigApp, 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        let dados = JSON.parse(data);
        switch (campo) {
          case 'pathdbhost':
            resolve(dados.host.pathdb);
            break;
          
          case 'urltray':
            resolve(dados.tray.url);
            break;

          case 'codetray':
            resolve(dados.tray.code);
            break;
          
          case 'access_token':
            resolve(dados.tray.access_token);
            break;
  
          case 'refresh_token':
            resolve(dados.tray.refresh_token);
            break;
        }
      }
    });
  });
}


module.exports = { 
    saveInfos,
    returnValueFromJson
}