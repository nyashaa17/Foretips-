import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function BettingSitesManager() {
  const [sites, setSites] = useState([]);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [bankerTipsLink, setBankerTipsLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'betting_banner_config')
      .single();
    
    if (data) {
      const config = data.value;
      setSites(config.sites || []);
      setWhatsappLink(config.whatsappLink || '');
      setBankerTipsLink(config.bankerTipsLink || '');
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const config = { sites, whatsappLink, bankerTipsLink };
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'betting_banner_config', value: config }, { onConflict: 'key' });
    
    if (error) alert('Error saving settings: ' + error.message);
    else alert('Settings saved successfully!');
    setSaving(false);
  };

  const addSite = () => setSites([...sites, { name: '', url: '' }]);
  const updateSite = (index, field, value) => {
    const newSites = [...sites];
    newSites[index][field] = value;
    setSites(newSites);
  };
  const removeSite = (index) => setSites(sites.filter((_, i) => i !== index));

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Manage Betting Banner</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp Channel Link</label>
          <input 
            type="text" 
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Banker Tips Link</label>
          <input 
            type="text" 
            value={bankerTipsLink}
            onChange={(e) => setBankerTipsLink(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">Betting Sites</label>
        {sites.map((site, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input 
              type="text" 
              placeholder="Name"
              value={site.name}
              onChange={(e) => updateSite(index, 'name', e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg"
            />
            <input 
              type="text" 
              placeholder="URL"
              value={site.url}
              onChange={(e) => updateSite(index, 'url', e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg"
            />
            <button onClick={() => removeSite(index)} className="text-red-500"><Trash2 className="w-5 h-5" /></button>
          </div>
        ))}
        <button onClick={addSite} className="flex items-center gap-2 text-green-600 font-bold text-sm mt-2">
          <Plus className="w-4 h-4" /> Add Site
        </button>
      </div>

      <button 
        onClick={saveSettings} 
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
      >
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
