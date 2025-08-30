import FeatureCard from '../components/FeatureCard.jsx'
import { dict } from '../i18n.js'

export default function Home({ lang }){
  const t = dict[lang]
  return (
    <>
      <div className="mt-6 sm:mt-10">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t.header}</h1>
        <p className="text-white/70 mt-4 max-w-2xl">{t.tagline}</p>
      </div>
      <main className="py-10 sm:py-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard icon="🧠" title={t.chat} description={t.chat_desc} href="/chat" />
        <FeatureCard icon="📷" title={t.ocr} description={t.ocr_desc} href="/ocr" />
        <FeatureCard icon="🛒" title={t.compare} description={t.compare_desc} href="/comparateur" />
      </main>
    </>
  )
}
