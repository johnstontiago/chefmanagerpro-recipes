import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChefManager – Gestão de Receitas',
  description: 'Sistema de gerenciamento de fichas técnicas e livros de receitas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
