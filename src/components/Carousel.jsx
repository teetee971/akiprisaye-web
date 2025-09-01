import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  { id: 1, title: 'Compare les prix', text: 'Repère les bons plans près de toi', color: 'from-yellow-200 to-orange-200' },
  { id: 2, title: 'Maîtrise ton budget', text: 'Suis l’évolution des prix essentiels', color: 'from-green-200 to-emerald-200' },
  { id: 3, title: 'Favoris & alertes', text: 'Ne rate plus les baisses de prix', color: 'from-sky-200 to-indigo-200' }
];

export default function Carousel(){
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(()=> setIdx(i => (i+1)%slides.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-40 sm:h-52 w-full overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[idx].id}
          initial={{opacity:0, scale:.98}}
          animate={{opacity:1, scale:1}}
          exit={{opacity:0}}
          transition={{duration:.5}}
          className={`absolute inset-0 bg-gradient-to-br ${slides[idx].color} p-6`}
        >
          <h3 className="text-2xl font-extrabold">{slides[idx].title}</h3>
          <p className="text-sm opacity-80 mt-2">{slides[idx].text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
