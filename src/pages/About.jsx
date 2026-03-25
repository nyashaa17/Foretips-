import { motion } from 'motion/react';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';

export default function About() {
  return (
    <div className="min-h-screen bg-white py-24">
      <SEO 
        title="About Us" 
        description="Learn about Foretips, your go-to platform for smart, data-driven football predictions."
      />

      <Breadcrumbs />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-slate-700 text-lg leading-relaxed"
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-12 tracking-tight">
            About Foretips
          </h1>
          
          <p>
            Foretips is your go-to platform for smart, data-driven football predictions built for serious bettors worldwide. We combine advanced AI analysis with well-researched insights to deliver accurate and reliable match predictions every day.
          </p>
          
          <p>
            Our platform covers a wide range of betting markets including daily predictions, correct score tips, and over/under analysis — all carefully selected to help you make more informed decisions.
          </p>
          
          <p>
            What makes Foretips different is the blend of technology and community. Alongside our AI-powered predictions, users can share their own tips, compete on the leaderboard, and prove their expertise.
          </p>
          
          <p>
            Whether you're looking for consistent daily picks or want to test your prediction skills against others, Foretips gives you the tools to stay ahead of the game.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-900 font-medium">
            <p className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <span>Please note: All predictions are for informational purposes only. Always bet responsibly.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
