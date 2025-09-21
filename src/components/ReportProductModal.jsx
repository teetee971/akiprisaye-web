import React from "react";
import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const REPORT_REASONS = [
  { value: "prix_incorrect", label: "Prix incorrect" },
  { value: "produit_inexistant", label: "Produit inexistant" },
  { value: "informations_erronees", label: "Informations erronées" },
  { value: "produit_expire", label: "Produit expiré" },
  { value: "contenu_inapproprie", label: "Contenu inapproprié" },
  { value: "autre", label: "Autre" }
];

export default function ReportProductModal({ product, open, onClose }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || !comment.trim()) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "signalements"), {
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        reason: reason,
        comment: comment.trim(),
        reportedAt: serverTimestamp(),
        status: "pending"
      });
      
      setIsSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Erreur lors du signalement:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setComment("");
    setIsSubmitting(false);
    setIsSubmitted(false);
    onClose();
  };

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isSubmitted ? (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Signalement envoyé</h3>
            <p className="text-slate-600">Merci pour votre contribution!</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4">Signaler un produit</h3>
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <h4 className="font-medium">{product.name}</h4>
              <p className="text-sm text-slate-600">{product.brand}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium mb-2">
                  Raison du signalement *
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner une raison</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                  Commentaire *
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez le problème..."
                  maxLength={500}
                  required
                />
                <div className="text-sm text-slate-500 mt-1">
                  {comment.length}/500 caractères
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi..." : "Signaler"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}