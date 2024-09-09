import './shared/common.css'
import { StorageData, ToggleMessage } from './shared/types'
import { toggleConfig } from './shared/config'

document.addEventListener("DOMContentLoaded", ():void => {
    const toggles: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type="checkbox"]')

    // Carrega o estado salvo dos toggles
    chrome.storage.sync.get(
        Object.values(toggleConfig).map(config => config.storageKey),
        (result: StorageData) => {
            toggles.forEach((toggle: HTMLInputElement) => {
                const config = toggleConfig[toggle.id]
                toggle.checked = result[config.storageKey] ?? false;
            })
        }
    )

    // Adiciona listeners para salvar o estado dos toggles
    toggles.forEach((toggle: HTMLInputElement): void => {
        toggle.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement
            const config = toggleConfig[target.id]
            void chrome.storage.sync.set({[config.storageKey]: target.checked})

            // Envia mensagem para o content script
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const currentTab = tabs[0]
                if(currentTab.id){
                    const message: ToggleMessage = {
                        action: 'toggleChanged',
                        scriptName: config.scriptName,
                        value: target.checked
                    }
                    chrome.tabs.sendMessage(currentTab.id, message, () => {
                        if(chrome.runtime.lastError){
                            console.log("Não foi possível estabelecer a conexão. O script de conteúdo pode não ser carregado.");
                        }else {
                            console.log('Mensagem enviada com sucesso');
                        }
                    })
                }
            })
        })
    })

    // Função para alternar a visibilidade das seções
    const toggleSection = (headerId: string, contentId: string): void => {
        const header = document.getElementById(headerId);
        const content = document.getElementById(contentId);
        const arrow = header?.querySelector<SVGElement>('svg.arrow-icon');
        
        if (header && content && arrow) {
            header.addEventListener('click', () => {
                content.classList.toggle('hidden');
                arrow.style.transform = arrow.style.transform === 'rotate(-90deg)' ? 'rotate(0deg)' : 'rotate(-90deg)';
            });
        }
    };

    // Inicializa os toggles das seções
    const sections = [
        { header: 'pje-header', content: 'pje-content' },
        { header: 'scdp-header', content: 'scdp-content' },        
    ];

    sections.forEach(section => {
        toggleSection(section.header, section.content);
    });

    // Mapeamento de IDs para URLs
    const urlMap: Record<string, string> = {
        'pje-header': 'https://pje.tjmg.jus.br/',
        'scdp-header': 'https://www.scdp.mg.gov.br/',        
    };

    // Adiciona funcionalidade para abrir links externos
    const externalLinks = document.querySelectorAll('.external-link');
    externalLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o evento de clique se propague para o header
            const header = link.closest('[id$="-header"]');
            if (header) {
                const url = urlMap[header.id];
                if (url) {
                    void chrome.tabs.create({ url: url });
                }
            }
        });
    });
})