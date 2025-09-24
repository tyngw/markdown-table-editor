// Webviewランタイム: VS Code API を安全に初期化・キャッシュするヘルパー。
// どこで: React ベースの webview 実行時環境。
// 何を: acquireVsCodeApi の単回取得とキャッシュ再利用を統括し、既存インスタンスを共有。
// なぜ: タブを素早く開き直した際に "An instance of the VS Code API has already been acquired" が発生し、
//        API 参照を失うとリロードが進まないため、確実に同じインスタンスを返す仕組みを提供する。

const GLOBAL_CACHE_KEY = '__mteVscodeApi';

type AcquireFn = (() => any) | undefined;

function readCachedApi(win: Window & Record<string, any>): any | null {
    if (win.vscode) {
        console.log('[MTE][React] ensureVsCodeApi: reusing window.vscode');
        return win.vscode;
    }
    const cached = win[GLOBAL_CACHE_KEY] ?? null;
    if (cached) {
        console.log('[MTE][React] ensureVsCodeApi: reusing global cache');
    }
    return cached;
}

function storeCachedApi(win: Window & Record<string, any>, api: any): any {
    if (!api) {
        return null;
    }
    win[GLOBAL_CACHE_KEY] = api;
    win.vscode = api;
    return api;
}

export function ensureVsCodeApi(win: Window & Record<string, any> = window as any): any | null {
    try {
        console.log('[MTE][React] ensureVsCodeApi: start', {
            hasAcquire: typeof win.acquireVsCodeApi === 'function',
            hasWindowVscode: Boolean(win.vscode),
            hasCached: Boolean(win[GLOBAL_CACHE_KEY])
        });
        const cached = readCachedApi(win);
        if (cached) {
            console.log('[MTE][React] ensureVsCodeApi: using cached instance');
            return storeCachedApi(win, cached);
        }

        const acquire: AcquireFn = typeof win.acquireVsCodeApi === 'function' ? win.acquireVsCodeApi : undefined;
        if (!acquire) {
            console.log('[MTE][React] ensureVsCodeApi: acquire function unavailable');
            return null;
        }

        try {
            console.log('[MTE][React] ensureVsCodeApi: acquiring new instance');
            const api = acquire();
            console.log('[MTE][React] ensureVsCodeApi: acquire succeeded');
            return storeCachedApi(win, api);
        } catch (error) {
            if (error instanceof Error && error.message.includes('already been acquired')) {
                console.warn('[MTE][React] ensureVsCodeApi: acquire reported already-acquired');
                const fallback = readCachedApi(win);
                if (fallback) {
                    console.log('[MTE][React] ensureVsCodeApi: fallback to cached after already-acquired');
                    return storeCachedApi(win, fallback);
                }
                console.warn('[MTE][React] VS Code API already acquired elsewhere, but no cached instance was found.');
                return null;
            }

            console.warn('[MTE][React] Unexpected error while acquiring VS Code API:', error);
            return null;
        }
    } catch (outerError) {
        console.warn('[MTE][React] ensureVsCodeApi failed:', outerError);
        return null;
    }
}

export function getVsCodeApi(win: Window & Record<string, any> = window as any): any | null {
    return ensureVsCodeApi(win);
}
