import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    BookOpen,
    BrainCircuit,
    Database,
    FileText,
    Image,
    Layers3,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
    articles: number;
    published_articles: number;
    illustrations: number;
    phenotype_illustrations: number;
    knowledge_illustrations: number;
    training_data: number;
    prediction_results: number;
    screening_results: number;
    knowledge_rules: number;
    phenotypes: number;
    users: number;
    admins: number;
    predictions_today: number;
}

interface PredictionDistributionItem {
    label: 'Minor' | 'Intermedia' | 'Mayor';
    total: number;
}

interface RecentPrediction {
    id: number;
    thalassemia_risk: string;
    parents: string;
    created_at: string | null;
}

interface AdminDashboardProps {
    stats: DashboardStats;
    predictionDistribution: PredictionDistributionItem[];
    recentPredictions: RecentPrediction[];
}

const riskColors: Record<string, string> = {
    Minor: '#22c55e',
    Intermedia: '#f59e0b',
    Mayor: '#ef4444',
};

const riskBadgeClass: Record<string, string> = {
    Minor: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    Intermedia: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    Mayor: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
};

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

function buildPieGradient(items: PredictionDistributionItem[]) {
    const total = items.reduce((sum, item) => sum + item.total, 0);

    if (total === 0) {
        return 'conic-gradient(#e5e7eb 0deg 360deg)';
    }

    let current = 0;
    const segments = items.map((item) => {
        const start = current;
        const size = (item.total / total) * 360;
        current += size;

        return `${riskColors[item.label]} ${start}deg ${current}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
}

function StatCard({
    title,
    value,
    description,
    icon: Icon,
    accent,
}: {
    title: string;
    value: number;
    description: string;
    icon: React.ElementType;
    accent: string;
}) {
    return (
        <Card className="overflow-hidden border-sidebar-border/70 bg-card/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">
                            {formatNumber(value)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${accent}`}>
                        <Icon className="size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard({
    stats,
    predictionDistribution,
    recentPredictions,
}: AdminDashboardProps) {
    const totalPredictions = predictionDistribution.reduce(
        (sum, item) => sum + item.total,
        0,
    );
    const pieGradient = buildPieGradient(predictionDistribution);

    return (
        <>
            <Head title="Dasbor Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-gradient-to-br from-rose-100 via-red-50 to-orange-100 p-6 text-rose-950 shadow-sm dark:border-sidebar-border dark:from-rose-950/50 dark:via-red-950/30 dark:to-orange-950/30 dark:text-rose-50 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-sm text-rose-700 backdrop-blur dark:bg-white/10 dark:text-rose-200">
                                <Sparkles className="size-4" />
                                Ringkasan statistik GENETIKAKU
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                Dasbor Admin
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-rose-800/80 dark:text-rose-100/80 sm:text-base">
                                Pantau konten, ilustrasi, data latih, basis pengetahuan,
                                pengguna, dan hasil prediksi dalam satu halaman yang responsif.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:min-w-80">
                            <div className="rounded-2xl bg-white/55 p-4 text-rose-900 shadow-sm backdrop-blur dark:bg-white/10 dark:text-rose-50">
                                <p className="text-sm text-rose-700/75 dark:text-rose-100/75">Prediksi hari ini</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {formatNumber(stats.predictions_today)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/55 p-4 text-rose-900 shadow-sm backdrop-blur dark:bg-white/10 dark:text-rose-50">
                                <p className="text-sm text-rose-700/75 dark:text-rose-100/75">Total prediksi</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {formatNumber(stats.prediction_results)}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Data Artikel"
                        value={stats.articles}
                        description={`${formatNumber(stats.published_articles)} artikel sudah publish`}
                        icon={FileText}
                        accent="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                    />
                    <StatCard
                        title="Data Ilustrasi"
                        value={stats.illustrations + stats.phenotype_illustrations + stats.knowledge_illustrations}
                        description="Media, fenotipe, dan basis pengetahuan"
                        icon={Image}
                        accent="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-300"
                    />
                    <StatCard
                        title="Total Data Latih"
                        value={stats.training_data}
                        description="Dataset untuk perhitungan prediksi"
                        icon={Database}
                        accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                    />
                    <StatCard
                        title="Hasil Prediksi"
                        value={stats.prediction_results}
                        description={`${formatNumber(stats.screening_results)} data skrining tercatat`}
                        icon={TrendingUp}
                        accent="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-5 text-indigo-500" />
                                Pie Chart Hasil Prediksi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-8 md:grid-cols-[260px_1fr] md:items-center">
                                <div className="mx-auto flex size-64 items-center justify-center rounded-full shadow-inner" style={{ background: pieGradient }}>
                                    <div className="flex size-32 flex-col items-center justify-center rounded-full bg-background text-center shadow-sm">
                                        <span className="text-3xl font-bold">
                                            {formatNumber(totalPredictions)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            total prediksi
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {predictionDistribution.map((item) => {
                                        const percentage = totalPredictions === 0
                                            ? 0
                                            : Math.round((item.total / totalPredictions) * 100);

                                        return (
                                            <div key={item.label} className="space-y-2">
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <span className="size-3 rounded-full" style={{ backgroundColor: riskColors[item.label] }} />
                                                        {item.label}
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {formatNumber(item.total)} data {percentage}%
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted">
                                                    <div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: riskColors[item.label] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="size-5 text-violet-500" />
                                Statistik Sistem
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            <StatCard title="Basis Pengetahuan" value={stats.knowledge_rules} description="Aturan skrining aktif" icon={BookOpen} accent="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" />
                            <StatCard title="Fenotipe" value={stats.phenotypes} description="Opsi ciri fisik keluarga" icon={Layers3} accent="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-300" />
                            <StatCard title="Pengguna" value={stats.users} description={`${formatNumber(stats.admins)} akun admin`} icon={Users} accent="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300" />
                            <StatCard title="Data Validasi" value={stats.screening_results} description="Riwayat skrining pengguna" icon={ShieldCheck} accent="bg-lime-50 text-lime-600 dark:bg-lime-950/50 dark:text-lime-300" />
                        </CardContent>
                    </Card>
                </section>

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Prediksi Terbaru</CardTitle>
                        <Link href="/admin/hasil-prediksi" className="text-sm font-medium text-primary hover:underline">
                            Lihat semua
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentPredictions.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                Belum ada hasil prediksi yang tersimpan.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentPredictions.map((prediction) => (
                                    <div key={prediction.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-medium">{prediction.parents}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {prediction.created_at ?? 'Waktu tidak tersedia'}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={riskBadgeClass[prediction.thalassemia_risk] ?? ''}>
                                            {prediction.thalassemia_risk}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

