import React, { useMemo } from 'react';
import { AppState, BesoinItem } from '../types';
import { LISTE_CHARGES_KEYS, LISTE_BESOINS_KEYS, formatCurrency, formatPercent } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  state: AppState;
  onPrev: () => void;
  onReset: () => void;
  isDarkMode: boolean;
}

const Report: React.FC<Props> = ({ state, onPrev, onReset, isDarkMode }) => {
  const years = [0, 1, 2, 3, 4];
  const months = Array.from({ length: 12 }, (_, i) => i);
  const currency = state.currency;
  
  const totalInvestissement = (Object.values(state.besoins || {}) as BesoinItem[]).reduce((a, b) => a + (b?.montant || 0), 0);
  const totalFinancement = (state.financements || []).reduce((a, f) => a + (f?.montant || 0), 0);
  const totalImmobilisations = totalInvestissement - (state.besoins?.['tresorerie-depart']?.montant || 0);
  const tresorerieInitiale = totalFinancement - totalInvestissement + (state.besoins?.['tresorerie-depart']?.montant || 0);

  /* ------------------------------------------------------ */
  /* TABLEAU D'AMORTISSEMENT DES EMPRUNTS (EXCEL LOGIC) */
  /* ------------------------------------------------------ */
  const buildLoanSchedule = () => {
    const interests = [0, 0, 0, 0, 0];
    const principals = [0, 0, 0, 0, 0];

    (state.financements || []).forEach(f => {
      if (!f.taux || !f.duree || !f.montant) return;

      const r = (f.taux / 100) / 12;
      const n = f.duree;
      const mensualite = (f.montant * r) / (1 - Math.pow(1 + r, -n));

      let capitalRestant = f.montant;
      for (let m = 0; m < n; m++) {
        const interet = capitalRestant * r;
        const principal = mensualite - interet;
        capitalRestant -= principal;

        const yearIndex = Math.floor(m / 12);
        if (yearIndex < 5) {
          interests[yearIndex] += interet;
          principals[yearIndex] += principal;
        }
      }
    });
    return { interests, principals };
  };

  const loanSchedule = buildLoanSchedule();

  // --- CALCULS FINANCIERS ANNUELS ---
  const financialData = useMemo(() => {
    const caArr: number[] = [];
    const inflation = state.revenue?.tauxInflation || 0;
    const isServices = state.generalInfo?.activiteType === 'services';

    /* ------------------ */
    /* CA (LOGIQUE EXCEL) */
    /* ------------------ */
    if (state.revenue?.caMode === 'mode2') {
      for (let i = 0; i < 5; i++) {
        const yearSum = (state.revenue.caManuel?.[i] || Array(12).fill(0))
          .reduce((a, b) => a + (b || 0), 0);
        caArr.push(yearSum);
      }
    } else {
      const year1Ca = (state.revenue?.caMensuel || [])
        .reduce((a, b) => a + (b || 0), 0);

      caArr.push(year1Ca);

      for (let i = 0; i < 4; i++) {
        const growth = (state.revenue?.tauxCroissance?.[i] || 0) / 100;
        caArr.push(caArr[i] * (1 + growth));
      }
    }

    const results: any[] = [];
    let cumulCaf = 0;
    let prevBfr = 0;

    years.forEach((y, idx) => {
      const ca = caArr[idx] || 0;

      /* ------------------ */
      /* COUT MARCHANDISES */
      /* Excel: =SI(service;0;CA * taux) */
      /* ------------------ */
      const costOfGoods = isServices
        ? 0
        : ca * ((state.revenue?.tauxCoutMarchandises || 0) / 100);

      const margin = ca - costOfGoods;

      /* ------------------ */
      /* CHARGES (SOMME) */
      /* ------------------ */
      const chargesDetail = LISTE_CHARGES_KEYS.reduce((acc, c) => {
        const val = state.charges?.[`${c.id}-${idx}`] || 0;
        acc[c.id] = val;
        return acc;
      }, {} as Record<string, number>);

      let fixedCosts = Object.values(chargesDetail)
        .reduce((a, b) => a + (b || 0), 0);

      /* Excel inflation */
      if (idx > 0 && inflation > 0) {
        fixedCosts *= Math.pow(1 + inflation / 100, idx);
      }

      /* ------------------ */
      /* AMORTISSEMENTS */
      /* Excel: =SI(année <= durée; montant/durée;0) */
      /* ------------------ */
      const amortDetails = LISTE_BESOINS_KEYS.reduce((acc, bKey) => {
        const item = state.besoins?.[bKey.id];

        if (item && item.amortissement > 0 && idx < item.amortissement) {
          acc[bKey.id] = item.montant / item.amortissement;
        } else {
          acc[bKey.id] = 0;
        }

        return acc;
      }, {} as Record<string, number>);

      const dotAmort = Object.values(amortDetails)
        .reduce((a, b) => a + b, 0);

      /* ------------------ */
      /* FINANCEMENT */
      /* ------------------ */
      const chargesFin = loanSchedule.interests[idx] || 0;
      const remboursementEmprunt = loanSchedule.principals[idx] || 0;

      /* ------------------ */
      /* VA */
      /* Excel: =Marge - Charges */
      /* ------------------ */
      const va = margin - fixedCosts;

      /* ------------------ */
      /* SALAIRES */
      /* ------------------ */
      const isAssimileSalarie =
        ['sas', 'sasu'].includes(state.generalInfo?.statutJuridique?.toLowerCase() || '');

      let tauxChargesDirNet = isAssimileSalarie ? 0.70 : 0.45;
      const tauxChargesEmpNet = 0.72;

      if (state.revenue?.accre && idx === 0) {
        tauxChargesDirNet = isAssimileSalarie ? 0.35 : 0.25;
      }

      const remunDir = state.revenue?.remunDir?.[idx] || 0;
      const salairesEmp = state.revenue?.salairesEmp?.[idx] || 0;

      const chargesSocDir = remunDir * tauxChargesDirNet;
      const chargesSocEmp = salairesEmp * tauxChargesEmpNet;

      const totalSalairesEtCharges =
        remunDir + salairesEmp + chargesSocDir + chargesSocEmp;

      /* ------------------ */
      /* EBE */
      /* ------------------ */
      const ebe = va - totalSalairesEtCharges;

      /* ------------------ */
      /* RESULTAT */
      /* ------------------ */
      const resExploit = ebe - dotAmort;
      const resAvantImpots = resExploit - chargesFin;

      /* ------------------ */
      /* IMPOT */
      /* Excel: =SI(resultat>0; resultat*taux;0) */
      /* ------------------ */
      const tauxIS = state.generalInfo?.tauxIS || 0;
      const is = resAvantImpots > 0 ? resAvantImpots * (tauxIS / 100) : 0;

      const netResult = resAvantImpots - is;

      /* ------------------ */
      /* CAF */
      /* ------------------ */
      const caf = netResult + dotAmort;
      cumulCaf += caf;

      /* ------------------ */
      /* BFR */
      /* ------------------ */
      const creditClient = ca * ((state.revenue?.joursClients || 0) / 365);
      const stock = costOfGoods * ((state.revenue?.joursStock || 0) / 365);
      const detteFournisseur = costOfGoods * ((state.revenue?.joursFournisseurs || 0) / 365);

      const bfr = creditClient + stock - detteFournisseur;
      const bfrVariation = bfr - prevBfr;
      prevBfr = bfr;

      /* ------------------ */
      /* NOUVEAUX AJOUTS EXCEL 🔥 */
      /* ------------------ */

      // Taux de marge
      const tauxMarge = ca !== 0 ? margin / ca : 0;

      // Seuil de rentabilité
      const seuilRentabilite =
        tauxMarge > 0 ? fixedCosts / tauxMarge : -1;

      /* ------------------ */
      /* TRESORERIE */
      /* ------------------ */
      const cumulRemboursements = loanSchedule.principals
        .slice(0, idx + 1)
        .reduce((a, b) => a + b, 0);

      const soldeTresorerieFinAnnee =
        tresorerieInitiale +
        cumulCaf -
        bfr -
        cumulRemboursements;

      results.push({
        year: idx + 1,
        ca,
        costOfGoods,
        margin,
        tauxMarge,
        seuilRentabilite,
        va,
        fixedCosts,
        chargesDetail,
        amortDetails,
        salairesEmp,
        remunDir,
        chargesSocDir,
        chargesSocEmp,
        totalSalairesEtCharges,
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
        stock,
        detteFournisseur,
        bfr,
        bfrVariation,
        soldeTresorerieFinAnnee
      });
    });

    return results;
  }, [state, years, tresorerieInitiale, loanSchedule]);

  // --- CALCULS MENSUELS ANNEE 1 POUR LE BUDGET ---
  const monthlyDataYear1 = useMemo(() => {
    let soldeCumule = tresorerieInitiale;
    const year1Data = financialData[0];
    
    return months.map(m => {
      const ca = state.revenue?.caMensuel?.[m] || 0;
      const costOfGoods = ca * ((state.revenue?.tauxCoutMarchandises || 0) / 100);
      
      // Répartition mensuelle des charges fixes et salaires
      const fixedCharges = (year1Data?.fixedCosts || 0) / 12;
      const salairesEtCharges = (year1Data?.totalSalairesEtCharges || 0) / 12;
      const chargesFinancieres = (year1Data?.chargesFin || 0) / 12;
      const remboursement = (year1Data?.remboursementEmprunt || 0) / 12;

      const encaissements = ca;
      const decaissements = costOfGoods + fixedCharges + salairesEtCharges + chargesFinancieres + remboursement;
      const fluxMois = encaissements - decaissements;
      soldeCumule += fluxMois;

      return {
        mois: m + 1,
        encaissements,
        decaissements,
        costOfGoods,
        fixedCharges,
        salairesEtCharges,
        fluxMois,
        soldeCumule
      };
    });
  }, [state, tresorerieInitiale, financialData]);

  if (!currency) return <div className="p-20 text-center">Chargement des données monétaires...</div>;

  const formatVal = (v: number) => (v === 0 ? '-' : formatCurrency(v, currency));

  const PrintSectionHeader = ({ title }: { title: string }) => (
    <div className="border-4 border-black p-4 mb-4 text-center bg-white avoid-break">
      <h2 className="text-2xl font-bold uppercase tracking-wide">{title}</h2>
    </div>
  );

  const ProjectInfoBlock = () => (
    <div className="mb-4 text-xs font-bold flex flex-col gap-1 border-b border-black pb-1 avoid-break">
      <p>Projet : <span className="font-normal">{state.generalInfo?.intituleProjet}</span></p>
      <p>Porteur de projet : <span className="font-normal">{state.generalInfo?.prenomNom}</span></p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* --- VUE WEB --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <i className="fa-solid fa-file-invoice text-indigo-600 dark:text-indigo-500 text-2xl"></i>
             <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Rapport Expert Prévisionnel (5 ans)</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Planification configurée en <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currency.name} ({currency.code})</span></p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3">
            <i className="fa-solid fa-print"></i> <span>Imprimer le Dossier</span>
          </button>
          <button onClick={onPrev} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 shadow-sm dark:shadow-none">
            <i className="fa-solid fa-pen-to-square text-xs"></i> <span>Ajuster les données</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <i className="fa-solid fa-chart-column text-indigo-600 dark:text-indigo-400"></i> Performance Annuelle ({currency.code})
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="year" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} />
                <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickFormatter={(v) => formatCurrency(v, currency)} />
                <Tooltip 
                  contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '10px', color: isDarkMode ? '#fff' : '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  itemStyle={{fontSize: '12px'}} 
                  formatter={(v: any) => [formatCurrency(v, currency) + ' ' + currency.symbol, '']} 
                />
                <Bar dataKey="ca" fill="#6366f1" name="CA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netResult" fill="#10b981" name="Bénéfice" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <i className="fa-solid fa-chart-line text-indigo-600 dark:text-indigo-400"></i> Flux de Trésorerie (CAF)
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="year" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} />
                <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickFormatter={(v) => formatCurrency(v, currency)} />
                <Tooltip 
                  contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '10px', color: isDarkMode ? '#fff' : '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  itemStyle={{fontSize: '12px'}} 
                  formatter={(v: any) => [formatCurrency(v, currency) + ' ' + currency.symbol, '']} 
                />
                <Line type="monotone" dataKey="caf" stroke="#8b5cf6" strokeWidth={3} name="CAF" dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* --- VUE WEB : RÉSUMÉ DES TABLEAUX --- */}
      <div className="no-print space-y-12">
        {/* Plan de Financement Web */}
        <div className="bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <i className="fa-solid fa-vault text-indigo-600 dark:text-indigo-400"></i>
            <h3 className="font-bold text-slate-900 dark:text-white">Plan de Financement Initial</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-bold">Emplois (Besoins)</th>
                  <th className="px-6 py-4 text-right font-bold">Montant ({currency.symbol})</th>
                  <th className="px-6 py-4 text-left font-bold">Ressources (Financements)</th>
                  <th className="px-6 py-4 text-right font-bold">Montant ({currency.symbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Investissements HT</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatVal(totalInvestissement)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Apports Personnels</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatVal((state.financements || []).filter(f => f.type === 'apport').reduce((a,f)=>a+(f?.montant||0),0))}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Trésorerie de départ</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatVal(state.besoins?.['tresorerie-depart']?.montant || 0)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Emprunts Bancaires</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatVal((state.financements || []).filter(f => f.type === 'emprunt').reduce((a,f)=>a+(f?.montant||0),0))}</td>
                </tr>
                <tr className="bg-indigo-50/30 dark:bg-indigo-500/5 font-bold">
                  <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 uppercase text-xs">Total Emplois</td>
                  <td className="px-6 py-4 text-right font-mono text-indigo-600 dark:text-indigo-400">{formatVal(totalInvestissement)}</td>
                  <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 uppercase text-xs">Total Ressources</td>
                  <td className="px-6 py-4 text-right font-mono text-indigo-600 dark:text-indigo-400">{formatVal(totalFinancement)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Compte de Résultats Web */}
        <div className="bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <i className="fa-solid fa-file-invoice-dollar text-indigo-600 dark:text-indigo-400"></i>
            <h3 className="font-bold text-slate-900 dark:text-white">Compte de Résultats Prévisionnel</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-bold sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Poste</th>
                  {years.map(y => <th key={y} className="px-6 py-4 text-right font-bold">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Chiffre d'Affaires HT</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">{formatVal(d.ca)}</td>)}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic pl-10 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Charges d'exploitation</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">{formatVal(d.costOfGoods + d.fixedCosts + d.totalSalairesEtCharges)}</td>)}
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-gray-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Résultat d'Exploitation</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatVal(d.resExploit)}</td>)}
                </tr>
                <tr className="bg-indigo-600 text-white">
                  <td className="px-6 py-4 font-bold uppercase text-xs sticky left-0 bg-indigo-600 z-10">Résultat Net</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono font-bold">{formatVal(d.netResult)}</td>)}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Taux de marge (%)</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono text-indigo-600 dark:text-indigo-400">{formatPercent(d.tauxMarge * 100)}</td>)}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Seuil de rentabilité</td>
                  {financialData.map(d => (
                    <td key={d.year} className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">
                      {d.seuilRentabilite === -1 ? (
                        <span className="text-red-500 text-xs italic">Marge négative</span>
                      ) : (
                        formatVal(d.seuilRentabilite)
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Trésorerie Web */}
        <div className="bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <i className="fa-solid fa-piggy-bank text-indigo-600 dark:text-indigo-400"></i>
            <h3 className="font-bold text-slate-900 dark:text-white">Évolution de la Trésorerie</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-bold sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Indicateur</th>
                  {years.map(y => <th key={y} className="px-6 py-4 text-right font-bold">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">CAF de l'exercice</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">{formatVal(d.caf)}</td>)}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic pl-10 sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Remboursement Emprunts</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">{formatVal(d.remboursementEmprunt)}</td>)}
                </tr>
                <tr className="bg-emerald-500/10 dark:bg-emerald-500/5">
                  <td className="px-6 py-4 font-bold text-emerald-700 dark:text-emerald-400 sticky left-0 bg-emerald-50 dark:bg-emerald-900/20 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Solde de Trésorerie Cumulé</td>
                  {financialData.map(d => <td key={d.year} className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatVal(d.soldeTresorerieFinAnnee)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- STRUCTURE DU PDF (PRINT ONLY) --- */}

      <div className="print-only hidden text-black bg-white w-full">
        
        {/* PAGE 1 : PAGE DE GARDE */}
        <div className="flex flex-col justify-between items-center text-center p-8 min-h-[90vh] bg-white border-0">
           <div className="w-full border-4 border-black p-6 mt-12">
              <p className="text-base font-bold mb-2 uppercase tracking-widest">Informations Accompagnement Conseil</p>
              <h1 className="text-5xl font-black uppercase mb-6 tracking-tighter">Création d'entreprise</h1>
           </div>

           <div className="w-full border-4 border-black p-10 my-6 flex flex-col items-center justify-center flex-grow">
              <h2 className="text-4xl font-black mb-4">Etude financière</h2>
              <h2 className="text-4xl font-black mb-8">prévisionnelle sur 5 ans</h2>
              <div className="flex gap-10 text-lg mt-6">
                 <p className="font-bold">Dévise</p>
                 <p className="font-bold">{currency.name}</p>
              </div>
           </div>

           <div className="w-full border-4 border-black p-6 flex justify-center mt-auto">
              <p className="text-xl font-bold">{new Date().toLocaleDateString(currency.locale)}</p>
           </div>
           <p className="text-right w-full text-xs font-bold mt-2 italic">1</p>
        </div>

        {/* PAGE 2 : INVESTISSEMENTS ET FINANCEMENTS */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Investissements et financements" />
          <ProjectInfoBlock />

          <div className="mb-6 avoid-break">
            <table className="w-full border-collapse border-2 border-black">
               <thead className="bg-slate-200">
                  <tr>
                     <th className="border-2 border-black p-1.5 text-left w-2/3 uppercase text-[10px]">INVESTISSEMENTS</th>
                     <th className="border-2 border-black p-1.5 text-center uppercase text-[10px]">Montant hors taxes</th>
                  </tr>
               </thead>
               <tbody>
                  <tr className="bg-slate-50 font-bold border-t-2 border-black">
                    <td className="border-2 border-black p-1.5 text-[10px]">Immobilisations incorporelles</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px]">-</td>
                  </tr>
                  {LISTE_BESOINS_KEYS.filter(k => k.id.includes('frais') || k.id.includes('logiciels') || k.id.includes('droit') || k.id.includes('caution') || k.id.includes('depot') || k.id.includes('achat-fonds-commerce')).map(k => (
                    <tr key={k.id}>
                      <td className="border-x-2 border-black p-1 text-[9px] pl-6 italic">{k.label}</td>
                      <td className="border-x-2 border-black p-1 text-right text-[9px] font-mono">{state.besoins?.[k.id]?.montant ? formatVal(state.besoins[k.id].montant) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-black">
                    <td className="border-2 border-black p-1.5 text-[10px]">Immobilisations corporelles</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px]">-</td>
                  </tr>
                  {LISTE_BESOINS_KEYS.filter(k => k.id.includes('achat-immo') || k.id.includes('travaux') || k.id.includes('materiel') || k.id.includes('enseigne')).map(k => (
                    <tr key={k.id}>
                      <td className="border-x-2 border-black p-1 text-[9px] pl-6 italic">{k.label}</td>
                      <td className="border-x-2 border-black p-1 text-right text-[9px] font-mono">{state.besoins?.[k.id]?.montant ? formatVal(state.besoins[k.id].montant) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black">
                    <td className="border-2 border-black p-1.5 text-[10px] font-bold">Stock de matières et produits</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{state.besoins?.['stock']?.montant ? formatVal(state.besoins['stock'].montant) : '-'}</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-black p-1.5 text-[10px] font-bold">Trésorerie de départ</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{state.besoins?.['tresorerie-depart']?.montant ? formatVal(state.besoins['tresorerie-depart'].montant) : '-'}</td>
                  </tr>
                  <tr className="bg-slate-200">
                     <td className="border-2 border-black p-1.5 font-black text-[10px] uppercase text-right">TOTAL BESOINS</td>
                     <td className="border-2 border-black p-1.5 text-right text-[10px] font-black font-mono">{formatVal(totalInvestissement)}</td>
                  </tr>
               </tbody>
            </table>
          </div>

          <div className="avoid-break">
            <table className="w-full border-collapse border-2 border-black">
               <thead className="bg-slate-200">
                  <tr>
                     <th className="border-2 border-black p-1.5 text-left w-2/3 uppercase text-[10px]">FINANCEMENT DES INVESTISSEMENTS</th>
                     <th className="border-2 border-black p-1.5 text-center uppercase text-[10px]">Montant hors taxes</th>
                  </tr>
               </thead>
               <tbody>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border-2 border-black p-1.5 text-[10px]">Apport personnel</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{formatVal((state.financements || []).filter(f => f.type === 'apport').reduce((a,f)=>a+(f?.montant||0),0))}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border-2 border-black p-1.5 text-[10px] flex justify-between">
                      <span>Emprunt</span>
                      <span className="font-normal text-[8px] italic">taux / durée mois</span>
                    </td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{formatVal((state.financements || []).filter(f => f.type === 'emprunt').reduce((a,f)=>a+(f?.montant||0),0))}</td>
                  </tr>
                  {(state.financements || []).filter(f => f.type === 'emprunt').map((f, i) => (
                    <tr key={f.id}>
                      <td className="border-x-2 border-black p-1 text-[9px] pl-6 flex justify-between">
                        <span>{f.nom || `Prêt n°${i+1}`}</span>
                        <span>{formatPercent(f.taux)} / {f.duree} mois</span>
                      </td>
                      <td className="border-x-2 border-black p-1 text-right text-[9px] font-mono">{formatVal(f.montant)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-200">
                     <td className="border-2 border-black p-1.5 font-black text-[10px] uppercase text-right">TOTAL RESSOURCES</td>
                     <td className="border-2 border-black p-1.5 text-right text-[10px] font-black font-mono">{formatVal(totalFinancement)}</td>
                  </tr>
               </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">2</p>
        </div>

        {/* PAGE 3 : SALAIRES ET CHARGES SOCIALES + AMORTISSEMENTS */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Salaires et charges sociales" />
          <ProjectInfoBlock />
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] font-bold border-b border-black pb-1 avoid-break">
            <p>Statut juridique : <span className="font-normal">{state.generalInfo?.statutJuridique || 'EI'}</span></p>
            <p>Bénéfice de l'Accre : <span className="font-normal">{state.revenue?.accre ? 'Oui' : 'Non'}</span></p>
            <p className="col-span-2">Statut social du/des dirigeants : <span className="font-normal">Travailleur non salarié</span></p>
          </div>

          <div className="avoid-break mb-8">
            <table className="w-full border-collapse border-2 border-black text-[9px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold">
                  <td className="border-2 border-black p-1.5">Rémunération du (des) dirigeants</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.remunDir)}</td>)}
                </tr>
                <tr>
                  <td className="border-2 border-black p-1.5 pl-4 italic">Charges sociales du (des) dirigeant(s)</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.chargesSocDir)}</td>)}
                </tr>
                <tr className="font-bold border-t-2 border-black">
                  <td className="border-2 border-black p-1.5">Salaires des employés</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.salairesEmp)}</td>)}
                </tr>
                <tr>
                  <td className="border-2 border-black p-1.5 pl-4 italic">Charges sociales employés</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.chargesSocEmp)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="avoid-break">
            <PrintSectionHeader title="Détail des amortissements" />
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5 text-left"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1" colSpan={6}>Amortissements incorporelles</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.defaultAmort > 0 && (k.id.includes('frais') || k.id.includes('logiciels') || k.id.includes('droit') || k.id.includes('achat-fonds-commerce'))).map(k => (
                  <tr key={k.id}>
                    <td className="border-2 border-black p-1 pl-4 italic">{k.label}</td>
                    {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.amortDetails?.[k.id] || 0)}</td>)}
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold border-t-2 border-black"><td className="border-2 border-black p-1" colSpan={6}>Amortissements corporelles</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.defaultAmort > 0 && (k.id.includes('achat-immo') || k.id.includes('travaux') || k.id.includes('materiel') || k.id.includes('enseigne'))).map(k => (
                  <tr key={k.id}>
                    <td className="border-2 border-black p-1 pl-4 italic">{k.label}</td>
                    {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.amortDetails?.[k.id] || 0)}</td>)}
                  </tr>
                ))}
                <tr className="bg-slate-200 font-black uppercase">
                  <td className="border-2 border-black p-1 text-right">Total amortissements</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.dotAmort)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">3</p>
        </div>

        {/* PAGE 4 : COMPTE DE RESULTATS PREVISIONNEL */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Compte de résultats prévisionnel" />
          <ProjectInfoBlock />

          <table className="w-full border-collapse border-2 border-black text-[8px]">
             <thead className="bg-slate-200">
                <tr>
                   <th className="border-2 border-black p-1 text-left w-1/3"></th>
                   {years.map(y => <th key={y} className="border-2 border-black p-1 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-50 font-bold">
                   <td className="border-2 border-black p-1">Produits d'exploitation</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}
                </tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Chiffre d'affaires HT</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}</tr>
                
                <tr className="bg-slate-50 font-bold">
                   <td className="border-2 border-black p-1">Charges d'exploitation</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods + d.fixedCosts + d.totalSalairesEtCharges)}</td>)}
                </tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Achats consommés</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>)}</tr>
                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1">Marge brute</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td>)}</tr>
                
                <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1">Charges externes</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fixedCosts)}</td>)}</tr>
                {LISTE_CHARGES_KEYS.map(c => (
                  <tr key={c.id} className="text-[7px]">
                    <td className="border-2 border-black p-0.5 pl-6 italic">{c.label}</td>
                    {financialData.map(d => <td key={d.year} className="border-2 border-black p-0.5 text-right font-mono">{formatVal(d.chargesDetail?.[c.id] || 0)}</td>)}
                  </tr>
                ))}

                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1">Valeur ajoutée</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.va)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Salaires et charges sociales</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.totalSalairesEtCharges)}</td>)}</tr>
                <tr className="bg-slate-300 font-black"><td className="border-2 border-black p-1 uppercase">Excédent brut d'exploitation</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ebe)}</td>)}</tr>
                
                <tr><td className="border-2 border-black p-1 pl-4 italic">Frais bancaires, charges financières</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesFin)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Dotations aux amortissements</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.dotAmort)}</td>)}</tr>
                
                <tr className="bg-slate-400 text-white font-black"><td className="border-2 border-white p-1 uppercase">Résultat avant impôts</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.resAvantImpots)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Impôts sur les sociétés</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.is)}</td>)}</tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1 uppercase">Résultat net comptable</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.netResult)}</td>)}</tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-4 italic">4</p>
        </div>

        {/* PAGE 6 : SOLDES INTERMEDIAIRES DE GESTION + CAF */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Soldes intermédiaires de gestion" />
          <ProjectInfoBlock />

          <div className="avoid-break mb-8 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-[10px] print:text-[8px] print:border-black print:border-2">
              <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 print:text-black">
                <tr>
                  <th className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-left">Indicateur</th>
                  {years.map(y => <React.Fragment key={y}><th className="border border-slate-300 dark:border-slate-700 print:border-black p-1">Année {y+1}</th><th className="border border-slate-300 dark:border-slate-700 print:border-black p-1">%</th></React.Fragment>)}
                </tr>
              </thead>
              <tbody className="print:text-black">
                <tr><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 font-bold">Chiffre d'affaires</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal(d.ca)}</td><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-center">100%</td></React.Fragment>)}</tr>
                <tr><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 italic pl-4">Achats consommés</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-center">{d.ca > 0 ? ((d.costOfGoods/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-slate-50 dark:bg-slate-800/30 print:bg-slate-50 font-bold"><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1">Marge globale</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal(d.margin)}</td><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-center">{d.ca > 0 ? ((d.margin/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-slate-100 dark:bg-slate-800/50 print:bg-slate-100 font-black"><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 uppercase">Valeur ajoutée</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal(d.va)}</td><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-center">{d.ca > 0 ? ((d.va/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-slate-200 dark:bg-slate-800/70 print:bg-slate-200 font-black"><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 uppercase">E.B.E.</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal(d.ebe)}</td><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-center">{d.ca > 0 ? ((d.ebe/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 print:bg-black print:text-white font-black"><td className="border border-slate-700 dark:border-slate-300 print:border-black p-1 uppercase">Capacité autofinancement</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border border-slate-700 dark:border-slate-300 print:border-black p-1 text-right font-mono">{formatVal(d.caf)}</td><td className="border border-slate-700 dark:border-slate-300 print:border-black p-1 text-center">{d.ca > 0 ? ((d.caf/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
              </tbody>
            </table>
          </div>


          <div className="avoid-break">
            <PrintSectionHeader title="Capacité d'autofinancement" />
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><td className="border-2 border-black p-1.5">Résultat net de l'exercice</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.netResult)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1.5 italic">+ Dotation aux amortissements</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.dotAmort)}</td>)}</tr>
                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1.5 uppercase">Capacité d'autofinancement</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.caf)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1.5 italic">- Remboursement d'emprunts</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.remboursementEmprunt)}</td>)}</tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1.5 uppercase">Autofinancement net</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1.5 text-right font-mono">{formatVal(d.caf - d.remboursementEmprunt)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">5</p>
        </div>

        {/* PAGE 8 : SEUIL DE RENTABILITE + BFR */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Seuil de rentabilité économique" />
          <ProjectInfoBlock />

          <div className="avoid-break mb-8">
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5 text-left w-1/3"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5 text-center">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold border-t-2 border-black"><td className="border-2 border-black p-1">Ventes + Production réelle</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1 italic pl-4">Achats consommés</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>)}</tr>
                <tr className="bg-slate-100 font-bold border-t-2 border-black"><td className="border-2 border-black p-1">Marge sur coûts variables</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td>)}</tr>
                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1">Taux de marge sur coûts variables</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-center font-mono">{(d.tauxMarge * 100).toFixed(0)}%</td>)}</tr>
                <tr><td className="border-2 border-black p-1 italic">Coûts fixes (incl. amort. & fin.)</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fixedCosts + d.totalSalairesEtCharges + d.dotAmort + d.chargesFin)}</td>)}</tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1 uppercase">Seuil de rentabilité (chiffre d'affaires)</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.seuilRentabilite)}</td>)}</tr>
              </tbody>
            </table>
          </div>

          <div className="avoid-break">
            <PrintSectionHeader title="Besoin en fonds de roulement" />
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1 text-left">Analyse clients / fournisseurs :</th>
                  <th className="border-2 border-black p-1">délai jours</th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1 text-center">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Besoins</td></tr>
                <tr>
                  <td className="border-2 border-black p-1 italic pl-4">Volume crédit client HT</td>
                  <td className="border-2 border-black p-1 text-center">{state.revenue?.joursClients || 0} j</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.creditClient)}</td>)}
                </tr>
                <tr>
                  <td className="border-2 border-black p-1 italic pl-4">Volume stock HT</td>
                  <td className="border-2 border-black p-1 text-center">{state.revenue?.joursStock || 0} j</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.stock)}</td>)}
                </tr>
                <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Ressources</td></tr>
                <tr>
                  <td className="border-2 border-black p-1 italic pl-4">Volume dettes fournisseurs HT</td>
                  <td className="border-2 border-black p-1 text-center">{state.revenue?.joursFournisseurs || 0} j</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.detteFournisseur)}</td>)}
                </tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1 uppercase" colSpan={2}>Besoin en fonds de roulement</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.bfr)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">6</p>
        </div>

        {/* PAGE 10 : PLAN DE FINANCEMENT A 5 ANS */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Plan de financement à cinq ans" />
          <ProjectInfoBlock />

          <table className="w-full border-collapse border-2 border-black text-[8px]">
            <thead className="bg-slate-200">
              <tr>
                <th className="border-2 border-black p-1.5 text-left"></th>
                {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={6}>Emplois (Besoins)</td></tr>
              <tr><td className="border-2 border-black p-1">Investissements (Immobilisations)</td><td className="border-2 border-black p-1 text-right font-mono">{formatVal(totalImmobilisations)}</td><td colSpan={4} className="border-2 border-black"></td></tr>
              <tr><td className="border-2 border-black p-1">Variation du BFR</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.bfrVariation)}</td>)}</tr>
              <tr><td className="border-2 border-black p-1">Remboursement d'emprunts</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.remboursementEmprunt)}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1 uppercase">Total des emplois</td>{financialData.map((d, i) => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal((i === 0 ? totalImmobilisations : 0) + d.bfrVariation + d.remboursementEmprunt)}</td>)}</tr>
              
              <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t-4 border-slate-900 dark:border-slate-100 print:bg-slate-50 print:text-black print:border-black"><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 uppercase" colSpan={6}>Ressources</td></tr>
              <tr><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1">Apports personnels</td><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal((state.financements || []).filter(f => f.type === 'apport').reduce((a,f)=>a+(f?.montant||0),0))}</td><td colSpan={4} className="border border-slate-300 dark:border-slate-700 print:border-black"></td></tr>
              <tr><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1">Emprunts bancaires</td><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal((state.financements || []).filter(f => f.type === 'emprunt').reduce((a,f)=>a+(f?.montant||0),0))}</td><td colSpan={4} className="border border-slate-300 dark:border-slate-700 print:border-black"></td></tr>
              <tr><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1">Capacité d'autofinancement (CAF)</td>{financialData.map(d => <td key={d.year} className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal(d.caf)}</td>)}</tr>
              <tr className="bg-slate-100 dark:bg-slate-800/50 font-bold print:bg-slate-100 print:text-black"><td className="border border-slate-300 dark:border-slate-700 print:border-black p-1 uppercase">Total des ressources</td>{financialData.map((d, i) => <td key={d.year} className="border border-slate-300 dark:border-slate-700 print:border-black p-1 text-right font-mono">{formatVal((i === 0 ? totalFinancement : 0) + d.caf)}</td>)}</tr>
              
              <tr className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black border-t-2 border-white print:bg-black print:text-white print:border-black"><td className="border border-slate-700 dark:border-slate-300 print:border-black p-1 uppercase">Solde de trésorerie annuel</td>{financialData.map(d => <td key={d.year} className="border border-slate-700 dark:border-slate-300 print:border-black p-1 text-right font-mono">{formatVal(d.soldeTresorerieFinAnnee)}</td>)}</tr>
            </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-4 italic">7</p>
        </div>

        {/* PAGE 11 : BUDGET DE TRESORERIE (PARTIE 1 - MOIS 1-6) */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Budget prévisionnel de trésorerie" />
          <ProjectInfoBlock />
          <p className="text-[10px] font-bold mb-2 uppercase">Première année</p>

          <table className="w-full border-collapse border-2 border-black text-[7px]">
            <thead className="bg-slate-200">
              <tr>
                <th className="border-2 border-black p-1 text-left"></th>
                {months.slice(0,6).map(m => <th key={m} className="border-2 border-black p-1">Mois {m+1}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Encaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Ventes de marchandises / services</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.encaissements)}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1 uppercase">Total des encaissements</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.encaissements)}</td>)}</tr>
              
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Décaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Achats consommés</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>)}</tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Charges externes</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fixedCharges)}</td>)}</tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Salaires et charges sociales</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.salairesEtCharges)}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1 uppercase">Total des décaissements</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.decaissements)}</td>)}</tr>
              
              <tr className="border-t-2 border-black bg-slate-200 font-black"><td className="border-2 border-black p-1">Solde du mois</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fluxMois)}</td>)}</tr>
              <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1">Solde de trésorerie (cumul)</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.soldeCumule)}</td>)}</tr>
            </tbody>
          </table>
          <div className="mt-4 text-[7px] italic border-t border-black pt-1 avoid-break">
            Ce tableau ne prend pas en compte les flux de TVA ni le besoin en fonds de roulement.
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">8</p>
        </div>

        {/* PAGE 12 : BUDGET DE TRESORERIE (PARTIE 2 - MOIS 7-12 + TOTAL) */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Budget prévisionnel de trésorerie (suite)" />
          <ProjectInfoBlock />

          <table className="w-full border-collapse border-2 border-black text-[7px]">
            <thead className="bg-slate-200">
              <tr>
                <th className="border-2 border-black p-1 text-left"></th>
                {months.slice(6,12).map(m => <th key={m} className="border-2 border-black p-1">Mois {m+1}</th>)}
                <th className="border-2 border-black p-1 bg-black text-white">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={8}>Encaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Ventes de marchandises / services</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.encaissements)}</td>)}<td className="border-2 border-black p-1 text-right font-black font-mono">{formatVal(financialData[0]?.ca || 0) || '-'}</td></tr>
              
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={8}>Décaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Total décaissements mensuels</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.decaissements)}</td>)}<td className="border-2 border-black p-1 text-right font-black font-mono">{formatVal(monthlyDataYear1.reduce((a,d)=>a+d.decaissements,0)) || '-'}</td></tr>
              
              <tr className="border-t-2 border-black bg-slate-200 font-black"><td className="border-2 border-black p-1">Solde du mois</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fluxMois)}</td>)}<td className="border-2 border-black p-1"></td></tr>
              <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1">Solde de trésorerie (cumul)</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.soldeCumule)}</td>)}<td className="border-2 border-white p-1 text-right font-black font-mono">{formatVal(financialData[0]?.soldeTresorerieFinAnnee || 0) || '-'}</td></tr>
            </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-4 italic">9</p>
        </div>
      </div>

      <div className="no-print pt-10 border-t border-slate-200 dark:border-slate-800 flex justify-between">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
          <i className="fa-solid fa-arrow-left text-xs"></i> <span>Ajuster les saisies</span>
        </button>
        <button onClick={onReset} className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
          <i className="fa-solid fa-trash-can text-xs"></i> <span>Effacer les données</span>
        </button>
      </div>
    </div>
  );
};

export default Report;
