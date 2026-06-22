import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, CheckCircle2, ArrowRight, Mail, AlignLeft, ExternalLink, Info, X, Eye, FileText, Globe } from 'lucide-react';
import { renderDocumentHTML } from './DocumentRenderer';
import { User } from 'firebase/auth';
import Markdown from 'react-markdown';

type AppState = 'upload' | 'analyzing' | 'result' | 'sent';

interface AnalysisResult {
  type: string;
  summary: string;
  painConversion: string;
  actionPlan: string[];
  englishDraft: {
    intention: string;
    recipientEmail: string;
    subject: string;
    body: string;
    chineseTranslation: string;
  };
}

const CASE_GUIDES: Record<string, {
  title: string;
  org: string;
  amount: string;
  deadline: string;
  difficulty: string;
  summary: string;
  tips: string[];
  groundingSources: { label: string; url: string }[];
}> = {
  fine: {
    title: '城市维权：市政道路停车罚单申诉',
    org: 'City of Brentmoor (虚构市政厅)',
    amount: '$85.00 AUD',
    deadline: '2026年5月1日前缴纳或发起复议',
    difficulty: '⭐ (低，极易豁免警告)',
    summary: '收到 City of Brentmoor 市政厅开出的停车漏缴罚单，指控红色的丰田 Corolla 车辆（车牌 ABC-123）在 Flinders Lane 禁停路段违规逗留。',
    tips: [
      '过去3年驾驶表现良好、无违章记录，可向市政厅书面申请将罚单酌情改发非罚款性的“Official Warning”（初犯警告减免机制）。',
      '如因紧急避险、车辆故障抛锚或人道主义急病就医等无抗力导致违停，可提供 RACV 道路救援单或医院急诊假条，此类复议撤销率极高。',
      '若现场的“禁停/限时”标识被繁茂树枝遮挡，或者地面标线严重剥落不清，拍照取证后可作为强有力的法定权利抗辩。'
    ],
    groundingSources: [
      { label: 'Melbourne City Council Parking Fines Review Guide', url: 'https://www.melbourne.vic.gov.au/parking-infringements' },
      { label: 'Fines Victoria Official Internal Review Application', url: 'https://online.fines.vic.gov.au/Request-a-review' }
    ]
  },
  coe: {
    title: '学术存续：大学停学与CoE取消意向（Show Cause）',
    org: 'Westhaven University, Melbourne (虚构大学)',
    amount: '面临学籍开除及学费损失',
    deadline: '自收到信起20个工作日内提交学术申诉（2026年7月20日前）',
    difficulty: '⭐⭐⭐⭐ (高，签证吊销高危)',
    summary: '因第一学期挂科率达到100%，或者连续学期未达到最低学术进展，Westhaven University 拟对李伟臣同学作出终止学籍处分，并将取消其 CoE 签证入学确认函。',
    tips: [
      '必须在20个工作日的严苛法定期限内提交书面学术抗辩！逾期学校将直接上报移民局，学生签证将进入取消阶段。',
      '需详实搜集“同理怜悯性因素”（Compassionate & Compelling）证据，例如突发生病、心理抑郁（附澳洲医生执业证明与医学诊断报告）、直系亲属重大难测事件。',
      '草拟一份可行的“成绩重振及格计划书（Study Plan）”，附带辅导预约记录，明确向学术进展委员会自证有能力在下学期纠偏并步入正轨。'
    ],
    groundingSources: [
      { label: 'Australian Dept of Education (ESOS Framework Standards)', url: 'https://www.education.gov.au/esos-framework' },
      { label: 'Department of Home Affairs Student Visa (Subclass 500) Conditions', url: 'https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/see-your-visa-conditions?product=500' }
    ]
  },
  bond: {
    title: '租务维权：中介扣留租约押金纠纷',
    org: 'Horizon Residential VIC (虚构房屋中介房东)',
    amount: '$420.00 AUD (拟扣押金额)',
    deadline: '2026年7月14日下午5:00前 (10个工作日内)',
    difficulty: '⭐⭐ (中，依靠法定条款易悉数索回)',
    summary: '租客 Alex Thompson 结束 4/85 Bourke Street 租期后，中介 Horizon 提议扣除 $420 押金，原因为地毯蒸汽清洁费 $180、厨房瓷砖去油污 $90 以及客厅墙面挂痕刮花 $150。',
    tips: [
      '地毯清洁法定规范：根据维州《住宅租赁法 RTA》，除非租客留下超出正常范畴的顽固污渍，中介通常无法强制要求专业级蒸汽清洗。合理磨损（Fair Wear and Tear）属于租客受法律保护的法定权利。',
      '墙面轻度损伤界定：由于日常居住使用留下的细微刮花、轻度磨损，在法律层面完全归为合理折旧，房东通常无权转嫁此项修缮费。',
      '主动线上发起反弹：登录 RTBA 押金系统主动单方面申请“全额返还押金 (Claim Entire Bond)”。在此机制下，中介如果不同意，必须在14天内向 VCAT 发起诉讼维权自证，否则押金将自动被主张释放给租客。VCAT 为第三方民事仲裁庭，双方需举证，并非自动全退，但中介常因繁琐及自证困难选择协商和解。'
    ],
    groundingSources: [
      { label: 'Consumer Affairs Victoria Official Rental Bond Guide', url: 'https://www.consumer.vic.gov.au/housing/renting' },
      { label: 'RTBA Victoria (Residential Tenancies Bond Authority)', url: 'https://rentalbonds.vic.gov.au/' },
      { label: 'VCAT Residential Tenancies Disputes Portal', url: 'https://www.vcat.vic.gov.au/case-types/residential-tenancies' }
    ]
  },
  plagiarism: {
    title: '学术防卫：课业学术诚信剽窃疑云（Integrity Allegation）',
    org: 'Westhaven University (虚构大学学术诚信委员会)',
    amount: '阶段性课业0分 / 挂科警告',
    deadline: '2026年6月28日前确认出席，7月3日正式答辩',
    difficulty: '⭐⭐⭐⭐⭐ (极高，触碰合规底线)',
    summary: 'Sarah Chen 同学的 ECON101 经济学作业 Assignment 2 被指控论文库及在线源高度重合48%，涉嫌学术不诚实写作。',
    tips: [
      '收集保存您完整的电脑本地草稿演化线。例如 Word 的修改痕迹历史、Git 递交提交链、平时手写思路图、查阅的 Lecture 纸张。',
      '厘清“抄袭”与“参考引用”两者的差异。如果是引用不规范造成的漏引或拼写格式问题，可在听证中坚称是学术编撰失误（Non-intentional Academic Misconduct），从而使指控降为警告。',
      '可以免费指派校内独立的“Student Advocate”（学生学术权益官）全程陪同听证。他们能扮演你的专业顾问把关话术。'
    ],
    groundingSources: [
      { label: 'TEQSA National Academic Integrity Best Practice Toolkit', url: 'https://www.teqsa.gov.au/guides-resources/resources/academic-integrity/academic-integrity-toolkit' },
      { label: 'Australian Student Study Assist Resources Helpline', url: 'https://www.studyassist.gov.au/' }
    ]
  },
  noise: {
    title: '社区相处：邻里深夜社交噪音违禁警告',
    org: 'Meridian Strata Management VIC (虚构物业管理)',
    amount: '警告，若重犯面临 VCAT 禁力和罚金',
    deadline: '2026年7月6日前书面回邮抗辩（自收到信14日内）',
    difficulty: '⭐ (低，调整作息易归于相安无事)',
    summary: '88 Flinders Lane 4B 单元的住户因过去四周内多次在 22:00 之后大分贝播放音响、高声社交，遭到 Owners Corporation 业主委员会多方联名投诉，下达违禁整顿通知。',
    tips: [
      '法定安静时段界定：澳洲各州对住宅区噪音制定了严厉法规。工作日夜晚 22:00 / 23:00 至次日上午 07:05 属于强制肃静期，不可制造影响邻里休息的破坏性噪声音量。',
      '此文主要为正式警示（Breach Notice）。建议态度温和诚恳，在期限内书面回复物业，解释情况并承诺后续严格注意防噪减震，以温和态度达成和解撤诉。'
    ],
    groundingSources: [
      { label: 'EPA Victoria Community Noise Legislation Guide', url: 'https://www.epa.vic.gov.au/for-community/environmental-information/noise' },
      { label: 'Victoria Consumer Strata By-Laws Enforcement Rules', url: 'https://www.consumer.vic.gov.au/housing/owners-corporations' }
    ]
  },
  utility: {
    title: '民生防卫：水电能源逾期与准断能驱逐通知',
    org: 'Coastal Energy & Water (虚构公用事业单位)',
    amount: '$258.30 AUD (账单逾期含滞纳金)',
    deadline: '2026年7月1日前阻断并产生连接费机制',
    difficulty: '⭐ (低，可瞬间申请无息账单延期)',
    summary: 'Mrs. Eleanor Vance 账户 9876 543 210 存在两重周期的水电欠费 $258.30，接获断水/断电高危通知。',
    tips: [
      '受强力民生人道保护：法律严禁公用事业服务商在极端温度季节、周末、节假日前夕切断家庭的生活能源负荷。',
      '立刻拨打账单页面的专线或登录平台点击加入“Hardship Program”（特殊困难人群救助计划）。一旦提出，利息、滞纳金会被免除，且依法强制获得最少 12-24 个月的小额免息分期权。',
      '还可以由服务商协助向各州政府代申领几百刀一户的公共能源灾害补贴（如 Utility Relief Grant Scheme VIC），可一次性全额冲抵 or 大额冲减所欠账目。'
    ],
    groundingSources: [
      { label: 'Energy & Water Ombudsman Victoria (EWOV) Dispute Hub', url: 'https://www.ewov.com.au/' },
      { label: 'Victorian Government Utility Relief Grant Scheme (URGS)', url: 'https://www.services.dffh.vic.gov.au/utility-relief-grant-scheme' }
    ]
  }
};

interface LiveDemoProps {
  user: User | null;
  accessToken: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onSendEmail: (recipient: string, subject: string, body: string) => Promise<void>;
}

export default function LiveDemo({ user, accessToken, onLogin, onLogout, onSendEmail }: LiveDemoProps) {
  const [appState, setAppState] = useState<AppState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  // New States for HD Previews, active presets, and "More Info"
  const [activeCase, setActiveCase] = useState<'fine' | 'coe' | 'bond' | 'plagiarism' | 'noise' | 'utility' | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setActiveCase(null); // Clear preset case when manually uploading
    }
  };

  const loadExample = async (type: 'fine' | 'coe' | 'bond' | 'plagiarism' | 'noise' | 'utility') => {
    setActiveCase(type);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 800);
    ctx.fillStyle = '#000000';
    ctx.font = '24px sans-serif';
    
    if (type === 'fine') {
      ctx.fillStyle = '#1C362B';
      ctx.fillRect(0, 0, 600, 15); // visual bar
      ctx.fillStyle = '#000000';
      ctx.fillText('CITY COUNCIL', 50, 100);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('INFRINGEMENT NOTICE', 50, 150);
      ctx.font = '24px sans-serif';
      ctx.fillText('Date: 21 Nov 2023', 50, 220);
      ctx.fillText('AMOUNT DUE: $385.00', 50, 270);
      ctx.fillText('OFFENCE: Parking in permit zone', 50, 320);
      ctx.fillText('Please pay within 14 days to avoid penalty.', 50, 420);
    } else if (type === 'coe') {
      ctx.fillStyle = '#FE6D5D';
      ctx.fillRect(0, 0, 600, 15); // visual bar
      ctx.fillStyle = '#000000';
      ctx.fillText('UNIVERSITY ADMINISTRATION', 50, 100);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('INTENTION TO CANCEL ENROLMENT', 50, 150);
      ctx.font = '24px sans-serif';
      ctx.fillText('Dear Student,', 50, 250);
      ctx.fillText('Due to unsatisfactory academic progress,', 50, 300);
      ctx.fillText('your CoE will be cancelled in 20 days.', 50, 350);
      ctx.fillText('You have the right to appeal.', 50, 400);
    } else if (type === 'bond') {
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(0, 0, 600, 15); // visual bar
      ctx.fillStyle = '#000000';
      ctx.fillText('EXCEL REAL ESTATE SERVICES', 50, 100);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('NOTICE OF BOND CLAIM', 50, 150);
      ctx.font = '24px sans-serif';
      ctx.fillText('Bond Reference: BX-9921', 50, 220);
      ctx.fillText('DEDUCTION CLAIMED: $650.00', 50, 270);
      ctx.fillText('Reason: Professional steam cleaning of carpet required', 50, 320);
      ctx.fillText('along with minor repairs to living room walls.', 50, 370);
      ctx.fillText('Please respond in 7 days or we will lodge.', 50, 470);
    } else if (type === 'plagiarism') {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(0, 0, 600, 15); // visual bar
      ctx.fillStyle = '#000000';
      ctx.fillText('FACULTY OF SCIENCE & TECHNOLOGY', 50, 100);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('ACADEMIC INTEGRITY INQUIRY', 50, 150);
      ctx.font = '24px sans-serif';
      ctx.fillText('Dear student,', 50, 220);
      ctx.fillText('An allegation of plagiarism has been made regarding', 50, 270);
      ctx.fillText('your COMP3300 Assignment 2 submission.', 50, 320);
      ctx.fillText('A similarity index of 48% was detected.', 50, 370);
      ctx.fillText('You must submit a response or attend a hearing.', 50, 420);
    } else if (type === 'noise') {
      ctx.fillStyle = '#10B981';
      ctx.fillRect(0, 0, 600, 15); // visual bar
      ctx.fillStyle = '#000000';
      ctx.fillText('CITY ENVIRONMENTAL PROTECTION AGENCY', 50, 100);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('OFFICIAL WARNING: NOISE DISTURBANCE', 50, 150);
      ctx.font = '24px sans-serif';
      ctx.fillText('To Resident at Flat 4C / 12 Barkly St', 50, 220);
      ctx.fillText('We have received verified community complaints regarding', 50, 270);
      ctx.fillText('excessive music and loud bass sounds after 11:30 PM.', 50, 320);
      ctx.fillText('Further breaches may result in $500 penalty notices.', 50, 370);
    } else if (type === 'utility') {
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, 0, 600, 15); // visual bar
      ctx.fillStyle = '#000000';
      ctx.fillText('ORIGIN ENERGY SERVICES', 50, 100);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('OVERDUE PAYMENT & DISCONNECTION WARNING', 50, 150);
      ctx.font = '24px sans-serif';
      ctx.fillText('Account Number: 1002-3994', 50, 220);
      ctx.fillText('TOTAL OUTSTANDING: $421.50', 50, 270);
      ctx.fillText('Due Date: 12 Dec 2023', 50, 320);
      ctx.fillText('If you are experiencing hardship, please contact', 50, 370);
      ctx.fillText('our support team immediately to request extension.', 50, 420);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
         const file = new File([blob], `${type}.png`, { type: 'image/png' });
         setFile(file);
         setFilePreview(URL.createObjectURL(file));
      }
    });
  };

  const submitForAnalysis = async () => {
    if (!file) return;
    setAppState('analyzing');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (activeCase) {
        formData.append('activeCase', activeCase);
      }

      const res = await fetch('/api/analyze-bill', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Analysis failed');
      
      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      setDraftBody(data.englishDraft.body);
      if (data.englishDraft.recipientEmail) {
        setRecipient(data.englishDraft.recipientEmail);
      }
      setCurrentTranslation(data.englishDraft.chineseTranslation);
      setAppState('result');
      
      // Save to history
      const currentHistoryStr = localStorage.getItem('serene_draft_history');
      const history = currentHistoryStr ? JSON.parse(currentHistoryStr) : [];
      history.push({
        id: Date.now().toString(),
        timestamp: Date.now(),
        subject: data.englishDraft.subject,
        body: data.englishDraft.body,
        recipientEmail: data.englishDraft.recipientEmail || ''
      });
      localStorage.setItem('serene_draft_history', JSON.stringify(history));
    } catch (err) {
      console.error(err);
      alert('解析失败，请重试');
      setAppState('upload');
    }
  };

  useEffect(() => {
    if (appState !== 'result' || !analysis) return;
    
    const timeoutId = setTimeout(async () => {
      if (draftBody && draftBody !== analysis.englishDraft.body) {
         setIsTranslating(true);
         try {
           const res = await fetch('/api/translate-stream', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ text: draftBody })
           });
           
           if (!res.ok) throw new Error("Stream failed");
           
           if (res.body) {
             const reader = res.body.getReader();
             const decoder = new TextDecoder();
             let done = false;
             setCurrentTranslation(""); // reset before streaming

             while (!done) {
               const { value, done: doneReading } = await reader.read();
               done = doneReading;
               if (value) {
                 const chunk = decoder.decode(value);
                 const lines = chunk.split('\n');
                 for (const line of lines) {
                   if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                     try {
                       const data = JSON.parse(line.slice(6));
                       if (data.text) {
                         setCurrentTranslation(prev => prev + data.text);
                       }
                     } catch (e) {
                       // ignore JSON parse errors from partial chunks
                     }
                   }
                 }
               }
             }
           }
         } catch (e) {
           console.error("Translation error", e);
         } finally {
           setIsTranslating(false);
           
           // Update this draft in history
           const currentHistoryStr = localStorage.getItem('serene_draft_history');
           if (currentHistoryStr) {
             let history = JSON.parse(currentHistoryStr);
             if (history.length > 0) {
               history[history.length - 1].body = draftBody;
               localStorage.setItem('serene_draft_history', JSON.stringify(history));
             }
           }
         }
      } else if (draftBody === analysis?.englishDraft.body) {
        setCurrentTranslation(analysis.englishDraft.chineseTranslation);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [draftBody, appState, analysis]);

  const handleSend = () => {
    if (!analysis) return;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(analysis.englishDraft.subject)}&body=${encodeURIComponent(draftBody)}`;
    window.open(url, '_blank');
    setAppState('sent');
  };

  const reset = () => {
    setAppState('upload');
    setFile(null);
    setFilePreview(null);
    setAnalysis(null);
    setActiveCase(null);
  };

  return (
      <div className="w-full md:p-4">
        
        <div className="mb-14 relative z-10">
          <p className="text-[#EAB252] text-sm font-bold tracking-widest mb-2 uppercase">LETTER OFFICER</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1C362B] leading-tight">
            全能信件官。<br className="hidden md:block"/>三步，从慌张到搞定。
          </h2>
        </div>

        <div className="flex flex-col relative z-10 w-full">
          {/* Interactive Main Area */}
          <div className="flex flex-col w-full min-h-[500px] bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
             
             {appState === 'upload' && (
                <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    
                    {/* Left Column: Image/Canvas Preview Box on the Left */}
                    <div className="lg:col-span-5 flex flex-col justify-between bg-neutral-50 p-5 rounded-3xl border border-gray-100">
                      <div>
                        <div className="text-xs font-black text-gray-400 mb-3 uppercase tracking-wider flex justify-between items-center">
                          <span>信件原文预览 / 上传选区</span>
                          {activeCase && (
                            <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded font-bold">内置经典案例载入</span>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        
                        <div 
                          onClick={() => { if (activeCase) return; fileInputRef.current?.click(); }}
                          className={`w-full ${activeCase ? 'cursor-default bg-white' : 'cursor-pointer hover:bg-neutral-800 bg-[#1C1C1C]'} border-2 border-dashed border-[#1C362B]/20 rounded-2xl flex flex-col items-center justify-center overflow-hidden relative transition-all duration-300 shadow-sm`}
                          style={{ minHeight: '380px' }}
                        >
                           {/* Render High definition document directly in container if a preset is selected! */}
                           {activeCase ? (
                             <div className="w-full h-[380px] overflow-y-auto custom-scrollbar p-1 select-none flex justify-center bg-gray-50/50 rounded-xl">
                               {renderDocumentHTML(activeCase, true)}
                             </div>
                           ) : (
                             filePreview ? (
                               <img src={filePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2 bg-white/5" />
                             ) : (
                               <div className="text-center p-6">
                                 <div className="w-12 h-12 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border-dashed group-hover:border-[#FE6D5D]/50 transition-colors">
                                   <Camera className="text-white/50 group-hover:text-white transition-colors" size={24} />
                                 </div>
                                 <p className="text-white/60 text-xs font-bold font-sans">拍照或上传英文公文/罚单</p>
                                 <p className="text-white/30 text-[10px] mt-1 px-4 leading-normal">点击区域选择图片 或 在右侧一键导入经典高频案例</p>
                                </div>
                             )
                           )}
                        </div>
                        
                        <div className="mt-3 flex gap-2 w-full">
                          {activeCase ? (
                            <button 
                              onClick={() => {
                                setFile(null);
                                setFilePreview(null);
                                setActiveCase(null);
                              }}
                              className="flex-1 text-xs font-bold border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 bg-white p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                              清除案例，开始自选手传
                            </button>
                          ) : (
                            filePreview && (
                              <button 
                                onClick={reset}
                                className="flex-1 text-xs font-bold border border-gray-200 hover:border-gray-300 text-gray-650 bg-white p-2.5 rounded-xl transition-all"
                              >
                                重置上传
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <button 
                          onClick={submitForAnalysis}
                          disabled={!file}
                          className={`w-full py-3.5 rounded-2xl font-extrabold flex justify-center items-center space-x-2 transition-all duration-350 ${file ? 'bg-[#FE6D5D] hover:bg-[#ff5642] text-white shadow-lg active:scale-95' : 'bg-gray-150 text-gray-400 cursor-not-allowed'}`}
                        >
                          <span className="tracking-wide">AI 一键深度汉化翻译</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Right Column: Case Choices Grid & "More Info" Guidance */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                      
                      {/* Presets Grid */}
                      <div className="bg-[#FAF9F5] p-5 rounded-3xl border border-gray-100">
                         <div className="text-xs font-black text-[#1C362B] uppercase mb-3.5 tracking-wider flex items-center gap-1.5">
                           <span>💡 一键载入真实留学生高频法律/申诉案例：</span>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <button onClick={() => loadExample('fine')} className={`text-xs font-bold border rounded-xl p-3 transition-all flex flex-col items-center gap-1 cursor-pointer ${activeCase === 'fine' ? 'border-[#1C362B] bg-[#1C362B]/5 shadow-sm text-neutral-900 ring-1 ring-[#1C362B]/25' : 'border-gray-100 bg-white hover:border-[#1C362B]/30 hover:bg-[#1C362B]/5 text-gray-700'}`}>
                              <span className="text-base">🎫</span>
                              <span className="text-gray-800">墨尔本停车罚单</span>
                            </button>
                            <button onClick={() => loadExample('coe')} className={`text-xs font-bold border rounded-xl p-3 transition-all flex flex-col items-center gap-1 cursor-pointer ${activeCase === 'coe' ? 'border-[#FE6D5D] bg-[#FE6D5D]/5 shadow-sm text-neutral-900 ring-1 ring-[#FE6D5D]/25' : 'border-gray-100 bg-white hover:border-[#FE6D5D]/30 hover:bg-[#FE6D5D]/5 text-gray-700'}`}>
                              <span className="text-base">⚠️</span>
                              <span className="text-gray-800">停学警告(CoE)</span>
                            </button>
                            <button onClick={() => loadExample('bond')} className={`text-xs font-bold border rounded-xl p-3 transition-all flex flex-col items-center gap-1 cursor-pointer ${activeCase === 'bond' ? 'border-amber-500 bg-amber-500/10 shadow-sm text-neutral-900 ring-1 ring-amber-500/25' : 'border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50 text-gray-700'}`}>
                              <span className="text-base">🏠</span>
                              <span className="text-gray-800">租房押金扣除</span>
                            </button>
                            <button onClick={() => loadExample('plagiarism')} className={`text-xs font-bold border rounded-xl p-3 transition-all flex flex-col items-center gap-1 cursor-pointer ${activeCase === 'plagiarism' ? 'border-red-500 bg-red-50 shadow-sm text-neutral-900 ring-1 ring-red-500/25' : 'border-gray-100 bg-white hover:border-red-200 hover:bg-red-50 text-gray-700'}`}>
                              <span className="text-base">🎓</span>
                              <span className="text-gray-800">学术抄袭指控</span>
                            </button>
                            <button onClick={() => loadExample('noise')} className={`text-xs font-bold border rounded-xl p-3 transition-all flex flex-col items-center gap-1 cursor-pointer ${activeCase === 'noise' ? 'border-emerald-500 bg-emerald-50 shadow-sm text-neutral-900 ring-1 ring-emerald-500/25' : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50 text-gray-700'}`}>
                              <span className="text-base">📢</span>
                              <span className="text-gray-800">邻里噪音警告</span>
                            </button>
                            <button onClick={() => loadExample('utility')} className={`text-xs font-bold border rounded-xl p-3 transition-all flex flex-col items-center gap-1 cursor-pointer ${activeCase === 'utility' ? 'border-amber-500 bg-amber-50 shadow-sm text-neutral-900 ring-1 ring-amber-500/25' : 'border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50 text-gray-700'}`}>
                              <span className="text-base">💧</span>
                              <span className="text-gray-800">水电账单逾期</span>
                            </button>
                         </div>
                      </div>
                      
                      {/* "More Info / 案例要点及法援内参" Card */}
                      <div className="flex-1 border border-amber-200/60 bg-amber-50/20 rounded-3xl p-5 md:p-6 flex flex-col justify-between">
                         {activeCase ? (
                           <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-350">
                             <div>
                               <div className="flex justify-between items-start border-b border-amber-200 pb-3 mb-3">
                                 <div>
                                   <span className="text-[10px] font-black tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase font-mono">法援内参 · MORE INFO</span>
                                   <h3 className="text-base font-bold text-gray-900 mt-1">{CASE_GUIDES[activeCase].title}</h3>
                                 </div>
                                 <div className="text-right">
                                   <span className="text-[10px] text-gray-400 block font-bold">处理难度</span>
                                   <span className="text-xs font-semibold text-amber-950 block">{CASE_GUIDES[activeCase].difficulty}</span>
                                 </div>
                               </div>
                               
                               <div className="space-y-3 my-3 text-xs text-gray-700">
                                 <div>
                                   <span className="font-bold text-gray-900">🏢 发方机构:</span> <span className="font-mono text-gray-650 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{CASE_GUIDES[activeCase].org}</span>
                                 </div>
                                 <div>
                                   <span className="font-bold text-gray-900">🚨 涉诉金额/威胁:</span> <span className="font-extrabold text-red-650">{CASE_GUIDES[activeCase].amount}</span>
                                 </div>
                                 <div>
                                   <span className="font-bold text-gray-900">⏰ 行政抗诉死线:</span> <span className="font-bold text-[#1C362B] bg-white border px-1.5 py-0.5 rounded">{CASE_GUIDES[activeCase].deadline}</span>
                                 </div>
                                 <div className="bg-white/85 p-3 rounded-2xl border border-amber-100/50 leading-relaxed text-gray-600 mt-2">
                                   <p className="font-bold text-gray-900 border-l-2 border-[#FE6D5D] pl-1.5 mb-1.5 text-[10px]">事件描述 (Case Overview):</p>
                                   {CASE_GUIDES[activeCase].summary}
                                 </div>
                               </div>
                               
                               <div className="mt-4 pt-1">
                                 <h4 className="text-xs font-black text-amber-950 mb-2 flex items-center gap-1 uppercase tracking-wide">🛡️ 新移民与留学生维权防坑指南 (Strategy Guide):</h4>
                                 <ul className="space-y-2 mb-4">
                                   {CASE_GUIDES[activeCase].tips.map((tip, index) => (
                                     <li key={index} className="text-xs text-gray-700 flex items-start gap-1 pb-1 font-sans">
                                       <span className="text-amber-600 font-extrabold text-xs leading-none mt-0.5">•</span>
                                       <span>{tip}</span>
                                     </li>
                                   ))}
                                 </ul>

                                 {/* Grounding Sources Panel */}
                                 {CASE_GUIDES[activeCase].groundingSources && CASE_GUIDES[activeCase].groundingSources.length > 0 && (
                                   <div className="bg-white/85 border border-amber-200/50 p-4 rounded-2xl mb-4 text-[11px] font-sans">
                                     <h5 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none">
                                       <Globe size={13} className="text-amber-700 shrink-0"/>
                                       <span className="font-extrabold">🔍 澳洲官方监管及法规信源对齐 (Grounding Sources):</span>
                                     </h5>
                                     <ul className="space-y-2">
                                       {CASE_GUIDES[activeCase].groundingSources.map((source, index) => (
                                         <li key={index} className="leading-normal flex items-start gap-1">
                                           <span className="text-[#1C362B] shrink-0 mt-0.5 text-xs">🔗</span>
                                           <a 
                                             href={source.url} 
                                             target="_blank" 
                                             rel="noopener noreferrer" 
                                             className="text-[#1C362B] hover:text-[#FE6D5D] hover:underline font-bold transition-colors flex flex-wrap items-center gap-0.5"
                                           >
                                             <span>{source.label}</span>
                                             <span className="text-[9px] text-gray-400 font-normal">({new URL(source.url).hostname})</span>
                                           </a>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}

                                 {/* Disclaimer Banner */}
                                 <div className="bg-amber-100/35 border border-amber-200/60 rounded-2xl p-3.5 text-[10px]/relaxed text-gray-650 font-sans mt-3">
                                   <div className="text-amber-800 font-bold flex items-center gap-1 mb-1 text-[11px]">
                                     <span>⚖️ R-AI 风险控制及责任声明 (Disclaimer):</span>
                                   </div>
                                   <p>
                                     本页面及平台服务解读的所有内容均基于澳大利亚联邦及各州公开法规之一般公共信息做梳理参考，<strong>不构成任何形式的执业律师正式法律意见（Legal Advice）</strong>。租客、学生或居民在正式进行法律抗辩、向法庭或审裁处（如 VCAT）提控前，请优先参阅上方对应官方直链，或向持牌顾问寻取协助。
                                   </p>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="border-t border-amber-100 pt-3 mt-5 flex flex-col sm:flex-row gap-2">
                               <button 
                                 onClick={() => setShowDocModal(true)}
                                 className="flex-1 bg-[#1C362B] hover:bg-neutral-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex justify-center items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                               >
                                 <Eye size={14}/>
                                 <span>📄 放大查阅高清原始公文 (HTML排版原件)</span>
                               </button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                              <Info className="text-amber-500 mb-3 animate-bounce" size={32} />
                              <h3 className="text-base font-bold text-[#1C362B] mb-1">等待选择公文案例</h3>
                              <p className="text-xs text-gray-500 max-w-sm leading-relaxed px-4">
                                请在上方点击选择任意常见罚单、租房、抄袭、噪音案例一键导入。
                                载入后，此区域将自动解锁专业保姆级法律指导(More Info)以及高清排版原件。
                              </p>
                           </div>
                         )}
                      </div>
                      
                    </div>
                  </div>
                </div>
             )}

             {appState === 'analyzing' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 border-4 border-[#1C362B]/10 border-t-[#1C362B] rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">正在用中文为你解读</h3>
                  <p className="text-gray-500 text-sm">联网核实相关条款中...</p>
               </div>
             )}

             {appState === 'result' && analysis && (
               <div className="flex-1 flex flex-col w-full h-full animate-in slide-in-from-bottom-4 duration-500">
                 <button onClick={reset} className="text-xs font-bold text-gray-400 hover:text-gray-900 mb-4 self-start flex items-center space-x-1">
                   <span>← 换一封信</span>
                 </button>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
                   {/* Left Column: Side-by-side active original document preview */}
                   <div className="lg:col-span-5 flex flex-col bg-neutral-150/60 p-4 rounded-3xl border border-gray-150/50 max-h-[85vh] overflow-y-auto custom-scrollbar">
                     <div className="text-xs font-black text-gray-400 mb-2.5 uppercase tracking-wider flex justify-between items-center">
                       <span>当前分析原文信件</span>
                       {activeCase ? (
                         <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">内置经典案例</span>
                       ) : (
                         <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-bold">用户自选公文</span>
                       )}
                     </div>

                     <div className="w-full bg-white border border-gray-155 rounded-2xl flex flex-col items-center justify-center overflow-x-auto overflow-y-auto relative shadow-sm p-1.5 flex-1 min-h-[300px]">
                       {activeCase ? (
                         <div className="w-full h-full md:max-h-[500px] overflow-y-auto custom-scrollbar p-1 select-none flex justify-center bg-gray-50/20 rounded-xl">
                           {renderDocumentHTML(activeCase, true)}
                         </div>
                       ) : (
                         filePreview && (
                           <img src={filePreview} alt="Preview" className="w-full h-full max-h-[500px] object-contain p-2 bg-white/5" />
                         )
                       )}
                     </div>

                     <button 
                       onClick={() => setShowDocModal(true)}
                       className="mt-3.5 w-full bg-[#1C362B] hover:bg-neutral-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex justify-center items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                     >
                       <Eye size={13}/>
                       <span>📄 放大查阅高清原始公文 (1:1 A4放大)</span>
                     </button>
                   </div>

                   {/* Right Column: AI Translation & Responses */}
                   <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar max-h-[85vh]">
                     <div className="bg-[#FFF4F2] p-6 rounded-2xl border border-[#FEE6E3]">
                    <div className="text-[10px] font-bold text-[#FE6D5D] tracking-widest mb-3 uppercase flex items-center space-x-2">
                       <span className="w-2 h-2 rounded-full bg-[#FE6D5D]"></span>
                       <span>它在说什么 & 痛感折算</span>
                    </div>
                    <div className="text-gray-900 font-medium text-sm mb-4 markdown-body">
                       <Markdown>{analysis.summary}</Markdown>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white font-medium text-sm text-[#D84C3E] flex items-start space-x-3 shadow-sm">
                       <span className="text-xl leading-none mt-0.5">💔</span>
                       <div className="leading-snug markdown-body flex-1">
                          <Markdown>{analysis.painConversion}</Markdown>
                       </div>
                    </div>
                 </div>

                 <div className="bg-[#F8F6F1] p-6 rounded-2xl mb-8 border border-[#EBE8E0]">
                    <div className="text-[10px] font-bold text-[#1C362B] tracking-widest mb-4 uppercase flex items-center space-x-2">
                       <span className="w-2 h-2 rounded-full bg-[#1C362B]"></span>
                       <span>💡 下一步核心建议</span>
                    </div>
                    <ul className="space-y-4">
                      {analysis.actionPlan.map((action, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm text-gray-700 bg-white/50 p-3 rounded-xl">
                          <CheckCircle2 size={18} className="text-[#1C362B] flex-shrink-0 mt-0.5" />
                          <div className="markdown-body -mt-0.5">
                             <Markdown>{action}</Markdown>
                          </div>
                        </li>
                      ))}
                    </ul>
                 </div>

                 <div className="mt-8 flex-1 flex flex-col border-t border-gray-100 pt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">拟定英文回信</h3>
                    
                    <div className="bg-[#FFF8E7] p-5 rounded-xl border border-[#FBEAC3] mb-6 flex items-start space-x-4 shadow-sm">
                       <div className="w-10 h-10 rounded-full bg-[#EAB252]/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#EAB252]/30">
                          <AlignLeft size={18} className="text-[#B58529]" />
                       </div>
                       <div>
                          <h4 className="text-[11px] font-bold text-[#B58529] tracking-widest mb-1.5 uppercase">对线策略（中文意图）</h4>
                          <div className="text-sm font-medium text-gray-800 markdown-body leading-relaxed">
                             <Markdown>{analysis.englishDraft.intention}</Markdown>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col space-y-4 mb-6">
                       <div className="flex items-center space-x-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100 focus-within:border-gray-300 focus-within:bg-white transition-colors">
                          <span className="text-xs font-bold text-gray-400 whitespace-nowrap uppercase tracking-wider w-12">发给</span>
                          <input 
                            type="email" 
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-bold text-gray-900 focus:outline-none"
                            placeholder="机构邮箱地址"
                          />
                       </div>
                       
                       <div className="flex items-center space-x-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                          <span className="text-xs font-bold text-gray-400 whitespace-nowrap uppercase tracking-wider w-12">主题</span>
                          <input 
                            type="text" 
                            value={analysis.englishDraft.subject}
                            readOnly
                            className="flex-1 bg-transparent text-sm font-bold text-gray-900 focus:outline-none placeholder-gray-400"
                            placeholder="邮件主题"
                          />
                       </div>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-4 mb-6">
                       <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-2 px-1">
                             <label className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">英文原稿（可自由修改）</label>
                             <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold">Editable</span>
                          </div>
                          <textarea 
                            value={draftBody}
                            onChange={(e) => setDraftBody(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-sm font-sans focus:outline-none focus:ring-2 ring-gray-200 hover:border-gray-300 transition-colors resize-none h-[320px] shadow-sm leading-relaxed"
                          />
                       </div>
                       
                       {currentTranslation && (
                          <div className="flex-1 flex flex-col">
                             <div className="flex items-center justify-between mb-2 px-1">
                               <label className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">中文精准对照</label>
                               {isTranslating && <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><div className="w-2 h-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> 翻译中...</span>}
                             </div>
                             <div className="w-full bg-[#FBFBFA] border border-gray-100 rounded-2xl p-5 text-sm font-sans resize-none h-[320px] shadow-inner overflow-y-auto leading-relaxed text-gray-600 markdown-body">
                                <Markdown>{currentTranslation}</Markdown>
                             </div>
                          </div>
                       )}
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center">
                       <p className="text-xs text-gray-400 font-medium mb-5 text-center leading-relaxed max-w-md">
                         AI 仅辅助生成草稿，<strong className="text-gray-500">发送前请仔细检查 [中括号] 内的信息</strong>。本服务不构成法律或学术建议。
                       </p>
                       
                       <div className="w-full max-w-md">
                         <button 
                           onClick={handleSend} 
                           className="w-full bg-[#1C362B] hover:bg-[#152920] text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-xl shadow-[#1C362B]/20 transition-all hover:-translate-y-0.5 active:scale-95"
                         >
                            <img src="https://www.gstatic.com/images/branding/product/1x/gmail_32dp.png" alt="Gmail" className="w-5 h-5 filter brightness-0 invert" />
                            <span>前往网页版 Gmail 发送</span>
                            <ExternalLink size={16} className="ml-1 opacity-70" />
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
             )}

             {appState === 'sent' && (
               <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-12">
                  <div className="w-24 h-24 bg-[#EBF1ED] text-[#1C362B] rounded-full flex items-center justify-center mb-8 shadow-inner border border-[#1C362B]/10">
                    <Send size={40} className="ml-2" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-4 font-serif">已跳转至网页版 Gmail！</h3>
                  <p className="text-gray-500 text-base max-w-sm mb-10 leading-relaxed">
                    请在弹出的窗口中确认并发送。这道难关，就快跨过去了。
                  </p>
                  
                  <button onClick={reset} className="text-[#1C362B] font-bold bg-white border-2 border-[#1C362B] hover:bg-[#1C362B] hover:text-white px-10 py-4 rounded-full transition-all shadow-sm flex items-center space-x-2 active:scale-95">
                     <span>处理下一封信</span>
                     <ArrowRight size={18} />
                  </button>
               </div>
             )}

          </div>
        </div>

        {/* High-Definition Original Document Overlay Modal */}
        {showDocModal && (activeCase || filePreview) && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-[#FAF9F5] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
              <div className="bg-[#1C362B] text-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#EAB252]"/>
                  <span className="font-extrabold text-xs md:text-sm">
                    {activeCase ? `${CASE_GUIDES[activeCase].title} - 官方正本 A4 高清阅览` : '已上传公文 - 高清放大阅览'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowDocModal(false)}
                  className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full text-white transition-colors cursor-pointer"
                  title="关闭"
                >
                  <X size={15}/>
                </button>
              </div>

              <div className="p-4 md:p-8 overflow-y-auto bg-gray-100 flex-1 flex justify-center custom-scrollbar">
                <div className="w-full max-w-2xl overflow-x-auto">
                  {activeCase ? (
                    renderDocumentHTML(activeCase, false)
                  ) : (
                    filePreview && (
                      <div className="flex justify-center bg-white p-4 rounded-xl border shadow-sm">
                        <img src={filePreview} alt="Uploaded Document Original" className="max-w-full max-h-[70vh] object-contain rounded" />
                      </div>
                    )
                  )}
                </div>
              </div>

              {appState !== 'result' && (
                <div className="bg-[#1C362B]/5 px-6 py-4 flex justify-end gap-2 border-t text-xs">
                  <button 
                    onClick={() => {
                      setShowDocModal(false);
                      submitForAnalysis();
                    }}
                    className="bg-[#FE6D5D] hover:bg-[#ff5642] text-white font-extrabold py-2.5 px-6 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>一键对该公文进行Ai深度解析与写信申诉</span>
                    <ArrowRight size={14}/>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
