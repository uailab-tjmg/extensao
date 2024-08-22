import JSZip from "jszip"
import { PDFDocument } from "pdf-lib"

interface DocumentInfo {
  id: string
  url: string
  fileName: string
}

(() => {
    const originalFetch = window.fetch;
  
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const response = await originalFetch.call(this, input, init);
      
      if (typeof input === 'string' && input.includes('listAutosDigitais.seam')) {
        console.log('Interceptada requisição para listAutosDigitais.seam');
        
        const clonedResponse = response.clone();
        const responseText = await clonedResponse.text();
        const match = responseText.match(/https:\/\/s3-pjedocumentos\.tjmg\.jus\.br\/[^"']+/);
        
        if (match) {
          console.log('URL do PDF encontrada:', match[0]);
          // Aqui você pode fazer o que quiser com a URL, como iniciar um download
          // Por exemplo:
          // window.open(match[0], '_blank');
        } else {
          console.log('Nenhuma URL de PDF encontrada na resposta');
        }
      }
  
      return response;
    };
  
    console.log('Interceptor instalado com sucesso');
  })();

const downloadDocumentsInFolder = async (documentInfos: DocumentInfo[], processNumber: string): Promise<void> => {
  try {
    const zip = new JSZip()
    const folderName = processNumber
    const folder = zip.folder(folderName)

    for (const info of documentInfos) {
      try {
        const response = await fetch(info.url, {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) throw new Error("Network response was not ok")

        const pdfBytes = await response.arrayBuffer()

        const pdfDoc = await PDFDocument.load(pdfBytes)

        // Verifica se o PDF tem mais de uma página
        if (pdfDoc.getPageCount() > 1) {
          // Cria um novo documento PDF sem a primeira página
          const newPdfDoc = await PDFDocument.create()
          const copiedPages = await newPdfDoc.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices().slice(1),
          )
          copiedPages.forEach((page) => newPdfDoc.addPage(page))

          // Salva o PDF modificado
          const modifiedPdfBytes = await newPdfDoc.save()
          folder?.file(`${info.fileName}.pdf`, modifiedPdfBytes)
        } else {
          // Se o PDF tiver apenas uma página, é adicionado sem modificações
          folder?.file(`${info.fileName}.pdf`, pdfBytes)
        }

        console.log(`Download concluído para o documento ${info.id}`)
      } catch (error) {
        console.error(`Erro no download do documento ${info.id}:`, error)
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const url = window.URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `${folderName}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)

    console.log(`Todos os documentos foram baixados na pasta "${folderName}".`)
  } catch (error) {
    console.error("Erro ao criar a pasta e baixar os documentos:", error)
    throw error
  }
}

const getPdfUrl = async (id: string): Promise<string> => {
  // Pegar o ViewState do documento atual
  const viewStateElement = document.querySelector<HTMLInputElement>(
    'input[name="javax.faces.ViewState"]',
  )

  if (!viewStateElement) {
    throw new Error("Não foi possível encontrar o ViewState no documento")
  }
  const viewState = viewStateElement.value

  console.log("ViewState encontrado:", viewState) // Para debug

  const buttonElement = document.querySelector<HTMLInputElement>(
    "[id^='navbar:j_id']",
  )
  if (!buttonElement) {
    throw new Error("Não foi possível encontrar o id no documento")
  }

  const data = new Date()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const ano = data.getFullYear().toString()

  const url =
    "https://pje.tjmg.jus.br/pje/Processo/ConsultaProcesso/Detalhe/listAutosDigitais.seam"
  const formData = new URLSearchParams()
  formData.append("navbar:cbTipoDocumento", "0")
  formData.append("navbar:idDe", id)
  formData.append("navbar:idAte", id)
  formData.append("navbar:dtInicioInputDate", "")
  formData.append("navbar:dtInicioInputCurrentDate", `${mes}/${ano}`)
  formData.append("navbar:dtFimInputDate", "")
  formData.append("navbar:dtFimInputCurrentDate", `${mes}/${ano}`)
  formData.append("navbar:cbCronologia", "ASC")
  formData.append("navbar:cbExpediente", "false")
  formData.append("navbar:cbMovimentos", "false")
  formData.append("navbar:cbQrCode", "false")
  formData.append("navbar:downloadProcesso", "Download")
  formData.append("navbar", "navbar")
  formData.append("autoScroll", "")
  formData.append("javax.faces.ViewState", viewState)
  formData.append(
    `navbar:${buttonElement.name}`,
    `navbar:${buttonElement.name}`,
  )

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
    credentials: "include",
  })

  const html = await response.text()
  const match = html.match(/https:\/\/s3-pjedocumentos\.tjmg\.jus\.br\/[^"']+/)

  if (match) {
    return match[0]
  } else {
    //console.error("HTML retornado:", html) // Para debug
    throw new Error(`URL do PDF não encontrada para o ID ${id}`)
  }
}

let lastFormSubmitTime: number | null = null;
const MINUTES_120_MS = 120 * 60 * 1000; // 120 minutos em milissegundos

const getDocumentInfos = async (ids: string[]): Promise<DocumentInfo[]> => {
  // Verifica se o formulário existe
  const form = document.querySelector<HTMLFormElement>("form#navbar");
  
  if (!form) {
    console.log('Formulário com id "navbar" não encontrado');
    throw new Error('Formulário com id "navbar" não encontrado');
  }

  const now = Date.now();
  if (!lastFormSubmitTime || now - lastFormSubmitTime > MINUTES_120_MS) {
    // Adiciona o ouvinte e cria a promessa apenas se não foi disparado ou se passou mais de 120 minutos
    const formSubmittedPromise = new Promise<void>((resolve, reject) => {
      const onSubmit = (e: Event) => {
        e.preventDefault();
        lastFormSubmitTime = Date.now();
        resolve();
        const idDe = form.querySelector<HTMLInputElement>("#navbar\\:idDe")
        const idAte = form.querySelector<HTMLInputElement>("#navbar\\:idAte")
        if(idDe && idAte){
          idDe.value = ''
          idAte.value = ''
        }
      };

      form.addEventListener("submit", onSubmit, { once: true });

      // Dispara o botão para submeter o formulário
      const btn = document.querySelector<HTMLInputElement>("input[id^='navbar:j_id']");
      if (btn) {
        const idDe = form.querySelector<HTMLInputElement>("#navbar\\:idDe")
        const idAte = form.querySelector<HTMLInputElement>("#navbar\\:idAte")
        if(idDe && idAte){
          idDe.value = ids[0]
          idAte.value = ids[0]
        }
        btn.click();
      } else {
        console.log('Botão não encontrado');
        reject(new Error('Botão não encontrado'));
      }
    });

    await formSubmittedPromise;    
  } else {
    console.log('O formulário já foi enviado recentemente. Não enviando novamente.');
  }

  try {    
    const documentInfos = await Promise.all(
      ids.map(async (id) => {
        try {
          const pdfUrl = await getPdfUrl(id)
          const checkbox = document.getElementById(
            `chk-${id}`,
          ) as HTMLInputElement
          const spanElement = checkbox.parentElement?.querySelector("a > span")
          const fileName = spanElement
            ? spanElement.textContent?.trim()
            : `document_${id}`
          return { id, url: pdfUrl, fileName }
        } catch (error) {
          console.error(`Erro ao obter informações do documento ${id}:`, error)
          return null
        }
      }),
    )

    return documentInfos.filter((info): info is DocumentInfo => info !== null)
  } catch (error) {
    console.error("Erro ao obter informações dos documentos:", error)
    throw error
  }
}

const processDocuments = async (ids: string[]): Promise<void> => {
  try {
    const downloadButton = document.getElementById("downloadButton")
    showSpinner(downloadButton as HTMLButtonElement)

    const documentInfos = await getDocumentInfos(ids)

    const processNumberElement =
      document.querySelector<HTMLAnchorElement>("a.titulo-topo")
    const folderName = processNumberElement?.firstChild?.textContent?.trim()??"Número não encontrado"

    await downloadDocumentsInFolder(documentInfos, folderName)

    hideSpinner(downloadButton as HTMLButtonElement)    
    showDownloadResults(
      documentInfos.map((info) => `Documento ${info.id}`),
      documentInfos
        .filter((info) => !info.url)
        .map((info) => `Documento ${info.id}`),
    )
  } catch (error) {
    console.error("Erro no processo de download:", error)
    hideSpinner(document.getElementById("downloadButton") as HTMLButtonElement)
    alert(
      "Ocorreu um erro durante o processo de download. Tente novamente mais tarde.",
    )
  }
}

// Objeto para armazenar o estado dos checkboxes
const checkboxStates: Record<string, boolean> = {}

// Função para estilizar os checkboxes
function styleCheckboxes() {
  const style = document.createElement("style")
  style.textContent = `
        input[type="checkbox"][id^="chk-"] {
            width: 14px;
            height: 14px;
            margin-right: 5px;
            transform: translateY(2px);
        }
    `
  document.head.appendChild(style)
}

// Chamar esta função no início do script
styleCheckboxes()

// Função para adicionar o checkbox "Marcar todos"
const addMarkAllCheckbox = (anexosDiv: HTMLDivElement) => {
  if (anexosDiv.querySelector<HTMLUListElement>("ul.tree")) {
    const markAllContainer = document.createElement("div")
    markAllContainer.style.cssText = `
            display: flex;
            align-items: center;
        `

    const markAllCheckbox = document.createElement("input")
    markAllCheckbox.type = "checkbox"
    markAllCheckbox.id = `markAll-${Date.now().toString()}` // ID único
    markAllCheckbox.style.cssText = `
            margin-right: 5px;
            width: 14px;
            height: 14px;
        `

    const markAllLabel = document.createElement("label")
    markAllLabel.textContent = "Selecionar todos"
    markAllLabel.htmlFor = markAllCheckbox.id
    markAllLabel.style.cssText = `
            display: inline-block;
            max-width: 100%;
            margin-bottom: -1px;
            font-weight: 700;
        `

    markAllContainer.appendChild(markAllCheckbox)
    markAllContainer.appendChild(markAllLabel)

    anexosDiv.insertAdjacentElement("beforebegin", markAllContainer)

    markAllCheckbox.addEventListener("change", () => {
      const checkboxes = anexosDiv.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"][id^="chk-"]',
      )
      checkboxes.forEach((checkbox) => {
        checkbox.checked = markAllCheckbox.checked
        checkboxStates[checkbox.id] = markAllCheckbox.checked
      })
      manageFloatingButton()
    })

    // Adicionar evento para atualizar o estado do "Marcar todos"
    anexosDiv.addEventListener("change", (event) => {
        // Verifica se event.target é um elemento HTML e se é um checkbox
        const target = event.target as HTMLInputElement | null;
      if (
        target?.type === "checkbox" &&
        target.id.startsWith("chk-")
      ) {
        updateMarkAllState(anexosDiv, markAllCheckbox)
      }
    })
  }
}

// Função para atualizar o estado do checkbox "Marcar todos"
const updateMarkAllState = (anexosDiv: HTMLDivElement, markAllCheckbox: HTMLInputElement) => {
  const checkboxes = anexosDiv.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="chk-"]')
  const allChecked = Array.from(checkboxes).every(
    (checkbox) => checkbox.checked,
  )
  markAllCheckbox.checked = allChecked
}

// Função auxiliar para criar e adicionar um checkbox com id
const addCheckboxWithId = (parentElement: HTMLElement, id: string, insertBefore: HTMLElement | null = null) => {
  const sanitizedId = `chk-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`

  if (!parentElement.querySelector(`#${sanitizedId}`)) {
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = sanitizedId
    checkbox.style.cssText = `
            width: 14px;
            height: 14px;
            margin-right: 5px;
            transform: translateY(2px);
        `

    if (checkboxStates[sanitizedId]) {        
        checkbox.checked = checkboxStates[sanitizedId]
    }

    checkbox.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement
      checkboxStates[sanitizedId] = target.checked
      manageFloatingButton()

      // Encontrar o checkbox "Marcar todos" mais próximo e atualizar seu estado
      const anexosDiv = parentElement.closest<HTMLDivElement>("div.anexos")??parentElement.querySelector<HTMLDivElement>("div.anexos")
      if (anexosDiv) {
        const markAllCheckbox = anexosDiv.previousElementSibling?.querySelector<HTMLInputElement>(
          'input[type="checkbox"][id^="markAll-"]',
        )
        if (markAllCheckbox) {
          updateMarkAllState(anexosDiv, markAllCheckbox)
        }
      }
    })

    if (insertBefore) {
      parentElement.insertBefore(checkbox, insertBefore)
    } else {
      parentElement.insertAdjacentElement("afterbegin", checkbox)
    }
  }
}

// Função auxiliar para extrair o número do texto (sem alterações)
const extractNumberFromText = (text: string) => {
  const match = text.match(/^\d+/)
  return match ? match[0] : null
}

// Função principal para processar os elementos
const processAnexosElement = (e: HTMLDivElement) => {
  addMarkAllCheckbox(e)

  const anexos = e.querySelector("ul.tree")

  const firstLink = e.querySelector("a")
  if (firstLink) {
    const firstTextContent = firstLink.querySelector("span")?.textContent ?? ""
    const firstNumber = extractNumberFromText(firstTextContent)

    if (firstNumber) {
      addCheckboxWithId(e, firstNumber)
    }
  }

  if (anexos) {
    anexos.querySelectorAll("li").forEach((li) => {
      const aElement = li.querySelector("a")
      if (aElement) {
        const textContent = aElement.querySelector("span")?.textContent ?? ""
        const number = extractNumberFromText(textContent)

        if (number) {
          // Insere o checkbox antes do elemento <a>
          addCheckboxWithId(li, number, aElement)
        }
      }
    })
  }
}

// Função para observar mudanças no DOM e aplicar o processamento
const observeDOMChanges = () => {
  const targetNode = document.querySelector("#divTimeLine")

  if (!targetNode) return

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).matches(".anexos") || (node as HTMLElement).querySelector(".anexos")) {
            document.querySelectorAll("#divTimeLine div.anexos").forEach((anexos: Element) => {
                if (!anexos.previousElementSibling?.querySelector('input[type="checkbox"][id^="markAll-"]')) {
                  processAnexosElement(anexos as HTMLDivElement)
                }
              })
              manageFloatingButton()
          }
        })
      }
    })
  })

  observer.observe(targetNode, { childList: true, subtree: true })

  return observer
}

function manageFloatingButton() {
  let floatingContainer = document.getElementById("floatingContainer")
  const checkedBoxes = Object.entries(checkboxStates).filter(
    ([, isChecked]) => isChecked,
  )

  if (checkedBoxes.length > 0) {
    if (!floatingContainer) {
      floatingContainer = document.createElement("div")
      floatingContainer.id = "floatingContainer"
      floatingContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                align-items: center;
            `

      const downloadButton = document.createElement("button")
      downloadButton.title = `Download de documento(s) selecionado(s)`
      downloadButton.id = "downloadButton"
      downloadButton.style.cssText = `
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
            `
      downloadButton.addEventListener("click", handleDownloadClick)

      const clearButton = document.createElement("button")
      clearButton.id = "clearButton"
      clearButton.title = "Desmarcar documento(s) selecionado(s)"
      clearButton.innerHTML = "&#10005;" // X symbol
      clearButton.style.cssText = `
                width: 30px;
                height: 30px;
                background-color: #dc3545;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            `
      clearButton.addEventListener("click", clearAllCheckboxes)

      floatingContainer.appendChild(downloadButton)
      floatingContainer.appendChild(clearButton)
      document.body.appendChild(floatingContainer)
    }

    const downloadButton = document.getElementById("downloadButton")
    if(downloadButton)downloadButton.textContent = `Download ${checkedBoxes.length.toString()} Documento(s)`
  } else if (floatingContainer) {
    floatingContainer.remove()
  }
}

function clearAllCheckboxes() {
  document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false
    if (checkbox.id.startsWith("chk-")) {
      checkboxStates[checkbox.id] = false
    }
  })
  manageFloatingButton()
}

const style = document.createElement("style")
style.textContent = `
    .spinner {
      display: inline-block;
      position: relative;
      width: 80px;
      height: 40px;
    }
  
    .spinner > div {
      background-color: #007bff;
      height: 100%;
      width: 6px;
      display: inline-block;
      animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    }
  
    .spinner .bounce1 {
      animation-delay: -0.32s;
    }
  
    .spinner .bounce2 {
      animation-delay: -0.16s;
    }
  
    @keyframes sk-bouncedelay {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
  `
document.head.appendChild(style)

const handleDownloadClick = () => {
  const currentCheckedBoxes = Object.entries(checkboxStates).filter(
    ([, isChecked]) => isChecked,
  )
  const checkedIds = currentCheckedBoxes.map(([id,]) =>
    id.replace("chk-", ""),
  )
  console.log("IDs marcados para download:", checkedIds)
  void processDocuments(checkedIds) 
}

// Função para criar o spinner de "Processando downloads..."
function createSpinnerElement() {
  const spinnerElement = document.createElement("div")
  spinnerElement.classList.add("spinner")
  spinnerElement.innerHTML = `
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
        <span>Processando downloads...</span>
      `
  return spinnerElement
}

// Função para exibir o spinner no botão de download
const showSpinner = (button: HTMLButtonElement) => {
  button.disabled = true
  button.style.display = "none"
  button.insertAdjacentElement("afterend", createSpinnerElement())
}

// Função para remover o spinner do botão de download
const hideSpinner = (button: HTMLButtonElement) => {
  const spinner = button.nextElementSibling
  if (spinner?.classList.contains("spinner")) {
    spinner.remove()
    button.style.display = "inline-block"
    button.disabled = false
  }
}

// Função para exibir um alerta com os resultados do download
const showDownloadResults = (successfulDownloads: string[], failedDownloads: string[]) => {
  let message = `${successfulDownloads.length.toString()} Downloads concluídos com sucesso!`
  if (failedDownloads.length > 0) {
    message = `Alguns downloads falharam:\n\nDocumentos não baixados:\n${failedDownloads.join("\n")}`
  }
  alert(message)
}

// Inicializa o processamento e o observer
document.querySelectorAll("#divTimeLine div.anexos").forEach((e: Element) => {
    processAnexosElement(e as HTMLDivElement)
})
observeDOMChanges()
manageFloatingButton() // Gerencia o botão flutuante inicialmente
