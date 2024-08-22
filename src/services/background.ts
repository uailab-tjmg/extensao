chrome.runtime.onInstalled.addListener(({ reason }) => {
    void chrome.action.disable();
  
    const addPageRules = (): void => {
      const conditions = [
        'www.scdp.mg.gov.br',
        'pje.tjmg.jus.br'
      ].map(hostPrefix => new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostPrefix }
      }));
  
      const rule = {
        conditions,
        actions: [new chrome.declarativeContent.ShowPageAction()]
      };
  
      chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([rule]);
      });
    };
  
    addPageRules();
  
    switch (reason) {
      case chrome.runtime.OnInstalledReason.INSTALL:
        // Abre a página de opções ao instalar a extensão
        // chrome.runtime.openOptionsPage();
        break;
      case chrome.runtime.OnInstalledReason.UPDATE:
        console.log(`Extensão atualizada para a versão ${chrome.runtime.getManifest().version}`);
        break;
      default:        
        break;
    }
  });