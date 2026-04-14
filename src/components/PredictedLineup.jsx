import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

export default function PredictedLineup({ lineup }) {
  if (!lineup) return null;

  // Handle both old and new API structures
  const isNewStructure = !!lineup.lineups;
  
  const homeFormation = isNewStructure ? lineup.lineups?.home?.predicted_formation : lineup.home_formation;
  const awayFormation = isNewStructure ? lineup.lineups?.away?.predicted_formation : lineup.away_formation;
  
  const homeStarters = isNewStructure 
    ? (lineup.lineups?.home?.starters || []) 
    : (lineup.starters?.filter(p => p.is_home) || []);
    
  const awayStarters = isNewStructure 
    ? (lineup.lineups?.away?.starters || []) 
    : (lineup.starters?.filter(p => !p.is_home) || []);

  const unavailable = isNewStructure
    ? [
        ...(lineup.lineups?.home?.unavailable?.map(p => ({ ...p, is_home: true })) || []),
        ...(lineup.lineups?.away?.unavailable?.map(p => ({ ...p, is_home: false })) || [])
      ]
    : (lineup.unavailable || []);

  const confidence = isNewStructure 
    ? Math.round(((lineup.lineups?.home?.confidence || 0) + (lineup.lineups?.away?.confidence || 0)) / 2)
    : lineup.confidence;

  if (homeStarters.length === 0 && awayStarters.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Predicted Lineups</h3>
        </div>
        <p className="text-slate-500">Stats not yet available. Lineups will be displayed closer to kick-off.</p>
      </div>
    );
  }

  const renderTeamLineup = (teamName, formation, teamStarters) => (
    <div className="flex-1">
      <div className="mb-4">
        <h4 className="font-bold text-slate-900">{teamName}</h4>
        <p className="text-sm text-slate-500">Formation: {formation || 'Unknown'}</p>
      </div>
      <div className="space-y-2">
        {teamStarters.map((player, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
              {player.position || '-'}
            </span>
            <span className="text-sm font-medium text-slate-900 truncate">{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Predicted Lineups</h3>
        </div>
        {confidence > 0 && (
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold border border-indigo-100">
            {confidence}% Confidence
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {renderTeamLineup('Home Team', homeFormation, homeStarters)}
        {renderTeamLineup('Away Team', awayFormation, awayStarters)}
      </div>

      {unavailable && unavailable.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Unavailable Players
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unavailable.map((player, idx) => (
              <div key={idx} className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100/50">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">{player.name}</span>
                  <span className="text-xs text-slate-500">{player.is_home ? 'Home' : 'Away'}</span>
                </div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-2 py-1 rounded">
                  {player.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
