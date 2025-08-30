import FeatureCard from '../components/FeatureCard.jsx'
export default function Home(){
  return (
    <>
      <div className="mt-6 sm:mt-10">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Bienvenue sur A KI PRI SA YÉ</h1>
        <p className="text-white/70 mt-4 max-w-2xl">L'application citoyenne pour lutter contre la vie chère dans les Outre-mer.</p>
      </div>
      <main className="py-10 sm:py-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard icon="🧠" title="Accéder au Chat IA Local" description="Questions en créole, français ou espagnol." href="/chat" />
        <FeatureCard icon="📷" title="Scanner un ticket (OCR)" description="Reconnaissance automatique des prix sur ticket." href="/ocr" />
        <FeatureCard icon="🛒" title="Comparer les prix ou créer un panier malin" description="Comparez les prix locaux en un clic." href="/comparateur" />
      </main>
    </>
  )
}