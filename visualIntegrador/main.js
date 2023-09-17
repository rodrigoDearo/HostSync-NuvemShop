// IMPORTANDO MÓDULOS E CONFIGURANDO VARIAVEIS 

const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let zPressionado = false;
let podeAbrirConfig = true;

const caminhoDoScript = './src/structures/reqCadastros.js';

// ELECTRON JS
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

    // Crie um atalho global para a tecla 'Z'
    globalShortcut.register('Z', () => {
        if(podeAbrirConfig){
            zPressionado = true;
            mainWindow.loadFile('./src/pages/paginaConfiguracao.html');
        }
    });
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
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll(); // Remova todos os atalhos globais
});



