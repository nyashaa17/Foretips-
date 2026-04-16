import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';

const FormBadge = ({ result }) => {
  const colors = {
    W: 'bg-green-500 text-white',
    D: 'bg-slate-300 text-slate-700',
    L: 'bg-red-500 text-white',
  };
  return (
    <span className={`w-6 h-6 flex items-center justify-center rounded-sm text-xs font-bold ${colors[result] || 'bg-slate-200 text-slate-600'}`}>
      {result}
    </span>
  );
};

export default function TeamForm({ homeTeam, awayTeam, homeForm, awayForm }) {
  if (!homeForm && !awayForm) return null;

  const renderForm = (teamName, form) => {
    if (!form) return null;
    return (
      <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100">
        <h4 className="font-bold text-slate-900 mb-3">{teamName}</h4>
        
        {form.form_string && (
          <div className="flex gap-1 mb-4">
            {form.form_string.split('').map((result, idx) => (
              <FormBadge key={idx} result={result} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Goals (Scored/Conceded)</span>
            <span className="font-bold text-slate-900">{form.goals_scored_last_n || 0} / {form.goals_conceded_last_n || 0}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Avg xG</span>
            <span className="font-bold text-slate-900">{form.avg_xg != null ? Number(form.avg_xg).toFixed(2) : 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Avg Shots</span>
            <span className="font-bold text-slate-900">{form.avg_shots != null ? Number(form.avg_shots).toFixed(1) : 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Pass Accuracy</span>
            <span className="font-bold text-slate-900">{form.avg_pass_accuracy != null ? `${Number(form.avg_pass_accuracy).toFixed(1)}%` : 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500 p-2 rounded-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Recent Form (Last 5 Matches)</h3>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {renderForm(homeTeam, homeForm)}
        {renderForm(awayTeam, awayForm)}
      </div>
    </div>
  );
}
