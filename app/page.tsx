import Link from 'next/link'
import {
  ArrowRight, Pencil, Share2, CheckCircle2,
  ShieldCheck, Zap, Undo2, Users, Link as LinkIcon,
  CreditCard, MapPin,
} from 'lucide-react'
import FaqItem from '@/components/FaqItem'

// ── FAQ data ─────────────────────────────────────────────────
const faqs = [
  {
    q: 'Što ako se ne skupi minimalni broj sudionika?',
    a: 'Sav novac se automatski vraća svim sudionicima bez ikakve naknade. Stripe i skupi. naknade se ne naplaćuju u slučaju refunda. Sustav sve radi automatski po isteku roka.',
  },
  {
    q: 'Je li plaćanje sigurno?',
    a: 'Da. Sva plaćanja procesira Stripe — isti sustav koji koriste Airbnb, Shopify i milijuni globalnih platformi. skupi. nikada ne pohranjuje podatke o karticama.',
  },
  {
    q: 'Trebaju li sudionici imati račun na skupi.?',
    a: 'Ne. Sudionici samo otvore link, unesu ime, email i plaćaju karticom — bez registracije, bez lozinke. Samo organizator treba imati skupi. račun.',
  },
  {
    q: 'Mogu li koristiti skupi. za bilo kakvu aktivnost?',
    a: 'Da — padel, skijanje, koncerti, izleti, zajednička večera, paintball, team buildingovi... skupi. radi za svaku aktivnost gdje se grupa mora platiti unaprijed.',
  },
  {
    q: 'Kada organizator dobiva novac?',
    a: 'Novac se prenosi na organizatorov Stripe račun nakon što je minimum sudionika plaćen i rok uplate je prošao. Isplata standardno stiže unutar 2 radna dana.',
  },
]

// ── Feature grid data ─────────────────────────────────────────
const features = [
  {
    icon: <ShieldCheck size={20} aria-hidden="true" />,
    title: 'Stripe sigurnost',
    desc: 'Plaćanja su zaštićena Stripe infrastrukturom. Isti standard koji koriste globalne fintech kompanije.',
    color: 'text-brand-purple bg-brand-purple/10',
  },
  {
    icon: <Zap size={20} aria-hidden="true" />,
    title: 'Radi u sekundi',
    desc: 'Bez registracije za sudionike — samo link. Otvore, unesu ime, plate karticom. Gotovo.',
    color: 'text-success bg-success/10',
  },
  {
    icon: <Undo2 size={20} aria-hidden="true" />,
    title: 'Automatski refund',
    desc: 'Ako minimum nije skupljen do roka, sav novac se automatski vraća. Bez naknade.',
    color: 'text-warning bg-warning/10',
  },
  {
    icon: <Users size={20} aria-hidden="true" />,
    title: 'Grupe do 50 osoba',
    desc: 'Radi za sportske grupe, izlete, djevojačke večeri, zajednička putovanja i večere.',
    color: 'text-blue-400 bg-blue-400/10',
  },
  {
    icon: <LinkIcon size={20} aria-hidden="true" />,
    title: 'Dijeli gdje hoćeš',
    desc: 'WhatsApp, Viber, email, SMS — jedan link radi svugdje. QR kod za ispis na ulazu.',
    color: 'text-pink-400 bg-pink-400/10',
  },
  {
    icon: <CreditCard size={20} aria-hidden="true" />,
    title: 'Plaćanje karticom',
    desc: 'Visa, Mastercard, Apple Pay i Google Pay. Sudionici plaćaju metodom koja im odgovara.',
    color: 'text-teal-400 bg-teal-400/10',
  },
]

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-dark-900 text-white">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-[60px] flex items-center border-b border-dark-700"
           style={{ background: 'rgba(13,15,26,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight">skupi.</span>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"
                  className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-white transition rounded-md">
              Prijava
            </Link>
            <Link href="/auth/register"
                  className="flex items-center gap-1.5 bg-brand-purple hover:bg-brand-purple-light text-white text-sm font-semibold px-4 py-2 rounded-md transition shadow-purple">
              Počni besplatno <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(108,71,255,0.12) 0%, transparent 60%)' }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-[55%_45%] gap-12 items-center">

            {/* Left: Copy */}
            <div>
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-sm font-medium border"
                   style={{ background: 'rgba(108,71,255,0.12)', borderColor: 'rgba(108,71,255,0.25)', color: '#B8A4FF' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span aria-hidden="true">✦</span> Novo &nbsp;·&nbsp; Automatska potvrda rezervacije
              </div>

              <h1 className="text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.05] tracking-tight text-white mb-0">
                Grupne uplate.
              </h1>
              <h2 className="text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.05] tracking-tight mb-5"
                  style={{ color: '#6C47FF', textShadow: '0 0 40px rgba(108,71,255,0.4)' }}>
                Bez WhatsApp kaosa.
              </h2>

              <p className="text-lg text-text-secondary max-w-[480px] leading-relaxed mb-8">
                Kreiraj link za rezervaciju, podijeli grupi — skupi. automatski prikupi uplate i potvrdi rezervaciju kad svi plate.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/auth/register"
                      className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple-light text-white font-semibold px-7 py-3.5 rounded-md transition shadow-purple text-base">
                  Počni besplatno <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/auth/login"
                      className="flex items-center gap-2 border border-dark-700 hover:border-brand-purple text-text-secondary hover:text-white font-medium px-7 py-3.5 rounded-md transition text-base">
                  Prijava
                </Link>
              </div>
            </div>

            {/* Right: Phone mockup */}
            <div aria-hidden="true" className="flex justify-center items-center relative">
              <div className="absolute inset-0 -inset-10 pointer-events-none rounded-full"
                   style={{ background: 'radial-gradient(ellipse at center, rgba(108,71,255,0.18) 0%, transparent 70%)' }} />

              {/* Floating success badge */}
              <div className="absolute -top-4 -right-4 z-20 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-dark-700 shadow-dark-md"
                   style={{ background: '#13162A' }}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-success/10">
                  <CheckCircle2 size={15} aria-hidden="true" className="text-success" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-none">Rezervacija potvrđena!</div>
                  <div className="text-[10px] text-text-muted mt-0.5">Upravo · squash · 3/3</div>
                </div>
              </div>

              {/* Card mockup */}
              <div className="relative z-10 w-[300px] rounded-2xl border border-dark-700 p-5"
                   style={{ background: '#13162A', transform: 'rotate(-2deg)', boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,71,255,0.15)' }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-black text-white tracking-tight">squash</div>
                    <div className="text-xs text-text-muted mt-0.5">pet, 6. 3. 2026 · 21:00</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                        style={{ background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.2)', color: '#22C55E' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Aktivan
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>Sudionici</span><span>2 / 3</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-dark-700 overflow-hidden">
                    <div className="h-full w-[67%] rounded-full"
                         style={{ background: 'linear-gradient(90deg, #6C47FF, #22C55E)' }} />
                  </div>
                </div>

                <div className="h-px bg-dark-700 mb-3" />

                {/* Participants */}
                {[
                  { init: 'D', name: 'Davor', paid: true, color: '#6C47FF' },
                  { init: 'I', name: 'Ivana', paid: true, color: '#22C55E' },
                  { init: 'A', name: 'Ana',   paid: false, color: '#363B6B' },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5 py-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                         style={{ background: p.color }}>
                      {p.init}
                    </div>
                    <span className="text-sm font-medium text-white flex-1">{p.name}</span>
                    {p.paid ? (
                      <span className="flex items-center gap-1 text-xs text-success font-semibold">
                        <CheckCircle2 size={12} aria-hidden="true" /> 5.58 €
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted italic">čeka...</span>
                    )}
                  </div>
                ))}

                <div className="h-px bg-dark-700 mt-3 mb-3" />

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-text-muted">Naknada za uslugu</div>
                    <div className="text-xs font-semibold text-text-secondary">0.58 €</div>
                  </div>
                  <button className="bg-brand-purple text-white text-sm font-bold px-4 py-1.5 rounded-md">
                    Plati →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────── */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl overflow-hidden border border-dark-700"
               style={{ background: 'rgba(19,22,42,0.7)' }}>
            {[
              { num: '5%',   l1: 'Skupi komisija',          l2: '+ Stripe naknade',          accent: true },
              { num: '30s',  l1: 'Kreiranje termina',        l2: 'bez postavljanja',           accent: false },
              { num: '€0',   l1: 'Naknada za postavljanje',  l2: 'besplatno za organizatora',  accent: true },
              { num: '100%', l1: 'Automatska potvrda',       l2: 'i refund ako ne uspije',     accent: false },
            ].map((s, i) => (
              <div key={s.l1}
                   className={`py-7 px-4 text-center ${i < 3 ? 'border-r border-dark-700' : ''} ${i >= 2 ? 'border-t sm:border-t-0 border-dark-700' : ''}`}>
                <div className={`text-3xl font-black mb-1 ${s.accent ? 'text-brand-purple' : 'text-white'}`}>
                  {s.num}
                </div>
                <div className="text-sm text-text-secondary font-medium">{s.l1}</div>
                <div className="text-xs text-text-muted mt-0.5">{s.l2}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="kako-funkcionira" className="py-24 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-brand-purple mb-3">
              Kako funkcionira
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-3">
              Tri koraka do potvrđene rezervacije
            </h2>
            <p className="text-lg text-text-secondary max-w-xl leading-relaxed">
              Od ideje do plaćene rezervacije za cijelu grupu — bez prebacivanja novca.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { num: '01', icon: <Pencil size={20} aria-hidden="true" />, title: 'Kreiraj termin', desc: 'Unesi naziv, datum, cijenu i broj mjesta. Gotovo za 30 sekundi — link se generira automatski.' },
              { num: '02', icon: <Share2 size={20} aria-hidden="true" />, title: 'Podijeli link',   desc: 'Pošalji Viber ili WhatsApp grupi. Svaki sudionik otvori i plati karticom. Nema registracije.' },
              { num: '03', icon: <CheckCircle2 size={20} aria-hidden="true" />, title: 'skupi. potvrdi', desc: 'Kad svi plate, automatski naplaćujemo i potvrđujemo. Ako se ne popuni — refundiramo sve.' },
            ].map((s) => (
              <div key={s.num}
                   className="group rounded-xl border border-dark-700 p-6 transition duration-200 hover:-translate-y-1 hover:border-brand-purple/40"
                   style={{ background: '#13162A', boxShadow: '0 0 0 0 rgba(108,71,255,0)' }}>
                <div className="text-xs font-bold text-brand-purple tracking-wider mb-4">{s.num}</div>
                <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-brand-purple"
                     style={{ background: 'rgba(108,71,255,0.13)' }}>
                  {s.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ───────────────────────────────────── */}
      <section id="zasto-skupi" className="py-24 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-brand-purple mb-3">Zašto skupi.</div>
            <h2 className="text-3xl font-black tracking-tight">Sve što trebaš, ništa što ne trebaš</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title}
                   className="rounded-xl border border-dark-700 p-5 transition duration-200 hover:border-dark-500"
                   style={{ background: 'rgba(19,22,42,0.5)' }}>
                <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3.5 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="cijene" className="py-24 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-brand-purple mb-3">Cijene</div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Transparentno i jednostavno</h2>
            <p className="text-text-secondary">Plaćaš samo kad zaradiš. Nema pretplate, nema skrivenih troškova.</p>
          </div>

          <div className="relative max-w-[560px] mx-auto rounded-2xl border border-dark-700 p-8 overflow-hidden"
               style={{ background: '#13162A' }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5"
                 style={{ background: 'linear-gradient(90deg, #6C47FF, #22C55E)' }} />

            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border mb-5"
                 style={{ background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.2)', color: '#22C55E' }}>
              <CheckCircle2 size={11} aria-hidden="true" /> Besplatno za organizatora
            </div>

            <h3 className="text-xl font-bold text-white mb-5">Što gost plaća za termin od 5 €</h3>

            <div className="space-y-0 divide-y divide-dark-700">
              {[
                { label: 'Tvoja cijena (organizator prima)', val: '5.00 €', accent: false },
                { label: 'skupi. komisija (5%)',              val: '0.25 €', accent: false },
                { label: 'Stripe naknada (1.5% + 0.25 €)',   val: '0.33 €', accent: false },
                { label: 'Naknada za postavljanje',           val: '€0',    accent: 'green' },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-3">
                  <span className="text-sm text-text-secondary">{r.label}</span>
                  <span className={`text-sm font-semibold font-mono ${r.accent === 'green' ? 'text-success' : 'text-white'}`}>
                    {r.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 flex justify-between items-center px-4 py-3.5 rounded-md border"
                 style={{ background: 'rgba(108,71,255,0.1)', borderColor: 'rgba(108,71,255,0.2)' }}>
              <span className="font-bold text-white">Gost plaća ukupno</span>
              <span className="text-xl font-black text-brand-purple-light font-mono">5.58 €</span>
            </div>
            <p className="text-xs text-text-muted text-center mt-2.5">Primjer za termin od 5.00 € po osobi</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-brand-purple mb-3">FAQ</div>
            <h2 className="text-3xl font-black tracking-tight">Često postavljana pitanja</h2>
          </div>

          <div className="max-w-[680px] mx-auto divide-y divide-dark-700">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────── */}
      <section className="py-24 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6 text-center relative">
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at center, rgba(108,71,255,0.07) 0%, transparent 70%)' }} />
          <h2 className="relative text-4xl font-black tracking-tight mb-3">Spreman za prvu rezervaciju?</h2>
          <p className="relative text-lg text-text-secondary mb-8">
            Kreiraj termin za 30 sekundi. Besplatno, bez kreditne kartice.
          </p>
          <div className="relative flex justify-center gap-3 flex-wrap">
            <Link href="/auth/register"
                  className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple-light text-white font-bold px-8 py-4 rounded-md transition shadow-purple text-base">
              Počni besplatno <ArrowRight size={16} />
            </Link>
            <Link href="#kako-funkcionira"
                  className="flex items-center gap-2 border border-dark-700 hover:border-brand-purple/40 text-text-secondary hover:text-white font-medium px-8 py-4 rounded-md transition text-base">
              Kako funkcionira
            </Link>
          </div>
          <p className="relative mt-4 text-xs text-text-muted">
            <span aria-hidden="true">✦</span> Bez pretplate · Bez naknade za postavljanje · Stripe zaštita
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-dark-700 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-black text-white">skupi.</div>
            <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
              <MapPin size={11} aria-hidden="true" /> Zagreb, Hrvatska
            </div>
          </div>
          <div className="flex gap-6">
            {['Uvjeti korištenja', 'Privatnost', 'Kontakt'].map((l) => (
              <a key={l} href="#" className="text-sm text-text-muted hover:text-text-secondary transition">{l}</a>
            ))}
          </div>
          <p className="text-sm text-text-muted">© 2025 skupi. — Sva prava pridržana</p>
        </div>
      </footer>

    </main>
  )
}

