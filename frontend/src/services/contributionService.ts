 
/**
 * Citizen Contribution Service
 * 
 * Handles citizen contributions including:
 * - Product photo uploads
 * - Price observations
 * - Missing product reports
 * - Moderation workflow
 * 
 * Features:
 * - Firebase Storage integration for images
 * - Firestore for contribution metadata
 * - GDPR-compliant data handling
 * - Audit trail
 * - Rate limiting
 * 
 * @module contributionService
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  getDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import type { TerritoryCode } from '../types/extensions';
import type { PhotoContribution } from '../components/PhotoContributionModal';

export interface PriceObservation {
  productId?: string;
  productName: string;
  barcode?: string;
  price: number;
  pricePerUnit?: number;
  currency: 'EUR';
  storeName: string;
  territory: TerritoryCode;
  observationDate: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  userId?: string;
  consentGiven: boolean;
}

export interface MissingProductReport {
  productName: string;
  barcode?: string;
  category?: string;
  brand?: string;
  description?: string;
  territory: TerritoryCode;
  storeName?: string;
  photoUrl?: string;
  userId?: string;
  consentGiven: boolean;
}

export interface ContributionMetadata {
  id?: string;
  type: 'photo' | 'price' | 'missing_product';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  moderatedAt?: Date;
  moderatedBy?: string;
  moderationNotes?: string;
  userId?: string;
  ipAddress?: string;
}

/**
 * Rate limit check for contributions
 * Prevents spam by limiting contributions per user
 */
async function checkRateLimit(userId?: string, ipAddress?: string): Promise<boolean> {
  const db = getFirestore();
  const contributionsRef = collection(db, 'contributions');
  
  // Check last 10 contributions in the past hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  let q = query(
    contributionsRef,
    where('submittedAt', '>=', oneHourAgo),
    orderBy('submittedAt', 'desc'),
    limit(10)
  );
  
  if (userId) {
    q = query(q, where('userId', '==', userId));
  } else if (ipAddress) {
    q = query(q, where('ipAddress', '==', ipAddress));
  }
  
  const snapshot = await getDocs(q);
  
  // Allow max 10 contributions per hour
  return snapshot.size < 10;
}

/**
 * Anti-fraud: detect duplicate price observation
 * Returns true if a similar observation (same barcode + store + rounded price) was
 * already submitted within the last 24 hours, regardless of user.
 */
async function isDuplicatePriceObservation(obs: PriceObservation): Promise<boolean> {
  if (!obs.barcode) return false;
  const db = getFirestore();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // Round price to nearest 5 cents to catch near-duplicate submissions
  const roundedPrice = Math.round(obs.price * 20) / 20;
  try {
    const q = query(
      collection(db, 'contributions'),
      where('barcode', '==', obs.barcode),
      where('storeName', '==', obs.storeName),
      where('submittedAt', '>=', oneDayAgo),
      orderBy('submittedAt', 'desc'),
      limit(5),
    );
    const snap = await getDocs(q);
    return snap.docs.some((d) => {
      const data = d.data();
      const storedRounded = Math.round((data.price ?? 0) * 20) / 20;
      return Math.abs(storedRounded - roundedPrice) < 0.01;
    });
  } catch {
    // Silently ignore query errors (e.g., missing index) – don't block submission
    return false;
  }
}


async function uploadContributionPhoto(
  contribution: PhotoContribution,
  contributionId: string
): Promise<string> {
  const storage = getStorage();
  
  // Generate unique filename
  const timestamp = Date.now();
  const extension = contribution.image.type.split('/')[1] || 'jpg';
  const filename = `contributions/${contributionId}/${timestamp}.${extension}`;
  
  // Upload to Firebase Storage
  const storageRef = ref(storage, filename);
  const snapshot = await uploadBytes(storageRef, contribution.image, {
    contentType: contribution.image.type,
    customMetadata: {
      territory: contribution.territory,
      productName: contribution.productName,
      originalSize: contribution.metadata.originalSize.toString(),
      compressedSize: contribution.metadata.compressedSize.toString()
    }
  });
  
  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}

/**
 * Submit a photo contribution
 */
export async function submitPhotoContribution(
  contribution: PhotoContribution,
  userId?: string
): Promise<string> {
  // Check rate limit
  const canSubmit = await checkRateLimit(userId);
  if (!canSubmit) {
    throw new Error('Trop de contributions récentes. Veuillez réessayer dans une heure.');
  }
  
  const db = getFirestore();
  const contributionsRef = collection(db, 'contributions');
  
  // Create contribution document
  const docRef = await addDoc(contributionsRef, {
    type: 'photo',
    status: 'pending',
    productName: contribution.productName,
    barcode: contribution.barcode || null,
    territory: contribution.territory,
    storeName: contribution.storeName || null,
    location: contribution.location || null,
    consentGiven: contribution.consentGiven,
    userId: userId || null,
    submittedAt: serverTimestamp(),
    metadata: {
      originalSize: contribution.metadata.originalSize,
      compressedSize: contribution.metadata.compressedSize,
      compressionRatio: contribution.metadata.compressionRatio
    }
  });
  
  // Upload photo
  const photoUrl = await uploadContributionPhoto(contribution, docRef.id);
  
  // Update contribution with photo URL
  const docSnapshot = await getDoc(docRef);
  if (docSnapshot.exists()) {
    await updateDoc(docRef, {
      photoUrl
    });
  }
  
  // Log contribution for audit trail
  await logContribution({
    id: docRef.id,
    type: 'photo',
    status: 'pending',
    submittedAt: new Date(),
    userId
  });
  
  return docRef.id;
}

/**
 * Submit a price observation
 */
export async function submitPriceObservation(
  observation: PriceObservation,
  userId?: string
): Promise<string> {
  // Check rate limit
  const canSubmit = await checkRateLimit(userId);
  if (!canSubmit) {
    throw new Error('Trop de contributions récentes. Veuillez réessayer dans une heure.');
  }

  // Anti-fraud: reject duplicate submissions within 24 h
  const isDuplicate = await isDuplicatePriceObservation(observation);
  if (isDuplicate) {
    throw new Error('Une observation similaire a déjà été soumise récemment pour ce produit et cette enseigne.');
  }
  
  const db = getFirestore();
  const observationsRef = collection(db, 'price_observations');
  
  // Create observation document
  const docRef = await addDoc(observationsRef, {
    type: 'price',
    status: 'pending',
    productId: observation.productId || null,
    productName: observation.productName,
    barcode: observation.barcode || null,
    price: observation.price,
    pricePerUnit: observation.pricePerUnit || null,
    currency: observation.currency,
    storeName: observation.storeName,
    territory: observation.territory,
    observationDate: observation.observationDate,
    location: observation.location || null,
    consentGiven: observation.consentGiven,
    userId: userId || null,
    submittedAt: serverTimestamp()
  });
  
  // Log contribution for audit trail
  await logContribution({
    id: docRef.id,
    type: 'price',
    status: 'pending',
    submittedAt: new Date(),
    userId
  });
  
  return docRef.id;
}

/**
 * Submit a missing product report
 */
export async function submitMissingProduct(
  report: MissingProductReport,
  userId?: string
): Promise<string> {
  // Check rate limit
  const canSubmit = await checkRateLimit(userId);
  if (!canSubmit) {
    throw new Error('Trop de contributions récentes. Veuillez réessayer dans une heure.');
  }
  
  const db = getFirestore();
  const reportsRef = collection(db, 'missing_products');
  
  // Create report document
  const docRef = await addDoc(reportsRef, {
    type: 'missing_product',
    status: 'pending',
    productName: report.productName,
    barcode: report.barcode || null,
    category: report.category || null,
    brand: report.brand || null,
    description: report.description || null,
    territory: report.territory,
    storeName: report.storeName || null,
    photoUrl: report.photoUrl || null,
    consentGiven: report.consentGiven,
    userId: userId || null,
    submittedAt: serverTimestamp()
  });
  
  // Log contribution for audit trail
  await logContribution({
    id: docRef.id,
    type: 'missing_product',
    status: 'pending',
    submittedAt: new Date(),
    userId
  });
  
  return docRef.id;
}

/**
 * Log contribution to audit trail
 */
async function logContribution(metadata: ContributionMetadata): Promise<void> {
  const db = getFirestore();
  const auditRef = collection(db, 'contribution_audit');
  
  await addDoc(auditRef, {
    ...metadata,
    timestamp: serverTimestamp()
  });
}

/**
 * Get user contribution stats
 */
export async function getUserContributionStats(userId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: {
    photo: number;
    price: number;
    missing_product: number;
  };
}> {
  const db = getFirestore();
  
  // Query all contributions for this user
  const contributionsRef = collection(db, 'contributions');
  const q = query(contributionsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  const stats = {
    total: snapshot.size,
    pending: 0,
    approved: 0,
    rejected: 0,
    byType: {
      photo: 0,
      price: 0,
      missing_product: 0
    }
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Count by status
    if (data.status === 'pending') stats.pending++;
    if (data.status === 'approved') stats.approved++;
    if (data.status === 'rejected') stats.rejected++;
    
    // Count by type
    if (data.type === 'photo') stats.byType.photo++;
    if (data.type === 'price') stats.byType.price++;
    if (data.type === 'missing_product') stats.byType.missing_product++;
  });
  
  return stats;
}

/**
 * Get recent contributions for moderation
 */
export async function getPendingContributions(limitCount: number = 20): Promise<any[]> {
  const db = getFirestore();
  const contributionsRef = collection(db, 'contributions');
  
  const q = query(
    contributionsRef,
    where('status', '==', 'pending'),
    orderBy('submittedAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Moderate a contribution (admin only)
 */
export async function moderateContribution(
  contributionId: string,
  decision: 'approved' | 'rejected',
  notes?: string,
  moderatorId?: string
): Promise<void> {
  const db = getFirestore();
  const contributionRef = doc(db, 'contributions', contributionId);
  
  // Update contribution status
  await updateDoc(contributionRef, {
    status: decision,
    moderatedAt: serverTimestamp(),
    moderatedBy: moderatorId || 'system',
    moderationNotes: notes || null
  });
  
  // Log moderation action
  await logContribution({
    id: contributionId,
    type: 'photo', // Type doesn't matter for moderation log
    status: decision,
    submittedAt: new Date(),
    moderatedAt: new Date(),
    moderatedBy: moderatorId,
    moderationNotes: notes
  });
}
