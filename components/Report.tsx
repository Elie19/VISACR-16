
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, BesoinItem } from '../types';
import { LISTE_CHARGES_KEYS } from '../constants';
import { getFinancialAdvice } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  state: AppState;
  onPrev: () => void;
  onReset: () => void;
}

const Report: React.FC<Props> = ({ state, onPrev, onReset }) => {
  const [advice, setAdvice] = useState<string>("Chargement de l'analyse IA...");

  useEffect(() => {
    const fetchAdvice = async () => {
      const res = await getFinancialAdvice(state);
      setAdvice(res || "Impossible d'analyser vos données.");
    };
    fetchAdvice();
  }, [state]);

  const financialData = useMemo(() => {
    const years = [0, 1, 2, 3, 4];
    const caArr: number[] = [];
    const year1Ca = state.revenue.caMensuel.reduce((a, b) => a + b, 0);
    caArr.push(year1Ca);

    for (let i = 0; i < 4; i++) {
      caArr.push(caArr[i] * (1 + state.revenue.tauxCroissance[i] / 100));
    }

    return years.map((y, idx) => {
      const ca = caArr[idx];
      const costOfGoods = ca * (state.revenue.tauxCoutMarchandises / 100);
      const grossMargin = ca - costOfGoods;
      const fixedCosts = LISTE_CHARGES_KEYS.reduce((acc, c) => acc + (state.charges[`${c.id}-${idx}`] || 0), 0);
      const salaries = (state.revenue.salairesEmp[idx] || 0) + (state.revenue.remunDir[idx] || 0);
      const netResult = grossMargin - fixedCosts - salaries;

      return {
        year: `An ${idx + 1}`,
        CA: Math.round(ca),
        Marge: Math.round(grossMargin),
        Charges: Math.round(fixedCosts + salaries),
        Resultat: Math.round(netResult),
      };
    });
  }, [state]);

  // Fix: Cast Object.values to BesoinItem[] to resolve 'unknown' type error during reduction
  const totalInvestment = (Object.values(state.besoins) as BesoinItem[]).reduce((a, b) => a + b.montant, 0);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <h2 className="text-3xl font-bold">Rapport Financier Prévisionnel</h2>
          <p className="text-slate-500">Votre synthèse sur 5 ans pour {state.generalInfo.intituleProjet}.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg">🖨️ Imprimer / PDF</button>
          <button onClick={onReset} className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold">Recommencer</button>
        </div>
      </div>

      {/* AI Advice Box */}
      <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden no-print">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🧠</span>
            <h3 className="text-xl font-bold">L'avis de l'Expert Gemini IA</h3>
          </div>
          <div className="whitespace-pre-line text-blue-50 leading-relaxed font-medium">
            {advice}
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">✨</div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Investissement Initial', val: totalInvestment, color: 'blue' },
          { label: 'Chiffre d\'Affaires An 1', val: financialData[0].CA, color: 'emerald' },
          { label: 'Seuil de Rentabilité (A1)', val: financialData[0].Charges / (1 - state.revenue.tauxCoutMarchandises/100), color: 'orange' },
          { label: 'Résultat Net An 5', val: financialData[4].Resultat, color: 'purple' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{stat.label}</span>
            <p className={`text-2xl font-bold font-mono text-${stat.color}-600`}>{Math.round(stat.val).toLocaleString()} <span className="text-xs">FCFA</span></p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6">Évolution CA vs Résultat Net</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                   formatter={(val) => `${val.toLocaleString()} FCFA`}
                />
                <Legend />
                <Bar dataKey="CA" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Chiffre d'Affaires" />
                <Bar dataKey="Resultat" fill="#10b981" radius={[4, 4, 0, 0]} name="Résultat Net" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6">Structure des Marges</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(val) => `${val.toLocaleString()} FCFA`} />
                <Legend />
                <Line type="monotone" dataKey="Marge" stroke="#3b82f6" strokeWidth={3} name="Marge Brute" />
                <Line type="monotone" dataKey="Charges" stroke="#f59e0b" strokeWidth={3} name="Total Charges" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table for Printing */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="p-6 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <h3 className="font-bold">Tableau de Bord Prévisionnel</h3>
          <span className="text-xs font-bold text-slate-400">VALEURS EN FCFA</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="py-4 px-6 text-left">Poste</th>
                {financialData.map((d, i) => <th key={i} className="py-4 px-4 text-right">An {i+1}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              <tr>
                <td className="py-4 px-6 font-semibold">Chiffre d'affaires</td>
                {financialData.map((d, i) => <td key={i} className="py-4 px-4 text-right font-mono">{d.CA.toLocaleString()}</td>)}
              </tr>
              <tr className="text-slate-500">
                <td className="py-4 px-6">Coût des marchandises ({state.revenue.tauxCoutMarchandises}%)</td>
                {financialData.map((d, i) => <td key={i} className="py-4 px-4 text-right font-mono italic">{(d.CA - d.Marge).toLocaleString()}</td>)}
              </tr>
              <tr className="bg-blue-50/30 dark:bg-blue-900/10 font-bold text-blue-600">
                <td className="py-4 px-6">MARGE BRUTE</td>
                {financialData.map((d, i) => <td key={i} className="py-4 px-4 text-right font-mono">{d.Marge.toLocaleString()}</td>)}
              </tr>
              <tr>
                <td className="py-4 px-6">Charges d'exploitation</td>
                {financialData.map((d, i) => <td key={i} className="py-4 px-4 text-right font-mono">{d.Charges.toLocaleString()}</td>)}
              </tr>
              <tr className={`font-bold text-lg ${financialData[0].Resultat >= 0 ? 'bg-emerald-50/50 text-emerald-600' : 'bg-red-50/50 text-red-600'}`}>
                <td className="py-6 px-6">RÉSULTAT NET</td>
                {financialData.map((d, i) => <td key={i} className="py-6 px-4 text-right font-mono">{d.Resultat.toLocaleString()}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="no-print pt-6 flex justify-start">
        <button onClick={onPrev} className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-all">Retour aux saisies</button>
      </div>
    </div>
  );
};

export default Report;
