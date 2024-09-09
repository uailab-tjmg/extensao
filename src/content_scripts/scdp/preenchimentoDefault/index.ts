import { StorageData, ToggleMessage } from "../../../shared/types"

const SCRIPT_NAME = "scdpPreenchimentoDefault"

const initializeScript = (): void => {
  // Variáveis

  // Aba dados bancários a debitar - TJMG
  const tipoContaDebito = "D - Demais Contas"
  const registrarOBTV = "Não"
  const nomeBancoDebito = "Itau"
  const numeroAgenciaDebito = "3380"
  const digitoAgenciaDebito = ""
  const numeroContaDebito = "510"
  const digitoContaDebito = "2"

  // Aba dados bancários para crédito - Solicitante
  const tipoContaCredito = "Corrente" // Padrão a ser selecionado
  const numeroBancoCredito = document.querySelector<HTMLInputElement>(
    "#formExecucaoFinanceira\\:bancoNacional\\:inputText",
  )
  //const numeroAgenciaCredito = document.querySelector<HTMLInputElement>("#formExecucaoFinanceira\\:agenciaNacional\\:inputText")
  const digitoAgenciaCredito = document.querySelector<HTMLInputElement>(
    "#formExecucaoFinanceira\\:dvAgenciaNacional",
  ) // Necessário preenchimento para o Banco do Brasil, Bradesco e Caixa. Para outros bancos não pode haver preenchimento
  //const numeroContaCredito = document.querySelector<HTMLInputElement>("#formExecucaoFinanceira\\:ccNacional\\:inputText")

  // Aba de aprovadores
  // const aprovador = "Eduardo Antônio Codo Santos"

  // Função auxiliar para selecionar option de select
  const selectValue = (element: HTMLSelectElement, value: string): void => {
    ;[...element.options].some((option) => {
      if (option.text === value) {
        element.value = option.value
        return true
      }
      return false
    })
  }

  // Função auxiliar para selecionar o input do tipo radio pelo texto do label associado.
  function encontrarRadioPorLabel(textoLabel: string): HTMLInputElement | null {
    // Primeiro, encontramos todos os labels
    const labels: NodeListOf<HTMLLabelElement> = document.querySelectorAll(
      "#formExecucaoFinanceira label",
    )

    const labelEncontrado: HTMLLabelElement | undefined = Array.from(
      labels,
    ).find((label) => {
      // Verificamos se o texto do label corresponde ao que estamos procurando
      return (
        label.textContent?.toUpperCase().trim() ===
        textoLabel.toUpperCase().trim()
      )
    })

    if (labelEncontrado) {
      // Se encontrarmos o label correto, pegamos o id do input associado
      const inputId: string | null = labelEncontrado.getAttribute("for")

      if (inputId) {
        // Usamos o id para encontrar o input correspondente
        const input: HTMLElement | null = document.getElementById(inputId)

        // Verificamos se o input é do tipo radio
        if (input instanceof HTMLInputElement && input.type === "radio") {
          return input
        }
      }
    }

    // Retornamos null se não encontrarmos o input
    return null
  }
  // Verifica se há algum tipo de conta selecionada
  function contaSelecionada() {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      "#formExecucaoFinanceira\\:rdoBancoNacionalDebitar input[type='radio']",
    )        
    return Array.from(inputs).some((input) => input.checked)
  }

  // Verifica a existência da opção D - Demais Contas
  function verificarExistenciaDemaisContas() {
    const labels = document.querySelectorAll<HTMLLabelElement>(
      `#formExecucaoFinanceira\\:rdoBancoNacionalDebitar label`,
    )

    for (const label of labels) {
      if (label.textContent?.trim() === tipoContaDebito) {
        const inputId = label.getAttribute("for")
        const input = document.getElementById(inputId ?? "")

        return input !== null
      }
    }

    return false
  }

  if (!contaSelecionada() && verificarExistenciaDemaisContas()) {
    const radioDesejado: HTMLInputElement | null =
      encontrarRadioPorLabel(tipoContaDebito)

    if (radioDesejado) {
      radioDesejado.click()

      // espera um tempo para aparecer mais opções
      setTimeout(() => {
        // Tabela registrar OBTV
        const formContaObtv: HTMLElement | null = document.querySelector(
          "#formExecucaoFinanceira\\:rdoBancoNacionalDebitarOBTV",
        )

        if (formContaObtv) {
          formContaObtv.querySelectorAll("label").forEach((e: Element) => {
            if (e.textContent?.trim().toUpperCase() === registrarOBTV) {
              ;(e as HTMLElement).click()
            }
          })
        }

        // DADOS BANCÁRIOS A DEBITAR
        const selectNomeBancoDebito: HTMLSelectElement | null =
          document.querySelector(
            "#formExecucaoFinanceira\\:cmbBancoNacionalDebitar",
          )
        if (selectNomeBancoDebito) {
          selectValue(selectNomeBancoDebito, nomeBancoDebito)
        }

        const iptNumeroAgenciaDebito: HTMLInputElement | null =
          document.querySelector(
            "#formExecucaoFinanceira\\:agenciaNacionalDebitar\\:inputText",
          )
        if (iptNumeroAgenciaDebito) {
          iptNumeroAgenciaDebito.value = numeroAgenciaDebito
        }

        const iptDigitoAgenciaDebito: HTMLInputElement | null =
          document.querySelector(
            "#formExecucaoFinanceira\\:DvAgenciaNacionalDebitar",
          )
        if (iptDigitoAgenciaDebito) {
          iptDigitoAgenciaDebito.value = digitoAgenciaDebito
        }

        const iptNumeroContaDebito: HTMLInputElement | null =
          document.querySelector(
            "#formExecucaoFinanceira\\:ccNacionalDebitar\\:inputText",
          )
        if (iptNumeroContaDebito) {
          iptNumeroContaDebito.value = numeroContaDebito
        }

        const dvContaDebitar: HTMLInputElement | null = document.querySelector(
          "#formExecucaoFinanceira\\:DvContaDebitar",
        )
        if (dvContaDebitar) {
          dvContaDebitar.value = digitoContaDebito
        }

        // DADOS BANCÁRIOS
        const indicadorPoupancaNacional: HTMLSelectElement | null =
          document.querySelector(
            "#formExecucaoFinanceira\\:cmbIndicadorPoupancaNacional",
          )
        if (indicadorPoupancaNacional) {
          selectValue(indicadorPoupancaNacional, tipoContaCredito)
        }

        if (numeroBancoCredito) {
          const arrBancos = ["001", "104", "237"]
          const iptValue = numeroBancoCredito.value

          if (arrBancos.includes(iptValue)) {
            if (digitoAgenciaCredito?.value === "") {
              alert(
                `Código do banco: ${iptValue} \n\n É necessário informar um dígito para a conta do solicitante`,
              )
            }
          } else {
            if (digitoAgenciaCredito) digitoAgenciaCredito.value = ""
          }
        }
      }, 1000)
    }
  }
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
