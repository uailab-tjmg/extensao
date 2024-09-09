import { StorageData, ToggleMessage } from "../../../shared/types"

const SCRIPT_NAME = "scdpDesabilitarCampos"

const initializeScript = (): void => { 

  // Selecionar valor de uma lista predefinida
  const selectValue = (element: HTMLSelectElement, value: string): void => {
    if (element.tagName === "SELECT") {
      ;[...element.options].some((option) => {
        if (option.text === value) {
          element.value = option.value
          return true
        }
        return false
      })
    }
  }

  // Desabilitar elemento
  const disableElement = (element: HTMLElement | null): void => {
    if (element) element.setAttribute("disabled", "disabled")
  }

  // Esconder elemento
  const hideElement = (element: HTMLElement | null): void => {
    if (element) element.style.display = "none"
  }

  const hideDadosBancarios = (): void => {
    // Checkbox
    const checkboxTipoConta = document.getElementById(
      "formCadastraViagem:naoPossuiCC",
    ) as HTMLInputElement | null
    if (checkboxTipoConta) {
      checkboxTipoConta.checked = false
      checkboxTipoConta.disabled = true
      checkboxTipoConta.style.display = "none"
    }

    // Label do checkbox
    const labelCheckbox =
      checkboxTipoConta?.nextElementSibling as HTMLLabelElement | null
    if (labelCheckbox) {
      labelCheckbox.textContent = "Conta Corrente"
    }   

    const indicadorPoupanca = document.getElementById(
      "formCadastraViagem:cmbIndicadorPoupancaViajante",
    ) as HTMLSelectElement | null
    if (indicadorPoupanca) {
      selectValue(indicadorPoupanca, "Corrente")
      disableElement(indicadorPoupanca)
      hideElement(indicadorPoupanca.parentElement)
    }
  }

  // Função para observar mudanças no DOM e aplicar o processamento necessário
  const observeDOMChanges = (): MutationObserver | undefined => {
    const targetNode = document.querySelector("#formCadastraViagem")

    if (!targetNode) return undefined

    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach(({ type, addedNodes }) => {
        if (type === "childList") {
          addedNodes.forEach(() => {
            // TAB: 0            
            const reuniaoColegiado = document.querySelector<HTMLElement>(
              "#formCadastraViagem\\:reuniaoColegiado",
            )
            if (reuniaoColegiado) {
              hideElement(reuniaoColegiado.closest("fieldset"))
            }
            hideDadosBancarios()

            // TAB: 1
            const selectors = [
              "input[type='radio'][id^='formCadastraViagem\\:tipoEtapaRoteiro'][value='TRANSITO']",
              "input[type='checkbox'][id='formCadastraViagem\\:embarqueDesembarque']",
              "input[type='checkbox'][id='formCadastraViagem\\:primeiroDiaSemDesconto']",
              "input[type='checkbox'][id='formCadastraViagem\\:ultimoDiaSemDesconto']",
            ]
            selectors.forEach((selector) => {
              const element = document.querySelector<HTMLInputElement>(selector)
              if (element) disableElement(element)
            })

            // TAB: 2
            const cursoFormacao = document.getElementById(
              "formCadastraViagem:cursoFormacaoCheck",
            ) as HTMLSelectElement | null
            if (cursoFormacao) {
              selectValue(cursoFormacao, "Não")
              hideElement(cursoFormacao.parentElement)
            }

            // TAB: 3
            const element = document.querySelector<HTMLElement>(
              "[id^='formCadastraViagem:resumoViagem:j_idt'][id$=':componenteCabecalhoViagem']",
            )
            if (element) {
              const targetLabel = [...element.querySelectorAll("label")].find(
                (label) =>
                  label.textContent?.trim() ===
                  "Curso Ministrado por Escola de Governo:",
              )
              if (targetLabel?.parentElement)
                hideElement(targetLabel.parentElement)
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
    const reuniaoColegiado = document.querySelector<HTMLElement>(
      "#formCadastraViagem\\:reuniaoColegiado",
    )
    if (reuniaoColegiado) {
      hideElement(reuniaoColegiado.closest("fieldset"))
    }
    hideDadosBancarios()    
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
