import { processAnexosElement } from '../components/checkbox';
import { manageFloatingButton } from '../components/floatingButton';

export function observeDOMChanges(): MutationObserver | undefined {
    const targetNode = document.querySelector("#divTimeLine");

    if (!targetNode) return;

    const observer = new MutationObserver(mutationsList => {
        const shouldProcess = mutationsList.some(mutation => 
            mutation.type === 'childList' && 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === Node.ELEMENT_NODE && 
                ((node as Element).matches(".anexos") || (node as Element).querySelector(".anexos"))
            )
        );

        if (shouldProcess) {
            document.querySelectorAll("#divTimeLine .anexos").forEach(anexos => {
                if (!anexos.previousElementSibling?.querySelector<HTMLInputElement>('input[type="checkbox"][id^="markAll-"]')) {
                    processAnexosElement(anexos as HTMLElement);
                }
            });
            manageFloatingButton();
        }
    });

    observer.observe(targetNode, { childList: true, subtree: true });

    return observer;
}

export function extractNumberFromText(text: string): string | null {
    const match = /^\d+/.exec(text);
    return match ? match[0] : null;
}

export { processAnexosElement };