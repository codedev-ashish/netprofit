import * as cheerio from 'cheerio';
import React from 'react';
import Script from 'next/script';
export default function HTMLInjector({ html }: { html?: string }) {
  if (!html) return null;
  
  // Automatically strip any accidentally injected noindex tags
  const sanitizedHtml = html.replace(/<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/gi, '');
  
  // Parse HTML using cheerio
  const $ = cheerio.load(sanitizedHtml, null, false);
  
  const renderNode = (node: any, index: number): React.ReactNode => {
    if (node.type === 'text') {
      if (!node.data.trim()) return null;
      return node.data;
    }
    if (node.type === 'comment') {
      return null;
    }
    
    if (node.type === 'tag' || node.type === 'script' || node.type === 'style' || node.type === 'link' || node.type === 'meta') {
      const Tag = node.name as any;
      const props: any = {};
      
      // Convert HTML attributes to React props
      for (const [key, value] of Object.entries(node.attribs || {})) {
        let reactKey = key;
        if (key === 'class') reactKey = 'className';
        if (key === 'for') reactKey = 'htmlFor';
        if (key === 'charset') reactKey = 'charSet';
        if (key === 'http-equiv') reactKey = 'httpEquiv';
        if (key.includes('-')) {
          if (!key.startsWith('data-') && !key.startsWith('aria-') && key !== 'http-equiv') {
             reactKey = key;
          }
        }
        props[reactKey] = value;
      }
      
      if (node.type === 'script') {
        const inner = $(node).html();
        if (props.src) {
           return <Script key={index} src={props.src} strategy="afterInteractive" suppressHydrationWarning={true} {...props} />;
        } else if (inner) {
           return <Script key={index} id={props.id || `inline-script-${index}`} strategy="afterInteractive" suppressHydrationWarning={true} dangerouslySetInnerHTML={{ __html: inner }} {...props} />;
        }
      }

      if (node.type === 'style') {
        const inner = $(node).html();
        if (inner) {
          props.dangerouslySetInnerHTML = { __html: inner };
        }
        props.suppressHydrationWarning = true;
        return <Tag key={index} {...props} />;
      }
      
      props.suppressHydrationWarning = true;
      const children = (node.children || []).map((child: any, i: number) => renderNode(child, i));
      if (children.length > 0) {
         return <Tag key={index} {...props}>{children}</Tag>;
      }
      return <Tag key={index} {...props} />;
    }
    return null;
  };

  const rootNodes = $.root()[0].children;
  return <>{rootNodes.map((node: any, i: number) => renderNode(node, i))}</>;
}
