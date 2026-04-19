import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface AdPlacementProps {
  position: string;
  className?: string;
}

export function AdPlacement({ position, className }: AdPlacementProps) {
  const [ad, setAd] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomAd();
  }, [position]);

  const fetchRandomAd = async () => {
    setLoading(true);
    try {
      // Fetch all active ads for the given position
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('position', position)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        // Pick a random ad from the results
        const randomIndex = Math.floor(Math.random() * data.length);
        setAd(data[randomIndex]);
      } else {
        setAd(null);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
      setAd(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (!ad) return;

    try {
      // Increment click count
      // Note: In a high-traffic production app, you'd want to use an RPC function 
      // to increment atomically, e.g., supabase.rpc('increment_click_count', { row_id: ad.id })
      // For this example, we'll do a simple read-modify-write or just update if we don't care about race conditions
      
      const { error } = await supabase
        .from('banners')
        .update({ click_count: ad.click_count + 1 })
        .eq('id', ad.id);

      if (error) {
        console.error('Error tracking click:', error);
      }
    } catch (error) {
      console.error('Error in click handler:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-24 bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading Ad...</span>
      </div>
    );
  }

  if (!ad) {
    // Return null or a placeholder if no ad is found
    return null;
  }

  return (
    <div className={`w-full max-w-sm h-24 my-4 flex flex-col items-center mx-auto ${className || ''}`}>
      <div className="w-full h-24 overflow-hidden bg-transparent">
        <a 
          href={ad.destination_url} 
          target="_blank" 
          rel="sponsored noopener noreferrer"
          onClick={handleClick}
          className="block w-full h-24"
        >
          <img 
            src={ad.image_url} 
            alt={`Advertisement - ${position}`} 
            className="w-full h-24 object-contain transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </a>
      </div>
      <span className="text-xs text-muted-foreground mt-1">Advertisement</span>
    </div>
  );
}
