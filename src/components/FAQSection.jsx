import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';

export const faqs = [
  {
    question: "What is Foretips?",
    answer: "Foretips is an advanced football prediction platform that uses Artificial Intelligence to analyze matches and provide highly accurate betting tips. We cover major leagues worldwide to help you make informed decisions."
  },
  {
    question: "What is the Foretips AI Engine?",
    answer: "Our AI prediction engine uses Ensemble Machine Learning (combining XGBoost, LightGBM, and CatBoost models) to analyze over 163 different data points, including spatial data and team Elo ratings, to generate our predictions."
  },
  {
    question: "How accurate are the predictions?",
    answer: "Our AI system is highly accurate. Currently, our success rates are: Over 1.5 Goals at 86%, Over 2.5 Goals at 80%, and Both Teams to Score (BTTS) at 82%. While no prediction is 100% guaranteed, our AI gives you a massive statistical advantage."
  },
  {
    question: "Are the predictions guaranteed?",
    answer: "No prediction in football is 100% guaranteed. Upsets happen in sports. However, our AI analyzes thousands of past matches and current data to give you the most statistically probable outcomes, significantly increasing your chances of winning."
  },
  {
    question: "Is Foretips free to use?",
    answer: "Yes! We provide free daily predictions on our website and WhatsApp channel. We believe in giving everyone access to high-quality, data-driven football analysis."
  },
  {
    question: "What leagues do you cover?",
    answer: "We cover all major football leagues including the English Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, and many other top-tier competitions globally."
  },
  {
    question: "How should I use these predictions?",
    answer: "We recommend using our predictions as a strong guide for your betting strategy. Look for our high-confidence picks (75% and above) and consider combining them in accumulators or playing them as singles depending on the odds."
  },
  {
    question: "How do I join the WhatsApp channel?",
    answer: "Joining is easy and free! Just click the WhatsApp button on our website or use this link: https://whatsapp.com/channel/0029Vb7MXnXKLaHohHn7do3q. You'll get instant daily tips straight to your phone, saving your data."
  },
  {
    question: "What does 'xG' mean?",
    answer: "xG stands for 'Expected Goals'. It is a statistical measure of the quality of goalscoring chances created in a match. A higher xG means a team created better chances to score. Our AI uses this to predict future performance."
  },
  {
    question: "When are new predictions posted?",
    answer: "We typically post our predictions 24-48 hours before the matches kick off. This gives our AI enough time to analyze the latest team news, injuries, and line-ups."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="mb-12">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-green-500" />
        Frequently Asked Questions
      </h3>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
              openIndex === index ? 'border-green-500 bg-green-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-bold text-slate-900 text-sm sm:text-base pr-4">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>
            
            <div 
              className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-slate-600 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
