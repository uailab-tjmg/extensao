import { JSZip, PDFLib } from '../../../../shared/vendor';

// Resto do seu código
import { showSpinner, hideSpinner, showDownloadResults } from '../utils/downloadUtils';
import { disableCheckboxes, enableCheckboxes, checkboxStates } from '../components/checkbox';

interface Document {
    dynamicId: string;
    name: string;
}

interface DownloadResult {
    successful: string[];
    failed: { name: string; error: string }[];
}

// Function to get the base URL and endpoint based on the current URL
function getBaseUrlAndEndpoint() {
    const baseUrl = 'https://pje.tjmg.jus.br';
    const currentUrl = window.location.href;
    let endpoint;

    if (currentUrl.includes('listAutosDigitais.seam')) {
        endpoint = '/pje/Processo/ConsultaProcesso/Detalhe/listAutosDigitais.seam';
    } else if (currentUrl.includes('listProcessoCompletoAdvogado.seam')) {
        endpoint = '/pje/Processo/ConsultaProcesso/Detalhe/listProcessoCompletoAdvogado.seam';
    } else {
        throw new Error('URL não suportada');
    }

    return { baseUrl, endpoint };
}

async function downloadDocuments(documentsArray: Document[]): Promise<DownloadResult> {
    const { endpoint } = getBaseUrlAndEndpoint();

    // Função para obter o viewState
    function getViewState(): string {
        const viewStateElement = document.querySelector<HTMLInputElement>('input[name="javax.faces.ViewState"]');
        if (!viewStateElement) {
            throw new Error('ViewState não encontrado na página.');
        }
        return viewStateElement.value;
    }

    // Função para fazer a requisição e obter os dados do documento
    async function getDocumentData(dynId: string, viewState: string): Promise<string> {
        const formData = new FormData();
        formData.append('AJAXREQUEST', '_viewRoot');
        formData.append('javax.faces.ViewState', viewState);
        formData.append(`divTimeLine:${dynId}`, `divTimeLine:${dynId}`);
        formData.append('ajaxSingle', `divTimeLine:${dynId}`);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'Faces-Request': 'partial/ajax'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status.toString()}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Erro ao obter dados do documento:', error);
            throw error;
        }
    }

    // Função para fazer o download do documento
    async function downloadDocumentFile(dynamicId: string, viewState: string, maxAttempts = 2): Promise<ArrayBuffer> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Chama getDocumentData antes de cada tentativa de download
                await getDocumentData(dynamicId, viewState);
    
                const formData = new FormData();
                formData.append('detalheDocumento', 'detalheDocumento');
                formData.append('autoScroll', '');
                formData.append('javax.faces.ViewState', viewState);
                formData.append('detalheDocumento:download', 'detalheDocumento:download');
    
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status.toString()}`);
                }
    
                const responseText = await response.text();
                const match = /https:\/\/s3-pjedocumentos\.tjmg\.jus\.br\/[^"']+/.exec(responseText);
                if (!match) {
                    if (attempt < maxAttempts) {
                        console.log(`Tentativa ${attempt.toString()}: Link do PDF não encontrado. Tentando novamente...`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos antes de tentar novamente
                        continue;
                    }
                    throw new Error('Link do PDF não encontrado na resposta após múltiplas tentativas.');
                }
    
                const pdfResponse = await fetch(match[0]);
                if (!pdfResponse.ok) {
                    throw new Error(`HTTP error! status: ${pdfResponse.status.toString()}`);
                }
    
                return await pdfResponse.arrayBuffer();
            } catch (error) {
                if (attempt === maxAttempts) {
                    console.error('Erro ao fazer o download do documento:', error);
                    throw error;
                }
                console.log(`Tentativa ${attempt.toString()} falhou. Tentando novamente...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos antes de tentar novamente
            }
        }
        throw new Error('Falha ao baixar o documento após múltiplas tentativas.');
    }

    // Função para remover a primeira página do PDF
    async function removeFirstPage(pdfArrayBuffer: ArrayBuffer): Promise<Uint8Array> {        
        const pdfDoc = await PDFLib.PDFDocument.load(pdfArrayBuffer);
        if (pdfDoc.getPageCount() > 1) {
            pdfDoc.removePage(0);
        }
        return await pdfDoc.save();
    }

    // Função principal
    async function processDocuments(): Promise<DownloadResult> {
        const viewState = getViewState();        
        const zip = new JSZip();
        const processNumberElement = document.querySelector("a.titulo-topo");
        const folderName = processNumberElement?.firstChild?.textContent?.trim() ?? "Número não encontrado";

        const results: { success: boolean; name: string; error?: string }[] = [];
        for (const doc of documentsArray) {
            try {
                await getDocumentData(doc.dynamicId, viewState);
                const pdfArrayBuffer = await downloadDocumentFile(doc.dynamicId, viewState);
                const modifiedPdfArrayBuffer = await removeFirstPage(pdfArrayBuffer);
                zip.file(`${folderName}/${doc.name}.pdf`, modifiedPdfArrayBuffer);
                console.log(`Documento ${doc.name} processado e adicionado ao ZIP.`);
                results.push({ success: true, name: doc.name })
            } catch (error) {
                console.error(`Erro ao processar o documento ${doc.name}:`, error);
                results.push({ success: false, name: doc.name, error: (error as Error).message });
            }
        }

        const successful = results.filter((r) => r.success).map((r) => r.name);
        const failed = results
            .filter((r) => !r.success)
            .map((r) => ({ name: r.name, error: r.error??'' }));

        if (successful.length === 0) {
            throw new Error("Nenhum documento foi baixado com sucesso.");
        }

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${folderName}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao gerar o arquivo ZIP:', error);
            throw new Error("Não foi possível gerar o arquivo ZIP.");
        }

        return { successful, failed };
    }

    // Iniciar o processo de download
    try {
        return await processDocuments();
    } catch (error) {
        console.error('Erro durante o processo de download:', error);
        alert('Ocorreu um erro durante o download dos documentos. Por favor, verifique o console para mais detalhes.');
        throw error;
    }
}

export async function handleDownloadClick(): Promise<void> {
    const downloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
    const clearButton = document.getElementById("clearButton") as HTMLButtonElement;

    showSpinner(downloadButton);
    clearButton.style.display = "none";
    disableCheckboxes();

    const currentCheckedBoxes = Object.entries(checkboxStates).filter(([, isChecked]) => isChecked);
    
    const documentsArray = currentCheckedBoxes.map(([id, ]) => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            const anchorElement = checkbox.nextElementSibling;
            if (anchorElement && anchorElement.tagName === 'A') {
                const dynamicId = id.replace('chk-', '');
                const name = anchorElement.textContent?.trim() ?? '';
                return { dynamicId, name };
            }
        }
        return null;
    }).filter((item): item is Document => item !== null);

    console.log("Documentos selecionados para download:", documentsArray);

    try {
        const results = await downloadDocuments(documentsArray);
        showDownloadResults(results.successful, results.failed.map(f => f.name));
    } catch (error) {
        console.error("Erro ao processar documentos:", error);
        alert("Ocorreu um erro ao processar os documentos.");
    } finally {
        hideSpinner(downloadButton);
        clearButton.style.display = "flex";
        enableCheckboxes();
    }
}