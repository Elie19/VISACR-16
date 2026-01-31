
import React from 'react';

interface Props {
  onStart: () => void;
}

const Welcome: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="text-center py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6 shadow-sm">
        <span className="text-6xl">🚀</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
        Lancez votre entreprise avec un <span className="text-blue-600">plan financier béton</span>
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Anticipez vos dépenses, simulez vos revenus sur 5 ans et générez un rapport complet prêt à être présenté à vos partenaires ou banques en quelques minutes.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
        {[
          { icon: '📝', title: 'Structuré', desc: 'Suivez les étapes clés de la création' },
          { icon: '💰', title: 'Précis', desc: 'Calculs automatiques en Franc CFA' },
          { icon: '🧠', title: 'Intelligent', desc: 'Analyse assistée par IA Gemini' }
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold mb-1">{item.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-105"
      >
        Commencer ma simulation
      </button>
      
      <p className="mt-8 text-xs text-slate-400 uppercase tracking-widest">Calculs basés sur le référentiel OHADA</p>
    </div>
  );
};

export default Welcome;
