import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import clsx from 'clsx';

export default function DateSelector({ dateOptions, selectedDate, onSelectDate }) {
  return (
    <div className="flex justify-center mb-10">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-4">
        {dateOptions.map((opt) => (
          <button
            key={opt.formatted}
            onClick={() => onSelectDate(opt.formatted)}
            className={clsx(
              "flex flex-col items-center justify-center min-w-[70px] h-16 rounded-2xl transition-all border",
              selectedDate === opt.formatted
                ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20 scale-105"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              {opt.isToday ? 'Today' : opt.dayName}
            </span>
            <span className="text-lg font-black">
              {format(opt.date, 'd')}
            </span>
          </button>
        ))}
        <div className="w-px h-10 bg-slate-200 mx-2"></div>
        <div className="relative group">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-14 h-14"
          />
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-green-500 group-hover:border-green-200 transition-colors">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
