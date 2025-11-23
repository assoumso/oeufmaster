import { GoogleGenAI } from "@google/genai";
import { Sale, InventoryLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBusinessReport = async (
  sales: Sale[],
  currentStock: Record<string, number>, // Type updated
  logs: InventoryLog[]
): Promise<string> => {
  
  // Prepare data context
  const recentSales = sales.slice(0, 50); // Analyze last 50 sales to save tokens
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const stockSummary = JSON.stringify(currentStock); // Send full breakdown
  
  const prompt = `
    Tu es un expert en gestion d'entreprise avicole. Analyse les données suivantes pour une entreprise de vente de plateaux d'œufs.
    
    Données actuelles:
    - Stock actuel par calibre: ${stockSummary}
    - Chiffre d'affaires total historique: ${totalRevenue} FCFA (ou devise locale)
    - Nombre de transactions récentes analysées: ${recentSales.length}
    
    Détail des ventes récentes (JSON):
    ${JSON.stringify(recentSales.map(s => ({ d: s.date, q: s.quantity, t: s.totalPrice, status: s.status, cal: s.caliber })))}
    
    Tâche:
    1. Donne un résumé rapide de la performance ( tendances de ventes).
    2. Identifie s'il y a des risques de rupture de stock sur certains calibres spécifiques ou de sur-stockage.
    3. Donne 3 conseils stratégiques pour augmenter les profits ou mieux gérer le stock.
    
    Réponds en format Markdown, avec des titres clairs, en français professionnel mais accessible. Utilise des émojis pour rendre la lecture agréable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Tu es un assistant expert pour les PME agricoles.",
        temperature: 0.7,
      }
    });
    
    return response.text || "Désolé, je n'ai pas pu générer le rapport pour le moment.";
  } catch (error: any) {
    console.error("Gemini Error:", error?.message || "Unknown error");
    return "Une erreur est survenue lors de la communication avec l'assistant intelligent. Vérifiez votre clé API.";
  }
};

export const askGeneralQuestion = async (question: string): Promise<string> => {
   try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: "Tu es un expert en aviculture et commerce d'œufs. Tes réponses doivent être courtes et utiles.",
      }
    });
    return response.text || "Pas de réponse.";
  } catch (error: any) {
    console.error("Gemini Error:", error?.message || "Unknown error");
    return "Erreur de connexion.";
  }
}