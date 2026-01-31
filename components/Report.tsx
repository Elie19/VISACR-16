
import React, { useMemo } from 'react';
import { AppState, BesoinItem, FinancingSource } from '../types';
import { LISTE_CHARGES_KEYS, LISTE_BESOINS_KEYS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  state: AppState;
  onPrev: () => void;
  onReset: () => void;
}

const Report: React.FC<Props> = ({ state, onPrev, onReset }) => {
  const years = [0, 1, 2, 3, 4];
  const totalInvestissement = (Object.values(state.besoins) as BesoinItem[]).reduce((a, b) => a + (b.montant || 0), 0);
  const totalFinancement = state.financements.reduce((a, f) => a + (f.montant || 0), 0);

  const financialData = useMemo(() => {
    const caArr: number[] = [];
    const year1Ca = state.revenue.caMensuel.reduce((a, b) => a + b, 0);
    caArr.push(year1Ca);
    for (let i = 0; i < 4; i++) {
      caArr.push(caArr[i] * (1 + state.revenue.tauxCroissance[i] / 100));
    }

    return years.map((y, idx) => {
      const ca = caArr[idx];
      const costOfGoods = ca * (state.revenue.tauxCoutMarchandises / 100);
      const margin = ca - costOfGoods;
      const fixedCosts = LISTE_CHARGES_KEYS.reduce((acc, c) => acc + (state.charges[`${c.id}-${idx}`] || 0), 0);
      const salaires = (state.revenue.salairesEmp[idx] || 0) + (state.revenue.remunDir[idx] || 0);
      
      const dotAmort = (Object.values(state.besoins) as BesoinItem[]).reduce((acc, b) => {
        if (b.amortissement > 0 && idx < b.amortissement) {
          return acc + (b.montant / b.amortissement);
        }
        return acc;
      }, 0);

      const chargesFin = state.financements
        .filter(f => f.taux && f.taux > 0)
        .reduce((acc, f) => acc + (f.montant * (f.taux || 0) / 100), 0) / (idx === 0 ? 1 : 1.2);

      const va = margin - fixedCosts;
      const ebe = va - (state.revenue.salairesEmp[idx] || 0);
      const resExploit = ebe - dotAmort;
      const resAvantImpots = resExploit - chargesFin;
      const is = resAvantImpots > 0 ? resAvantImpots * 0.25 : 0;
      const netResult = resAvantImpots - is;

      return {
        year: idx + 1,
        ca,
        costOfGoods,
        margin,
        va,
        fixedCosts,
        salairesEmp: state.revenue.salairesEmp[idx] || 0,
        remunDir: state.revenue.remunDir[idx] || 0,
        ebe,
        dotAmort,
        resExploit,
        chargesFin,
        resAvantImpots,
        is,
        netResult,
        caf: netResult + dotAmort
      };
    });
  }, [state]);

  const TableHeader = ({ title }: { title: string }) => (
    <div className="bg-[#242b3d] p-3 border-y border-slate-700 font-bold uppercase text-xs tracking-widest text-indigo-400 mt-10 mb-6">
      {title}
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <h2 className="text-3xl font-bold">Rapport Expert</h2>
          <p className="text-slate-500">Business Plan {state.generalInfo.intituleProjet}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.print()} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            🖨️ Imprimer le Dossier
          </button>
          <button onClick={onPrev} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl font-medium text-slate-300">Modifier</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Chiffre d'Affaires vs Résultat Net</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                   contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px'}} 
                   formatter={(v: any) => v.toLocaleString() + ' FCFA'} 
                />
                <Bar dataKey="ca" fill="#6366f1" name="Chiffre d'affaires" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netResult" fill="#10b981" name="Bénéfice Net" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Évolution de l'Autofinancement (CAF)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                   contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px'}}
                   formatter={(v: any) => v.toLocaleString() + ' FCFA'} 
                />
                <Line type="monotone" dataKey="caf" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#8b5cf6' }} name="CAF" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- REPRODUCTION PDF --- */}
      <div className="print-only hidden font-serif text-black p-4 bg-white">
        {/* Structure identique au PDF original via CSS @media print */}
        <div className="page-break h-[28cm] flex flex-col items-center justify-between border-[2px] border-black p-12 text-center">
          <div className="space-y-4">
            <p className="text-lg">Informations - Accompagnement - Conseil</p>
            <h1 className="text-6xl font-black mt-20">Création d'entreprise</h1>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold underline underline-offset-8">Étude financière prévisionnelle sur 5 ans</h2>
            <p className="text-xl">Devise : <strong>Franc CFA (FCFA)</strong></p>
          </div>
          <div className="w-full max-w-lg border border-black p-8 text-left">
            <p className="text-2xl font-bold uppercase mb-2">{state.generalInfo.intituleProjet}</p>
            <p className="text-lg">Porteur du projet : {state.generalInfo.prenomNom}</p>
          </div>
          <p className="text-lg">{new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="page-break mt-12">
          <h2 className="text-2xl font-bold text-center border-2 border-black p-4 mb-10 uppercase">Investissements et financements</h2>
          <TableHeader title="INVESTISSEMENTS (BESOINS)" />
          <table className="w-full border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-black p-2 text-left">Poste d'investissement</th>
                <th className="border border-black p-2 text-right">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {LISTE_BESOINS_KEYS.map(item => {
                const val = state.besoins[item.id]?.montant || 0;
                if (val === 0) return null;
                return (
                  <tr key={item.id}>
                    <td className="border border-black p-2">{item.label}</td>
                    <td className="border border-black p-2 text-right">{val.toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-slate-50">
                <td className="border border-black p-2">TOTAL BESOINS</td>
                <td className="border border-black p-2 text-right">{totalInvestissement.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <TableHeader title="FINANCEMENT DES BESOINS" />
          <table className="w-full border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-black p-2 text-left">Source de financement</th>
                <th className="border border-black p-2 text-right">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {state.financements.map(f => (
                <tr key={f.id}>
                  <td className="border border-black p-2">{f.label} {f.taux ? `(${f.taux}%)` : ''}</td>
                  <td className="border border-black p-2 text-right">{f.montant.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-bold bg-slate-50">
                <td className="border border-black p-2">TOTAL RESSOURCES</td>
                <td className="border border-black p-2 text-right">{totalFinancement.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="page-break mt-12">
          <h2 className="text-2xl font-bold text-center border-2 border-black p-4 mb-10 uppercase">SIG & Seuil de rentabilité</h2>
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-200">
              <tr>
                <th className="border border-black p-2 text-left">Analyse par année</th>
                {years.map(y => <th key={y} className="border border-black p-2">Année {y+1}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-black p-2 font-bold">Chiffre d'affaires</td>{financialData.map(d => <td key={d.year} className="border border-black p-2 text-right">{Math.round(d.ca).toLocaleString()}</td>)}</tr>
              <tr><td className="border border-black p-2">Marge brute</td>{financialData.map(d => <td key={d.year} className="border border-black p-2 text-right">{Math.round(d.margin).toLocaleString()}</td>)}</tr>
              <tr className="bg-slate-50 font-bold"><td className="border border-black p-2">Valeur Ajoutée (VA)</td>{financialData.map(d => <td key={d.year} className="border border-black p-2 text-right">{Math.round(d.va).toLocaleString()}</td>)}</tr>
              <tr><td className="border border-black p-2">Excédent Brut (EBE)</td>{financialData.map(d => <td key={d.year} className="border border-black p-2 text-right">{Math.round(d.ebe).toLocaleString()}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border border-black p-2">Résultat Net</td>{financialData.map(d => <td key={d.year} className="border border-black p-2 text-right">{Math.round(d.netResult).toLocaleString()}</td>)}</tr>
              <tr className="bg-emerald-50 text-emerald-900 font-bold"><td className="border border-black p-2 uppercase">Autofinancement (CAF)</td>{financialData.map(d => <td key={d.year} className="border border-black p-2 text-right">{Math.round(d.caf).toLocaleString()}</td>)}</tr>
            </tbody>
          </table>

          <div className="mt-12 p-6 border-2 border-black">
            <h3 className="text-lg font-bold mb-4 uppercase">Seuil de Rentabilité (Break-even)</h3>
            <p className="text-sm leading-relaxed">
              Le seuil de rentabilité correspond au chiffre d'affaires minimum à réaliser pour ne pas faire de perte.
              Pour l'année 1, votre seuil de rentabilité est estimé à : 
              <strong className="text-lg ml-2">
                {Math.round((financialData[0].fixedCosts + financialData[0].salairesEmp + financialData[0].remunDir) / (financialData[0].margin / financialData[0].ca)).toLocaleString()} FCFA
              </strong>
            </p>
          </div>
        </div>
      </div>

      <div className="no-print pt-6 flex justify-start">
        <button onClick={onPrev} className="px-6 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl transition-all hover:bg-slate-800">Retour aux saisies</button>
      </div>
    </div>
  );
};

export default Report;
