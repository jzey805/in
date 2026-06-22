import React, { useEffect, useState } from 'react';
import LiveDemo from './components/LiveDemo';
import SafetyShieldDemo from './components/SafetyShieldDemo';
import EmergencyAidDemo from './components/EmergencyAidDemo';
import EcosystemHub from './components/EcosystemHub';
import HistoryView from './components/HistoryView';
import LegalHubDemo from './components/LegalHubDemo';
import { Mail, Shield, AlertTriangle, Compass, LogIn, LogOut, Clock, Scale } from 'lucide-react';

import { initAuth, googleSignIn, logout } from './lib/firebase';
import { sendEmail } from './lib/gmail';
import { User } from 'firebase/auth';

type TabView = 'letter' | 'shield' | 'legalhub' | 'emergency' | 'roadmap' | 'history';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('letter');

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSendEmail = async (recipient: string, subject: string, body: string) => {
    if (!accessToken) throw new Error("No token");
    await sendEmail(accessToken, recipient, subject, body);
  };

  const tabs: { id: TabView; label: string; icon: React.ReactNode }[] = [
    { id: 'letter', label: '信件官', icon: <Mail size={24} /> },
    { id: 'shield', label: '防坑盾', icon: <Shield size={24} /> },
    { id: 'legalhub', label: '法援站', icon: <Scale size={24} /> },
    { id: 'history', label: '历史', icon: <Clock size={24} /> },
    { id: 'emergency', label: '急救包', icon: <AlertTriangle size={24} /> },
    { id: 'roadmap', label: '生态', icon: <Compass size={24} /> }
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F1] font-sans text-gray-900 overflow-hidden pb-16 md:pb-0 md:pl-20 relative">
      
      {/* Top App Bar */}
      <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 shadow-sm z-20 sticky top-0 w-full">
        <h1 className="text-xl font-bold tracking-tight text-[#1C362B] flex items-center gap-2">
          <span className="w-8 h-8 bg-[#EAB252] rounded-lg flex items-center justify-center text-white font-display">S</span>
          Serene｜留学生海外避坑安心助手
        </h1>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
               <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />
               <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-gray-900 transition flex items-center gap-1">
                 <LogOut size={14}/> 退出
               </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="text-sm font-bold bg-[#1C362B] text-white px-4 py-2 rounded-full hover:bg-gray-800 transition flex items-center gap-2">
               <LogIn size={16}/> 登录
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full relative">
         <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
            {activeTab === 'letter' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LiveDemo 
                   user={user} 
                   accessToken={accessToken} 
                   onLogin={handleLogin} 
                   onLogout={handleLogout} 
                   onSendEmail={handleSendEmail} 
                />
              </div>
            )}
            {activeTab === 'shield' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SafetyShieldDemo />
              </div>
            )}
            {activeTab === 'legalhub' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LegalHubDemo />
              </div>
            )}
            {activeTab === 'history' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <HistoryView />
              </div>
            )}
            {activeTab === 'emergency' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <EmergencyAidDemo />
              </div>
            )}
            {activeTab === 'roadmap' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
                <EcosystemHub />
              </div>
            )}
         </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-6 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)] flex justify-between items-center z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
         {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 transition-colors ${activeTab === tab.id ? 'text-[#1C362B]' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <div className={`mb-1 ${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`}>
                 {tab.icon}
               </div>
               <span className={`text-[10px] ${activeTab === tab.id ? 'font-black' : 'font-bold'}`}>{tab.label}</span>
            </button>
         ))}
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-20 bg-white border-r border-gray-100 flex-col items-center pt-24 pb-8 z-10 shadow-sm">
         <div className="flex-1 flex flex-col gap-8 w-full px-3">
            {tabs.map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 title={tab.label}
                 className={`flex flex-col items-center p-3 rounded-2xl w-full transition-all ${activeTab === tab.id ? 'bg-[#1C362B] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
               >
                  <div className={`${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`}>
                    {tab.icon}
                  </div>
                  <span className="text-[10px] font-bold mt-2">{tab.label}</span>
               </button>
            ))}
         </div>
      </nav>

    </div>
  );
}
