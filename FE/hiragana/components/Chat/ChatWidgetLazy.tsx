'use client';

import dynamic from 'next/dynamic';

// Lazy-load ChatWidget: defers socket.io + axios bundles until client-side render
const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
});

export default function ChatWidgetLazy() {
  return <ChatWidget />;
}
