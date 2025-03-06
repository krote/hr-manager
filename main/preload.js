"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const {contextBridge, ipcRenderer} = require("electron");
// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.
// Be very cautious about which globals and APIs you expose to untrusted remote content.
contextBridge.exposeInMainWorld("electron", {
    sayHello: () => ipcRenderer.send("message", "hi from next"),
    receiveHello: (handler) => ipcRenderer.on("message", handler),
    stopReceivingHello: (handler) => ipcRenderer.removeListener("message", handler),
});
