import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

interface ScreeningContext {
    father_name: string;
    mother_name: string;
    father_result: string;
    mother_result: string;
    father_indicators: string[];
    mother_indicators: string[];
}

interface EducationContent {
    result_explanation: string;
    thalassemia_info: string;
    follow_up_advice: string;
    method_explanation: string;
    mendel_basis: string;
    two_stage_flow: string;
}

interface PrintProps {
    physical: Record<string, string>;
    thalassemiaRisk: string;
    probabilities: Record<string, Record<string, number>>;
    screening: ScreeningContext;
    education: EducationContent;
    disclaimer: string;
}

const EDUCATION_SECTIONS: { key: keyof EducationContent; title: string }[] = [
    { key: 'method_explanation', title: 'Metode Prediksi' },
    { key: 'two_stage_flow', title: 'Alur Pemeriksaan' },
    { key: 'mendel_basis', title: 'Landasan Pewarisan' },
    { key: 'result_explanation', title: 'Penjelasan Hasil' },
    { key: 'thalassemia_info', title: 'Tentang Thalassemia' },
    { key: 'follow_up_advice', title: 'Saran Pemeriksaan Lanjutan' },
];

const VARIABLE_LABELS: Record<string, string> = {
    baby_blood: 'Golongan Darah Bayi',
    baby_iris: 'Warna Iris Mata Bayi',
    baby_hair: 'Tekstur Rambut Bayi',
    baby_ear: 'Bentuk Cuping Telinga Bayi',
    baby_thalassemia_risk: 'Risiko Thalassemia Bayi',
};

function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
}

function variableLabel(key: string): string {
    return VARIABLE_LABELS[key] ?? key.replace(/^baby_/, '').replace(/_/g, ' ');
}

function riskMeaning(risk: string): string {
    switch (risk) {
        case 'Mayor':
            return 'Tingkat paling berat: anemia parah sejak bayi dan umumnya membutuhkan transfusi darah rutin seumur hidup.';
        case 'Intermedia':
            return 'Tingkat menengah: anemia ringan hingga sedang dan transfusi darah hanya dibutuhkan sesekali pada kondisi tertentu.';
        default:
            return 'Tingkat paling ringan: umumnya tanpa gejala atau hanya anemia ringan, dan biasanya tidak memerlukan pengobatan khusus.';
    }
}

export default function PredictionPrint({
    physical,
    thalassemiaRisk,
    probabilities,
    screening,
    education,
    disclaimer,
}: PrintProps) {
    useEffect(() => {
        const timer = window.setTimeout(() => window.print(), 300);

        return () => window.clearTimeout(timer);
    }, []);

    const physicalEntries = Object.entries(physical);
    const probabilityEntries = Object.entries(probabilities);
    const printedAt = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date());

    return (
        <>
            <Head title="Cetak Hasil Prediksi" />

            <style>{`
                @page {
                    size: A4;
                    margin: 16mm 14mm;
                }

                @media print {
                    html,
                    body {
                        background: #ffffff !important;
                    }

                    .print-report {
                        box-shadow: none !important;
                    }

                    .print-section {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-950 print:bg-white print:px-0 print:py-0">
                <div className="mx-auto mb-6 flex max-w-[210mm] items-center justify-between print:hidden">
                    <span className="text-sm text-neutral-500">
                        Gunakan tombol di kanan untuk mencetak atau menyimpan hasil sebagai PDF.
                    </span>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-base font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                    >
                        Cetak Hasil
                    </button>
                </div>

                <article className="print-report mx-auto min-h-[297mm] max-w-[210mm] bg-white px-12 py-10 shadow-sm print:min-h-0 print:max-w-none print:px-0 print:py-0">
                    <header className="border-b-2 border-neutral-900 pb-5">
                        <div className="flex items-start justify-between gap-8">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
                                    Genetikaku
                                </p>
                                <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide">
                                    Laporan Hasil Prediksi Karakteristik Bayi
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-700">
                                    Dokumen ini berisi ringkasan hasil skrining orang tua,
                                    prediksi karakteristik fisik bayi, risiko Thalassemia, dan
                                    probabilitas keluaran berdasarkan data yang dimasukkan.
                                </p>
                            </div>
                            <div className="shrink-0 border border-neutral-300 px-4 py-3 text-right text-xs leading-6 text-neutral-700">
                                <p className="font-semibold uppercase text-neutral-900">Dokumen Cetak</p>
                                <p>{printedAt}</p>
                            </div>
                        </div>
                    </header>

                    <section className="print-section mt-6">
                        <h2 className="border-b border-neutral-300 pb-2 text-sm font-bold uppercase tracking-wide">
                            A. Identitas dan Ringkasan Hasil
                        </h2>
                        <table className="mt-3 w-full border-collapse text-sm">
                            <tbody>
                                <tr>
                                    <th className="w-44 border border-neutral-300 bg-neutral-100 px-3 py-2 text-left font-semibold">
                                        Nama Ayah
                                    </th>
                                    <td className="border border-neutral-300 px-3 py-2">
                                        {screening.father_name}
                                    </td>
                                    <th className="w-44 border border-neutral-300 bg-neutral-100 px-3 py-2 text-left font-semibold">
                                        Hasil Skrining Ayah
                                    </th>
                                    <td className="border border-neutral-300 px-3 py-2 font-semibold">
                                        {screening.father_result}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-left font-semibold">
                                        Nama Ibu
                                    </th>
                                    <td className="border border-neutral-300 px-3 py-2">
                                        {screening.mother_name}
                                    </td>
                                    <th className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-left font-semibold">
                                        Hasil Skrining Ibu
                                    </th>
                                    <td className="border border-neutral-300 px-3 py-2 font-semibold">
                                        {screening.mother_result}
                                    </td>
                                </tr>
                                <tr>
                                    <th className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-left font-semibold">
                                        Risiko Thalassemia Bayi
                                    </th>
                                    <td
                                        colSpan={3}
                                        className="border border-neutral-300 px-3 py-2 font-bold"
                                    >
                                        {thalassemiaRisk}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="print-section mt-6">
                        <h2 className="border-b border-neutral-300 pb-2 text-sm font-bold uppercase tracking-wide">
                            B. Hasil Skrining Orang Tua
                        </h2>
                        <table className="mt-3 w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-neutral-100">
                                    <th className="w-1/4 border border-neutral-300 px-3 py-2 text-left">
                                        Subjek
                                    </th>
                                    <th className="w-1/5 border border-neutral-300 px-3 py-2 text-left">
                                        Hasil
                                    </th>
                                    <th className="border border-neutral-300 px-3 py-2 text-left">
                                        Indikator yang Dipilih
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="align-top">
                                    <td className="border border-neutral-300 px-3 py-2">
                                        {screening.father_name} (Ayah)
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 font-semibold">
                                        {screening.father_result}
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 leading-relaxed">
                                        {screening.father_indicators.length > 0
                                            ? screening.father_indicators.join(', ')
                                            : 'Tidak ada indikator yang dipilih.'}
                                    </td>
                                </tr>
                                <tr className="align-top">
                                    <td className="border border-neutral-300 px-3 py-2">
                                        {screening.mother_name} (Ibu)
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 font-semibold">
                                        {screening.mother_result}
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 leading-relaxed">
                                        {screening.mother_indicators.length > 0
                                            ? screening.mother_indicators.join(', ')
                                            : 'Tidak ada indikator yang dipilih.'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="print-section mt-6">
                        <h2 className="border-b border-neutral-300 pb-2 text-sm font-bold uppercase tracking-wide">
                            C. Prediksi Karakteristik Fisik Bayi
                        </h2>
                        <table className="mt-3 w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-neutral-100">
                                    <th className="w-1/2 border border-neutral-300 px-3 py-2 text-left">
                                        Kategori
                                    </th>
                                    <th className="border border-neutral-300 px-3 py-2 text-left">
                                        Hasil Prediksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {physicalEntries.map(([category, value]) => (
                                    <tr key={category}>
                                        <td className="border border-neutral-300 px-3 py-2">
                                            {category}
                                        </td>
                                        <td className="border border-neutral-300 px-3 py-2 font-semibold">
                                            {value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="print-section mt-6">
                        <h2 className="border-b border-neutral-300 pb-2 text-sm font-bold uppercase tracking-wide">
                            D. Risiko Thalassemia Bayi
                        </h2>
                        <div className="mt-3 border border-neutral-300 p-4">
                            <p className="text-sm text-neutral-600">Klasifikasi risiko</p>
                            <p className="mt-1 text-xl font-bold uppercase tracking-wide">
                                {thalassemiaRisk}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                                {riskMeaning(thalassemiaRisk)}
                            </p>
                        </div>
                    </section>

                    <section className="mt-6">
                        <h2 className="border-b border-neutral-300 pb-2 text-sm font-bold uppercase tracking-wide">
                            E. Probabilitas Prediksi
                        </h2>
                        <div className="mt-3 grid grid-cols-1 gap-4">
                            {probabilityEntries.map(([variable, classes]) => (
                                <div key={variable} className="print-section">
                                    <h3 className="bg-neutral-100 px-3 py-2 text-sm font-semibold">
                                        {variableLabel(variable)}
                                    </h3>
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr>
                                                <th className="w-2/3 border border-neutral-300 px-3 py-2 text-left">
                                                    Kelas
                                                </th>
                                                <th className="border border-neutral-300 px-3 py-2 text-right">
                                                    Probabilitas
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(classes)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([label, probability]) => (
                                                    <tr key={label}>
                                                        <td className="border border-neutral-300 px-3 py-2">
                                                            {label}
                                                        </td>
                                                        <td className="border border-neutral-300 px-3 py-2 text-right font-medium tabular-nums">
                                                            {formatPercentage(probability)}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mt-6">
                        <h2 className="border-b border-neutral-300 pb-2 text-sm font-bold uppercase tracking-wide">
                            F. Catatan Edukasi dan Tindak Lanjut
                        </h2>
                        <div className="mt-3 space-y-3">
                            {EDUCATION_SECTIONS.map((section) => (
                                <div key={section.key} className="print-section">
                                    <h3 className="text-sm font-semibold">{section.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-neutral-800">
                                        {education[section.key]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer className="print-section mt-8 border-t-2 border-neutral-900 pt-4">
                        <h2 className="text-sm font-bold uppercase tracking-wide">
                            Pernyataan Penyangkalan
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-neutral-700">
                            {disclaimer}
                        </p>
                        <div className="mt-8 grid grid-cols-2 gap-10 text-xs text-neutral-700">
                            <div>
                                <p className="font-semibold">Catatan</p>
                                <p className="mt-1 leading-relaxed">
                                    Dokumen ini dihasilkan oleh sistem Genetikaku dan digunakan
                                    sebagai materi skrining serta edukasi awal.
                                </p>
                            </div>
                            <div className="text-right">
                                <p>Dicetak pada</p>
                                <p className="font-semibold">{printedAt}</p>
                            </div>
                        </div>
                    </footer>
                </article>
            </div>
        </>
    );
}
