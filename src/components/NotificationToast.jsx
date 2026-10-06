import React from 'react';
import { CheckCircle2, Heart, Bookmark, Sparkles } from 'lucide-react';

export default function NotificationToast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const icons = {
    like: <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />,
    save: <Bookmark className="w-4 h-4 text-purple-400 fill-purple-400" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    info: <Sparkles className="w-4 h-4 text-sky-400" />,
  };

  return (
    <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel border border-white/20 shadow-2xl text-xs font-semibold text-white animate-in slide-in-from-top duration-300">
      {icons[type] || icons.info}
      <span>{message}</span>
    </div>
  );
}
