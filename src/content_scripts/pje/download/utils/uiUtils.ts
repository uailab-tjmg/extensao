export const disableLinks = ():void => {
    const links: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('#divTimeLine a');
    links.forEach(link => {
        link.style.pointerEvents = 'none';
        link.style.opacity = '0.5';
    });
}

export const enableLinks = (): void => {
    const links: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('#divTimeLine a');
    links.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.opacity = '1';
    });
}

export const updateProgress = (current: number, total: number): void => {
    const progressElement = document.getElementById('downloadProgress');
    if (progressElement) {
        const percentage = Math.round((current / total) * 100);
        progressElement.textContent = `Aguarde | Download ${current.toString()}/${total.toString()} - ${percentage.toString()}%`;
    }
}

export const showCompressingMessage = (): void => {
    const progressElement = document.getElementById('downloadProgress');
    if (progressElement) {
        progressElement.textContent = 'Compactando arquivos...';
    }
}