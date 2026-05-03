import Link from 'next/link';

export default function ResultsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className="text-sm text-gray-500">No report found.</p>
      <Link href="/" className="mt-4 text-sm text-blue-600 hover:underline">
        ← Analyze a URL
      </Link>
    </main>
  );
}
