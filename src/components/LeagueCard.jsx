import { Link } from 'react-router-dom';
import { getLeagueLogoUrl } from '../services/api';
import SmartLogo from './SmartLogo';

export default function LeagueCard({ league }) {
  const { id, api_id, name, country } = league;
  const logos = [getLeagueLogoUrl(api_id)];

  // Generate SEO-friendly URL slug
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <Link 
      to={`/${slug}-predictions`}
      className="block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all group"
    >
      <div className="p-6 flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center p-4 border border-slate-200 group-hover:border-green-500/50 transition-colors">
          <SmartLogo 
            urls={logos} 
            alt={name} 
            className="w-full h-full object-contain"
            fallbackText={name || 'L'}
          />
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-green-600 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{country}</p>
        </div>
      </div>
    </Link>
  );
}
