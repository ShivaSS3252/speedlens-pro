'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@apollo/client';
import Link from 'next/link';
import ReportView from '@/components/ReportView';
import { GET_REPORT, GET_HISTORY, ANALYZE_WEBSITE } from '@/lib/graphql/operations';
import { client } from '@/lib/apollo-client';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: reportData, isLoading, isError } = useQuery({
    queryKey: ['report', id],
    queryFn: () => client.query({ query: GET_REPORT, variables: { id }, fetchPolicy: 'network-only' }),
  });

  const report = reportData?.data?.getReport;

  const { data: historyData } = useQuery({
    queryKey: ['history', report?.url],
    queryFn: () => client.query({ query: GET_HISTORY, variables: { url: report?.url }, fetchPolicy: 'network-only' }),
    enabled: !!report?.url,
  });

  const history = historyData?.data?.getHistory ?? [];

  const [reaudit, { loading: reauditLoading }] = useMutation(ANALYZE_WEBSITE, {
    onCompleted(data) {
      router.push(`/results/${data.analyzeWebsite.id}`);
    },
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-16">
        {/* Logo skeleton */}
        <div className="mb-10 h-8 w-44 animate-pulse rounded-lg bg-zinc-800" />
        <div className="w-full max-w-2xl space-y-4">
          {/* Score card skeleton */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex gap-6">
              <div className="flex flex-1 flex-col items-center gap-3">
                <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-zinc-800" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="w-px bg-zinc-800" />
              <div className="flex flex-1 flex-col items-center gap-3">
                <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-zinc-800" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
            <div className="mt-5 h-px bg-zinc-800" />
            <div className="mt-4 h-3 w-3/4 animate-pulse rounded bg-zinc-800 mx-auto" />
            <div className="mt-4 flex justify-center gap-2">
              <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-800" />
              <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-800" />
              <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-800" />
            </div>
          </div>
          {/* Issue skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
          ))}
        </div>
      </main>
    );
  }

  if (isError || !report) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/8 p-6 text-center">
          <p className="text-3xl mb-3">⚠</p>
          <h2 className="text-base font-bold text-red-400">Report not found</h2>
          <p className="mt-1 text-xs text-slate-600">This report doesn't exist or may have been removed.</p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-zinc-700 hover:text-white"
          >
            ← Analyze a URL
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16">
      <h1 className="mb-10 text-2xl font-black tracking-tight text-white">
        Speed
        <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
          Lens
        </span>{' '}
        Pro
      </h1>
      <ReportView
        report={report}
        history={history}
        onReaudit={() => reaudit({ variables: { url: report.url } })}
        reauditLoading={reauditLoading}
        onExportPdf={() => window.print()}
      />
    </main>
  );
}
