import { Link } from 'react-router-dom';
import { Trophy, MessageCircle, ShieldAlert, Mail, Globe, Twitter, Instagram, Activity } from 'lucide-react';
import { AdPlacement } from './AdPlacement';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-green-500 p-1.5 rounded-xl group-hover:bg-green-600 transition-colors">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-slate-900 font-bold text-2xl tracking-tight">Foretips</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              Leading the way in data-driven football analysis. Our machine learning models process thousands of data points to bring you the most accurate match predictions and insights.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://whatsapp.com/channel/0029Vb7MXnXKLaHohHn7do3q" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-slate-900 font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/predictions" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Match Predictions
                </Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Live Scores
                </Link>
              </li>
              <li>
                <Link to="/leagues" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Top Leagues
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  Blog & Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-slate-900 font-bold text-lg mb-6">Support</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/about" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  About Foretips
                </Link>
              </li>
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
              <li>
                <a href="mailto:support@foretips.com" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              </li>
              <li>
                <a href="https://foretips.betteruptime.com/" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Disclaimer Section */}
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-6">
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

        {/* Ad Placement */}
        <div className="mb-16">
          <AdPlacement position="footer" />
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
