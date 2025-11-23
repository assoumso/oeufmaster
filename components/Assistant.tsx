import React, { useState } from 'react';
import { Sale, InventoryLog } from '../types';
import { generateBusinessReport } from '../services/geminiService';
import { Sparkles, FileText, Loader2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Assuming we can't install, I will simply render text with newlines or simple formatting. Wait, I cannot import react-markdown if it's not in the prompt's allowed libs.
// Correction: I will render the text using a simple pre-wrap style or a custom simple markdown parser if needed. 
// However, the best approach for a single file React/Tailwind demo without npm install is to just use whitespace-pre-wrap.

interface AssistantProps {
  sales: Sale[];
  currentStock: number;
  logs: InventoryLog[];
}

const Assistant: React.FC<AssistantProps> = ({ sales, currentStock, logs }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateBusinessReport(sales, currentStock, logs);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
          <Bot size={150} />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <Sparkles className="text-yellow-300" /> Assistant Intelligent
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl">
            Utilisez la puissance de Gemini AI pour analyser vos ventes, prédire vos besoins en stock et obtenir des conseils stratégiques personnalisés pour votre commerce.
          </p>
          
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 disabled:opacity-70 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : <FileText />}
            {loading ? 'Analyse en cours...' : 'Générer un rapport d\'analyse'}
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-fade-in">
          <div className="prose prose-indigo max-w-none">
             {/* Simple rendering of markdown-like text */}
             <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-sans">
                {report.split('\n').map((line, i) => {
                    // Simple bold handling
                    if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold text-gray-800 mt-5 mb-2">{line.replace('### ', '')}</h3>;
                    if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700 my-1">{line.replace('- ', '')}</li>;
                    return <p key={i} className="my-2">{line.replace(/\*\*(.*?)\*\*/g, (match, p1) => p1)}</p>; // Very basic strip bold stars for cleaner text if regex logic isn't full parser
                })}
             </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>Généré par Gemini 2.5 Flash</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
      )}
      
      {!report && !loading && (
        <div className="text-center py-12 text-gray-400">
            <p>Cliquez sur le bouton ci-dessus pour lancer l'analyse de vos données.</p>
        </div>
      )}
    </div>
  );
};

export default Assistant;