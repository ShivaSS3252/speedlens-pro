import './globals.css';
import ApolloWrapper from './ApolloWrapper';
import ReactQueryWrapper from './ReactQueryWrapper';

export const metadata = {
  title: 'SpeedLens Pro',
  description: 'Instant Lighthouse performance audits',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-100 antialiased">
        <ApolloWrapper>
          <ReactQueryWrapper>{children}</ReactQueryWrapper>
        </ApolloWrapper>
      </body>
    </html>
  );
}
