const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron")
const path = require("path")
const imagemin = require("imagemin")
const imageminMozjpeg = require("imagemin-mozjpeg")
const imageminPngquant = require("imagemin-pngquant")
const slash = require("slash")
// set Dev
process.env.NODE_ENV = "production"

const isDev = process.env.NODE_ENV !== "production" ? true : false
const isMac = process.platform === "darwin" ? true : false

let mainWindow
let aboutWindow

function createMainWindow() {
  mainWindow = new BrowserWindow({
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    title: "ImageShrink",
    width: 500,
    height: 600,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
  mainWindow.loadFile("./app/index.html")
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    title: "ImageShrink",
    width: 300,
    height: 300,
    backgroundColor: "white",
    resizable: false,
  })
  aboutWindow.setMenu(null)
  aboutWindow.loadFile("./app/about.html")
}

app.whenReady().then(() => {
  createMainWindow()
  const menu = [
    {
      role: "fileMenu",
    },
    ...(isDev
      ? [
          {
            label: "Developer",
            submenu: [
              { role: "reload" },
              { role: "forcereload" },
              { type: "separator" },
              { role: "toggledevtools" },
            ],
          },
        ]
      : []),
    {
      label: "About",
      click: createAboutWindow,
    },
  ]

  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  ipcMain.on("image:minimize", async (e, { images, quality, destination }) => {
    try {
      const qualityInPercentage = quality / 100
      const files = await imagemin(
        images.map((filePath) => slash(filePath)),
        {
          destination,
          plugins: [
            imageminMozjpeg({ quality }),
            imageminPngquant({
              quality: [qualityInPercentage, qualityInPercentage],
            }),
          ],
        }
      )
      shell.openPath(destination)
      mainWindow.webContents.send("image:done")
    } catch (error) {
      console.log(error)
      mainWindow.webContents.send("image:exception", error)
    }
  })

  app.on("closed", () => (mainWindow = null))
})

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit()
  }
})
