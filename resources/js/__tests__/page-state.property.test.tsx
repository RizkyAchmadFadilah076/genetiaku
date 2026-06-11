// Feature: genetikaku-expert-system, Property 19: Halaman merender tepat satu status
import { cleanup, render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import PageState from '@/components/page-state';
import {
    resolvePageState
    
} from '@/lib/page-state';
import type {PageStateStatus} from '@/lib/page-state';

/**
 * Property 19: Halaman merender tepat satu status.
 *
 * Validates: Requirements 16.7
 *
 * For ANY combination of page inputs (loading, empty, error), the page resolves
 * to and renders EXACTLY ONE status indicator based on a single source of truth,
 * so two status indicators can never appear at once.
 */

const ALL_STATUSES: readonly PageStateStatus[] = [
    'loading',
    'empty',
    'error',
    'ready',
];

/** Distinguishable test ids — one per possible status indicator. */
const TESTIDS: Record<PageStateStatus, string> = {
    loading: 'slot-loading',
    empty: 'slot-empty',
    error: 'slot-error',
    ready: 'slot-ready',
};

/**
 * Arbitrary error value covering the full input space: no-error sentinels
 * (`undefined`/`null`), `Error` instances, plain strings, and falsy-but-present
 * values (`0`, `''`) which the resolver still treats as a real error.
 */
const errorArb = fc.oneof(
    fc.constant(undefined),
    fc.constant(null),
    fc.string().map((message) => new Error(message)),
    fc.string(),
    fc.constant(0),
    fc.constant(''),
);

const inputArb = fc.record({
    isLoading: fc.boolean(),
    isEmpty: fc.boolean(),
    error: errorArb,
});

describe('Property 19: Halaman merender tepat satu status', () => {
    it('(a) resolvePageState is total: returns exactly one of the four statuses', () => {
        fc.assert(
            fc.property(inputArb, (input) => {
                const status = resolvePageState(input);

                // Exactly one known status is produced for any input.
                expect(ALL_STATUSES).toContain(status);
            }),
            { numRuns: 200 },
        );
    });

    it('(b) PageState renders exactly one status indicator for any input', () => {
        fc.assert(
            fc.property(inputArb, (input) => {
                const expected = resolvePageState(input);

                render(
                    <PageState
                        isLoading={input.isLoading}
                        isEmpty={input.isEmpty}
                        error={input.error}
                        loadingSlot={
                            <div data-testid={TESTIDS.loading}>loading</div>
                        }
                        emptySlot={<div data-testid={TESTIDS.empty}>empty</div>}
                        errorSlot={<div data-testid={TESTIDS.error}>error</div>}
                    >
                        <div data-testid={TESTIDS.ready}>ready</div>
                    </PageState>,
                );

                try {
                    // Exactly the expected indicator is present...
                    expect(
                        screen.getByTestId(TESTIDS[expected]),
                    ).toBeInTheDocument();

                    // ...and every other indicator is absent.
                    for (const status of ALL_STATUSES) {
                        if (status === expected) {
                            continue;
                        }

                        expect(
                            screen.queryByTestId(TESTIDS[status]),
                        ).not.toBeInTheDocument();
                    }

                    // Sanity: precisely one indicator node exists in the DOM.
                    const rendered = ALL_STATUSES.filter(
                        (status) =>
                            screen.queryByTestId(TESTIDS[status]) !== null,
                    );
                    expect(rendered).toHaveLength(1);
                } finally {
                    // Reset the DOM between iterations (afterEach only fires once).
                    cleanup();
                }
            }),
            { numRuns: 200 },
        );
    });
});
