'use client';

import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ANALYZE_WEBSITE } from '@/lib/graphql/operations';

const schema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .max(500, 'URL too long')
    .transform((val) => (val.startsWith('http') ? val : `https://${val}`))
    .pipe(z.string().url({ message: 'Must be a valid URL' })),
});

type FormValues = z.input<typeof schema>;

export default function UrlForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [analyzeWebsite, { loading, error }] = useMutation(ANALYZE_WEBSITE, {
    onCompleted(data) {
      router.push(`/results/${data.analyzeWebsite.id}`);
    },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    analyzeWebsite({ variables: { url: values.url } });
  }

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <input
              {...register('url')}
              type="text"
              placeholder="https://example.com"
              disabled={loading}
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-sm text-slate-100
                         placeholder:text-slate-600
                         transition-all duration-200
                         focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20
                         disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.url && (
              <p className="pl-1 text-xs font-medium text-red-400">{errors.url.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex min-w-[110px] items-center justify-center gap-2 self-start rounded-xl
                       bg-gradient-to-r from-orange-500 to-amber-500
                       px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20
                       transition-all duration-200
                       hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/30
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Auditing…
              </>
            ) : 'Analyze →'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-400" />
            <div>
              <p className="text-sm font-semibold text-orange-300">Auditing your site…</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Running Lighthouse on mobile &amp; desktop + generating AI fixes. Up to 45 sec.
              </p>
            </div>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-1/3 animate-[progress_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
          {error.message}
        </div>
      )}
    </div>
  );
}
