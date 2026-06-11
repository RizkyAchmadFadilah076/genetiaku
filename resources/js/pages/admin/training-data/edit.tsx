import { Head } from '@inertiajs/react';
import TrainingDataForm from './training-data-form';
import type {PhenotypeOptions, TrainingRow} from './training-data-form';

interface EditProps {
    row: TrainingRow;
    phenotypeOptions: PhenotypeOptions;
    screeningOptions: string[];
    riskOptions: string[];
}

export default function TrainingDataEdit({
    row,
    phenotypeOptions,
    screeningOptions,
    riskOptions,
}: EditProps) {
    return (
        <>
            <Head title="Ubah Data Latih" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Ubah Data Latih</h1>
                    <p className="text-sm text-muted-foreground">
                        Nilai fenotipe dibatasi pada Data_Fenotipe terkini.
                    </p>
                </div>

                <TrainingDataForm
                    action={`/admin/data-latih/${row.id}`}
                    method="put"
                    row={row}
                    phenotypeOptions={phenotypeOptions}
                    screeningOptions={screeningOptions}
                    riskOptions={riskOptions}
                    cancelHref="/admin/data-latih"
                    submitLabel="Perbarui"
                />
            </div>
        </>
    );
}

TrainingDataEdit.layout = {
    breadcrumbs: [
        { title: 'Data Latih', href: '/admin/data-latih' },
        { title: 'Ubah', href: '#' },
    ],
};
