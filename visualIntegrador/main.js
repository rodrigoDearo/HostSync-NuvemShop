// IMPORTANDO MÓDULOS E CONFIGURANDO VARIAVEIS 

const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { exec } = require('child_process');
//const express = require('express');

let mainWindow;
let zPressionado = false;
let podeAbrirConfig = true;

const caminhoDoScript = './src/structures/reqCadastros.js';

/*
const expss = express();

expss.get('/erroProduto', async (req, res) => {

  await createWindowErr()
  .then(() => {
    res.status(200).send();
  })
  .catch(() => {
    res.status(500).send();
  });
});


expss.listen(3000, () => {
    console.log('Servidor Express iniciado na porta 3000');
});*/


// ELECTRON JS

function createWindowErr() {
    mainWindow = new BrowserWindow({
        width: 200,
        height: 75,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    mainWindow.loadFile('./src/pages/erroProduto.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

}


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 650,
        height: 400,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    mainWindow.loadFile('./src/pages/paginaInicial.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Crie um atalho global para a tecla 'Z
}

app.on('ready', () => {
    createWindow();

    setTimeout(async () => {
        if(!zPressionado){
            podeAbrirConfig = false;
            console.log('Iniciar ');         
            exec(`node ${caminhoDoScript}`, (error, stdout, stderr) => {
                mainWindow.loadFile('./src/pages/sincronizacao.html');
            });
        }
    }, 8000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    createWindow();  
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll(); // Remova todos os atalhos globais
});



