import React from 'react';

export const metadata = {
  title: 'Auth Demo',
  description: 'NextAuth + Prisma with credentials and magic link'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
