import "./styles/spinner"
import { observeDOMChanges } from "./utils/domUtils"
import { manageFloatingButton } from "./components/floatingButton"
import { StorageData, ToggleMessage } from "../../../shared/types"
import { processAnexosElement } from "./components/checkbox"

const SCRIPT_NAME = "pjeDownload"

const initializeScript = (): void => {
  // Inicializa o processamento e o observer
  document.querySelectorAll("#divTimeLine .anexos").forEach((anexos) => {
    processAnexosElement(anexos as HTMLElement)
  })
  observeDOMChanges()  
  manageFloatingButton() // Gerencia o botão flutuante inicialmente
  console.log(`O script ${SCRIPT_NAME} foi executado`)
}

const desactivateScript = (): void => {
  location.reload()
  console.log(`O script ${SCRIPT_NAME} está desativado`)
}

// Verificar o estado inicial
chrome.storage.sync.get([SCRIPT_NAME], (result: StorageData): void => {
  if (result[SCRIPT_NAME]) {
    initializeScript()
  }
})

// Listener para mudanças de estado
chrome.runtime.onMessage.addListener((message: ToggleMessage): void => {
  if (
    (message.action as string) === "toggleChanged" &&
    message.scriptName === SCRIPT_NAME
  ) {
    if (message.value) {
      initializeScript()
    } else {
      desactivateScript()
    }
  }
})
