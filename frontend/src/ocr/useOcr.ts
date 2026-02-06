// supprime l'import statique
import { recognizeImage } from './loadTesseract'; // chemin relatif selon ton fichier

export async function doOcr(image, lang = 'eng', onProgress) {
  return await recognizeImage(image, lang, onProgress);
}