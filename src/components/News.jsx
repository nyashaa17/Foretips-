import { useState, useEffect } from 'react';
import { getNews } from '../services/sportsService';

export default function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        setNews(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Latest News</h2>
      <div className="space-y-4">
        {news.map((item, index) => (
          <div key={index} className="p-4 border-b">
            <h3 className="font-bold">{item.title}</h3>
            <p className="text-sm text-slate-600">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
