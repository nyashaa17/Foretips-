import { Link } from 'react-router-dom';
import { Trophy, MessageCircle, ShieldAlert, Mail, Globe, Twitter, Instagram, Activity } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-12 pb-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 lg:gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-6 xl:col-span-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-green-500 p-1.5 rounded-xl group-hover:bg-green-600 transition-colors">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-slate-900 font-bold text-2xl tracking-tight">
                Fore<span className="text-green-500">tips</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Leading the way in data-driven football analysis. Our machine learning models process thousands of data points to bring you the most accurate match predictions and insights.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://x.com/Foretips_Zw" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm hover:shadow-md">
                <Twitter className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="https://wa.me/263718161365" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-sm hover:shadow-md">
                <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Predictions & Leagues */}
          <div>
            <h3 className="text-slate-900 font-bold text-lg mb-6">Predictions</h3>
            <ul className="space-y-3 text-sm mb-6">
              <li>
                <Link to="/predictions/today" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Football Predictions For Today
                </Link>
              </li>
              <li>
                <Link to="/predictions/tomorrow" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Football Predictions For Tomorrow
                </Link>
              </li>
            </ul>
            <h3 className="text-slate-900 font-bold text-lg mb-6">Football Predictions League</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/premier-league-predictions" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Premier League
                </Link>
              </li>
              <li>
                <Link to="/la-liga-predictions" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  La Liga
                </Link>
              </li>
              <li>
                <Link to="/serie-a-predictions" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Serie A
                </Link>
              </li>
              <li>
                <Link to="/bundesliga-predictions" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Bundesliga
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-slate-900 font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3 text-sm mb-6">
              <li>
                <Link to="/" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Live Scores
                </Link>
              </li>
              <li>
                <Link to="/leagues" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  All Leagues
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Blog & Insights
                </Link>
              </li>
            </ul>

            {/* Support */}
            <h3 className="text-slate-900 font-bold text-lg mb-6">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:Foretips@proton.me" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="https://foretips.betteruptime.com/" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Disclaimer Section */}
          <div>
            <h3 className="text-slate-900 font-bold text-lg mb-6">Legal</h3>
            <ul className="space-y-3 text-sm mb-6">
              <li>
                <Link to="/privacy-policy" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Terms of Service
                </Link>
              </li>
            </ul>

            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-4">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              <h3>Disclaimer</h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Foretips provides football predictions and data for informational purposes only. We do not offer gambling services or facilitate betting.
            </p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Predictions are based on statistical analysis and do not guarantee results. Please gamble responsibly. 18+ only.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} Foretips. All rights reserved. Developed by TrueFlow.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              English (UK)
            </span>
            <span>BeGambleAware.org</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
