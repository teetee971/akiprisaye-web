import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Testimonial {
  id: string;
  author: string;
  territory: string;
  rating: number;
  comment: string;
  savings: number;
  date: string;
  verified: boolean;
}

export function TestimonialWall() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, 'testimonials'), where('visible', '==', true));
        const snapshot = await getDocs(q);
        const firestoreTestimonials: Testimonial[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Testimonial, 'id'>),
        }));
        setTestimonials(firestoreTestimonials);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        setTestimonials([]);
      }
    };

    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-white">
          Ce que disent les utilisateurs
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Quote className="w-8 h-8 text-blue-500 mb-4" />
              <div
                className="flex items-center gap-1 mb-3"
                aria-label={`Note: ${t.rating} étoiles sur 5`}
              >
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4 italic">"{t.comment}"</p>
              <div className="flex justify-between items-center border-t pt-4 border-slate-200 dark:border-slate-700">
                <div>
                  <strong className="text-slate-900 dark:text-white">{t.author}</strong>
                  {t.verified && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Vérifié
                    </span>
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.territory}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {t.savings}€
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">économisés/mois</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
