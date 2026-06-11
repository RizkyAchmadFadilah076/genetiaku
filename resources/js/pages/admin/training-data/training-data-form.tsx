import { Form } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface TrainingRow {
    id: number;
    father_blood: string;
    father_iris: string;
    father_hair: string;
    father_ear: string;
    father_thalassemia: string;
    mother_blood: string;
    mother_iris: string;
    mother_hair: string;
    mother_ear: string;
    mother_thalassemia: string;
    baby_blood: string;
    baby_iris: string;
    baby_hair: string;
    baby_ear: string;
    baby_thalassemia_risk: string;
}

export type PhenotypeOptions = Record<string, string[]>;

// Kategori fenotipe — backing value harus identik dengan PhenotypeCategory (PHP).
const CAT_BLOOD = 'Golongan Darah';
const CAT_IRIS = 'Warna Iris Mata';
const CAT_HAIR = 'Tekstur Rambut';
const CAT_EAR = 'Bentuk Cuping Telinga';

interface FieldDef {
    name: keyof Omit<TrainingRow, 'id'>;
    label: string;
    category: string; // kunci ke phenotypeOptions, atau '__screening__' / '__risk__'
}

const SCREENING = '__screening__';
const RISK = '__risk__';

const FATHER_FIELDS: FieldDef[] = [
    { name: 'father_blood', label: 'Golongan Darah', category: CAT_BLOOD },
    { name: 'father_iris', label: 'Warna Iris Mata', category: CAT_IRIS },
    { name: 'father_hair', label: 'Tekstur Rambut', category: CAT_HAIR },
    { name: 'father_ear', label: 'Bentuk Cuping Telinga', category: CAT_EAR },
    { name: 'father_thalassemia', label: 'Status Thalassemia', category: SCREENING },
];

const MOTHER_FIELDS: FieldDef[] = [
    { name: 'mother_blood', label: 'Golongan Darah', category: CAT_BLOOD },
    { name: 'mother_iris', label: 'Warna Iris Mata', category: CAT_IRIS },
    { name: 'mother_hair', label: 'Tekstur Rambut', category: CAT_HAIR },
    { name: 'mother_ear', label: 'Bentuk Cuping Telinga', category: CAT_EAR },
    { name: 'mother_thalassemia', label: 'Status Thalassemia', category: SCREENING },
];

const BABY_FIELDS: FieldDef[] = [
    { name: 'baby_blood', label: 'Golongan Darah', category: CAT_BLOOD },
    { name: 'baby_iris', label: 'Warna Iris Mata', category: CAT_IRIS },
    { name: 'baby_hair', label: 'Tekstur Rambut', category: CAT_HAIR },
    { name: 'baby_ear', label: 'Bentuk Cuping Telinga', category: CAT_EAR },
    { name: 'baby_thalassemia_risk', label: 'Risiko Thalassemia', category: RISK },
];

interface TrainingDataFormProps {
    action: string;
    method: 'post' | 'put';
    row?: TrainingRow;
    phenotypeOptions: PhenotypeOptions;
    screeningOptions: string[];
    riskOptions: string[];
    cancelHref: string;
    submitLabel: string;
}

export default function TrainingDataForm({
    action,
    method,
    row,
    phenotypeOptions,
    screeningOptions,
    riskOptions,
    cancelHref,
    submitLabel,
}: TrainingDataFormProps) {
    const optionsFor = (category: string): string[] => {
        if (category === SCREENING) {
return screeningOptions;
}

        if (category === RISK) {
return riskOptions;
}

        return phenotypeOptions[category] ?? [];
    };

    const renderGroup = (
        title: string,
        fields: FieldDef[],
        errors: Record<string, string>,
    ) => (
        <fieldset className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <legend className="px-2 text-sm font-semibold text-foreground">
                {title}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                    const options = optionsFor(field.category);

                    return (
                        <div key={field.name} className="grid gap-2">
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <select
                                id={field.name}
                                name={field.name}
                                defaultValue={row ? row[field.name] : ''}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                required
                            >
                                <option value="" disabled>
                                    Pilih {field.label.toLowerCase()}
                                </option>
                                {options.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors[field.name]} />
                        </div>
                    );
                })}
            </div>
        </fieldset>
    );

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    {renderGroup('Atribut Ayah', FATHER_FIELDS, errors)}
                    {renderGroup('Atribut Ibu', MOTHER_FIELDS, errors)}
                    {renderGroup('Prediksi Bayi', BABY_FIELDS, errors)}

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={cancelHref}>Batal</Link>
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
