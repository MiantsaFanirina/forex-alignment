import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TimezoneProvider } from '@/contexts/timezone-context'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Anita FX Map - Forex Timeframe Alignment',
  description: 'Professional Forex timeframe alignment analysis tool',
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TimezoneProvider>
            {children}
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}