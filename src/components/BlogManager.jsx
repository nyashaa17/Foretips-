import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Plus, Edit, Trash2, Save, X, Image as ImageIcon, Check, Eye } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function BlogManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [currentPost, setCurrentPost] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image_url: '',
    category: 'Predictions',
    author: 'Admin',
    is_published: true
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPost(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from title if it's a new post and slug is empty or matches old title slug
      if (name === 'title' && (!prev.id || !prev.slug)) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `blog-posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setCurrentPost(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image!');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentPost.id) {
        const { error } = await supabase
          .from('blogs')
          .update({
            ...currentPost,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentPost.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Blog updated successfully!' });
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([currentPost]);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Blog created successfully!' });
      }
      setIsEditing(false);
      setCurrentPost({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        image_url: '',
        category: 'Predictions',
        author: 'Admin',
        is_published: true
      });
      fetchPosts();
    } catch (error) {
      console.error('Error saving blog:', error);
      setMessage({ type: 'error', text: 'Error saving blog: ' + error.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEdit = (post) => {
    setCurrentPost(post);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      title: 'Delete Blog Post',
      message: 'Are you sure you want to delete this blog post? This cannot be undone.',
      onConfirm: async () => {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id);
          if (error) throw error;
          fetchPosts();
          setModal({ ...modal, isOpen: false });
        } catch (error) {
          console.error('Error deleting blog:', error);
          alert('Error deleting blog');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Blog Management</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> New Post
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {isEditing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              {currentPost.id ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h3>
            <button 
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              onClick={() => {
                setIsEditing(false);
                setCurrentPost({
                  title: '',
                  slug: '',
                  content: '',
                  excerpt: '',
                  image_url: '',
                  category: 'Predictions',
                  author: 'Admin',
                  is_published: true
                });
              }}
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Title</label>
                  <input 
                    name="title" 
                    value={currentPost.title} 
                    onChange={handleInputChange} 
                    placeholder="Enter blog title" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Slug (URL path)</label>
                  <input 
                    name="slug" 
                    value={currentPost.slug} 
                    onChange={handleInputChange} 
                    placeholder="e.g. how-to-predict-football" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select 
                    name="category" 
                    value={currentPost.category} 
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="Predictions">Predictions</option>
                    <option value="News">News</option>
                    <option value="Guides">Guides</option>
                    <option value="Community">Community</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Author</label>
                  <input 
                    name="author" 
                    value={currentPost.author} 
                    onChange={handleInputChange} 
                    placeholder="Author name" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Featured Image</label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <input 
                      name="image_url" 
                      value={currentPost.image_url} 
                      onChange={handleInputChange} 
                      placeholder="Image URL or upload below" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                    <div className="mt-2">
                      <label className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors text-sm font-medium">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>
                  {currentPost.image_url && (
                    <div className="w-32 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={currentPost.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Excerpt (Short summary)</label>
                <textarea 
                  name="excerpt" 
                  value={currentPost.excerpt} 
                  onChange={handleInputChange} 
                  rows="2" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
                  placeholder="A brief summary of the post..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Content (Markdown supported)</label>
                <textarea 
                  name="content" 
                  value={currentPost.content} 
                  onChange={handleInputChange} 
                  rows="12" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none text-sm font-mono"
                  placeholder="Write your blog content here..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setCurrentPost(prev => ({ ...prev, is_published: !prev.is_published }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${currentPost.is_published ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentPost.is_published ? 'left-7' : 'left-1'}`} />
                </button>
                <label className="text-sm font-bold text-slate-700 cursor-pointer" onClick={() => setCurrentPost(prev => ({ ...prev, is_published: !prev.is_published }))}>
                  Published
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-colors"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {currentPost.id ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700 text-sm">Title</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-sm">Category</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-sm">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-sm">Date</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      No blog posts found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id} post={post} handleEdit={handleEdit} handleDelete={handleDelete} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}

function TableRow({ post, handleEdit, handleDelete }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {post.image_url && (
            <img src={post.image_url} alt="" className="w-10 h-10 rounded object-cover bg-slate-100 flex-shrink-0" />
          )}
          <div>
            <div className="font-bold text-slate-900">{post.title}</div>
            <div className="text-xs text-slate-500">/{post.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
          {post.category}
        </span>
      </td>
      <td className="px-6 py-4">
        {post.is_published ? (
          <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
            <Check className="w-3 h-3" /> Published
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400 text-xs font-bold">
            <X className="w-3 h-3" /> Draft
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-slate-600 text-sm">
        {new Date(post.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => handleEdit(post)} 
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(post.id)} 
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
