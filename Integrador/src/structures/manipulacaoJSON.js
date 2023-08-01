const util = require('util');
const fs = require('fs');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

/**
 * Função para salvar em um banco de dados não relacional as informações para agilizar próximas cargas
 * @param {*} campo1 Caso não nulo, é uma informação para ser cadastrada
 * @param {*} campo2 Caso não nuulo, é outra informalção para ser cadastrada
 * @param {string} systemSave Informa qual tabela do arquivo JSOn pertence a informação
 */
async function salvarDados(campo1, campo2, campo3, systemSave) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await readFileAsync('./src/build/dados.json', 'utf-8');
      let dadosApp = JSON.parse(data);

      switch (systemSave) {
        case 'saurus':
          dadosApp.dadosApp.saurus.chave = campo1;
          dadosApp.dadosApp.saurus.dominio = campo2;
          break;

        case 'geral':
          dadosApp.dadosApp.geral.timer = campo1;
          break;

        case 'tray':
          campo2 = decodeURIComponent(campo2)
          dadosApp.dadosApp.tray.code = campo1;
          dadosApp.dadosApp.tray.url = campo2;
          break;

        case 'geral_file':
          dadosApp.dadosApp.geral.ultimo_file = campo1;
          break;
      }

      let novoJson = JSON.stringify(dadosApp, null, 2);

      await writeFileAsync('./src/build/dados.json', novoJson, 'utf-8');
      resolve();
    } catch (err) {
      reject('Erro ao atualizar dados');
      console.error('Erro ao processar o arquivo JSON:', err);
    }
  });
}

/**
 * Função que retorna array com informações puxadas o arquivo dados.JSON
 * @returns {dadosRetorno} uma array contendo as informação a serem alocadas nos campos "value" dos input HTML 
 */
function retornarDados() {
  return new Promise((resolve, reject) => {
    fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        let dados = JSON.parse(data);
        var dadosRetorno = [
          dados.dadosApp.saurus.chave,
          dados.dadosApp.saurus.dominio,
          dados.dadosApp.geral.timer,
          dados.dadosApp.tray.code,
          dados.dadosApp.tray.url
        ];
        resolve(dadosRetorno);
      }
    });
  });
}


/**
 * Função que faz a leitura do arquivo JSON das configurações e retorna conforme é solciitado
 * @param {*} campo parametro referente a qual campo se requisita
 * @returns {dadosRetorno} retorna o dado lido na gravação JSON
 */
async function retornaCampo(campo){
  return new Promise((resolve, reject) => {
    fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        let dados = JSON.parse(data);
        switch (campo) {
          case 'chave':
            var dadosRetorno = dados.dadosApp.saurus.chave;
            break;
          
          case 'dominio':
            var dadosRetorno = dados.dadosApp.saurus.dominio;
            break;

          case 'timer':
            var dadosRetorno = dados.dadosApp.geral.timer;
            break;

          case 'nameFile':
            var dadosRetorno = dados.dadosApp.geral.ultimo_file;
            dados.dadosApp.geral.ultimo_file = "";
            break

          case 'expira_acessToken':
            var dadosRetorno = dados.dadosApp.tray.date_expiration_access_token;
            break

          case 'expira_refreshToken':
            var dadosRetorno = dados.dadosApp.tray.date_expiration_refresh_token;
            break
          
        }
        resolve(dadosRetorno);
      }
    });
  });
}
