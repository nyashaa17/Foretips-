import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function OddsComparison({ odds }) {
  if (!odds || !Array.isArray(odds) || odds.length === 0) return null;

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
