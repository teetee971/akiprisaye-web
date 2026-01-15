import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Mock data for Ti-Panié Solidaire baskets
 */
const mockBaskets = [
  {
    id: 1,
    name: 'Panier Fruits & Légumes',
    store: 'Carrefour Destrellan',
    territory: 'Guadeloupe',
    price: 5.00,
    originalPrice: 12.00,
    savings: 58,
    stock: true,
    timeSlot: '17h-19h',
    description: 'Fruits et légumes de saison légèrement abîmés',
    image: '/img/panie-fruits.jpg',
    lat: 16.262,
    lon: -61.583,
  },
  {
    id: 2,
    name: 'Panier Boulangerie',
    store: 'Super U Baie-Mahault',
    territory: 'Guadeloupe',
    price: 3.50,
    originalPrice: 8.00,
    savings: 56,
    stock: true,
    timeSlot: '18h-20h',
    description: 'Pains et viennoiseries de la veille',
    image: '/img/panie-boul.jpg',
    lat: 16.271,
    lon: -61.588,
  },
  {
    id: 3,
    name: 'Panier Mixte',
    store: 'Leader Price Gosier',
    territory: 'Guadeloupe',
    price: 6.00,
    originalPrice: 15.00,
    savings: 60,
    stock: false,
    timeSlot: '17h30-19h30',
    description: 'Assortiment de produits proches de la date limite',
    image: '/img/panie-mix.jpg',
    lat: 16.224,
    lon: -61.493,
  },
  {
    id: 4,
    name: 'Panier Fruits Tropicaux',
    store: 'Hyper U Le Lamentin',
    territory: 'Martinique',
    price: 4.50,
    originalPrice: 11.00,
    savings: 59,
    stock: true,
    timeSlot: '16h-18h',
    description: 'Fruits locaux de saison',
    image: '/img/panie-fruits.jpg',
    lat: 14.613,
    lon: -60.996,
  },
  {
    id: 5,
    name: 'Panier Anti-Gaspi',
    store: 'Carrefour Matoury',
    territory: 'Guyane',
    price: 5.50,
    originalPrice: 13.00,
    savings: 58,
    stock: true,
    timeSlot: '17h-19h',
    description: 'Produits variés proches de la date limite',
    image: '/img/panie-mix.jpg',
    lat: 4.853,
    lon: -52.328,
  },
];

/**
 * Get all baskets or filter by territory
 */
export const getBaskets = async (filters = {}) => {
  try {
    // In production, this would query Firestore
    // For now, return mock data with filters applied
    let baskets = [...mockBaskets];

    // Validate filters
    if (filters.territory && filters.territory !== 'all') {
      baskets = baskets.filter(b => b.territory === filters.territory);
    }

    if (filters.store && typeof filters.store === 'string') {
      baskets = baskets.filter(b => b.store.toLowerCase().includes(filters.store.toLowerCase()));
    }

    if (filters.stockOnly) {
      baskets = baskets.filter(b => b.stock === true);
    }

    if (filters.timeSlot && typeof filters.timeSlot === 'string') {
      baskets = baskets.filter(b => b.timeSlot === filters.timeSlot);
    }

    // Validate basket structure before returning
    const validBaskets = baskets.filter(basket => {
      return (
        basket &&
        typeof basket.id !== 'undefined' &&
        typeof basket.name === 'string' &&
        typeof basket.store === 'string' &&
        typeof basket.price === 'number' &&
        basket.price >= 0
      );
    });

    return validBaskets;
  } catch (error) {
    console.error('Error in getBaskets:', error);
    // Log detailed error for debugging but provide user-friendly message
    const technicalDetails = error instanceof Error ? error.message : String(error);
    console.error('Technical details:', technicalDetails);
    throw new Error('Impossible de charger les paniers. Veuillez réessayer plus tard.');
  }
};

/**
 * Save basket view to user history (Firestore)
 */
export const saveBasketToHistory = async (userId, basket) => {
  if (!userId || !db) return;

  try {
    await addDoc(collection(db, 'basket_history'), {
      userId,
      basketId: basket.id,
      basketName: basket.name,
      store: basket.store,
      territory: basket.territory,
      viewedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving basket to history:', error);
  }
};

/**
 * Get user's basket history
 */
export const getUserBasketHistory = async (userId) => {
  if (!userId || !db) return [];

  try {
    const q = query(collection(db, 'basket_history'), where('userId', '==', userId));
    const docs = await getDocs(q);
    return docs.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching basket history:', error);
    return [];
  }
};
