import { checkboxStates, clearAllCheckboxes } from './checkbox';
import { handleDownloadClick } from '../services/documentService';

export const manageFloatingButton = (): void => {
    let floatingContainer = document.getElementById('floatingContainer');
    const checkedBoxes = Object.entries(checkboxStates).filter(([, isChecked]) => isChecked);
  
    if (checkedBoxes.length > 0) {
        if (!floatingContainer) {
            floatingContainer = document.createElement('div');
            floatingContainer.id = 'floatingContainer';
            floatingContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                align-items: center;
            `;
            
            const downloadButton = document.createElement('button');
            downloadButton.title = `Download de documento(s) selecionado(s)`;
            downloadButton.id = 'downloadButton';
            downloadButton.style.cssText = `
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
            `;
            downloadButton.addEventListener('click', () => {void handleDownloadClick();});
            
            const clearButton = document.createElement('button');
            clearButton.id = 'clearButton';
            clearButton.title = 'Desmarcar documento(s) selecionado(s)';
            clearButton.innerHTML = '&#10005;'; // X symbol
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
            `;
            clearButton.addEventListener('click', clearAllCheckboxes);
            
            floatingContainer.appendChild(downloadButton);
            floatingContainer.appendChild(clearButton);
            document.body.appendChild(floatingContainer);
        }
        
        const downloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
        downloadButton.textContent = `Download ${checkedBoxes.length.toString()} Documento(s)`;
        downloadButton.disabled = false;
    } else if (floatingContainer) {
        floatingContainer.remove();
    }
  }