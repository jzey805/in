import React, { useState, useRef } from 'react';
import { Camera, ShieldCheck, ArrowRight, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

type AppState = 'upload' | 'analyzing' | 'result';

interface ShieldValueCheck {
  localPrice?: string;
  rmbEquivalent?: string;
  wittyComparison?: string;
}

interface ShieldResult {
  riskLevel: 'green' | 'yellow' | 'red';
  title: string;
  summary: string;
  redFlags: string[];
  valueCheck?: ShieldValueCheck;
}

export default function SafetyShieldDemo() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [textInfo, setTextInfo] = useState('');
  const [analysis, setAnalysis] = useState<ShieldResult | null>(null);
  const [activePreset, setActivePreset] = useState<'rent' | 'item' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setActivePreset(null);
    }
  };

  const submitForAnalysis = async () => {
    if (!file && !textInfo.trim()) return;
    setAppState('analyzing');
    
    try {
      const formData = new FormData();
      if (file) formData.append('image', file);
      if (textInfo.trim()) formData.append('textInfo', textInfo);
      if (activePreset) formData.append('activeCase', activePreset);

      const res = await fetch('/api/analyze-shield', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Analysis failed');
      
      const data: ShieldResult = await res.json();
      setAnalysis(data);
      setAppState('result');
    } catch (err) {
      console.error(err);
      alert('防坑诊断失败，请重试');
      setAppState('upload');
    }
  };

  const reset = () => {
    setAppState('upload');
    setFile(null);
    setFilePreview(null);
    setTextInfo('');
    setAnalysis(null);
    setActivePreset(null);
  };

  const loadExample = (type: 'rent' | 'item') => {
    setActivePreset(type);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#f0f2f5'; // Facebook-like bg
    ctx.fillRect(0, 0, 600, 800);
    ctx.fillStyle = '#000000';
    
    if (type === 'rent') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 20, 560, 400);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('CBD Luxury Appartment $200/w', 50, 70);
      ctx.font = '24px sans-serif';
      ctx.fillText('Super cheap! Fully furnished.', 50, 120);
      ctx.fillText('Owner in UK, send deposit via', 50, 180);
      ctx.fillText('Western Union first to get keys.', 50, 220);
      
      setTextInfo('这套房子位于墨尔本市中心，但房东说他在英国工作，无法带我看房，要求我先通过西联汇款打 1000 澳币作为押金，之后会把钥匙寄给我。这套房子周租才 200 刀，靠谱吗？');
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 20, 560, 400);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Microwave (Used) - $80', 50, 70);
      ctx.font = '24px sans-serif';
      ctx.fillText('Good condition. Pick up only.', 50, 120);
      ctx.fillText('Message me for details.', 50, 160);
      
      setTextInfo('Facebook Marketplace 上有人卖我一台八成新的二手微波炉，要价 80 澳币。这算贵吗？澳洲买全新的大概多少钱？');
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const fileObj = new File([blob], `${type}.png`, { type: 'image/png' });
        setFile(fileObj);
        setFilePreview(URL.createObjectURL(fileObj));
      }
    });
  };

  const getRiskUI = (level: string) => {
    switch(level) {
      case 'red': return { bg: 'bg-[#FFF4F2]', border: 'border-[#FEE6E3]', text: 'text-[#D84C3E]', icon: <ShieldAlert size={24} />, label: '高危预警' };
      case 'yellow': return { bg: 'bg-[#FFF9F0]', border: 'border-[#FBEAC8]', text: 'text-[#D48806]', icon: <ShieldAlert size={24} />, label: '中度风险' };
      case 'green': return { bg: 'bg-[#F2FBF5]', border: 'border-[#E0F4E8]', text: 'text-[#1C362B]', icon: <ShieldCheck size={24} />, label: '大致安全' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', icon: <ShieldCheck size={24} />, label: '情况未知' };
    }
  };

  return (
      <div className="w-full px-2 pb-16">
        
        {/* Decorative background */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#EAB252]/20 to-transparent blur-3xl rounded-full pointer-events-none -mr-20 -mt-20"></div>

        <div className="mb-12 relative z-10">
          <div className="flex items-center space-x-2 mb-2">
             <ShieldCheck size={24} className="text-[#EAB252]" />
             <p className="text-gray-500 text-sm font-bold tracking-widest uppercase">SAFETY SHIELD</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1C362B] leading-tight">
            防诈防坑安全盾。<br className="hidden md:block"/>查房源，扫盲区。
          </h2>
        </div>

        <div className="flex flex-col relative z-10 w-full">
          {/* Interactive Main Area */}
          <div className="flex flex-col w-full min-h-[550px] bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
             
             <AnimatePresence mode="wait">
               {appState === 'upload' && (
                  <motion.div 
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 flex flex-col justify-center"
                  >
                    <div className="text-sm font-bold text-gray-500 mb-4">第一步：提供线索（图片或文字描述）</div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-4 flex-1">
                      {/* Image Upload Box */}
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-gray-200 bg-gray-50 rounded-[1.5rem] p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-[#EAB252]/50 transition-colors overflow-hidden relative group min-h-[200px]"
                      >
                         {filePreview ? (
                           <img src={filePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                         ) : (
                           <div className="text-center">
                             <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                               <Camera className="text-gray-400 group-hover:text-[#EAB252] transition-colors" size={24} />
                             </div>
                             <p className="text-gray-500 text-sm font-medium">上传聊天截图 / 报价单</p>
                           </div>
                         )}
                      </div>

                      {/* Text Input Box */}
                      <div className="flex-1 border border-gray-200 rounded-[1.5rem] bg-white p-4 focus-within:border-[#EAB252] focus-within:ring-2 ring-[#EAB252]/20 transition-all flex flex-col min-h-[200px]">
                         <div className="flex items-center justify-between text-gray-400 mb-2">
                           <div className="flex items-center space-x-2">
                             <FileText size={16} />
                             <span className="text-xs font-bold uppercase">附加文字线索</span>
                           </div>
                         </div>
                         <textarea 
                           className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-gray-700"
                           placeholder="例如：对方要求我先用西联汇款转 500 澳币作为看房保证金，合理吗？或者：他卖我一台二手微波炉 80 刀..."
                           value={textInfo}
                           onChange={e => setTextInfo(e.target.value)}
                         ></textarea>
                         
                         <div className="mt-4 pt-4 border-t border-gray-100">
                           <div className="text-[10px] font-bold text-gray-400 mb-2">一键输入示例：</div>
                           <div className="flex flex-col gap-2">
                             <button onClick={() => loadExample('rent')} className="text-xs text-left bg-gray-50 hover:bg-[#EAB252]/10 text-gray-600 hover:text-[#1C362B] p-2 rounded-lg transition-colors truncate border border-gray-100">
                               🏠 “房东在英国，让西联打钱...”
                             </button>
                             <button onClick={() => loadExample('item')} className="text-xs text-left bg-gray-50 hover:bg-[#EAB252]/10 text-gray-600 hover:text-[#1C362B] p-2 rounded-lg transition-colors truncate border border-gray-100">
                               📺 “二手微波炉要 $80 算贵吗？”
                             </button>
                           </div>
                         </div>
                      </div>
                    </div>

                    <button 
                      onClick={submitForAnalysis}
                      disabled={!file && !textInfo.trim()}
                      className={`mt-4 w-full py-4 rounded-xl font-bold flex justify-center items-center space-x-2 transition-all ${file || textInfo.trim() ? 'bg-[#1C362B] hover:bg-[#254839] text-[#EAB252] shadow-lg active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      <span>全网搜索与防坑诊断</span>
                      <ArrowRight size={18} />
                    </button>
                  </motion.div>
               )}

               {appState === 'analyzing' && (
                 <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col items-center justify-center text-center"
                 >
                    <div className="w-16 h-16 border-4 border-[#EAB252]/20 border-t-[#EAB252] rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">正在进行全网比对</h3>
                    <p className="text-gray-500 text-sm">调用 Google Search 与底层数据排查风险中...</p>
                 </motion.div>
               )}

               {appState === 'result' && analysis && (
                 <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col w-full h-full overflow-y-auto pr-2 custom-scrollbar"
                 >
                   <div className="flex justify-between items-start mb-6">
                     <button onClick={reset} className="text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center space-x-1">
                       <span>← 返回重新检测</span>
                     </button>
                     
                     {/* Risk Badge */}
                     <div className={`px-4 py-1.5 rounded-full flex items-center space-x-2 border ${getRiskUI(analysis.riskLevel).bg} ${getRiskUI(analysis.riskLevel).border} ${getRiskUI(analysis.riskLevel).text}`}>
                        {getRiskUI(analysis.riskLevel).icon}
                        <span className="font-bold text-sm tracking-wide">{getRiskUI(analysis.riskLevel).label}</span>
                     </div>
                   </div>

                   <h3 className="text-2xl font-bold text-gray-900 mb-4">{analysis.title}</h3>

                   {/* Summary block */}
                   <div className={`p-5 rounded-2xl mb-4 border ${getRiskUI(analysis.riskLevel).bg} ${getRiskUI(analysis.riskLevel).border}`}>
                      <div className="text-gray-900 font-medium leading-relaxed markdown-body">
                         <Markdown>{analysis.summary}</Markdown>
                      </div>
                   </div>

                   {/* Red Flags / Specific Checks */}
                   {analysis.redFlags && analysis.redFlags.length > 0 && (
                     <div className="mb-6">
                        <div className="text-xs font-bold text-gray-400 tracking-widest mb-3 uppercase">🔍 诊断细节</div>
                        <ul className="space-y-3">
                           {analysis.redFlags.map((flag, idx) => (
                             <li key={idx} className="flex items-start space-x-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                               <span className="text-[#EAB252] flex-shrink-0 mt-0.5">•</span>
                               <div className="font-medium leading-relaxed markdown-body w-full">
                                  <Markdown>{flag}</Markdown>
                               </div>
                             </li>
                           ))}
                        </ul>
                     </div>
                   )}

                   {/* Value Check / Witty Module (if present) */}
                   {analysis.valueCheck?.wittyComparison && (
                     <div className="mt-auto">
                        <div className="bg-[#1C362B] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 bg-[#EAB252] text-[#1C362B] text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider">物价体感换算</div>
                           
                           <div className="flex justify-between items-end mb-4">
                              <div>
                                <div className="text-white/50 text-xs mb-1">报价等值约</div>
                                <div className="text-2xl font-bold">{analysis.valueCheck.rmbEquivalent || "￥-"}</div>
                              </div>
                           </div>
                           
                           <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                              <div className="text-sm text-[#EAB252] font-medium leading-relaxed markdown-body">
                                <Markdown>{analysis.valueCheck.wittyComparison}</Markdown>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
  );
}
