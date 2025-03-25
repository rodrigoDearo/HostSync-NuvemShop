const util = require('util');
const fs = require('fs');
const { app } = require('electron')
const path = require('node:path')


const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

//const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
//const pathConfigApp = path.join(userDataPath, 'configApp.json');

const pathConfigApp = path.join(__dirname, '../../build/configApp.json')

async function saveInfos(systemSave, infos) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await readFileAsync(pathConfigApp, 'utf-8');
      let dadosApp = JSON.parse(data);

      switch (systemSave) {
        case 'host':
          dadosApp.host.pathdb = infos;
          break;

        case 'nuvemshop':
          dadosApp.nuvemshop.code = infos;
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

          case 'codenuvemshop':
            resolve(dados.nuvemshop.code);
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