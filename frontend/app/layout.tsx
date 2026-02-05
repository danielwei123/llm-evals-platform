import type { ReactNode } from 'react';

export const metadata = {
  title: 'llm-evals-platform',
  description: 'LLM evals + monitoring platform (v0)',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
