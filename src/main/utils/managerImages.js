/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const fs = require('fs');
const path = require('path');
const { app } = require('electron')

//const userDataPath = 'src/build';
const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const pathLinksIMG = path.join(userDataPath, 'links_img.json');
const pathProducts = path.join(userDataPath, 'products.json');

async function return8caracteresBase64(imagem, caminho){
    return new Promise(async (resolve, reject) => {
      try {
        // Verificar se o arquivo existe antes de prosseguir
        if (!fs.existsSync(`${caminho}/imgProdutos/${imagem}`)) {
          resolve();
          return;
        }

        const buffer = fs.readFileSync(`${caminho}/imgProdutos/${imagem}`);
        const base64String = buffer.toString('base64');
        const primeiros8Caracteres = base64String.substring(0, 8);

        resolve(primeiros8Caracteres);        
  
      } catch (error) {
        gravarLog(`Erro na codificação da imagem ${caminho}/imgProdutos/${imagem} em BASE64`);
        reject(error);
      }
    })
  }



module.exports = {

};
