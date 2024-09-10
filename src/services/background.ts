chrome.runtime.onInstalled.addListener(({ reason }) => {
  
  switch (reason) {
    case chrome.runtime.OnInstalledReason.INSTALL:
      // Abre a página de opções ao instalar a extensão
      // chrome.runtime.openOptionsPage();
      break
    case chrome.runtime.OnInstalledReason.UPDATE:
      console.log(
        `Extensão atualizada para a versão ${chrome.runtime.getManifest().version}`,
      )
      break
    default:
      break
  }
})