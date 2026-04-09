import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, User, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { hapticFeedback } from '../utils/haptics';
import { supabase } from '../supabaseClient';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(post => post.category))].filter(Boolean);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Football Betting Blog & Analysis" 
        description="Expert football betting tips, match analysis, and data-driven insights from the Foretips team."
      />
      
      <Breadcrumbs />

      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
        >
          Foretips <span className="text-green-500">Insights</span>
        </motion.h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
          Expert analysis, betting strategies, and deep dives into the world of football data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-4" />
              <p className="text-slate-500 font-medium">Loading insights...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">No articles published yet.</p>
              <p className="text-sm text-slate-400">Check back later for expert analysis!</p>
            </div>
          ) : (
            posts.map((post, index) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-green-500/30 transition-all group flex flex-col"
              >
                <Link to={`/blog/${post.slug}`} onClick={() => hapticFeedback('light')} className="flex flex-col h-full">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image_url || `https://picsum.photos/seed/${post.id}/800/400`} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-green-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-slate-500 mb-6 leading-relaxed line-clamp-2 flex-grow">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{post.author}</span>
                      </div>
                      <span className="text-green-500 font-bold text-sm flex items-center gap-1">
                        Read More <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Categories</h3>
            <div className="space-y-3">
              {categories.map(cat => (
                <button key={cat} className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-green-500 transition-colors group">
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
