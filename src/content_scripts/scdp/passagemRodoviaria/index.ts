import { StorageData, ToggleMessage } from "../../../shared/types"

const SCRIPT_NAME = "scdpPassagemRodoviaria"

const initializeScript = (): void => {
  // Função auxiliar para selecionar o input do tipo radio pelo texto do label associado.
  function encontrarTextareaPorLabel(
    textoLabel: string,
  ): HTMLTextAreaElement | null {
    // Primeiro, encontramos todos os labels
    const labels: NodeListOf<HTMLLabelElement> = document.querySelectorAll(
      "#formCadastraViagem label",
    )

    const labelEncontrado: HTMLLabelElement | undefined = Array.from(labels).find((label) => {
      // Verificamos se o texto do label corresponde ao que estamos procurando
      return (
        label.textContent?.toUpperCase().trim() === textoLabel.toUpperCase().trim()
      )
    })

    if (labelEncontrado) {
      // Se encontrarmos o label correto, pegamos o id do textarea associado
      const textareaId: string | null = labelEncontrado.getAttribute("for")

      if (textareaId) {
        // Usamos o id para encontrar o textarea correspondente
        const textarea: HTMLTextAreaElement | null = document.getElementById(
          textareaId,
        ) as HTMLTextAreaElement

        // Verificamos se o textarea é do tipo radio
        if (textarea instanceof HTMLTextAreaElement) {
          return textarea
        }
      }
    }

    // Retornamos null se não encontrarmos o input
    return null
  }

  // Desabilitar elemento
//   const disableElement = (element: HTMLElement | null): void => {
//     if (element) element.setAttribute("disabled", "disabled")
//   }

  // Esconder elemento
  const hideElement = (element: HTMLElement | null): void => {
    if (element) element.style.display = "none"
  }

  // Função para observar mudanças no DOM e aplicar o processamento necessário
  const observeDOMChanges = (): MutationObserver | undefined => {
    const targetNode = document.querySelector("#formCadastraViagem")

    if (!targetNode) return undefined

    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach(({ type, addedNodes }) => {
        
        if (type === "childList") {
          addedNodes.forEach(() => {
            // TAB: 2
            const justificativaElement = encontrarTextareaPorLabel(
              "Entre com a justificativa para Viagem sem diária ou sem passagem:*",
            )            
            
            if (justificativaElement) {
              justificativaElement.value = "O TJMG não possui, até o momento, contrato de passagem rodoviária."              
              hideElement(justificativaElement.parentElement)              
            }
          })
        }
      })
    })

    observer.observe(targetNode, { childList: true, subtree: true })

    return observer
  }

  // Inicialização
  const init = (): void => {    
    observeDOMChanges()
  }

  init()
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
