import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TimezoneProvider } from '@/contexts/timezone-context'
import ResponsiveScale from '@/components/responsive-scale'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Anita FX Map - Forex Timeframe Alignment',
  description: 'Professional Forex timeframe alignment analysis tool',
  viewport: "width=device-width, initial-scale=0.7, maximum-scale=0.7, user-scalable=0, viewport-fit=cover"
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} h-full`}>
        <ResponsiveScale />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TimezoneProvider>
            <div className="h-full">
              {children}
            </div>
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}