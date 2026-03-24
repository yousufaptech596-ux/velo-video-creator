import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface AdBannerProps {
  className?: string;
  slot?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ className, slot }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const pubId = import.meta.env.VITE_ADMOB_PUB_ID;

  useEffect(() => {
    if (pubId && isVisible) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense/AdMob error:', e);
      }
    }
  }, [pubId, isVisible]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all hover:border-neutral-700 min-h-[100px]",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-800 px-1.5 py-0.5 rounded">Advertisement</span>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-neutral-600 hover:text-neutral-400 text-xs"
        >
          ×
        </button>
      </div>
      
      <div className="flex flex-col items-center justify-center py-4 text-center">
        {pubId ? (
          <ins className="adsbygoogle"
               style={{ display: 'block', minWidth: '250px', minHeight: '100px' }}
               data-ad-client={pubId}
               data-ad-slot={slot}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-full h-24 bg-neutral-950 rounded-lg border border-dashed border-neutral-800 flex flex-col items-center justify-center gap-2 mb-3">
              <div className="text-neutral-600 font-mono text-xs">AdMob Slot: {slot || 'default-banner'}</div>
              <div className="text-neutral-700 text-[10px]">320 x 100 Banner</div>
            </div>
            <p className="text-xs text-neutral-500 italic">
              Add VITE_ADMOB_PUB_ID to your environment variables to enable real ads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
