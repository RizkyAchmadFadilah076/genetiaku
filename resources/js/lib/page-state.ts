export type PageStateStatus = 'loading' | 'empty' | 'error' | 'ready';

export interface PageStateInput {
    isLoading?: boolean;
    error?: unknown;
    isEmpty?: boolean;
}

function hasError(error: unknown): boolean {
    return error !== null && error !== undefined;
}

export function resolvePageState(input: PageStateInput): PageStateStatus {
    if (hasError(input.error)) {
        return 'error';
    }

    if (input.isLoading === true) {
        return 'loading';
    }

    if (input.isEmpty === true) {
        return 'empty';
    }

    return 'ready';
}
