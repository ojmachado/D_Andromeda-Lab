import React from 'react';
import { useParams } from 'react-router-dom';

export default function Dashboard() {
  const { workspaceId } = useParams();

  // Placeholder para Dashboard (MVP focado no Setup)
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Spend', 'ROAS', 'CPC', 'CTR'].map(kpi => (
                <div key={kpi} className="bg-surface p-6 rounded-xl border border-border">
                    <p className="text-gray-500 text-sm">{kpi}</p>
                    <p className="text-2xl font-bold text-white mt-2">--</p>
                    <div className="h-1 w-20 bg-gray-800 mt-4 rounded overflow-hidden">
                        <div className="h-full bg-primary w-2/3 animate-pulse"></div>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="bg-surface p-8 rounded-xl border border-border text-center py-20">
            <h3 className="text-xl font-bold mb-2">Sincronização em andamento...</h3>
            <p className="text-gray-400">Os dados aparecerão aqui em breve.</p>
        </div>
    </div>
  );
}