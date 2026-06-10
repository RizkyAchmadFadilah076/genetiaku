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
    /** Karakteristik fisik bayi: map kategori => nilai (Req 5.2). */
    physical: Record<string, string>;
    /** Risiko_Thalassemia_Bayi (Istilah_Laporan: Minor/Intermedia/Mayor) (Req 5.2). */
    thalassemiaRisk: string;
    /** Probabilitas posterior per variabel keluaran: map variabel => (map kelas => float) (Req 5.2). */
    probabilities: Record<string, Record<string, number>>;
    /** Konteks Hasil_Skrining terkait (nama & hasil ayah/ibu). */
    screening: ScreeningContext;
    /** Konten edukasi (Req 5.2). */
    education: EducationContent;
    /** Pernyataan penyangkalan (Req 5.2). */
    disclaimer: string;
}

const EDUCATION_SECTIONS: { key: keyof EducationContent; title: string }[] = [
    { key: 'method_explanation', title: 'Metode Naive Bayes' },
    { key: 'two_stage_flow', title: 'Alur Dua Tahap' },
    { key: 'mendel_basis', title: 'Dasar Hukum Mendel' },
    { key: 'result_explanation', title: 'Penjelasan Hasil' },
    { key: 'thalassemia_info', title: 'Tentang Thalassemia' },
    { key: 'follow_up_advice', title: 'Saran Pemeriksaan Lanjutan' },
];

function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
}

/** Penjelasan singkat arti tingkat Risiko_Thalassemia_Bayi pada keluaran cetak. */
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

/**
 * Tampilan cetak Hasil_Prediksi (Req 5.1, 5.2).
 *
 * Halaman ini sengaja tidak memakai chrome navigasi (PublicLayout) agar keluaran
 * cetak bersih. Memuat seluruh bagian wajib (Property 17): karakteristik fisik
 * bayi, Risiko_Thalassemia_Bayi, nilai probabilitas, konten edukasi, dan
 * pernyataan penyangkalan.
 *
 * Aksi cetak (Req 5.1) disediakan dua arah: tombol "Cetak" yang memanggil
 * `window.print()` dan pemicu otomatis saat halaman dimuat. Tombol dan elemen
 * non-cetak disembunyikan pada media cetak melalui utilitas Tailwind `print:hidden`.
 */
export default function PredictionPrint({
    physical,
    thalassemiaRisk,
    probabilities,
    screening,
    education,
    disclaimer,
}: PrintProps) {
    useEffect(() => {
        // Req 5.1: memicu dialog cetak secara otomatis saat tampilan cetak terbuka.
        const timer = window.setTimeout(() => window.print(), 300);

        return () => window.clearTimeout(timer);
    }, []);

    const physicalEntries = Object.entries(physical);
    const probabilityEntries = Object.entries(probabilities);

    return (
        <>
            <Head title="Cetak Hasil Prediksi" />

            <div className="mx-auto max-w-3xl bg-white px-8 py-10 text-neutral-900 print:px-0 print:py-0">
                <div className="mb-6 flex items-center justify-between print:hidden">
                    <span className="text-sm text-neutral-500">
                        Gunakan tombol di kanan untuk mencetak atau menyimpan hasil sebagai PDF.
                    </span>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#A855F7] px-6 py-3 text-base font-semibold text-white hover:bg-[#9333EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A855F7]"
                    >
                        Cetak Hasil
                    </button>
                </div>

                <header className="border-b border-neutral-300 pb-4">
                    <h1 className="text-2xl font-bold tracking-tight">Hasil Prediksi Karakteristik Bayi</h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Ayah: {screening.father_name} ({screening.father_result}) &middot; Ibu:{' '}
                        {screening.mother_name} ({screening.mother_result})
                    </p>
                </header>

                <section className="mt-6">
                    <h2 className="text-lg font-semibold">Hasil Skrining Orang Tua (Tahap 1)</h2>
                    <table className="mt-3 w-full border-collapse text-sm">
                        <tbody>
                            <tr className="border-b border-neutral-200 align-top">
                                <th className="w-1/3 py-2 pr-4 text-left font-medium text-neutral-700">
                                    {screening.father_name} (Ayah) — {screening.father_result}
                                </th>
                                <td className="py-2 text-neutral-900">
                                    {screening.father_indicators.length > 0
                                        ? screening.father_indicators.join(', ')
                                        : 'Tidak ada indikator yang dipilih.'}
                                </td>
                            </tr>
                            <tr className="border-b border-neutral-200 align-top">
                                <th className="w-1/3 py-2 pr-4 text-left font-medium text-neutral-700">
                                    {screening.mother_name} (Ibu) — {screening.mother_result}
                                </th>
                                <td className="py-2 text-neutral-900">
                                    {screening.mother_indicators.length > 0
                                        ? screening.mother_indicators.join(', ')
                                        : 'Tidak ada indikator yang dipilih.'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="mt-6">
                    <h2 className="text-lg font-semibold">Karakteristik Fisik Bayi</h2>
                    <table className="mt-3 w-full border-collapse text-sm">
                        <tbody>
                            {physicalEntries.map(([category, value]) => (
                                <tr key={category} className="border-b border-neutral-200">
                                    <th className="py-2 pr-4 text-left font-medium text-neutral-700">{category}</th>
                                    <td className="py-2 text-neutral-900">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-6">
                    <h2 className="text-lg font-semibold">Risiko Thalassemia Bayi</h2>
                    <p className="mt-2 text-base font-semibold text-neutral-900">{thalassemiaRisk}</p>
                    <p className="mt-1 text-sm text-neutral-700">{riskMeaning(thalassemiaRisk)}</p>
                </section>

                <section className="mt-6">
                    <h2 className="text-lg font-semibold">Probabilitas</h2>
                    <div className="mt-3 space-y-4">
                        {probabilityEntries.map(([variable, classes]) => (
                            <div key={variable}>
                                <h3 className="text-sm font-medium text-neutral-700">{variable}</h3>
                                <table className="mt-1 w-full border-collapse text-sm">
                                    <tbody>
                                        {Object.entries(classes).map(([label, probability]) => (
                                            <tr key={label} className="border-b border-neutral-200">
                                                <td className="py-1.5 pr-4 text-neutral-800">{label}</td>
                                                <td className="py-1.5 text-right tabular-nums text-neutral-900">
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
                    <h2 className="text-lg font-semibold">Edukasi</h2>
                    <div className="mt-3 space-y-4">
                        {EDUCATION_SECTIONS.map((section) => (
                            <div key={section.key}>
                                <h3 className="text-sm font-medium text-neutral-700">{section.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-neutral-800">
                                    {education[section.key]}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="mt-8 border-t border-neutral-300 pt-4">
                    <h2 className="text-sm font-semibold text-neutral-700">Pernyataan Penyangkalan</h2>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">{disclaimer}</p>
                </footer>
            </div>
        </>
    );
}
