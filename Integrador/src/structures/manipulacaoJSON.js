process.stdin.setEncoding('utf-8');

const fs = require('fs');


/**
 * Função que faz a leitura do arquivo JSON das configurações e retorna conforme é solciitado
 * @param {*} campo parametro referente a qual campo se requisita
 * @returns {dadosRetorno} retorna o dado lido na gravação JSON
 */
function retornaCampo(campo){
    return new Promise((resolve, reject) => {
      fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
        if (err) {
          console.log(err);
        } else {
          let dados = JSON.parse(data);
  
  
          switch (campo) {
            case 'store_id':
              var dadosRetorno = dados.dadosApp.nuvem.store_id;
              break;
            
            case 'app_token':
              var dadosRetorno = dados.dadosApp.nuvem.app_token;
              break;
  
            case 'caminho_banco':
              var dadosRetorno = dados.dadosApp.host.caminho_banco;
              break;

            case 'caminho_imagens':
              var dadosRetorno = dados.dadosApp.host.caminho_imagens;
              break;
  
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


  module.exports = { 
        retornaCampo
    }