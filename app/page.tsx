import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen" style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1a2b4a 50%, #1e1b4b 100%)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/5">
        <span className="text-white text-2xl font-black tracking-tight">
          skupi<span className="text-indigo-400">.</span>
        </span>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/auth/login" className="text-white/60 hover:text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition">
            Prijava
          </Link>
          <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-500/25">
            Besplatno →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center px-6 sm:px-10 max-w-5xl mx-auto w-full py-16 sm:py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 font-medium mb-8 self-start">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Novo · Automatska potvrda rezervacije
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none mb-6">
          Grupne uplate.<br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #a78bfa)' }}>
            Bez WhatsApp kaosa.
          </span>
        </h1>
        <p className="text-white/50 text-lg sm:text-xl mb-10 max-w-lg leading-relaxed">
          Kreiraj link za rezervaciju, podijeli grupi — skupi. automatski prikupi uplate i potvrdi rezervaciju kad svi plate.
        </p>

        <div className="flex flex-wrap gap-3 mb-16">
          <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl transition shadow-xl shadow-indigo-500/30 text-base">
            Počni besplatno →
          </Link>
          <Link href="/auth/login" className="border border-white/15 hover:border-white/30 text-white/60 hover:text-white font-medium px-7 py-3.5 rounded-xl transition text-base">
            Prijava
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 sm:divide-x sm:divide-white/10 sm:border sm:border-white/10 sm:rounded-2xl sm:overflow-hidden max-w-2xl">
          {[
            { num: '5%', label: 'Skupi komisija', sub: '+ Stripe naknade' },
            { num: '30s', label: 'Kreiranje', sub: 'Bez postavljanja' },
            { num: '€0', label: 'Setup fee', sub: 'Plaćaš samo kad zaradite' },
            { num: '100%', label: 'Automatski', sub: 'Potvrda + refund' },
          ].map((s) => (
            <div key={s.label} className="py-5 sm:py-7 text-center bg-white/5 sm:bg-white/[0.04] rounded-xl sm:rounded-none border border-white/10 sm:border-0 px-4">
              <div className="text-2xl sm:text-3xl font-black text-white">{s.num}</div>
              <div className="text-xs text-white/60 mt-1 font-semibold">{s.label}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-10 pb-16 max-w-5xl mx-auto w-full">
        <h2 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-8">Kako funkcionira</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '01', icon: '✏️', title: 'Kreiraj termin', desc: 'Unesi naziv, datum, cijenu i broj mjesta. Gotovo za 30 sekundi.' },
            { step: '02', icon: '📲', title: 'Podijeli link', desc: 'Pošalji Viber ili WhatsApp grupi. Svaki sudionik otvori i plati karticom.' },
            { step: '03', icon: '✅', title: 'Skupi potvrdi', desc: 'Kad svi plate, automatski naplaćujemo i potvrđujemo. Ako se ne popuni — refundiramo sve.' },
          ].map((s) => (
            <div key={s.step} className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition">
              <div className="text-xs text-white/20 font-bold tracking-widest mb-3">{s.step}</div>
              <div className="text-2xl mb-3">{s.icon}</div>
              <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/20 max-w-5xl mx-auto w-full">
        <span>skupi. · Zagreb, Hrvatska</span>
        <span>© 2025 — Sva prava pridržana</span>
      </footer>
    </main>
  )
}
