
import React from 'react';

interface Props {
  onStart: () => void;
}

const Welcome: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-12 animate-in fade-in duration-700">
      <div className="flex-1 space-y-8 text-center lg:text-left">
        <h2 className="text-indigo-500 font-bold uppercase tracking-[0.2em] text-sm">Gestion de Projet</h2>
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight text-white">
          Maîtrisez vos dépenses dès le départ
        </h1>
        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
          Anticipez tous les coûts nécessaires pour démarrer votre projet en toute sérénité. Une planification rigoureuse est la clé du succès.
        </p>
        
        <div className="bg-[#242b3d] border-l-4 border-indigo-500 p-4 rounded-r-xl max-w-md">
           <div className="flex items-center gap-3 text-slate-300 text-sm">
              <span className="text-indigo-400">ℹ️</span>
              <p>Devise utilisée : <span className="text-white font-bold">Franc CFA (FCFA)</span></p>
           </div>
        </div>

        <button
          onClick={onStart}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 flex items-center gap-2 mx-auto lg:mx-0"
        >
          <span>↓</span> Découvrir les dépenses
        </button>
      </div>

      <div className="flex-1 flex justify-center lg:justify-end">
        <div className="relative">
          <div className="w-64 h-48 bg-indigo-600/30 rounded-3xl flex items-center justify-center border-2 border-indigo-500/20 shadow-2xl backdrop-blur-sm">
             <span className="text-8xl text-indigo-500 opacity-80">$ =</span>
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg rotate-12">
             
          </div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-indigo-400 rounded-xl flex items-center justify-center text-white shadow-lg -rotate-12">
             
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
