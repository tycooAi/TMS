import './globals.css';
import type { Metadata } from 'next';
import { EnterKeyNavigation } from '../components/ui/EnterKeyNavigation';

export const metadata: Metadata = { title: 'TRANSLOGIX | Worker Portal', description: 'Operational trip workspace' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body>
        <EnterKeyNavigation />
        {children}
      </body>
    </html>
  );
}

