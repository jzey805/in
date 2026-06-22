import React, { useState } from 'react';
import { Mic, Phone, MapPin, AlertCircle, Volume2, ShieldAlert, BookOpen, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheatsheetType {
  title: string;
  emoji: string;
  english: string;
  chinese: string;
}

const EMERGENCY_CHEATSHEETS: CheatsheetType[] = [
  {
    title: "突发急病 / 昏迷",
    emoji: "🚑",
    english: "I need an ambulance, someone passed out and has severe difficulty breathing.",
    chinese: "我需要一辆救护车，有人昏迷了且呼吸非常困难。"
  },
  {
    title: "遭受抢劫 / 暴力袭击",
    emoji: "🛡️",
    english: "I was just mugged and assaulted. I need immediate police assistance at my location.",
    chinese: "我刚刚被抢劫并遭到袭击。我需要立刻派警察到我当前的位置。"
  },
  {
    title: "入室盗窃 / 安全威胁",
    emoji: "🚪",
    english: "My residence is being broken into right now. There is an active intruder and we are in danger.",
    chinese: "我的住处有人正强行闯入。屋内有入侵者，我们处于危险之中。"
  },
  {
    title: "发生火灾 / 浓烟",
    emoji: "🔥",
    english: "There is a fire breaking out at this address. Please send a fire brigade immediately.",
    chinese: "这个地址发生了火灾，请立刻派遣消防队。"
  }
];

export default function EmergencyAidDemo() {
  const [isListening, setIsListening] = useState(false);
  const [meltdownTriggered, setMeltdownTriggered] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeCheatsheetIdx, setActiveCheatsheetIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateEmergency = (mockText: string) => {
    setIsListening(true);
    setTranscript('');
    let currentLog = "";
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < mockText.length) {
        currentLog += mockText[i];
        setTranscript(currentLog);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          setMeltdownTriggered(true);
          // Auto-match active index based on voice keywords
          if (mockText.includes("抢劫")) {
            setActiveCheatsheetIdx(1);
          } else if (mockText.includes("晕倒") || mockText.includes("呼吸")) {
            setActiveCheatsheetIdx(0);
          }
        }, 800);
      }
    }, 100);
  };

  const reset = () => {
    setMeltdownTriggered(false);
    setTranscript('');
    setIsListening(false);
  };

  return (
    <div id="emergency-aid-container" className="relative w-full overflow-hidden bg-transparent min-h-[700px] flex flex-col">
      <AnimatePresence mode="wait">
        {!meltdownTriggered ? (
          <motion.div 
            key="id-normal-aid-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 w-full flex flex-col gap-8 py-6 md:py-10 animate-in fade-in duration-300"
          >
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black tracking-wider mb-2">
                  <ShieldAlert size={14} />
                  <span>RESPONSIBLE AI · 紧急避险红线守则</span>
                </div>
                <h1 className="text-2xl md:text-3.5xl font-black text-[#1C362B] tracking-tight">
                  First Aid 紧急求助辅助箱 <span className="text-sm font-normal text-gray-400 block mt-1">（提供拨号放大 + 救命小抄 + 精准定位，AI不干预真实000拨号）</span>
                </h1>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-3 max-w-sm text-xs leading-relaxed text-amber-900">
                ⚠️ <strong>安全红线：</strong>系统绝不挡在您与澳洲 <strong>000</strong> 之间，AI绝非求救过滤器，本模块纯为恐慌或外语卡壳时提供即开即用的高对比度视听支持。
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Side: Solid Direct Call and Info Panel */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Permanent Location Display */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute right-4 top-4 opacity-5 bg-emerald-100 text-[#1C362B] p-3 rounded-full">
                    <MapPin size={48} />
                  </div>
                  <div className="flex items-start space-x-3.5">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl mt-1">
                      <MapPin size={24} className="animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">您的实时精准定位</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">已启用 GPS & 澳洲数据库</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-1">
                        123 Swanston St, Melbourne, VIC 3000
                      </h3>
                      <p className="text-xs text-red-600 font-extrabold mt-2.5 bg-red-50 inline-block px-3 py-1.5 rounded-lg border border-red-100">
                        📢 电话接通后，请大声、清晰地将上方英文地址读给 000 接线员
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Responsive Huge Call Button Panel */}
                <div className="bg-gradient-to-br from-[#FE5D4C]/5 to-transparent rounded-3xl p-6 border border-red-100/60 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left flex-1">
                    <span className="text-xs font-black text-[#FE6D5D] uppercase tracking-wider block mb-1">澳洲官方唯一特服急救热线</span>
                    <h4 className="text-2xl font-black text-[#1C362B]">
                      一键快速紧急拨号
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm border-l-2 border-red-200 pl-2.5">
                      澳洲合并救援电话（警察、救护、消防统一由000接通并人工分流。若您英文受限，请在接通后立即大声告知 <strong>“Chinese, Please！”</strong> ）。
                    </p>
                  </div>
                  <a 
                    href="tel:000"
                    id="emergency-dial-btn"
                    className="w-40 h-40 md:w-44 md:h-44 bg-red-600 hover:bg-red-700 text-white rounded-full flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-all relative group shrink-0 active:scale-95"
                  >
                    <div className="absolute inset-0 rounded-full border-4 border-red-600/30 animate-pulse scale-105"></div>
                    <Phone size={36} className="mb-2" />
                    <span className="text-4xl font-black tracking-tight">000</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-90 block">点击拨打</span>
                  </a>
                </div>

                {/* 3. Copyman Cheat Sheet */}
                <div id="cheatsheet-section" className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen size={18} className="text-[#1C362B]" />
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide">澳洲急救口译英文小抄（直接照读）</h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">点击一键复制</span>
                  </div>

                  {/* Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {EMERGENCY_CHEATSHEETS.map((sheet, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCheatsheetIdx(idx)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                          activeCheatsheetIdx === idx
                            ? "bg-[#1C362B] text-white shadow-sm scale-102"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150"
                        }`}
                      >
                        <span>{sheet.emoji}</span>
                        <span className="truncate">{sheet.title}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sheet Card Content */}
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 relative group">
                    <button
                      onClick={() => handleCopy(EMERGENCY_CHEATSHEETS[activeCheatsheetIdx].english)}
                      className="absolute right-3 top-3 p-2 rounded-xl bg-white border border-gray-250 text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center space-x-1"
                      title="复制英文"
                    >
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      <span className="text-[10px] font-bold">{copied ? '已复制' : '复制小抄'}</span>
                    </button>
                    
                    <span className="text-[10px] font-black text-[#FE6D5D] block mb-2 uppercase tracking-wide">
                      {EMERGENCY_CHEATSHEETS[activeCheatsheetIdx].emoji} 接通电话后直接对着话筒念：
                    </span>
                    <blockquote className="text-lg md:text-xl font-black text-gray-900 leading-snug tracking-tight pr-10">
                      "{EMERGENCY_CHEATSHEETS[activeCheatsheetIdx].english}"
                    </blockquote>
                    <hr className="my-3 border-gray-200" />
                    <p className="text-xs text-gray-500 font-medium">
                      💡 中文意思对照：{EMERGENCY_CHEATSHEETS[activeCheatsheetIdx].chinese}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Side: Demo Playground of Voice Meltdown simulator */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Voice meltdown intro box */}
                <div className="bg-[#1C362B]/5 border border-[#1C362B]/15 rounded-3xl p-6 relative">
                  <div className="flex items-center space-x-2 text-[#1C362B] mb-3">
                    <Sparkles size={18} className="text-[#FE6D5D]" />
                    <h3 className="text-sm font-black uppercase tracking-wider">评委交互演示：高危安全词汇熔断</h3>
                  </div>
                  
                  <p className="text-xs text-gray-600 leading-relaxed mb-4 font-medium">
                    留学生在极度慌意卡壳时，可直接呼出特定词汇。此模拟版允许通过按钮模拟对着麦克风说出高危词汇的效果，展现系统瞬间熔断切入特大自救板的能力。
                  </p>
                  
                  <div className="bg-white border border-[#1C362B]/10 rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                      🛠️ 触发模拟高危词汇：
                    </div>

                    <button 
                      onClick={() => simulateEmergency("我遇到抢劫了！")}
                      disabled={isListening}
                      className="w-full bg-red-50 hover:bg-red-100 border border-red-150 p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Volume2 size={16} className="text-red-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">场景模拟 A</p>
                          <p className="text-xs font-black text-red-950">“我遇到抢劫了！”</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-black">点击触发</span>
                    </button>

                    <button 
                      onClick={() => simulateEmergency("我朋友突然晕倒了，呼吸非常困难！")}
                      disabled={isListening}
                      className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-150 p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Volume2 size={16} className="text-amber-700 shrink-0" />
                        <div>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">场景模拟 B</p>
                          <p className="text-xs font-black text-amber-950">“我朋友晕倒了，呼吸很困难！”</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-black">点击触发</span>
                    </button>
                  </div>

                  {/* Status Listening Panel */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-4 bg-gray-900 text-white p-4 rounded-2xl shadow-lg flex items-center space-x-3.5"
                      >
                        <div className="relative flex items-center justify-center w-7 h-7 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <Mic size={16} className="relative text-red-400 animate-pulse" />
                        </div>
                        <div className="flex-1 font-mono text-sm tracking-tight leading-snug">
                          "{transcript}<span className="animate-pulse">|</span>"
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Responsible AI compliance explanation */}
                <div className="border border-gray-150 rounded-3xl p-6 bg-white space-y-3 shadow-xs">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-emerald-700" />
                    <span>负责任 AI · 机制防线</span>
                  </h4>
                  <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>纯口译卡辅助：</strong> 语音熔断仅作前端视图切换。无论检测是错是对，绝不干扰用户自行通过任何方式呼叫 000 实体服务。
                    </li>
                    <li>
                      <strong>零网络传输阻碍：</strong> 离线自建简单字典判识，没有云端延迟。让最关键的地址、求助句式和拨号盘在您眼前无限放大。
                    </li>
                  </ul>
                </div>

              </div>

            </div>

          </motion.div>
        ) : (
          /* MELTDOWN SYSTEM EMERGENCY STATE */
          <motion.div 
            key="id-meltdown-activated"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-[#DE3C3A] text-white p-4 md:p-8 rounded-3xl flex flex-col justify-between min-h-[660px]"
          >
            {/* Header control */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
               <button 
                 onClick={reset} 
                 className="text-white hover:bg-white/10 text-xs font-extrabold bg-white/15 px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
               >
                 <span>✕ 返回常规模式</span>
               </button>
               <div className="flex items-center space-x-2 animate-pulse bg-white/15 px-3 py-1.5 rounded-xl">
                 <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                 <span className="text-xs font-black uppercase tracking-widest">EMERGENCY SOS CARD</span>
               </div>
            </div>

            {/* Core Assistance Info */}
            <div className="flex flex-col items-center justify-center flex-1 my-6 space-y-6">
               
               {/* Heavy contrast big text Current Location */}
               <div className="bg-black/20 border border-white/10 p-5 rounded-2xl w-full max-w-xl shadow-inner text-center">
                 <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1.5">Your Current Location // 您的实时中英对照地址</p>
                 <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-white selection:bg-red-800">
                   123 Swanston St, Melbourne, VIC 3000
                 </h3>
                 <p className="text-xs text-white/90 mt-2 font-bold bg-white/10 inline-block px-3 py-1 rounded-md">
                   请在电话拨通后，立刻大声将此英文地址高声读给接线员！
                 </p>
               </div>

               {/* Absolute giant SOS calling button */}
               <a 
                 href="tel:000"
                 className="w-48 h-48 md:w-56 md:h-56 bg-white rounded-full flex flex-col items-center justify-center text-[#DE3C3A] shadow-2xl hover:scale-105 active:scale-95 transition-all relative group"
               >
                  <div className="absolute inset-0 rounded-full border-8 border-white/20 animate-ping scale-110"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-white/10 scale-125"></div>
                  <Phone size={56} className="mb-2" />
                  <span className="text-6xl font-black tracking-tighter">000</span>
                  <span className="text-xs font-black tracking-widest mt-1.5 opacity-90">立即拨打 000</span>
               </a>

               {/* Super Heavy Survival Translation Cheat sheet */}
               <div className="bg-black/35 p-6 rounded-2xl w-full max-w-2xl text-center border border-white/5 relative">
                 <span className="absolute left-4 top-4 text-xs font-black text-white/55 uppercase">SOS 口译卡</span>
                 <p className="text-red-200 text-xs font-black mb-1.5 uppercase tracking-widest">直接对着对接人高声照读：</p>
                 <p className="text-2.5xl md:text-4xl font-black tracking-tight leading-snug text-white">
                   "{EMERGENCY_CHEATSHEETS[activeCheatsheetIdx].english}"
                 </p>
                 <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/75">
                   <span>💡 对应中文：{EMERGENCY_CHEATSHEETS[activeCheatsheetIdx].chinese}</span>
                   <button 
                     onClick={() => handleCopy(EMERGENCY_CHEATSHEETS[activeCheatsheetIdx].english)}
                     className="bg-white/15 text-white hover:bg-white/25 px-3 py-1.5 rounded-lg font-bold transition-all text-[11px]"
                   >
                     {copied ? "已复制" : "复制英文小抄"}
                   </button>
                 </div>
               </div>

            </div>

            {/* Absolute bottom guard */}
            <p className="text-center text-white/50 text-[11px] font-black leading-relaxed max-w-lg mx-auto">
              救援免责保证：本工具完全开源离线运行。系统仅作为视听辅助（帮你更快找到求救小抄与定位），AI对真实的直联生命通道000不进行拦截或决策，如需呼救请选直接拨打！
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
