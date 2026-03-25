import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import { Trash2, Upload, Loader2 } from 'lucide-react';

export function AdManager() {
  const [banners, setBanners] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [position, setPosition] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching banners:', error);
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !destinationUrl || !position) {
      alert('Please fill all fields');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ad-banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ad-banners')
        .getPublicUrl(filePath);

      // 3. Save to database
      const { error: dbError } = await supabase
        .from('banners')
        .insert([
          {
            image_url: publicUrl,
            destination_url: destinationUrl,
            position: position,
            is_active: true,
            click_count: 0
          }
        ]);

      if (dbError) throw dbError;

      // Reset form and refresh list
      setFile(null);
      setDestinationUrl('');
      setPosition('');
      fetchBanners();
      alert('Ad banner uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    } else {
      fetchBanners();
    }
  };

  const deleteBanner = async (id: string, imageUrl: string) => {
    console.log('deleteBanner called for:', id);
    // if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Extract filename from URL and delete from storage
      // Assuming URL format: .../storage/v1/object/public/ad-banners/public/filename.ext
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `public/${fileName}`;
      
      console.log('Deleting from storage:', { imageUrl, fileName, filePath });

      const { error: storageError } = await supabase.storage
        .from('ad-banners')
        .remove([filePath]);

      if (storageError) console.error('Storage deletion error:', storageError);

      fetchBanners();
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert(`Deletion failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Banner Ad</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Banner Image</Label>
              <Input 
                id="image" 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destination">Destination URL</Label>
              <Input 
                id="destination" 
                type="url" 
                placeholder="https://example.com"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={position} onValueChange={setPosition} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="in-article">In-Article</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Banner
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : banners.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No banners found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <img 
                          src={banner.image_url} 
                          alt="Banner preview" 
                          className="h-12 w-auto object-cover rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md"
                          referrerPolicy="no-referrer"
                        />
                      </TableCell>
                      <TableCell className="capitalize">{banner.position}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <a href={banner.destination_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {banner.destination_url}
                        </a>
                      </TableCell>
                      <TableCell>{banner.click_count}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={banner.is_active} 
                          onCheckedChange={() => toggleActive(banner.id, banner.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <button 
                          className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                          onClick={() => deleteBanner(banner.id, banner.image_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
