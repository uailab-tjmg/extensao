export function createSpinnerElement(): HTMLDivElement {
    const spinnerElement = document.createElement("div");
    spinnerElement.classList.add("spinner");
    spinnerElement.innerHTML = `        
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>        
    `;
    return spinnerElement;
}

export function showSpinner(button: HTMLButtonElement): void {
    button.disabled = true;
    button.style.display = "none";
    button.insertAdjacentElement("afterend", createSpinnerElement());
}

export function hideSpinner(button: HTMLButtonElement): void {
    const spinner = button.nextElementSibling;
    if (spinner?.classList.contains("spinner")) {
        spinner.remove();
        button.style.display = "inline-block";
        button.disabled = false;
    }
}

export function showDownloadResults(successfulDownloads: string[], failedDownloads: string[]): void {
    let message = `${successfulDownloads.length.toString()} Downloads concluídos com sucesso!`;
    if (failedDownloads.length > 0) {
        message = `Alguns downloads falharam:\n\nDocumentos não baixados:\n${failedDownloads.join("\n")}`;
    }
    alert(message);
}