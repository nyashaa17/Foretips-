import { useState, useEffect } from 'react';
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
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
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('slug', slug)
          .limit(1)
          .maybeSingle();

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

  // Intelligently format text that might be missing line breaks
  const formatContent = (text) => {
    if (!text) return '';
    
    let formatted = text;
    
    // Always apply formatting to ensure consistency, especially for pasted text
    
    // Add newlines before common emojis that act as bullet points or section headers
    formatted = formatted.replace(/([.!?])\s*(✅|👉|📊|💡|⚽|🎯|🔥|💰|🏆|📌|📝|🤔|👇)/g, '$1\n\n$2 ');
    
    // Format checkmarks as lists
    formatted = formatted.replace(/([.!?])\s*(✔|✓)/g, '$1\n\n- ');
    
    // Replace inline checkmarks with list items if they follow a space
    formatted = formatted.replace(/\s+(✔|✓)\s+/g, '\n- ');
    
    // Make "Step X:" a heading (H3)
    formatted = formatted.replace(/([.!?])\s*(Step \d+:)/gi, '$1\n\n### $2');
    // Also catch if it's right after an emoji
    formatted = formatted.replace(/(✅|👉|📊|💡|⚽|🎯|🔥|💰|🏆|📌|📝|🤔|👇)\s*(Step \d+:)/gi, '$1\n\n### $2');
    
    // Make common section starters into headings
    formatted = formatted.replace(/([.!?])\s*(What Are|How To|Why You|The Goal:)/gi, '$1\n\n### $2');
    
    // Replace single newlines with double newlines to ensure proper paragraphs (only if it's not already a list or heading)
    formatted = formatted.replace(/([^\n])\n([^\n#-])/g, '$1\n\n$2');
    
    // Clean up multiple newlines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Remove emojis
    formatted = formatted.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    
    return formatted;
  };

  const displayContent = formatContent(post.content);

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
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Insights
          </button>

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
            <div className="relative w-full">
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full aspect-[16/9] md:aspect-[21/9] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          )}
          
          {/* Unified Social Share */}
          <div className="flex items-center justify-center gap-3 p-6 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 hidden sm:inline-block">Share Article:</span>
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => hapticFeedback('light')}
                className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 transition-all ${link.color} hover:text-white hover:border-transparent flex items-center gap-2 shadow-sm`}
                title={`Share on ${link.name}`}
              >
                <link.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-bold hidden sm:inline-block">{link.name}</span>
              </a>
            ))}
          </div>
          
          <div className="p-8 md:p-12">
            <div className="markdown-body font-serif prose-headings:font-sans prose prose-slate prose-lg md:prose-xl max-w-3xl mx-auto prose-headings:text-slate-900 prose-headings:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-900 prose-a:text-green-600 prose-h2:mt-12 prose-h2:mb-6 prose-h3:mt-8 prose-h3:mb-4 [&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:font-black [&>p:first-of-type]:first-letter:text-green-600 [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:leading-[0.8] [&>p:first-of-type]:first-letter:mt-2">
              <ReactMarkdown
                remarkPlugins={[remarkBreaks, remarkGfm]}
                components={{
                  p: ({ children }) => <p className="leading-relaxed mb-6 whitespace-pre-wrap">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-8 space-y-3 marker:text-green-500">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-8 space-y-3 marker:text-green-500 font-medium">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-600 pl-2">{children}</li>,
                  h1: ({ children }) => <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-14 mb-6 tracking-tight">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-12 mb-6 tracking-tight">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-10 mb-4">{children}</h3>,
                  strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                  a: ({ children, href }) => <a href={href} className="text-green-600 hover:text-green-700 font-medium underline underline-offset-4 decoration-green-200 hover:decoration-green-500 transition-colors">{children}</a>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-green-500 bg-green-50/50 py-4 px-6 rounded-r-2xl italic text-slate-700 my-8 shadow-sm">{children}</blockquote>
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
