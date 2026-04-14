import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Brain, Zap } from 'lucide-react';
import SEO from '../components/SEO';
import FAQSection, { faqs } from '../components/FAQSection';

export default function FAQ() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.slice(0, 5).map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <SEO 
        title="Foretips FAQ | AI Football Predictions Explained" 
        description="Learn how Foretips uses advanced AI and machine learning to provide accurate football predictions. Get answers to all your questions about our betting tips."
      />
      
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* SECTION 1: Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Foretips FAQ</h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
          Everything you need to know about our AI-driven football predictions, how our system works, and how to get the most out of our daily tips.
        </p>
      </div>

      {/* SECTION 2: Foretips Highlight Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 mb-12 shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Brain className="w-32 h-32 text-green-600" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-green-100">
            <Zap className="w-3 h-3" />
            Powered by AI
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Foretips AI Engine</h2>
          <p className="text-slate-600 text-sm mb-6 max-w-xl">
            Our most advanced prediction model yet. We use Ensemble Machine Learning (XGBoost, LightGBM, CatBoost) analyzing 163 distinct features including spatial data and Elo ratings to beat the bookies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-green-600 text-sm font-bold uppercase tracking-wider mb-1">Over 1.5 Goals</div>
              <div className="text-3xl font-black text-slate-900">86%</div>
              <div className="text-xs text-slate-500 mt-1">Accuracy Rate</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-green-600 text-sm font-bold uppercase tracking-wider mb-1">Over 2.5 Goals</div>
              <div className="text-3xl font-black text-slate-900">80%</div>
              <div className="text-xs text-slate-500 mt-1">Accuracy Rate</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-green-600 text-sm font-bold uppercase tracking-wider mb-1">BTTS</div>
              <div className="text-3xl font-black text-slate-900">82%</div>
              <div className="text-xs text-slate-500 mt-1">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: FAQ List */}
      <FAQSection />

      {/* SECTION 4: WhatsApp CTA */}
      <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#25D366]/30">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Join Our WhatsApp Community</h3>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Get instant daily predictions sent directly to your phone. Save your data and never miss a winning tip!
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">🚀 Instant Updates</span>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">📱 Low Data Usage</span>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">🎯 Daily Free Tips</span>
          </div>

          <a 
            href="https://whatsapp.com/channel/0029Vb7MXnXKLaHohHn7do3q" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Join WhatsApp Channel
          </a>
        </div>
      </div>
    </div>
  );
}
