import { useState, useMemo, lazy, Suspense }   from 'react'
import { motion, AnimatePresence }             from 'framer-motion'
import { AnimatedBackground, Navbar, LiveTicker, Footer } from './components/layout'
import { GroqAssistant }                       from './components/ai'
import { useFreighterWallet, useSearch }       from './hooks'
import { Toaster }                             from 'sonner'

const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })))
const DocsPage = lazy(() => import('./pages/DocsPage').then(m => ({ default: m.DocsPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))

type Page = 'search' | 'docs' | 'dashboard'

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-6 animate-pulse">
      <div className="h-10 w-1/3 bg-white/10 rounded-xl" />
      <div className="h-48 w-full bg-white/5 rounded-2xl border border-white/5" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-white/5 rounded-xl" />
        <div className="h-32 bg-white/5 rounded-xl" />
        <div className="h-32 bg-white/5 rounded-xl" />
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('search')

  const {
    wallet, transactions, txLoading,
    connect, disconnect, refresh,
  } = useFreighterWallet()

  // Lifted so the floating GroqAssistant can read the last completed search
  // and pre-populate context (issue #57).
  const { session, search, reset } = useSearch(
    wallet.connected ? wallet.publicKey : null
  )

  const prefetchPage = (p: Page) => {
    if (p === 'search') import('./pages/SearchPage')
    if (p === 'docs') import('./pages/DocsPage')
    if (p === 'dashboard') import('./pages/DashboardPage')
  }

  const lastSearch = useMemo(
    () => session.status === 'complete' && session.results.length
      ? { query: session.query, results: session.results }
      : null,
    [session.status, session.query, session.results],
  )

  return (
    <div className="min-h-screen relative text-white">
      {/* Canvas particle / matrix background */}
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top navigation bar */}
        <Navbar
          page={page}
          onNavigate={setPage}
          onPrefetch={prefetchPage}
          wallet={wallet}
          transactions={transactions}
          txLoading={txLoading}
          onConnect={connect}
          onDisconnect={disconnect}
          onRefresh={refresh}
        />

        {/* Scrolling stats ticker */}
        <LiveTicker walletConnected={wallet.connected} />

        {/* Page content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {page === 'search' && (
                <SearchPage
                  wallet={wallet}
                  onConnectWallet={connect}
                  session={session}
                  search={search}
                  reset={reset}
                />
              )}
              {page === 'docs' && <DocsPage />}
              {page === 'dashboard' && (
                <DashboardPage
                  transactions={transactions}
                  txLoading={txLoading}
                  publicKey={wallet.publicKey}
                  usdcBalance={wallet.usdcBalance}
                  xlmBalance={wallet.xlmBalance}
                  onRefresh={refresh}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <Suspense fallback={<PageSkeleton />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {page === 'search' && (
                  <SearchPage
                    wallet={wallet}
                    onConnectWallet={connect}
                    session={session}
                    search={search}
                    reset={reset}
                  />
                )}
                {page === 'docs' && <DocsPage />}
                {page === 'dashboard' && (
                  <DashboardPage
                    transactions={transactions}
                    txLoading={txLoading}
                    publicKey={wallet.publicKey}
                    usdcBalance={wallet.usdcBalance}
                    xlmBalance={wallet.xlmBalance}
                    onRefresh={refresh}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Floating Groq AI assistant */}
      <GroqAssistant lastSearch={lastSearch} />

      <Toaster position="bottom-right" theme="dark" duration={4000} richColors />
    </div>
  )
}
