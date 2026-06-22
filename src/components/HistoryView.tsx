import React, { useEffect, useState } from 'react';
import { Mail, ArrowRight, Clock, Search, ExternalLink } from 'lucide-react';
import Markdown from 'react-markdown';

interface HistoryItem {
  id: string;
  timestamp: number;
  subject: string;
  body: string;
  recipientEmail: string;
}

export default function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('serene_draft_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleSend = (item: HistoryItem) => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.recipientEmail)}&su=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(item.body)}`;
    window.open(url, '_blank');
  };

  if (selectedItem) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100">
        <button 
          onClick={() => setSelectedItem(null)}
          className="mb-6 text-sm font-bold text-gray-400 hover:text-gray-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowRight className="rotate-180" size={16} /> 返回列表
        </button>
        <div>
          <h2 className="text-2xl font-bold font-serif mb-2">{selectedItem.subject}</h2>
          <p className="text-sm text-gray-500 mb-8 flex items-center gap-2">
            <Clock size={14} /> {new Date(selectedItem.timestamp).toLocaleString()}
          </p>

          <div className="mb-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 font-mono">
            <span className="font-bold mr-2 text-gray-400">发给:</span> {selectedItem.recipientEmail || '未指定'}
          </div>

          <div className="bg-white border rounded-2xl p-6 text-sm resize-none min-h-[300px] shadow-sm leading-relaxed text-gray-800 markdown-body">
            <Markdown>{selectedItem.body}</Markdown>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => handleSend(selectedItem)}
              className="bg-[#1C362B] hover:bg-[#152920] text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg hover:-translate-y-1 transition-all active:scale-95"
            >
              <span>前往 Gmail 发送</span>
              <ExternalLink size={16} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-11px font-bold text-[#Eab252] tracking-widest uppercase mb-2">History</h2>
        <h1 className="text-4xl font-extrabold text-[#1C362B] font-serif mb-4">草稿箱历史。</h1>
        <p className="text-gray-500 text-sm">查看你所有生成的信件和申诉草稿。</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">暂无历史记录</h3>
          <p className="text-gray-400 text-sm max-w-xs">当你使用全能信件官生成过英文邮件草稿后，可以在这里查看它们。</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:border-[#1C362B]/30 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-6 flex flex-col gap-2">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#1C362B] transition-colors">{item.subject}</h3>
                  <p className="text-sm text-gray-400 font-mono line-clamp-2 md:line-clamp-1">{item.body.substring(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1"><Clock size={12}/> {new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1"><Mail size={12}/> {item.recipientEmail || '未指定邮箱'}</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-[#F8F6F1] rounded-full flex items-center justify-center group-hover:bg-[#1C362B] group-hover:text-white text-gray-400 transition-colors">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
