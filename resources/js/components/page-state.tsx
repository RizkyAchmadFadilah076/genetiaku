import { Loader2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    resolvePageState
    
    
} from '@/lib/page-state';
import type {PageStateInput, PageStateStatus} from '@/lib/page-state';
import { cn } from '@/lib/utils';

export interface PageStateProps extends PageStateInput {
    loadingSlot?: ReactNode;
    emptySlot?: ReactNode;
    errorSlot?: ReactNode;
    children?: ReactNode;
    className?: string;
}

export default function PageState({
    isLoading,
    error,
    isEmpty,
    loadingSlot,
    emptySlot,
    errorSlot,
    children,
    className,
}: PageStateProps) {
    const status: PageStateStatus = resolvePageState({
        isLoading,
        error,
        isEmpty,
    });

    return <div className={cn(className)}>{renderStatus(status)}</div>;

    function renderStatus(current: PageStateStatus): ReactNode {
        switch (current) {
            case 'error':
                return (
                    errorSlot ?? (
                        <div role="alert" className="text-sm text-destructive">
                            {toMessage(error) ?? 'Something went wrong.'}
                        </div>
                    )
                );
            case 'loading':
                return (
                    loadingSlot ?? (
                        <div
                            role="status"
                            aria-live="polite"
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <Loader2Icon
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                            <span>Loading…</span>
                        </div>
                    )
                );
            case 'empty':
                return (
                    emptySlot ?? (
                        <div className="text-sm text-muted-foreground">
                            No data available.
                        </div>
                    )
                );
            case 'ready':
            default:
                return children ?? null;
        }
    }
}

function toMessage(error: unknown): string | undefined {
    if (error === null || error === undefined) {
        return undefined;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    ) {
        return (error as { message: string }).message;
    }

    return undefined;
}
