import { Head } from '@inertiajs/react';
import TrainingDataForm from './training-data-form';
import type {PhenotypeOptions} from './training-data-form';

interface CreateProps {
    phenotypeOptions: PhenotypeOptions;
    screeningOptions: string[];
    riskOptions: string[];
}

export default function TrainingDataCreate({
    phenotypeOptions,
    screeningOptions,
    riskOptions,
}: CreateProps) {
    return (
        <>
            <Head title="Tambah Data Latih" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Tambah Data Latih</h1>
                    <p className="text-sm text-muted-foreground">
                        Nilai fenotipe dibatasi pada Data_Fenotipe terkini.
                    </p>
                </div>

                <TrainingDataForm
                    action="/admin/data-latih"
                    method="post"
                    phenotypeOptions={phenotypeOptions}
                    screeningOptions={screeningOptions}
                    riskOptions={riskOptions}
                    cancelHref="/admin/data-latih"
                    submitLabel="Simpan"
                />
            </div>
        </>
    );
}

TrainingDataCreate.layout = {
    breadcrumbs: [
        { title: 'Data Latih', href: '/admin/data-latih' },
        { title: 'Tambah', href: '/admin/data-latih/create' },
    ],
};
