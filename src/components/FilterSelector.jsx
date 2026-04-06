import { CheckCircle2, Circle } from 'lucide-react';

export default function FilterSelector({ options, selected, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-slate-900 font-bold text-center">-- Select Filter --</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {options.map(option => {
            const isSelected = selected === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className="w-full text-left p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-900 text-sm font-medium">
                  {option.label}
                </span>
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
