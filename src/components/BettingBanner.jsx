import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MessageCircle, Trophy } from 'lucide-react';

export default function BettingBanner() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'betting_banner_config')
      .single();
    
    if (data) setConfig(data.value);
  };

  if (!config) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-black text-slate-900 text-center">Free Expert Tips</h3>
      
      <div className="grid grid-cols-1 gap-2">
        {config.sites.map((site, index) => (
          <a 
            key={index}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
          >
            <span>Bet tips on {site.name}</span>
          </a>
        ))}
      </div>
      
      <a 
        href={config.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        Join our WhatsApp Channel
      </a>
      
      <a 
        href={config.bankerTipsLink}
        className="block text-center px-4 py-3 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Banker Tips of the Day
      </a>
    </div>
  );
}
