import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, User, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import { supabase } from '../supabaseClient';

export default function LatestBlogs() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching latest blogs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
        <p className="text-slate-500 font-medium">Loading latest insights...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show the section if there are no blogs
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Latest Insights
          </h2>
        </div>
        <Link 
          to="/blog" 
          onClick={() => hapticFeedback('light')}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <motion.article 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-green-500/30 transition-all group flex flex-col shadow-sm"
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
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 mb-3">
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2 flex-grow">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{post.author}</span>
                  </div>
                  <span className="text-green-500 font-bold text-xs flex items-center gap-1">
                    Read <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
