export interface PredictionSessionScreening {
    father_name: string;
    mother_name: string;
    father_result: string;
    mother_result: string;
    father_indicators: string[];
    mother_indicators: string[];
}

export interface PredictionSessionEntry {
    predictionId: number;
    createdAt: string;
    physical: Record<string, string>;
    thalassemiaRisk: string;
    probabilities: Record<string, Record<string, number>>;
    screening: PredictionSessionScreening;
}

const entries: PredictionSessionEntry[] = [];

export function addPredictionSessionEntry(
    entry: Omit<PredictionSessionEntry, 'createdAt'> & { createdAt?: string },
): void {
    const existingIndex = entries.findIndex(
        (item) => item.predictionId === entry.predictionId,
    );
    const nextEntry: PredictionSessionEntry = {
        ...entry,
        createdAt: entry.createdAt ?? new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        entries[existingIndex] = nextEntry;

        return;
    }

    entries.unshift(nextEntry);
}

export function getPredictionSessionEntries(): PredictionSessionEntry[] {
    return [...entries];
}
