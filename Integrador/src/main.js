// IMPORTANDO MÓDULOS E BIBLIOTECAS 


// ---------------------- ELECTRON JS ---------------------- //

const {  app, BrowserWindow, nativeImage, Tray, Menu } = require("electron");
const path = require("path");
const electronReload = require('electron-reload');


/*electronReload(__dirname);*/

let win = null; // Variável global para armazenar a instância da janela
let tray = null; // Variável global para armazenar a instância do ícone na bandeja

// Função que cria uma janela desktop
function createWindow() {
  // Adicionando um ícone na barra de tarefas/dock
  const icon = nativeImage.createFromPath(`${app.getAppPath()}/build/icon.jpg`);

  if (app.dock) {
    app.dock.setIcon(icon);
  }


  // CRIA UMA JANELA DESKTOP
  win = new BrowserWindow({
    icon,
    width: 650,
    height: 400,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  win.loadFile("./index.html");

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir', click: () => win.show() },
    { label: 'Fechar', click: () => app.quit() }
  ]);
  tray.setToolTip('SaurusSync');
  tray.setContextMenu(contextMenu);

  // Evento para minimizar a janela quando ela for fechada
  win.on('close', (event) => {
    event.preventDefault();
    win.hide();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
