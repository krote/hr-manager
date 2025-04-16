"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const electron_1 = require("electron");
// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.
// Be very cautious about which globals and APIs you expose to untrusted remote content.
electron_1.contextBridge.exposeInMainWorld("electron", {
    sayHello: () => electron_1.ipcRenderer.send("message", "hi from next"),
    receiveHello: (handler) => electron_1.ipcRenderer.on("message", handler),
    stopReceivingHello: (handler) => electron_1.ipcRenderer.removeListener("message", handler),
});
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // SQLクエリを実行する関数
    executeQuery: (query) => electron_1.ipcRenderer.invoke('execute-query', query),
    // 文字起こし関連の関数
    selectVideoFile: () => electron_1.ipcRenderer.invoke('select-video-file'),
    transcribeVideo: (filePath) => electron_1.ipcRenderer.invoke('transcribe-video', filePath),
    // 文字起こし設定関連の関数
    getTranscriptionConfig: () => electron_1.ipcRenderer.invoke('get-transcription-config'),
    updateTranscriptionConfig: (config) => electron_1.ipcRenderer.invoke('update-transcription-config', config),
});
