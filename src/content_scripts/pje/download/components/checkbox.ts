import { extractNumberFromText } from "../utils/domUtils"
import { manageFloatingButton } from "./floatingButton"

export const checkboxStates: Record<string, boolean> = {}

export const styleCheckboxes = (): void => {
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

export const addMarkAllCheckbox = (anexosDiv: HTMLElement): void => {
  if (anexosDiv.querySelector("ul.tree")) {
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
      const checkboxes = anexosDiv.querySelectorAll(
        'input[type="checkbox"][id^="chk-"]',
      )
      checkboxes.forEach((checkbox) => {
        ;(checkbox as HTMLInputElement).checked = markAllCheckbox.checked
        checkboxStates[checkbox.id] = markAllCheckbox.checked
      })
      manageFloatingButton()
    })

    // Adicionar evento para atualizar o estado do "Marcar todos"
    anexosDiv.addEventListener("change", (event) => {
      const target = event.target as HTMLInputElement
      if (target.type === "checkbox" && target.id.startsWith("chk-")) {
        updateMarkAllState(anexosDiv, markAllCheckbox)
      }
    })
  }
}

export const updateMarkAllState = (
  anexosDiv: HTMLElement,
  markAllCheckbox: HTMLInputElement,
): void => {
  const checkboxes = anexosDiv.querySelectorAll(
    'input[type="checkbox"][id^="chk-"]',
  )
  const allChecked = Array.from(checkboxes).every(
    (checkbox) => (checkbox as HTMLInputElement).checked,
  )
  markAllCheckbox.checked = allChecked
}

export const addCheckboxWithId = (
  parentElement: HTMLElement,
  id: string,
  insertBefore: HTMLElement | null = null,
): void => {
  // Encontrar o elemento irmão "a"
  const siblingAnchor = parentElement.querySelector('a[id^="divTimeLine:"]')

  let sanitizedId: string
  if (siblingAnchor) {
    // Remover o prefixo "divTimeLine:" do id do elemento "a"
    const anchorId = siblingAnchor.id.replace("divTimeLine:", "")
    sanitizedId = `chk-${anchorId}`
  } else {
    // Fallback para o comportamento anterior se não encontrar o elemento "a"
    sanitizedId = `chk-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`
  }

  // Escapar caracteres especiais para uso no seletor CSS
  const escapedSanitizedId = CSS.escape(sanitizedId)

  if (!parentElement.querySelector(`#${escapedSanitizedId}`)) {
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

    checkbox.addEventListener("change", (e) => {
      checkboxStates[sanitizedId] = (e.target as HTMLInputElement).checked
      manageFloatingButton()

      // Encontrar o checkbox "Marcar todos" mais próximo e atualizar seu estado
      const anexosDiv =
        parentElement.closest(".anexos") ??
        parentElement.querySelector(".anexos")
      if (anexosDiv) {
        const markAllCheckbox =
          anexosDiv.previousElementSibling?.querySelector<HTMLInputElement>(
            'input[type="checkbox"][id^="markAll-"]',
          )
        if (markAllCheckbox) {
          updateMarkAllState(anexosDiv as HTMLElement, markAllCheckbox)
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

export const processAnexosElement = (e: HTMLElement): void => {
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

export const disableCheckboxes = (): void => {
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    ;(checkbox as HTMLInputElement).disabled = true
  })
}

export const enableCheckboxes = (): void => {
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        (checkbox as HTMLInputElement).disabled = false;
    });
  }

export const clearAllCheckboxes = (): void => {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        (checkbox as HTMLInputElement).checked = false;
        if (checkbox.id.startsWith('chk-')) {
            checkboxStates[checkbox.id] = false;
        }
    });
    manageFloatingButton();
  }
