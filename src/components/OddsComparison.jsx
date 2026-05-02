import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function OddsComparison({ odds }) {
  if (!odds) return null;

  // Handle v2 format
  if (odds.home_win || odds.odds) {
    const v2Odds = odds.odds || odds;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Consensus Odds</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">1 (Home)</div>
            <div className="font-bold text-lg text-slate-900">{v2Odds.home_win?.toFixed(2) || '-'}</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">X (Draw)</div>
            <div className="font-bold text-lg text-slate-900">{v2Odds.draw?.toFixed(2) || '-'}</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-xl">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">2 (Away)</div>
            <div className="font-bold text-lg text-slate-900">{v2Odds.away_win?.toFixed(2) || '-'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-600">Over 1.5</span>
            <span className="font-bold text-sm">{v2Odds.over_15_goals?.toFixed(2) || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-600">Over 2.5</span>
            <span className="font-bold text-sm">{v2Odds.over_25_goals?.toFixed(2) || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-600">Under 1.5</span>
            <span className="font-bold text-sm">{v2Odds.under_15_goals?.toFixed(2) || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-600">Under 2.5</span>
            <span className="font-bold text-sm">{v2Odds.under_25_goals?.toFixed(2) || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-600">BTTS (Yes)</span>
            <span className="font-bold text-sm">{v2Odds.btts_yes?.toFixed(2) || '-'}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-600">BTTS (No)</span>
            <span className="font-bold text-sm">{v2Odds.btts_no?.toFixed(2) || '-'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(odds) || odds.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Odds Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Bookmaker</th>
              <th className="px-4 py-3 text-center">1 (Home)</th>
              <th className="px-4 py-3 text-center">X (Draw)</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">2 (Away)</th>
            </tr>
          </thead>
          <tbody>
            {odds.map((odd, idx) => (
              <tr key={idx} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{odd.bookmaker}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className={odd.is_best_home ? 'font-bold text-green-600' : ''}>
                      {odd.home_odds ? Number(odd.home_odds).toFixed(2) : '-'}
                    </span>
                    {odd.home_movement === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
                    {odd.home_movement === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
                    {odd.home_movement === 'stable' && <Minus className="w-3 h-3 text-slate-300" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className={odd.is_best_draw ? 'font-bold text-green-600' : ''}>
                      {odd.draw_odds ? Number(odd.draw_odds).toFixed(2) : '-'}
                    </span>
                    {odd.draw_movement === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
                    {odd.draw_movement === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
                    {odd.draw_movement === 'stable' && <Minus className="w-3 h-3 text-slate-300" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className={odd.is_best_away ? 'font-bold text-green-600' : ''}>
                      {odd.away_odds ? Number(odd.away_odds).toFixed(2) : '-'}
                    </span>
                    {odd.away_movement === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
                    {odd.away_movement === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
                    {odd.away_movement === 'stable' && <Minus className="w-3 h-3 text-slate-300" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
