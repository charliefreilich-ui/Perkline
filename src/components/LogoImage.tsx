import React, { useState, useMemo } from 'react';
import { cn } from '../lib/utils';

interface LogoImageProps {
  src?: string;
  website?: string;
  alt: string;
  emoji: string;
  className?: string;
}

export const LogoImage = ({ src, website, alt, emoji, className }: LogoImageProps) => {
  const [errorCount, setErrorCount] = useState(0);
  
  const domain = useMemo(() => {
    // 1. Try to extract from src if it's already a logo URL
    if (src && (src.includes('clearbit.com') || src.includes('icon.horse') || src.includes('duckduckgo.com'))) {
      const parts = src.split('/');
      const last = parts[parts.length - 1].split('?')[0];
      if (last.includes('.')) return last.replace('.ico', '');
    }

    // 2. Try to get hostname from website URL
    const urlToParse = website || src;
    if (urlToParse) {
      try {
        const urlStr = urlToParse.includes('://') ? urlToParse : `https://${urlToParse}`;
        const url = new URL(urlStr);
        const host = url.hostname.replace(/^www\./, '');
        if (host && host.includes('.')) return host;
      } catch (e) { /* ignore */ }
    }

    // 3. Last resort: derive from business name (alt)
    const sanitized = alt.toLowerCase().replace(/[^a-z0-9]/g, '');
    return sanitized ? `${sanitized}.com` : null;
  }, [src, website, alt]);

  const getSource = () => {
    if (!domain || errorCount >= 5) return null;
    
    // We try multiple services in a preferred order of reliability
    const fallbacks = [
      src, // Original provided URL
      `https://icon.horse/icon/${domain}`, // Most reliable scraping
      `https://logo.clearbit.com/${domain}`, // High quality but limits
      `https://icons.duckduckgo.com/ip3/${domain}.ico`, // Fast & reliable
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128` // Last fallback
    ].filter(Boolean) as string[];

    // Ensure we don't repeat the same URL if src was one of the fallbacks
    const uniqueFallbacks = Array.from(new Set(fallbacks));
    
    return uniqueFallbacks[errorCount] || null;
  };

  const currentSrc = getSource();

  if (!currentSrc) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2d1b4e] to-[#0f071a] rounded-xl border border-white/10 shadow-inner", className)}>
        <span className="text-2xl group-hover:scale-125 transition-transform drop-shadow-md select-none">{emoji}</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full flex items-center justify-center relative bg-[#2d1b4e] rounded-xl overflow-hidden border border-white/10 shadow-inner group-hover:border-purple-500/30 transition-all", className)}>
      <img 
        src={currentSrc} 
        alt={alt} 
        onError={() => {
          setErrorCount(prev => prev + 1);
        }}
        className="max-w-[85%] max-h-[85%] object-contain drop-shadow-md" 
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
