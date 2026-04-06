import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Crosshair, Users, GitCommit } from 'lucide-react';

export default function MatchSpatialData({ event }) {
  if (!event) return null;

  const { momentum, shotmap, average_positions, incidents } = event;

  let normalizedAvgPos = [];
  if (Array.isArray(average_positions)) {
    normalizedAvgPos = average_positions;
  } else if (average_positions && typeof average_positions === 'object') {
    if (average_positions.home) {
      normalizedAvgPos = [...normalizedAvgPos, ...average_positions.home.map(p => ({...p, is_home: true}))];
    }
    if (average_positions.away) {
      normalizedAvgPos = [...normalizedAvgPos, ...average_positions.away.map(p => ({...p, is_home: false}))];
    }
  }

  const hasMomentum = Array.isArray(momentum) && momentum.length > 0;
  const hasShotmap = Array.isArray(shotmap) && shotmap.length > 0;
  const hasAvgPos = normalizedAvgPos.length > 0;
  
  const goalSequences = Array.isArray(incidents) ? incidents.filter(i => i.type === 'goal' && Array.isArray(i.sequence) && i.sequence.length > 0) : [];
  const hasGoalSequences = goalSequences.length > 0;

  if (!hasMomentum && !hasShotmap && !hasAvgPos && !hasGoalSequences) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center mb-8">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Stats Not Available</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Detailed spatial data, momentum, and match statistics are currently unavailable for this match.
        </p>
      </div>
    );
  }

  // Format momentum data for Recharts
  // Assuming momentum is an array of objects { minute, value }
  const momentumData = hasMomentum ? momentum.map(m => ({
    minute: m.minute,
    value: m.value,
    // Split into positive and negative for different colors
    home: m.value > 0 ? m.value : 0,
    away: m.value < 0 ? m.value : 0
  })) : [];

  return (
    <div className="space-y-8 mb-8">
      {hasMomentum && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Match Momentum</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={momentumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="minute" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis domain={[-100, 100]} tick={false} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(label) => `Minute ${label}`}
                  formatter={(value) => [Math.abs(value), value > 0 ? 'Home Advantage' : 'Away Advantage']}
                />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                <Area type="monotone" dataKey="home" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <Area type="monotone" dataKey="away" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-sm text-slate-500 mt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{event.home_team_obj?.name || event.home_team || 'Home'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{event.away_team_obj?.name || event.away_team || 'Away'}</span>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
          </div>
        </div>
      )}

      {hasShotmap && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Crosshair className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Shot Map</h3>
          </div>
          <div className="relative w-full aspect-[105/68] bg-green-600 rounded-lg overflow-hidden border-2 border-white shadow-inner">
            {/* Pitch lines */}
            <div className="absolute inset-0 border-2 border-white/50 m-4"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 -mt-12 -ml-12 border-2 border-white/50 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 bg-white/50 rounded-full"></div>
            
            {/* Penalty areas */}
            <div className="absolute top-1/2 left-4 w-32 h-64 -mt-32 border-2 border-white/50"></div>
            <div className="absolute top-1/2 right-4 w-32 h-64 -mt-32 border-2 border-white/50"></div>
            
            {/* Goal areas */}
            <div className="absolute top-1/2 left-4 w-12 h-24 -mt-12 border-2 border-white/50"></div>
            <div className="absolute top-1/2 right-4 w-12 h-24 -mt-12 border-2 border-white/50"></div>

            {/* Shots */}
            {shotmap.map((shot, idx) => {
              const rawX = shot.pos?.x ?? shot.x ?? 0;
              const rawY = shot.pos?.y ?? shot.y ?? 0;
              const xPct = (rawX / 105) * 100;
              const yPct = (rawY / 68) * 100;
              const isHome = shot.home ?? shot.is_home;
              const isGoal = shot.type === 'goal' || shot.situation === 'goal' || shot.is_goal;
              const isSave = shot.type === 'save';
              const isBlock = shot.type === 'block';
              const size = Math.max(4, (shot.xg || 0.1) * 20); // Scale by xG

              let bgColor = 'bg-slate-400'; // miss
              if (isGoal) bgColor = 'bg-green-400 z-10';
              else if (isSave) bgColor = 'bg-orange-400';
              else if (isBlock) bgColor = 'bg-red-500';

              return (
                <div
                  key={idx}
                  className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 ${bgColor}`}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    opacity: isGoal ? 1 : 0.8,
                    border: '1px solid white'
                  }}
                  title={`${shot.player?.name || `Player ${shot.pid || ''}`} - xG: ${shot.xg || 'N/A'} (${shot.type || 'miss'})`}
                />
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-2 left-2 text-[10px] text-white/90 flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-400 border border-white rounded-full"></div> Goal</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-orange-400 border border-white rounded-full"></div> Save</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 border border-white rounded-full"></div> Block</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-400 border border-white rounded-full"></div> Miss</div>
            </div>
          </div>
        </div>
      )}

      {hasAvgPos && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Average Positions</h3>
          </div>
          <div className="relative w-full aspect-[105/68] bg-green-600 rounded-lg overflow-hidden border-2 border-white shadow-inner">
            {/* Pitch lines */}
            <div className="absolute inset-0 border-2 border-white/50 m-4"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 -mt-12 -ml-12 border-2 border-white/50 rounded-full"></div>
            
            {/* Penalty areas */}
            <div className="absolute top-1/2 left-4 w-32 h-64 -mt-32 border-2 border-white/50"></div>
            <div className="absolute top-1/2 right-4 w-32 h-64 -mt-32 border-2 border-white/50"></div>

            {/* Positions */}
            {normalizedAvgPos.map((pos, idx) => {
              const rawX = pos.pos?.x ?? pos.x ?? 0;
              const rawY = pos.pos?.y ?? pos.y ?? 0;
              const xPct = (rawX / 105) * 100;
              const yPct = (rawY / 68) * 100;
              const isHome = pos.home ?? pos.is_home;
              const playerName = pos.player || pos.player_name;
              const jerseyNumber = pos.number || pos.jersey_number;
              
              return (
                <div
                  key={idx}
                  className={`absolute flex items-center justify-center text-xs font-bold text-white rounded-full transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 shadow-md ${
                    isHome ? 'bg-blue-600 border-2 border-blue-300' : 'bg-red-600 border-2 border-red-300'
                  }`}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                  }}
                  title={playerName || `Player ${jerseyNumber || pos.pid || ''}`}
                >
                  {jerseyNumber || ''}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {hasGoalSequences && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <GitCommit className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Goal Build-up Sequences</h3>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {goalSequences.map((goal, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm">{goal.minute}'</span>
                    {goal.player} 
                    <span className="text-slate-500 font-normal text-sm">({goal.is_home ? 'Home' : 'Away'})</span>
                  </h4>
                  {goal.assist && <span className="text-sm text-slate-500">Assist: {goal.assist}</span>}
                </div>
                <div className="relative w-full aspect-[105/68] bg-green-600 rounded-lg overflow-hidden border-2 border-white shadow-inner">
                  {/* Pitch lines */}
                  <div className="absolute inset-0 border-2 border-white/50 m-4"></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50"></div>
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 -mt-12 -ml-12 border-2 border-white/50 rounded-full"></div>
                  
                  {/* Penalty areas */}
                  <div className="absolute top-1/2 left-4 w-32 h-64 -mt-32 border-2 border-white/50"></div>
                  <div className="absolute top-1/2 right-4 w-32 h-64 -mt-32 border-2 border-white/50"></div>

                  {/* Goal areas */}
                  <div className="absolute top-1/2 left-4 w-12 h-24 -mt-12 border-2 border-white/50"></div>
                  <div className="absolute top-1/2 right-4 w-12 h-24 -mt-12 border-2 border-white/50"></div>

                  {/* Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {goal.sequence.map((seq, idx) => {
                      if (!seq.end) return null;
                      const startX = (seq.pos.x / 105) * 100;
                      const startY = (seq.pos.y / 68) * 100;
                      const endX = (seq.end.x / 105) * 100;
                      const endY = (seq.end.y / 68) * 100;
                      const isAssist = seq.assist;
                      return (
                        <line 
                          key={idx}
                          x1={`${startX}%`} 
                          y1={`${startY}%`} 
                          x2={`${endX}%`} 
                          y2={`${endY}%`} 
                          stroke={isAssist ? "#fbbf24" : "white"} 
                          strokeWidth="2" 
                          strokeDasharray="4 4"
                        />
                      );
                    })}
                  </svg>

                  {/* Nodes */}
                  {goal.sequence.map((seq, idx) => {
                    const startX = (seq.pos.x / 105) * 100;
                    const startY = (seq.pos.y / 68) * 100;
                    const isGoal = seq.event === 'goal';
                    const isAssist = seq.assist;

                    return (
                      <React.Fragment key={idx}>
                        {/* Player Node */}
                        <div
                          className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10 ${
                            isGoal ? 'bg-green-400 w-4 h-4 border-2 border-white shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 
                            isAssist ? 'bg-yellow-400 w-3 h-3 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-white w-2 h-2'
                          }`}
                          style={{
                            left: `${startX}%`,
                            top: `${startY}%`,
                          }}
                          title={`${seq.player} - ${seq.event}`}
                        />
                        
                        {/* Player Name Label */}
                        <div 
                          className={`absolute text-[10px] font-bold whitespace-nowrap transform -translate-x-1/2 -translate-y-full pb-2 z-20 drop-shadow-md ${
                            isGoal ? 'text-green-300' : isAssist ? 'text-yellow-400' : 'text-white'
                          }`}
                          style={{
                            left: `${startX}%`,
                            top: `${startY}%`,
                          }}
                        >
                          {seq.player}
                        </div>

                        {/* Goalkeeper */}
                        {seq.gk && (
                          <div
                            className="absolute bg-red-500 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10 border border-white"
                            style={{
                              left: `${(seq.gk.x / 105) * 100}%`,
                              top: `${(seq.gk.y / 68) * 100}%`,
                            }}
                            title="Goalkeeper"
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  <div className="absolute bottom-2 left-2 text-[10px] text-white/90 flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-white rounded-full"></div> Pass</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div> Assist</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-400 border border-white rounded-full"></div> Goal</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 border border-white rounded-full"></div> GK</div>
                  </div>
                  
                  {/* Goal Text Label */}
                  {(() => {
                    const goalEvent = goal.sequence.find(s => s.event === 'goal');
                    if (!goalEvent) return null;
                    return (
                      <div className="absolute bottom-2 right-2 text-[10px] text-white/70 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                        {goal.minute}' {goal.player} (xG {goalEvent.xg || '?'}, {goalEvent.body || 'unknown'})
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
