/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { contextBridge, ipcRenderer } from "electron";
import { IpcRendererEvent } from "electron/main";

// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.
// Be very cautious about which globals and APIs you expose to untrusted remote content.
contextBridge.exposeInMainWorld("electron", {
  sayHello: () => ipcRenderer.send("message", "hi from next"),
  receiveHello: (handler: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on("message", handler),
  stopReceivingHello: (
    handler: (event: IpcRendererEvent, ...args: any[]) => void,
  ) => ipcRenderer.removeListener("message", handler),
});

contextBridge.exposeInMainWorld('electronAPI', {
  // SQLクエリを実行する関数
  executeQuery: (query: string) => ipcRenderer.invoke('execute-query', query),
  
  // 文字起こし関連の関数
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  transcribeVideo: (filePath: string) => ipcRenderer.invoke('transcribe-video', filePath),
  
  // 文字起こし設定関連の関数
  getTranscriptionConfig: () => ipcRenderer.invoke('get-transcription-config'),
  updateTranscriptionConfig: (config: any) => ipcRenderer.invoke('update-transcription-config', config),
});
