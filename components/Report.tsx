
import React, { useMemo } from 'react';
import { AppState, BesoinItem } from '../types';
import { LISTE_CHARGES_KEYS, LISTE_BESOINS_KEYS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  state: AppState;
  onPrev: () => void;
  onReset: () => void;
}

const Report: React.FC<Props> = ({ state, onPrev, onReset }) => {
  const years = [0, 1, 2, 3, 4]; // Étendu à 5 ans pour un business plan complet
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  const totalInvestissement = (Object.values(state.besoins) as BesoinItem[]).reduce((a, b) => a + (b.montant || 0), 0);
  const totalFinancement = state.financements.reduce((a, f) => a + (f.montant || 0), 0);

  // --- CALCULS FINANCIERS ANNUELS ---
  const financialData = useMemo(() => {
    const caArr: number[] = [];
    const year1Ca = state.revenue.caMensuel.reduce((a, b) => a + b, 0);
    caArr.push(year1Ca);
    
    // Calcul de la croissance sur les 5 années suivantes (pour atteindre 5 ans au total)
    for (let i = 0; i < 4; i++) {
      caArr.push(caArr[i] * (1 + (state.revenue.tauxCroissance[i] || 0) / 100));
    }

    return years.map((y, idx) => {
      const ca = caArr[idx];
      const costOfGoods = ca * (state.revenue.tauxCoutMarchandises / 100);
      const margin = ca - costOfGoods;
      
      const chargesDetail = LISTE_CHARGES_KEYS.reduce((acc, c) => {
        acc[c.id] = state.charges[`${c.id}-${idx}`] || 0;
        return acc;
      }, {} as Record<string, number>);

      const fixedCosts = Object.values(chargesDetail).reduce((a, b) => a + b, 0);
      
      const dotAmort = (Object.values(state.besoins) as BesoinItem[]).reduce((acc, b) => {
        if (b.amortissement > 0 && idx < b.amortissement) return acc + (b.montant / b.amortissement);
        return acc;
      }, 0);

      const interestRate = state.financements
        .filter(f => f.taux && f.taux > 0)
        .reduce((acc, f) => acc + (f.montant * (f.taux || 0) / 100), 0);
      
      // Amortissement financier dégressif simple (sur 5 ans)
      const chargesFin = interestRate * (1 - (idx * 0.2));

      const va = margin - fixedCosts;
      const totalSalaires = (state.revenue.salairesEmp[idx] || 0) + (state.revenue.remunDir[idx] || 0);
      const ebe = va - totalSalaires;
      const resExploit = ebe - dotAmort;
      const resAvantImpots = resExploit - (chargesFin > 0 ? chargesFin : 0);
      const is = resAvantImpots > 0 ? resAvantImpots * 0.25 : 0;
      const netResult = resAvantImpots - is;

      const volumeCreditClient = ca * (state.revenue.joursClients / 360);
      const volumeDettesFournisseur = costOfGoods * (state.revenue.joursFournisseurs / 360);
      const bfr = volumeCreditClient - volumeDettesFournisseur;

      return {
        year: idx + 1,
        ca,
        costOfGoods,
        margin,
        va,
        fixedCosts,
        chargesDetail,
        salairesEmp: state.revenue.salairesEmp[idx] || 0,
        remunDir: state.revenue.remunDir[idx] || 0,
        ebe,
        dotAmort,
        resExploit,
        chargesFin,
        resAvantImpots,
        is,
        netResult,
        caf: netResult + dotAmort,
        bfr,
        creditClient: volumeCreditClient,
        detteFournisseur: volumeDettesFournisseur
      };
    });
  }, [state, years]);

  // --- CALCULS TRESORERIE MENSUELLE (ANNEE 1) ---
  const treasuryMonthly = useMemo(() => {
    let soldePrecedent = 0;
    return months.map(m => {
      const caMois = state.revenue.caMensuel[m] || 0;
      const apportInitial = m === 0 ? totalFinancement : 0;
      const encaissements = caMois + apportInitial;

      const investissement = m === 0 ? totalInvestissement : 0;
      const chargeMois = LISTE_CHARGES_KEYS.reduce((acc, c) => acc + (state.charges[`${c.id}-0`] || 0) / 12, 0);
      const salaireMois = ((state.revenue.salairesEmp[0] || 0) + (state.revenue.remunDir[0] || 0)) / 12;
      const achatMois = caMois * (state.revenue.tauxCoutMarchandises / 100);
      
      const decaissements = investissement + chargeMois + salaireMois + achatMois;
      const soldeDuMois = encaissements - decaissements;
      const cumul = soldePrecedent + soldeDuMois;
      soldePrecedent = cumul;

      return {
        mois: m + 1,
        ca: caMois,
        apport: apportInitial,
        invest: investissement,
        charges: chargeMois,
        salaires: salaireMois,
        achats: achatMois,
        totalEnc: encaissements,
        totalDec: decaissements,
        solde: soldeDuMois,
        cumul: cumul
      };
    });
  }, [state, financialData, totalInvestissement, totalFinancement, months]);

  // --- COMPOSANTS PDF ---
  const PdfPageHeader = ({ title }: { title: string }) => (
    <div className="mb-10">
      <div className="border-t-4 border-black pt-2 pb-6 flex justify-center">
        <h1 className="text-4xl font-bold uppercase text-center tracking-tighter leading-none">{title}</h1>
      </div>
      <div className="space-y-1 text-sm font-semibold">
        <p>Projet : {state.generalInfo.intituleProjet || "N/A"}</p>
        <p>Porteur de projet : {state.generalInfo.prenomNom || "N/A"}</p>
      </div>
    </div>
  );

  const formatVal = (v: number) => (v === 0 ? '-' : Math.round(v).toLocaleString());

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER WEB NO-PRINT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <i className="fa-solid fa-file-invoice text-indigo-500 text-2xl"></i>
             <h2 className="text-3xl font-bold">Rapport Expert Prévisionnel (5 ans)</h2>
          </div>
          <p className="text-slate-500">Business Plan de {state.generalInfo.intituleProjet || "votre projet"}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3">
            <i className="fa-solid fa-print"></i> <span>Imprimer le Dossier Complet</span>
          </button>
          <button onClick={onPrev} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-xs"></i> <span>Modifier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-column text-indigo-400"></i> Chiffre d'Affaires vs Résultat
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} label={{ value: 'Année', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} itemStyle={{fontSize: '12px'}} formatter={(v: any) => v.toLocaleString()} />
                <Bar dataKey="ca" fill="#6366f1" name="CA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netResult" fill="#10b981" name="Bénéfice" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-line text-indigo-400"></i> Évolution de la CAF
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} label={{ value: 'Année', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} itemStyle={{fontSize: '12px'}} formatter={(v: any) => v.toLocaleString()} />
                <Line type="monotone" dataKey="caf" stroke="#8b5cf6" strokeWidth={3} name="CAF" dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* --- STRUCTURE DU PDF (PRINT ONLY) --- */}
      <div className="print-only hidden text-black bg-white">
        
        {/* PAGE 0 : PAGE DE GARDE */}
        <div className="page-break p-12 min-h-screen flex flex-col justify-between items-center text-center border-8 border-slate-100">
           <div className="w-full">
              <div className="mt-20">
                 <h2 className="text-xl uppercase tracking-widest font-bold text-slate-400">Dossier de Création</h2>
                 <div className="w-16 h-1 bg-indigo-600 mx-auto mt-4"></div>
              </div>
              <h1 className="text-7xl font-black mt-24 mb-6 leading-none tracking-tighter">BUSINESS PLAN</h1>
              <p className="text-2xl font-light text-slate-500 italic">Étude Financière Prévisionnelle sur 5 ans</p>
           </div>

           <div className="w-full max-w-3xl border-2 border-black p-10 text-left bg-slate-50 shadow-sm">
              <div className="mb-8">
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1">Intitulé du projet</p>
                <h3 className="text-3xl font-black uppercase">{state.generalInfo.intituleProjet || "Projet de création"}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-6 text-sm">
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Porteur de projet</p>
                    <p className="font-bold text-lg">{state.generalInfo.prenomNom}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Type d'activité</p>
                    <p className="font-bold text-lg capitalize">{state.generalInfo.activiteType}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Ville</p>
                    <p className="font-bold">{state.generalInfo.ville}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email / Contact</p>
                    <p className="font-bold text-xs">{state.generalInfo.email}<br/>{state.generalInfo.telephone}</p>
                 </div>
              </div>
           </div>

           <div className="w-full text-center pb-10">
              <p className="text-sm font-bold text-slate-400 mb-2">Émis le {new Date().toLocaleDateString('fr-FR')}</p>
              <p className="text-xs italic text-slate-300">Généré par FinanceStart Pro - Business Plan Analyzer</p>
           </div>
        </div>

        {/* PAGE 1 : INVESTISSEMENTS ET FINANCEMENTS */}
        <div className="page-break p-12 min-h-screen">
          <PdfPageHeader title="Investissements et financements" />
          
          <div className="border-2 border-black overflow-hidden mb-12">
            <div className="bg-slate-200 border-b-2 border-black px-4 py-2 font-bold flex justify-between uppercase text-xs">
               <span>Investissements</span>
               <span>Montant hors taxes</span>
            </div>
            
            <div className="divide-y divide-black/10">
               {/* Incorporelles */}
               <div className="p-4 space-y-2">
                  <p className="font-bold text-sm">Immobilisations incorporelles</p>
                  <div className="space-y-1">
                     {LISTE_BESOINS_KEYS.filter(k => ['frais-etablissement', 'frais-compteurs', 'logiciels-formations', 'depot-marque', 'droits-entrees', 'achat-fonds-commerce', 'droit-bail', 'caution', 'frais-dossier', 'frais-notaire'].includes(k.id)).map(k => {
                        const val = state.besoins[k.id]?.montant || 0;
                        if (val === 0) return null;
                        return (
                          <div key={k.id} className="flex justify-between text-xs italic pl-4">
                             <span>{k.label}</span>
                             <span>{val.toLocaleString()}</span>
                          </div>
                        );
                     })}
                  </div>
               </div>

               {/* Corporelles */}
               <div className="p-4 space-y-2">
                  <p className="font-bold text-sm">Immobilisations corporelles</p>
                  <div className="space-y-1">
                     {LISTE_BESOINS_KEYS.filter(k => ['enseigne-communication', 'achat-immobilier', 'travaux-amenagement', 'materiel', 'materiel-bureau'].includes(k.id)).map(k => {
                        const val = state.besoins[k.id]?.montant || 0;
                        if (val === 0) return null;
                        return (
                          <div key={k.id} className="flex justify-between text-xs italic pl-4">
                             <span>{k.label}</span>
                             <span>{val.toLocaleString()}</span>
                          </div>
                        );
                     })}
                  </div>
               </div>

               {/* Autres besoins */}
               <div className="px-4 py-3 space-y-1">
                  <div className="flex justify-between text-sm font-bold">
                     <span>Stock de matières et produits</span>
                     <span>{(state.besoins['stock']?.montant || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                     <span>Trésorerie de départ</span>
                     <span>{(state.besoins['tresorerie-depart']?.montant || 0).toLocaleString()}</span>
                  </div>
               </div>

               {/* Total Besoins */}
               <div className="bg-slate-100 px-4 py-4 border-t-2 border-black flex justify-between font-black uppercase text-sm">
                  <span>Total Besoins</span>
                  <span>{totalInvestissement.toLocaleString()} FCFA</span>
               </div>
            </div>
          </div>

          <div className="border-2 border-black overflow-hidden">
            <div className="bg-slate-200 border-b-2 border-black px-4 py-2 font-bold flex justify-between uppercase text-xs">
               <span>Financement des investissements</span>
               <span>Montant hors taxes</span>
            </div>
            
            <div className="divide-y divide-black/10">
               {/* Apport */}
               <div className="p-4 space-y-2">
                  <p className="font-bold text-sm">Apport personnel</p>
                  <div className="space-y-1 pl-4">
                     {state.financements.filter(f => !f.taux).map(f => (
                        <div key={f.id} className="flex justify-between text-xs italic">
                           <span>{f.label}</span>
                           <span>{f.montant.toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Emprunt */}
               <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                     <span>Emprunt</span>
                     <div className="flex gap-12 text-[10px] text-slate-400 uppercase">
                        <span>taux</span>
                        <span>durée mois</span>
                        <span className="text-black">montant</span>
                     </div>
                  </div>
                  <div className="space-y-1 pl-4">
                     {state.financements.filter(f => f.taux).map(f => (
                        <div key={f.id} className="flex justify-between text-xs italic">
                           <span>{f.label}</span>
                           <div className="flex gap-16">
                              <span className="w-10 text-center">{f.taux}%</span>
                              <span className="w-10 text-center">{f.duree}</span>
                              <span>{f.montant.toLocaleString()}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Total Ressources */}
               <div className="bg-slate-100 px-4 py-4 border-t-2 border-black flex justify-between font-black uppercase text-sm">
                  <span>Total Ressources</span>
                  <span>{totalFinancement.toLocaleString()} FCFA</span>
               </div>
            </div>
          </div>
        </div>

        {/* PAGE 2 : SALAIRES & CHARGES SOCIALES */}
        <div className="page-break p-12 min-h-screen">
          <PdfPageHeader title="Salaires et charges sociales" />
          <div className="mb-12 w-full flex justify-end">
            <div className="w-2/3 space-y-2 text-sm">
              <div className="grid grid-cols-2"><span>Statut juridique :</span> <span className="font-bold">{state.generalInfo.statutJuridique || "-"}</span></div>
              <div className="grid grid-cols-2"><span>Bénéfice de l'Accre :</span> <span className="font-bold">{state.revenue.accre ? "Oui" : "Non"}</span></div>
              <div className="grid grid-cols-2"><span>Statut social du/des dirigeants :</span> <span className="font-bold">Travailleur non salarié</span></div>
            </div>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 border-t border-black text-[10px]">
                <th className="border-x border-black p-2 text-left w-1/4"></th>
                {years.map(y => <th key={y} className="border-x border-black p-2 text-center">Année {y+1}</th>)}
              </tr>
            </thead>
            <tbody className="border-b border-black">
              <tr className="border-t border-black">
                <td className="border-x border-black p-2 font-bold">Rémunération du (des) dirigeants</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.remunDir)}</td>)}
              </tr>
              <tr className="text-slate-500 italic text-xs">
                <td className="border-x border-black p-2 pl-6">% augmentation</td>
                {financialData.map((d, i) => <td key={d.year} className="border-x border-black p-2 text-right">{i === 0 ? '-' : `${state.revenue.tauxCroissance[i-1]}%`}</td>)}
              </tr>
              <tr>
                <td className="border-x border-black p-2 font-bold">Charges sociales du (des) dirigeant(s)</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.remunDir * 0.15)}</td>)}
              </tr>
              <tr className="border-t border-black h-4"></tr>
              <tr className="border-t border-black">
                <td className="border-x border-black p-2 font-bold">Salaires des employés</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.salairesEmp)}</td>)}
              </tr>
              <tr className="text-slate-500 italic text-xs">
                <td className="border-x border-black p-2 pl-6">% augmentation</td>
                {financialData.map((d, i) => <td key={d.year} className="border-x border-black p-2 text-right">{i === 0 ? '-' : `${state.revenue.tauxCroissance[i-1]}%`}</td>)}
              </tr>
              <tr>
                <td className="border-x border-black p-2 font-bold">Charges sociales employés</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.salairesEmp * 0.3)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAGE 3 : AMORTISSEMENTS */}
        <div className="page-break p-12 min-h-screen">
          <PdfPageHeader title="Détail des amortissements" />
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 border-t border-black text-[10px]">
                <th className="border-x border-black p-2 text-left w-1/4"></th>
                {years.map(y => <th key={y} className="border-x border-black p-2 text-center">Année {y+1}</th>)}
              </tr>
            </thead>
            <tbody className="border-b border-black text-[11px]">
              <tr className="border-t border-black font-bold">
                <td className="border-x border-black p-2">Amortissements incorporels</td>
                {years.map(y => {
                  const total = LISTE_BESOINS_KEYS.filter(k => k.id.includes('frais') || k.id.includes('logiciel') || k.id.includes('droit'))
                    .reduce((acc, k) => {
                      const item = state.besoins[k.id];
                      return acc + (item && item.amortissement > y ? item.montant / item.amortissement : 0);
                    }, 0);
                  return <td key={y} className="border-x border-black p-2 text-right">{formatVal(total)}</td>;
                })}
              </tr>
              {LISTE_BESOINS_KEYS.filter(k => k.id.includes('frais') || k.id.includes('logiciel') || k.id.includes('droit')).map(k => (
                <tr key={k.id} className="text-xs italic">
                  <td className="border-x border-black p-2 pl-8">{k.label}</td>
                  {years.map(y => {
                    const item = state.besoins[k.id];
                    const val = (item && item.amortissement > y) ? item.montant / item.amortissement : 0;
                    return <td key={y} className="border-x border-black p-2 text-right">{formatVal(val)}</td>;
                  })}
                </tr>
              ))}
              <tr className="border-t border-black font-bold">
                <td className="border-x border-black p-2">Amortissements corporels</td>
                {years.map(y => {
                  const total = LISTE_BESOINS_KEYS.filter(k => k.id.includes('materiel') || k.id.includes('travaux') || k.id.includes('immobilier'))
                    .reduce((acc, k) => {
                      const item = state.besoins[k.id];
                      return acc + (item && item.amortissement > y ? item.montant / item.amortissement : 0);
                    }, 0);
                  return <td key={y} className="border-x border-black p-2 text-right">{formatVal(total)}</td>;
                })}
              </tr>
              {LISTE_BESOINS_KEYS.filter(k => k.id.includes('materiel') || k.id.includes('travaux') || k.id.includes('immobilier')).map(k => (
                <tr key={k.id} className="text-xs italic">
                  <td className="border-x border-black p-2 pl-8">{k.label}</td>
                  {years.map(y => {
                    const item = state.besoins[k.id];
                    const val = (item && item.amortissement > y) ? item.montant / item.amortissement : 0;
                    return <td key={y} className="border-x border-black p-2 text-right">{formatVal(val)}</td>;
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-black font-black uppercase bg-slate-100">
                <td className="border-x border-black p-2">Total amortissements</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.dotAmort)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAGE 4 : COMPTE DE RESULTAT */}
        <div className="page-break p-12 min-h-screen">
          <PdfPageHeader title="Compte de résultats prévisionnel sur 5 ans" />
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-200 border-t border-black">
                <th className="border-x border-black p-2 text-left w-1/4"></th>
                {years.map(y => <th key={y} className="border-x border-black p-2 text-center">Année {y+1}</th>)}
              </tr>
            </thead>
            <tbody className="border-b border-black">
              <tr className="font-bold border-t border-black"><td>Produits d'exploitation</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.ca)}</td>)}</tr>
              <tr className="italic text-[9px]"><td>Chiffre d'affaires HT vente de marchandises</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{state.generalInfo.activiteType !== 'services' ? formatVal(d.ca) : '-'}</td>)}</tr>
              <tr className="italic text-[9px]"><td>Chiffre d'affaires HT services</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{state.generalInfo.activiteType !== 'marchandises' ? formatVal(d.ca) : '-'}</td>)}</tr>
              <tr className="font-bold border-t border-black"><td>Charges d'exploitation</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">({formatVal(d.costOfGoods + d.fixedCosts + d.salairesEmp + d.remunDir)})</td>)}</tr>
              <tr className="italic text-[9px]"><td>Achats consommés</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.costOfGoods)}</td>)}</tr>
              <tr className="bg-slate-200 font-bold border-y border-black"><td>Marge brute</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.margin)}</td>)}</tr>
              
              <tr className="font-bold border-t border-black"><td>Charges externes</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">({formatVal(d.fixedCosts)})</td>)}</tr>
              {LISTE_CHARGES_KEYS.slice(0, 8).map(c => (
                <tr key={c.id} className="text-[9px] italic">
                  <td className="pl-6 border-x border-black p-1">{c.label}</td>
                  {financialData.map(d => <td key={d.year} className="text-right p-1 border-x border-black">{formatVal(d.chargesDetail[c.id])}</td>)}
                </tr>
              ))}
              
              <tr className="bg-slate-200 font-bold border-y border-black uppercase"><td>Valeur ajoutée</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.va)}</td>)}</tr>
              <tr><td>Impôts et taxes</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.chargesDetail['taxes'] || 0)}</td>)}</tr>
              <tr><td>Salaires employés</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.salairesEmp)}</td>)}</tr>
              <tr><td>Prélèvement dirigeant(s)</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.remunDir)}</td>)}</tr>
              
              <tr className="bg-slate-200 font-bold border-y border-black uppercase"><td>Excédent brut d'exploitation</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.ebe)}</td>)}</tr>
              <tr><td>Frais bancaires, charges financières</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.chargesFin)}</td>)}</tr>
              <tr><td>Dotations aux amortissements</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.dotAmort)}</td>)}</tr>
              <tr className="bg-slate-200 font-bold border-y border-black"><td>Résultat avant impôts</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.resAvantImpots)}</td>)}</tr>
              <tr className="bg-slate-300 font-black border-y-2 border-black uppercase text-[11px]"><td>Résultat net comptable</td>{financialData.map(d => <td key={d.year} className="text-right p-2 border-x border-black">{formatVal(d.netResult)}</td>)}</tr>
            </tbody>
          </table>
        </div>

        {/* PAGE 5 : SIG AVEC % */}
        <div className="page-break p-12 min-h-screen">
          <PdfPageHeader title="Soldes intermédiaires de gestion" />
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-slate-200 border-t border-black">
                <th className="border-x border-black p-2 text-left w-1/5"></th>
                {years.map(y => (
                  <React.Fragment key={y}>
                    <th className="border-x border-black p-2 text-center">Année {y+1}</th>
                    <th className="border-x border-black p-2 text-center bg-slate-300 font-black">%</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="border-b border-black">
              <tr className="border-t border-black font-bold">
                <td className="border-x border-black p-2">Chiffre d'affaires</td>
                {financialData.map(d => (
                  <React.Fragment key={d.year}>
                    <td className="border-x border-black p-2 text-right">{formatVal(d.ca)}</td>
                    <td className="border-x border-black p-2 text-center">100%</td>
                  </React.Fragment>
                ))}
              </tr>
              <tr>
                <td className="border-x border-black p-2">Marge globale</td>
                {financialData.map(d => (
                  <React.Fragment key={d.year}>
                    <td className="border-x border-black p-2 text-right">{formatVal(d.margin)}</td>
                    <td className="border-x border-black p-2 text-center">{d.ca > 0 ? Math.round((d.margin/d.ca)*100) : 0}%</td>
                  </React.Fragment>
                ))}
              </tr>
              <tr>
                <td className="border-x border-black p-2">Valeur ajoutée</td>
                {financialData.map(d => (
                  <React.Fragment key={d.year}>
                    <td className="border-x border-black p-2 text-right">{formatVal(d.va)}</td>
                    <td className="border-x border-black p-2 text-center">{d.ca > 0 ? Math.round((d.va/d.ca)*100) : 0}%</td>
                  </React.Fragment>
                ))}
              </tr>
              <tr className="bg-slate-300 font-black border-t-2 border-black uppercase text-[10px]">
                <td className="border-x border-black p-2">Capacité autofinancement</td>
                {financialData.map(d => (
                  <React.Fragment key={d.year}>
                    <td className="border-x border-black p-2 text-right">{formatVal(d.caf)}</td>
                    <td className="border-x border-black p-2 text-center">{d.ca > 0 ? Math.round((d.caf/d.ca)*100) : 0}%</td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* CAF Section */}
        <div className="page-break p-12 min-h-screen">
          <PdfPageHeader title="Capacité d'autofinancement" />
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 border-t border-black text-[11px]">
                <th className="border-x border-black p-2 text-left w-1/4"></th>
                {years.map(y => <th key={y} className="border-x border-black p-2 text-center">Année {y+1}</th>)}
              </tr>
            </thead>
            <tbody className="border-b border-black">
              <tr className="border-t border-black">
                <td className="border-x border-black p-2 font-bold">Résultat de l'exercice</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.netResult)}</td>)}
              </tr>
              <tr>
                <td className="border-x border-black p-2">+ Dotation amortissements</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.dotAmort)}</td>)}
              </tr>
              <tr className="bg-slate-300 font-black border-t-2 border-black uppercase text-[11px]">
                <td className="border-x border-black p-2 uppercase">Capacité d'autofinancement</td>
                {financialData.map(d => <td key={d.year} className="border-x border-black p-2 text-right">{formatVal(d.caf)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="no-print pt-10 border-t border-slate-800 flex justify-between">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
          <i className="fa-solid fa-arrow-left text-xs"></i> <span>Retour aux saisies</span>
        </button>
        <button onClick={onReset} className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
          <i className="fa-solid fa-trash-can text-xs"></i> <span>Réinitialiser le projet</span>
        </button>
      </div>
    </div>
  );
};

export default Report;
