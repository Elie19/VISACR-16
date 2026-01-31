
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const getFinancialAdvice = async (state: AppState) => {
  try {
    // Fix: Use process.env.API_KEY directly as required by guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Summary construction for the prompt
    const prompt = `
      Agis en tant qu'expert comptable et conseiller financier senior spécialisé en zone OHADA (Sénégal/Afrique de l'Ouest).
      Analyse les données financières suivantes d'un projet de création d'entreprise :
      
      Infos Générales: ${state.generalInfo.intituleProjet} (${state.generalInfo.activiteType}), Ville: ${state.generalInfo.ville}
      Besoins totaux de démarrage: ${Object.values(state.besoins).reduce((acc: number, b: any) => acc + (b.montant || 0), 0)} FCFA
      Financement total: ${state.financements.reduce((acc, f) => acc + f.montant, 0)} FCFA
      Revenue Année 1 Estimé: ${state.revenue.caMensuel.reduce((acc, m) => acc + m, 0)} FCFA
      Charges Fixes Année 1: ${Object.keys(state.charges).filter(k => k.endsWith('-0')).reduce((acc, k) => acc + state.charges[k], 0)} FCFA
      
      Donne-moi 3 conseils stratégiques courts (2 phrases max par conseil) :
      1. Sur la viabilité du projet.
      2. Sur la structure des charges.
      3. Sur le besoin de financement ou la trésorerie.
      
      Réponds directement avec les conseils sous forme de liste à puces.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Fix: Access .text property instead of .text() method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "L'IA n'est pas disponible pour le moment pour analyser votre plan.";
  }
};
