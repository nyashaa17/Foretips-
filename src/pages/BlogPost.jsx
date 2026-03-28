import { useState, useEffect } from 'react';
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import NotFound from './NotFound';
import { 
  Calendar, 
  User, 
  ChevronLeft, 
  Twitter, 
  Facebook, 
  Linkedin, 
  MessageCircle, 
  Share2,
  Clock,
  Tag,
  Loader2
} from 'lucide-react';
import SEO from '../components/SEO';
import { hapticFeedback } from '../utils/haptics';
import { supabase } from '../supabaseClient';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setPost(data);
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
        <p className="text-slate-500 font-medium">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return <NotFound />;
  }

  const shareUrl = window.location.href;
  const shareText = `Check out this article on Foretips: ${post.title}`;

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'hover:bg-[#25D366]',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'hover:bg-[#1DA1F2]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:bg-[#4267B2]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:bg-[#0077B5]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO 
        title={post.title} 
        description={post.excerpt || post.title}
        image={post.image_url}
      />

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Insights
          </Link>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider">
                {post.category}
              </span>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Clock className="w-3 h-3" />
                {Math.ceil(post.content?.split(' ').length / 200)} min read
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between py-6 border-y border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{post.author}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Desktop Social Share */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Share:</span>
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => hapticFeedback('light')}
                    className={`p-2 rounded-xl bg-slate-50 text-slate-500 transition-all ${link.color} hover:text-white`}
                    title={`Share on ${link.name}`}
                  >
                    <link.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          {post.image_url && (
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full aspect-[2/1] object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          
          <div className="p-8 md:p-12">
            <div className="markdown-body prose prose-slate prose-xl max-w-3xl mx-auto prose-headings:text-slate-900 prose-headings:font-black prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-a:text-green-600 prose-h2:mt-12 prose-h2:mb-6 prose-h3:mt-8 prose-h3:mb-4">
              <ReactMarkdown
                components={{
                  p: ({ children }) => {
                    const childrenArray = React.Children.toArray(children);
                    const firstChild = childrenArray[0];
                    
                    if (typeof firstChild === 'string' && /^[💡⚠️ℹ️]/.test(firstChild)) {
                      return (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg text-slate-800">
                          {children}
                        </div>
                      );
                    }
                    return <p className="leading-relaxed mb-6">{children}</p>;
                  }
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Mobile Social Share */}
            <div className="mt-12 pt-8 border-t border-slate-100 md:hidden">
              <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Share this article</p>
              <div className="flex justify-center gap-4">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => hapticFeedback('light')}
                    className={`p-4 rounded-2xl bg-slate-50 text-slate-500 transition-all ${link.color} hover:text-white flex-1 flex flex-col items-center gap-2`}
                  >
                    <link.icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Newsletter Bottom */}
        <div className="mt-12 bg-green-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black mb-4">Never miss an insight</h2>
              <p className="text-green-100">Join 5,000+ football fans who get our weekly data-driven betting analysis.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:bg-white/20 transition-all placeholder:text-green-200 text-white w-full sm:w-64"
              />
              <button className="px-8 py-4 bg-white text-green-600 font-black rounded-2xl hover:bg-green-50 transition-all active:scale-95">
                Subscribe
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Share2 className="w-48 h-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
