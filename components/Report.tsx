
import React, { useMemo } from 'react';
import { AppState, BesoinItem } from '../types';
import { LISTE_CHARGES_KEYS, LISTE_BESOINS_KEYS, formatCurrency } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  state: AppState;
  onPrev: () => void;
  onReset: () => void;
}

const Report: React.FC<Props> = ({ state, onPrev, onReset }) => {
  const years = [0, 1, 2, 3, 4];
  const months = Array.from({ length: 12 }, (_, i) => i);
  const currency = state.currency;
  
  const totalInvestissement = (Object.values(state.besoins) as BesoinItem[]).reduce((a, b) => a + (b.montant || 0), 0);
  const totalFinancement = state.financements.reduce((a, f) => a + (f.montant || 0), 0);
  const tresorerieInitiale = totalFinancement - totalInvestissement;

  // --- CALCULS FINANCIERS ANNUELS ---
  const financialData = useMemo(() => {
    const caArr: number[] = [];
    
    if (state.revenue.caMode === 'mode2') {
      for (let i = 0; i < 5; i++) {
        const yearSum = (state.revenue.caManuel[i] || Array(12).fill(0)).reduce((a, b) => a + b, 0);
        caArr.push(yearSum);
      }
    } else {
      const year1Ca = state.revenue.caMensuel.reduce((a, b) => a + b, 0);
      caArr.push(year1Ca);
      for (let i = 0; i < 4; i++) {
        caArr.push(caArr[i] * (1 + (state.revenue.tauxCroissance[i] || 0) / 100));
      }
    }

    let cumulCaf = 0;

    return years.map((y, idx) => {
      const ca = caArr[idx];
      const costOfGoods = ca * (state.revenue.tauxCoutMarchandises / 100);
      const margin = ca - costOfGoods;
      
      const chargesDetail = LISTE_CHARGES_KEYS.reduce((acc, c) => {
        acc[c.id] = state.charges[`${c.id}-${idx}`] || 0;
        return acc;
      }, {} as Record<string, number>);

      const fixedCosts = Object.values(chargesDetail).reduce((a, b) => a + b, 0);
      
      const amortDetails = LISTE_BESOINS_KEYS.reduce((acc, bKey) => {
        const item = state.besoins[bKey.id];
        if (item && item.amortissement > 0 && idx < item.amortissement) {
          acc[bKey.id] = item.montant / item.amortissement;
        } else {
          acc[bKey.id] = 0;
        }
        return acc;
      }, {} as Record<string, number>);

      const dotAmort = Object.values(amortDetails).reduce((a, b) => a + b, 0);

      const interestRate = state.financements
        .filter(f => f.taux && f.taux > 0)
        .reduce((acc, f) => acc + (f.montant * (f.taux || 0) / 100), 0);
      
      const chargesFin = Math.max(0, interestRate * (1 - (idx * 0.2)));
      
      const totalEmprunts = state.financements.filter(f => f.taux !== undefined).reduce((a, f) => a + f.montant, 0);
      const remboursementEmprunt = idx < 5 ? totalEmprunts / 5 : 0;

      const va = margin - fixedCosts;
      
      const tauxChargesDir = (state.revenue.accre && idx === 0) ? 0.05 : 0.15;
      const chargesSocDir = (state.revenue.remunDir[idx] || 0) * tauxChargesDir;
      const chargesSocEmp = (state.revenue.salairesEmp[idx] || 0) * 0.30;
      const totalSalairesEtCharges = (state.revenue.salairesEmp[idx] || 0) + (state.revenue.remunDir[idx] || 0) + chargesSocDir + chargesSocEmp;
      
      const ebe = va - totalSalairesEtCharges;
      const resExploit = ebe - dotAmort;
      const resAvantImpots = resExploit - chargesFin;
      const is = resAvantImpots > 0 ? resAvantImpots * 0.25 : 0;
      const netResult = resAvantImpots - is;
      const caf = netResult + dotAmort;

      const creditClient = ca * (state.revenue.joursClients / 360);
      const detteFournisseur = costOfGoods * (state.revenue.joursFournisseurs / 360);
      const bfr = creditClient - detteFournisseur;

      const tauxMarge = ca > 0 ? (margin / ca) : 0;
      const chargesFixesTotales = fixedCosts + totalSalairesEtCharges;
      const seuilRentabilite = tauxMarge > 0 ? chargesFixesTotales / tauxMarge : 0;

      cumulCaf += caf;
      const soldeTresorerieFinAnnee = tresorerieInitiale + cumulCaf - bfr - (remboursementEmprunt * (idx + 1));

      return {
        year: idx + 1,
        ca,
        costOfGoods,
        margin,
        va,
        fixedCosts,
        chargesDetail,
        amortDetails,
        salairesEmp: state.revenue.salairesEmp[idx] || 0,
        remunDir: state.revenue.remunDir[idx] || 0,
        chargesSocDir,
        chargesSocEmp,
        ebe,
        dotAmort,
        resExploit,
        chargesFin,
        resAvantImpots,
        is,
        netResult,
        caf,
        remboursementEmprunt,
        creditClient,
        detteFournisseur,
        bfr,
        seuilRentabilite,
        tauxMarge,
        soldeTresorerieFinAnnee
      };
    });
  }, [state, years, tresorerieInitiale]);

  const formatVal = (v: number) => (v === 0 ? '-' : formatCurrency(v, currency));

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER WEB NO-PRINT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <i className="fa-solid fa-file-invoice text-indigo-500 text-2xl"></i>
             <h2 className="text-3xl font-bold">Rapport Expert Prévisionnel (5 ans)</h2>
          </div>
          <p className="text-slate-500">Planification configurée en <span className="text-indigo-400 font-bold">{currency.name} ({currency.code})</span></p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3">
            <i className="fa-solid fa-print"></i> <span>Imprimer le Dossier</span>
          </button>
          <button onClick={onPrev} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-xs"></i> <span>Ajuster les données</span>
          </button>
        </div>
      </div>

      {/* DASHBOARDS WEB NO-PRINT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-column text-indigo-400"></i> Performance Annuelle ({currency.code})
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => formatCurrency(v, currency)} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} 
                  itemStyle={{fontSize: '12px'}} 
                  formatter={(v: any) => [formatCurrency(v, currency) + ' ' + currency.symbol, '']} 
                />
                <Bar dataKey="ca" fill="#6366f1" name="CA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netResult" fill="#10b981" name="Bénéfice" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-line text-indigo-400"></i> Flux de Trésorerie (CAF)
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => formatCurrency(v, currency)} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} 
                  itemStyle={{fontSize: '12px'}} 
                  formatter={(v: any) => [formatCurrency(v, currency) + ' ' + currency.symbol, '']} 
                />
                <Line type="monotone" dataKey="caf" stroke="#8b5cf6" strokeWidth={3} name="CAF" dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* --- STRUCTURE DU PDF (PRINT ONLY) --- */}
      <div className="print-only hidden text-black bg-white">
        
        {/* PAGE 1 : PAGE DE GARDE */}
        <div className="page-break p-12 min-h-screen flex flex-col justify-between items-center text-center">
           <div className="w-full border-4 border-black p-8 mt-10">
              <p className="text-sm font-bold mb-4 uppercase tracking-widest">Dossier de Création d'Entreprise</p>
              <h1 className="text-5xl font-black uppercase mb-10">{state.generalInfo.intituleProjet || "Projet Entrepreneurial"}</h1>
           </div>

           <div className="w-full border-4 border-black p-12 my-10 flex flex-col items-center justify-center flex-grow">
              <h2 className="text-4xl font-bold mb-4">Etude financière</h2>
              <h2 className="text-4xl font-bold mb-8">prévisionnelle sur 5 ans</h2>
              <div className="bg-slate-100 p-6 rounded-lg border-2 border-black">
                 <p className="text-sm font-bold uppercase mb-2">Contexte monétaire international</p>
                 <p className="text-xl font-bold">Tous les montants sont exprimés en {currency.name} ({currency.code})</p>
              </div>
           </div>

           <div className="w-full border-4 border-black p-8 mb-10 flex justify-center">
              <p className="text-lg font-bold">{new Date().toLocaleDateString(currency.locale)}</p>
           </div>
           <p className="text-right w-full text-xs font-bold">1</p>
        </div>

        {/* PAGE 2 : INVESTISSEMENTS ET FINANCEMENTS */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-3xl font-bold uppercase">Investissements et financements ({currency.code})</h2>
          </div>
          
          <div className="mb-10 text-sm font-bold flex justify-between border-b-2 border-black pb-2">
             <p>Projet : {state.generalInfo.intituleProjet}</p>
             <p>Devise de tenue de compte : {currency.code} ({currency.symbol})</p>
          </div>

          <table className="w-full border-collapse border-2 border-black mb-10">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left w-2/3 uppercase text-xs">POSTES D'INVESTISSEMENTS</th>
                   <th className="border-2 border-black p-2 text-center uppercase text-xs">Montant ({currency.symbol})</th>
                </tr>
             </thead>
             <tbody>
                {LISTE_BESOINS_KEYS.map(k => (
                  state.besoins[k.id]?.montant > 0 && (
                    <tr key={k.id}>
                      <td className="border-2 border-black p-1 text-[10px] pl-6 italic">{k.label}</td>
                      <td className="border-2 border-black p-1 text-right text-[10px] font-mono">{formatVal(state.besoins[k.id].montant)}</td>
                    </tr>
                  )
                ))}
                <tr className="bg-slate-200">
                   <td className="border-2 border-black p-2 font-black text-xs uppercase text-right">TOTAL BESOINS DE DÉMARRAGE</td>
                   <td className="border-2 border-black p-2 text-right text-xs font-black font-mono">{formatVal(totalInvestissement)}</td>
                </tr>
             </tbody>
          </table>

          <table className="w-full border-collapse border-2 border-black">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left w-2/3 uppercase text-xs">RESOURCES DE FINANCEMENT</th>
                   <th className="border-2 border-black p-2 text-center uppercase text-xs">Montant ({currency.symbol})</th>
                </tr>
             </thead>
             <tbody>
                {state.financements.map(f => (
                   <tr key={f.id}>
                      <td className="border-2 border-black p-1 text-[10px] pl-6 italic">
                         {f.label} {f.taux ? `(taux: ${f.taux}%, durée: ${f.duree} mois)` : ''}
                      </td>
                      <td className="border-2 border-black p-1 text-right text-[10px] font-mono">{formatVal(f.montant)}</td>
                   </tr>
                ))}
                <tr className="bg-slate-200">
                   <td className="border-2 border-black p-2 font-black text-xs uppercase text-right">TOTAL RESSOURCES DE FINANCEMENT</td>
                   <td className="border-2 border-black p-2 text-right text-xs font-black font-mono">{formatVal(totalFinancement)}</td>
                </tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-auto">2</p>
        </div>

        {/* PAGE 4 : COMPTE DE RESULTATS */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-2xl font-bold uppercase">Compte de résultats prévisionnel ({currency.code})</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[8px]">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left w-1/4">INDICATEURS CLÉS</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-50 font-bold">
                   <td className="border-2 border-black p-1">Produits d'exploitation (CA)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}
                </tr>
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-1 uppercase">Marge brute globale</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td>)}
                </tr>
                <tr className="bg-slate-300 font-black">
                   <td className="border-2 border-black p-1 uppercase">E.B.E. (Excédent Brut)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ebe)}</td>)}
                </tr>
                <tr className="bg-black text-white font-black">
                   <td className="border-2 border-white p-1 uppercase">Résultat net de l'exercice</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.netResult)}</td>)}
                </tr>
             </tbody>
          </table>
          <div className="mt-8 p-4 bg-slate-100 rounded border border-black text-[10px] italic">
             Note : Ce rapport utilise le standard de précision {currency.decimals} décimales propre à la devise {currency.name}.
          </div>
          <p className="text-right w-full text-xs font-bold mt-auto">3</p>
        </div>
      </div>

      <div className="no-print pt-10 border-t border-slate-800 flex justify-between">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
          <i className="fa-solid fa-arrow-left text-xs"></i> <span>Ajuster les saisies</span>
        </button>
        <button onClick={onReset} className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
          <i className="fa-solid fa-trash-can text-xs"></i> <span>Effacer les données</span>
        </button>
      </div>
    </div>
  );
};

export default Report;
