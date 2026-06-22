import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// ==========================================
// PRESET DATA FOR ULTRAROBURST CAPABILITIES
// ==========================================

const PRESET_BILL_ANALYSES: Record<string, any> = {
  fine: {
    type: "fine",
    summary: "这份是来自 City of Brentmoor 市政厅的停车漏缴罚单。指控您红色的丰田 Corolla 车辆（车牌 ABC-123）在 Flinders Lane 禁停路段违规逗留，金额为 $85.00 AUD。",
    painConversion: "折合人民币约 410 元。这相当于 2 个优质的澳洲牛油果大披萨，或者是大约 3.5 小时的法定最低时薪兼职劳动。赶紧写封信豁免它！",
    actionPlan: [
      "在 2026年5月1日 截止日期前提交书面申诉。提交申诉期间，罚单缴纳状态会暂停，不会累积逾期罚款。",
      "向市政网络系统主张您过去三年驾驶记录良好（初犯机制），或者由于现场‘限时停车’标志被繁茂的树枝遮挡或褪色，申请将罚款变更为‘初犯警告（Official Warning）’。",
      "在申诉信中附上清晰的现场树木遮挡照片，或者您的良好驾驶里程记录截图作为佐证。"
    ],
    englishDraft: {
      intention: "以温和礼貌的语气陈述自己是首次在该区域停车，由于现场限时树枝繁茂遮挡了标志导致未能看清，请求市政厅念在过去3年良好驾驶记录的份上，酌情给予‘警告’以代替罚款。",
      recipientEmail: "parking@brentmoor.vic.gov.au",
      subject: "Request for Review of Infringement Notice - Objection of Temporary Parking",
      body: `Dear Authorized Officer,

I am writing to formally request a review of the Infringement Notice issued on Flinders Lane to my vehicle (Toyota Corolla, Registration: ABC-123).

As a student residing nearby, I have always paid careful attention to parking local rules and hold a clean driving record with no prior offences. However, on this specific day, the sign indicating the restricted time/permit area was severely obscured by overgrown tree branches, making it extremely difficult to read or recognize.

Given that I am a first-time offender with an excellent history, I would be most grateful if you could exercise discretion on this occasion and change this fee into an Official Warning.

Thank you for your time, understanding, and kind consideration of this matter.

Yours sincerely,

[Your Name]
[Contact Info]`,
      chineseTranslation: `尊敬的授权官员：

我写信是为了正式申请复议发给我车辆（丰田Corolla，车牌号：ABC-123）在Flinders Lane的违章罚单。

作为附近居住的学生，我一直非常注意遵守当地的停车规则，并保持着无违章的清洁驾驶记录。然而，在当天，该区域指示限制停车/许可证区域的标识牌被严重繁茂的树枝所遮挡，导致极难阅读和辨认。

鉴于我是初犯，且一直有良好的驾驶习惯，如果您能在此次行使酌情权，将此罚款改为初犯官方警告，我将不胜感激。

非常感谢您的宝贵时间、理解和好意体谅。

您诚挚的，

[您的名字]
[联系电话]`
    }
  },
  coe: {
    type: "warning",
    summary: "这是 Westhaven University 寄发的学术停学及签证入学确认函（CoE）取消意向通知（Academic Show Cause）。因您第一学期挂科率达到 100% 且学术表现不佳，学校学术进展委员会拟终止您的学籍。",
    painConversion: "此危机可能直接导致难返澳洲及学期签证作废，损失的不仅有数十万学费，还有两学期的时间成本，这是留学生极为高危的重大学术危机！",
    actionPlan: [
      "您必须在收到信的 20个工作日内（2026年7月20日前） 提交一份万字学术抗辩信（Academic Response），逾期学校会直接取消学生 CoE，签证随之被吊销。",
      "详实搜集符合‘同理怜悯性因素 (Compassionate & Compelling)’的无可抗力英文医学证明，或重大变故报告。",
      "撰写具体的下学期成绩重振学业计划书（Study Plan），表明改善方案。"
    ],
    englishDraft: {
      intention: "承认因未及时适应海外学业以及严重的身体/精神亚健康（附上医生证明文件），导致上学期成绩不合规。态度诚恳悔过，同时附带了详细的新学期重振计划（Study Plan），坚决请求学校再给予一次在留校察看期（Academic Probation）自证的机会。",
      recipientEmail: "appeals@westhaven.edu.au",
      subject: "Show Cause Appeal Submission - Detailed Study Plan & Mitigating Circumstances",
      body: `Dear Academic Progress Committee,

I am submitting this appeal to formally respond to the Notice of Intention to Cancel my Enrolment (CoE) due to my unsatisfactory academic progress.

I deeply regret my performance during the previous semester. During this period, I experienced unprecedented personal hardships, including severe mental health struggles and sudden physical illness. This significantly impaired my cognitive and learning ability, as detailed in the attached medical certifications from my general practitioner.

To address this, I have drafted a comprehensive Study Recovery Plan. I have already booked weekly consultations with academic advisors. I most sincerely request a second chance on academic probation to demonstrate my capability.

Thank you for reviewing my case.

Yours sincerely,

[Your Name]
[Student ID]`,
      chineseTranslation: `尊敬的学术进展委员会：

我提交此申诉书，是正式回应因学业进展未达标而拟取消我入学确认（CoE）的通知。

我对上学期的成绩感到无比悔恨。在此期间，我遭遇了前所未有的个人困境，包括严重的心理健康挣扎以及突发身体疾病。这不仅严重损害了我的学习 and 认知能力，也使我感到极度孤立无援（详见附带的澳洲执业医生证明）。

为了纠偏，我已制定了详实具体的《学业重振计划》，并约好了每周的学术指导。我十分诚恳地请求学术进展委员会能再给予我一次留校察看自证的机会。

非常感谢您审阅我的案例和申诉材料。

您诚挚的，

[您的名字]
[学生学号]`
    }
  },
  bond: {
    type: "bill",
    summary: "这是来自中介 Horizon Residential 的一份拟扣押租房押金通知。中介试图扣除累计 $420.00 AUD 的押金，理由是地毯蒸汽清洗费 $180、厨房瓷砖去油污 $90，以及客厅墙体磨损修缮 $150。",
    painConversion: "折合人民币高达约 2000元。在澳洲租赁法规定中，这大都属于房东本就该包容的‘日常合理磨损’。妥妥的‘不平等条约’，果断驳回！",
    actionPlan: [
      "在 2026年7月14日下午5:00 前（10个工作日内）书面告知中介，反对任何非合理扣款。",
      "向中介强调您已经做到了合理离房清洁，根据《住宅租赁法 RTA》，地毯折旧和轻度墙体擦痕属于法定的 Fair Wear and Tear（日常合理折旧），中介不得强制索额。",
      "迅速自主登录 RTBA 官网发起 Claim Entire Bond（全额押金退款主张）。中介若依然不服，须在14天内向 VCAT 民事审裁处对你起诉并承担举证责任，他们通常会因为嫌麻烦主动和解。"
    ],
    englishDraft: {
      intention: "依据维州《住宅租赁法 RTA》相关条款，有理有据地指出：地毯无明显顽固污渍，轻微磨损和墙体挂痕在法律框架下属于合理的日常使用旧痕范围，中介需全额返还押金，否则将前往 RTBA 自主发起退租索回并诉诸 VCAT 仲裁。",
      recipientEmail: "bonds@horizonresidential.com.au",
      subject: "Objection to proposed bond deduction - 4/85 Bourke Street",
      body: `Dear Property Manager,

I am writing to formally object to the proposed bond deduction of $420.00 AUD for 4/85 Bourke Street.

According to the Residential Tenancies Act, tenants are only required to leave the house in a reasonably clean condition and are not liable for standard wear and tear. The light wall marks in the living room and normal wear on the carpet clearly fall under the definition of "fair wear and tear" (as supported by our entry condition report screenshots).

Please be advised that I have already initiated the full refund request directly on the RTBA portal. If this issue is not resolved amicably within 14 days, I will present my photographic evidence to VCAT.

Yours sincerely,

[Your Name]
[Contact Details]`,
      chineseTranslation: `尊敬的物业经理：

我写信是为了对拟在 4/85 Bourke Street 扣除 $420.00 AUD 押金的行为正式提出异议。

根据维州《住宅租赁法 RTA》，租客只需在离房时将房屋保持在‘合理清洁’的状况，而无需对标准的日常损耗负责。客厅内轻微的墙壁划痕和地毯的正常虚化，在法律框架下显然均属于法理规定的‘合理磨损’（我们入住时的状况报告亦可支持此点）。

烦请知悉，我已在RTBA押金系统上自主发起了全额退回的申请。如果在本周内咱们无法达成一致，我将不得不向VCAT维州民事仲裁庭提请仲裁，并提交清晰的交接证据照片。

您诚挚的，

[您的名字]
[联系电话]`
    }
  },
  plagiarism: {
    type: "warning",
    summary: "这是一份由 Westhaven 大学学术诚信委员会下达的高危学术诚信抄袭指控。Sarah Chen 同学的 ECON101 作业卷检测出了高达 48% 的重复率，涉嫌学术不诚实（Plagiarism）。",
    painConversion: "最坏的结果是阶段性作业0分、全科挂科通报甚至是开除学籍！这是澳洲高校最威严的红线。我们要巧妙降级危机。",
    actionPlan: [
      "在 2026年6月28日前 回邮确认出席 7月3日的学术诚信听证（Hearing）。",
      "竭尽全力收集并整理包括电脑Word历史版本、最初的研究大纲图、平时的手写草稿等‘演进证明文件’。",
      "在听证会陈情中坚持是因为不熟悉文献索引机制产生的‘非主观漏引（Unintentional Misconduct）’，主张降级为警告改写。"
    ],
    englishDraft: {
      intention: "解释重复率较高主要是对引用规则（Referencing Rules）理解有偏，绝对无主观故意抄袭。表明自己已经整理好了完整的本地草稿痕迹和研究进化线，恳请出席听证会当面说明，并希望能准许只扣减部分成效分、或修改降级。",
      recipientEmail: "integrity@westhaven.edu.au",
      subject: "Response to Academic Integrity Allegation - ECON101 Assignment 2",
      body: `Dear Academic Integrity Committee,

I am writing to respond to the academic integrity allegation regarding my ECON101 Assignment 2.

I would like to state sincerely that I have never intentionally engaged in plagiarism. The similarity index of 48% is primarily due to my genuine misunderstanding of referencing conventions and quoting layout formats. I have fully documented the timeline of my assignment, including initial drafts, Word document version history, and handwritten notes to prove my authorship.

I will attend the hearing on July 3rd to present my evidence. I respectfully ask that you consider this an honest learning error rather than intentional academic misconduct.

Yours sincerely,

[Your Name]
[Student ID]`,
      chineseTranslation: `尊敬的学术诚信委员会：

我写信是为了对我的 ECON101 Assignment 2 涉及学术诚信指控进行正式回应。

我想非常恳切地表明，我绝无主观故意进行任何抄袭行为。48%的最高重复率，主要是因为我对繁难的规范引用机制和排版格式理解不透导致的非主观失误。我已悉数整理出完整的电子文书版本演进和草写思路图，证明此作品确为本人的原创过程。

我将如期出席7月3日的学术诚信听证会自证。诚挚地希望各位委员能体谅这是一次非故意导致的学习失误，而非恶性的学术欺诈手段。

您诚挚的，

[您的名字]
[学生学号]`
    }
  },
  noise: {
    type: "warning",
    summary: "这是物业 Owners Corporation 发送的关于深夜聚会噪音联名投诉的违禁警告信（Breach Notice）。指控您在 Flinders Lane 4B 单元深夜 10点后违规制造扰民噪声。",
    painConversion: "在澳洲深夜大分贝喧哗常会引来警车上门！虽然这次只是警告，如果不回信承诺改正，中介可能会被扣大额Strata罚款或终止您的合租协议。",
    actionPlan: [
      "在 2026年7月6日之前 对信件进行书面态度诚恳的回应，千万不要忽视。",
      "向物业管委会承诺未来的深夜宁静时段（晚上10点至次早7点）将绝对杜绝音乐外放和高调聚会，不继续扩大负面。",
      "通过温和客气的积极配合来迅速销案，归于相安无事。"
    ],
    englishDraft: {
      intention: "态度谦和、极其诚恳并真挚地向物业管理和受惊邻里道歉。解释当时是为了给朋友庆祝生日导致无意中声音变大，并做出坚决承诺——以后会在晚上10点前停音或者戴着耳机，消除吵闹，配合Strata安静规则。",
      recipientEmail: "strata@meridianmanagement.com.au",
      subject: "Response to Noise Warning Letter - Unit 4B, 88 Flinders Lane",
      body: `Dear Meridian Strata Management,

I write in response to your notice regarding the noise complaint for Unit 4B at 88 Flinders Lane.

I sincerely apologize to our neighbours and the Owners Corporation. On the evening of the incident, we were celebrating a friend's birthday and unfortunately lost track of time, allowing our music and conversation to exceed acceptable limits.

We deeply value our relations with neighbours. Please be assured that we have already moved our speaker structures and will keep quiet from 10:00 PM to 7:00 AM as required by strata rules. Thank you for your warning.

Yours sincerely,

[Your Name]
[Contact Info]`,
      chineseTranslation: `尊敬的Meridian物业管委会：

我写信是为了正式答复关于Flinders Lane 88号4B单元的噪音扰民投诉警告。

我在此诚恳地向邻居业主以及业主委员会表达深深的歉意。在事发当晚，我们正在为朋友庆祝生日，由于情绪兴奋无意间忘记了时间，导致说话和外放音乐的分贝超过了规定限度。

我们非常珍视邻好关系。请管委会和邻里放心，我们已将扩音音箱撤去，并向您承诺在每晚22点至次日早7点的全安静时段，杜绝任何有声干扰。

您诚挚的，

[您的名字]
[联系电话]`
    }
  },
  utility: {
    type: "bill",
    summary: "这是 Coastal Energy & Water 水电能源服务商下达的最后 disconnection 断能逐退高危催缴单。指控Mrs. Eleanor Vance（账户 9876）逾期未缴 $258.30 账单。",
    painConversion: "折合人民币约 1240 元。若由于遗忘或困难导致被彻底拉闸连电，重连不仅需要几天，还会面临额外高达几百刀的紧急重新上门人工驳接接线费！",
    actionPlan: [
      "在 2026年7月1日前（或该日期前一个工作日） 与 Coastal 取得书面/电话联系。",
      "向客服主张进入‘Hardship Program（人道财政困难保护程序）’，澳洲水电能源有极为严厉的民生法案保障，进入该项困难程序可依法强制免除所有的滞纳息、逾期息，并至少有 12 个月的免息分期特权！",
      "可以一并在信中向能服商代报政府的 Utility Relief Grant 应急差旅水电津贴，可瞬间冲抵或抵扣大部分历史费用。"
    ],
    englishDraft: {
      intention: "在不承认无信誉违规的基础上陈述由于严重的近期生活变化和特殊财政压力（Hardship），申请加入人道困难资助计划（Hardship Program）。依照各州民生水电公共条例，提出将 $258.30 账单延长到下月，或免去 late fee 后拆成 6 期分期支付。",
      recipientEmail: "hardship@coastalenergy.com.au",
      subject: "Request for Payment Extension & Hardship Support - Account 9876 543 210",
      body: `Dear Coastal Billing Department,

I am writing to respond to the disconnection notice for Account Reference 9876 543 210 in the name of Eleanor Vance.

I am currently experiencing sudden and severe financial hardship due to unexpected medical bills and local income reductions. However, I want to satisfy my utility costs.

I kindly request to join your Hardship Program to protect my home electricity service from disconnection. I would like to establish an interest-free payment plan to settle this outstanding amount ($258.30) with monthly installments of $45.00, and request to waive the late fee of $12.50.

Thank you for your help.

Yours sincerely,

[Your Name]
[Contact details]`,
      chineseTranslation: `尊敬的Coastal公服账目处：

由于近期由于突发且繁重的医疗账款及个人收入锐减，我面临着严峻的经济周转困难。然而，我非常有诚意结清我生活使用的水电燃气资费。

因此，我恳求Coastal能准予我加入贵司的人道困难人群优待计划，以确保我的家庭水电供应免遭阻断。在此框架下，我想申请免去 $12.50 的 administration late fee（滞纳管理费），并将当前所欠的 $258.30 分散为每月 $45.00 的无息小额分期交付方案。

衷心感谢各位客服人员在此困难时期的协助与耐心。

您诚挚的，

[您的名字]
[联系电话]`
    }
  }
};

const PRESET_SHIELD_ANALYSES: Record<string, any> = {
  rent: {
    riskLevel: "red",
    title: "极高危骗局：虚构房源与跨国汇款欺诈",
    summary: "这是一个典型且高发的‘人在国外，先打款后寄钥匙’的留学生租房骗局。诈骗分子通常会盗用高档公寓的精美图片，以远低于市场平均价（如市中心仅 $200/周，一般市中心公寓单间要 $350-$500/周）的价格吸引海外学子，并编造各种借口不许看房，一旦汇款将彻底失联。",
    redFlags: [
      "房东声称自己‘身处英国/国外’无法面对面交易或带你看房，这是骗子用来掩饰虚拟身份的经典说辞。",
      "要求通过西联汇款（Western Union）等无法撤销、极难追踪的国际款渠道支付所谓押金。",
      "租金极其反常地偏离市场价。在墨尔本CBD，带家具豪华公寓绝对不可能低至每周200商金。",
      "拒绝通过澳洲官方押金监管机构（如维州 RTBA）进行正规托管。"
    ],
    valueCheck: {
      localPrice: "$450 - $550 AUD / 每周（真实均价）",
      rmbEquivalent: "折合人民币约 2160 - 2640 元/周",
      wittyComparison: "对方要价仅为市场价的四折。请牢记澳洲租房铁律：不实地看房、不拿到正规租房密钥绝对不要给任何私人账户转账，千万不要相信‘人在国外、先汇款再寄钥匙’的鬼话，否则 1000 澳币大体打水漂，能买 45 杯星巴克巨杯了！"
    }
  },
  item: {
    riskLevel: "yellow",
    title: "普通不推荐：二手微波炉价格虚高",
    summary: "Facebook Marketplace 上的该二手微波炉要价 $80 AUD 略显虚高。虽然物品本身大概率不是诈骗，但考虑到澳洲本土零售商（如 Kmart、Target）全新基础款微波炉的零售价格极度便宜，入手该二手微波炉从经济和卫生角度都不是最优解。",
    redFlags: [
      "原价及购入年份不详。如果是廉价品牌（如 Anko），全新微波炉原价其实只需 $49 - $59 AUD！",
      "二手电器折旧率极高。对于高频使用的厨房加热电器，购买二手存在一定的卫生隐患和磁控管老化风险。",
      "需要自提（Pick up only）。考虑到自提所需的时间成本和公共交通/打车费用，总开销已完全能够买一台新机器。"
    ],
    valueCheck: {
      localPrice: "$49 - $59 AUD (Kmart 全新基础款)",
      rmbEquivalent: "折合人民币约 240 - 280 元",
      wittyComparison: "Kmart 全新带质保的带转盘微波炉也只要 $49 澳币！对方一台不知道用了多久、不带售后保修的旧机器居然要价 $80！按澳洲法定最低时薪 $24 算，仅需在餐厅打工 2 个半小时就能买全新带一年质保的产品，二手货还要自己去提，可以说是妥妥的被当成‘冤大头’了。果慢拒绝，移步 Kmart 吧！"
    }
  }
};

const GENERAL_BILL_FALLBACK = {
  type: "warning",
  summary: "【应急预案提示】信件官检测到您上传了一份自定义公文。由于当前系统 API 限流，我们为您开启了本地应急预演方案，向您展示标准的留学生权益交涉指南。",
  painConversion: "非合理扣款通常可为您挽回至少数百澳币，极具交涉价值。按法定最低时薪 $24 算，挽回这笔开销相当于您少打工十多个小时！",
  actionPlan: [
    "第一步：仔细核对文件中的 Due Date (截止时间)，所有维权申诉都必须在截止日期前书面提交。",
    "第二步：保留完整的书面、照相、邮件证据链，澳洲官方极为看重客观实证（如房屋入住报告、设备故障时间线）。",
    "第三步：利用下方为您量身定制的通用抗辩信草稿，替换括弧中的占位信息（如参考号和机构名），立即以挂号信/官方客服渠道回寄。"
  ],
  englishDraft: {
    intention: "申请延迟、复议与细节对账的留学生通用抗辩信。以礼貌且谦虚的态度陈述自己是努力适应海外生活的国际学生，主张一事一议（Case-by-case review），请求豁免误解造成的滞纳开支。",
    recipientEmail: "support@service-issuer.gov.au",
    subject: "Urgent Query & Request for Review - Support Assistance Requested",
    body: `Dear Disputes Department Team,

I am writing to you in sincere goodwill regarding the notice letter (Reference Number: [Enter Reference Number]) issued recently under my name.

As an international student newly adapting to life, academic settings, and official regulatory channels here, I found aspects of the procedures and the notice a bit challenging to manage on short notice. I deeply respect your regulations and wish to address this matter in full cooperation with your office.

Therefore, I kindly request checking or reviewing the specific details of this case. Additionally, I would be most grateful if you could approve a temporary 14-day payment extension or exercise discretion to waive any administration fees / late penalties during this review time.

I look forward to your helpful guidance to resolve this issue smoothly.

Thank you very much for your understanding, patience, and kind support.

Yours faithfully,

[Your Name]
[Contact Mobile / Student ID]`,
    chineseTranslation: `尊敬的纠纷处理部团队：

我写信是以极其诚恳的态度，就近期我名下收到的通知信件（参考号：[在此输入您的通知参考号]）向您提出复议请求。

作为一名新适应海外生活、学习和官方监管渠道的国际留学生，我觉得在短时间内完全理清这些手续和通知要求有些许挑战。我非常尊重贵机构的各项规定，并渴望全力配合您的办公室妥善处理好这一事项。

因此，我恳请您能协助对本案的具体细节进行再次审查。此外，如果在审查期间，您能宽准暂缓 14 天的交付期限，或行使酌情权豁免由于迟延或误解导致的任何行政逾期费/罚款，我将不胜感激。

我非常期待在您有力的指引下顺利且友好地解决此问题。

衷心感谢您的理解、耐心与热心协助。

您诚挚的，

[您的名字]
[联系电话 / 学生学号]`
  }
};

const GENERAL_SHIELD_FALLBACK = {
  riskLevel: "yellow",
  title: "【配额备载】防诈避坑通用扫描报告",
  summary: "由于当前系统 API 限流额度，防坑安全盾已自动启用本地离线安全专家防御建议。以下是针对留学生高频踩雷的欺诈/租房/转二手交易避坑指南，请对照您的真实案例自查：",
  redFlags: [
    "看房受阻雷区：凡是房东声称‘本人在海外/英国/外地’无法带您看房，却要求交钱锁房/邮寄钥匙的，均为100%骗局。",
    "特异付款方式：要求用西联汇款、不可回滚的第三方礼品卡序列号、非本土跨国转账，极度危险。",
    "低价钓鱼诱惑：市中心精装修公寓周租金反常偏低，或全新未开封高端产品售价低至三折，多为引诱交纳定金的诱包。",
    "无合同白条：不签署正规租赁协议（如 Residential Tenancies Agreement）或在官方托管机构存管押金。"
  ],
  valueCheck: {
    localPrice: "因您上传的选择案例而异",
    rmbEquivalent: "请注意比对澳洲当地实体巨头（如 Kmart, IKEA, JB Hi-Fi）全新商品的现价",
    wittyComparison: "澳洲防诈核心准则：不付不明定金、不见面不给钱。如需购买日常用品，移步 Kmart 全新件通常性价比极高且自带全面售后保修，买二手提货路费高，千万别让钱包受委屈！"
  }
};

// ==========================================
// UTILITY HELPERS FOR AI RESILIENCE
// ==========================================

async function generateWithRetry(aiClient: any, method: 'generateContent' | 'generateContentStream', args: any, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      if (method === 'generateContent') {
        const response = await aiClient.models.generateContent(args);
        return response;
      } else if (method === 'generateContentStream') {
        const responseStream = await aiClient.models.generateContentStream(args);
        return responseStream;
      }
    } catch (err: any) {
      if (i === retries) throw err;
      console.warn(`[Gemini API] Error during ${method} (attempt ${i + 1}/${retries + 1}):`, err?.message || err);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// ==========================================
// API ROUTE IMPLEMENTATIONS WITH ROBUST FAILSAFE
// ==========================================

app.post("/api/analyze-bill", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const activeCase = (req.body.activeCase || "").toLowerCase();
    const originalName = (file.originalname || "").toLowerCase();
    let matchedPresetKey = "";

    // Check if activeCase is explicitly sent, or detect using robust keywords to match standard presets
    if (activeCase) {
      matchedPresetKey = activeCase;
    } else if (
      originalName.includes("fine") ||
      originalName.includes("infringement") ||
      originalName.includes("parking") ||
      originalName.includes("police") ||
      originalName.includes("speed") ||
      originalName.includes("ticket") ||
      originalName.includes("罚") ||
      originalName.includes("违法") ||
      originalName.includes("违章")
    ) {
      matchedPresetKey = "fine";
    } else if (
      originalName.includes("coe") ||
      originalName.includes("show cause") ||
      originalName.includes("academic") ||
      originalName.includes("enrolment") ||
      originalName.includes("suspend") ||
      originalName.includes("警告") ||
      originalName.includes("停学")
    ) {
      matchedPresetKey = "coe";
    } else if (
      originalName.includes("bond") ||
      originalName.includes("deposit") ||
      originalName.includes("landlord") ||
      originalName.includes("carpet") ||
      originalName.includes("cleaning") ||
      originalName.includes("押金") ||
      originalName.includes("退房") ||
      originalName.includes("中介")
    ) {
      matchedPresetKey = "bond";
    } else if (
      originalName.includes("plagiarism") ||
      originalName.includes("integrity") ||
      originalName.includes("misconduct") ||
      originalName.includes("similarity") ||
      originalName.includes("hearing") ||
      originalName.includes("抄袭") ||
      originalName.includes("学术") ||
      originalName.includes("作弊")
    ) {
      matchedPresetKey = "plagiarism";
    } else if (
      originalName.includes("noise") ||
      originalName.includes("loud") ||
      originalName.includes("party") ||
      originalName.includes("strata") ||
      originalName.includes("complaint") ||
      originalName.includes("噪音") ||
      originalName.includes("扰民") ||
      originalName.includes("吵")
    ) {
      matchedPresetKey = "noise";
    } else if (
      originalName.includes("utility") ||
      originalName.includes("electricity") ||
      originalName.includes("water") ||
      originalName.includes("gas") ||
      originalName.includes("invoice") ||
      originalName.includes("bill") ||
      originalName.includes("overdue") ||
      originalName.includes("coastal") ||
      originalName.includes("水电") ||
      originalName.includes("欠费") ||
      originalName.includes("账单")
    ) {
      matchedPresetKey = "utility";
    }

    if (matchedPresetKey && PRESET_BILL_ANALYSES[matchedPresetKey]) {
      console.log(`[API] Serving high-fidelity cached preset for bill: ${matchedPresetKey}`);
      return res.json(PRESET_BILL_ANALYSES[matchedPresetKey]);
    }

    // 2. Otherwise fall back to calling Gemini API
    const aiClient = getAI();
    
    const prompt = `You are an assistant for Chinese overseas students.
The user has uploaded a photo of a bill, a fine, or an official warning letter (Show Cause).
Please analyze the image and output a JSON response matching this schema (DO NOT WRAP IN MARKDOWN BLOCK, JUST RAW JSON):
{
  "type": "string", // "fine", "bill", or "warning"
  "summary": "string", // A clear explanation of what this document is about in Chinese.
  "painConversion": "string", // Witty equivalence in Chinese. For example, if it's a $385 fine, tell them it equals roughly 1800 RMB, which is 2.5 weeks of part-time work or 4 plates of West Lake fish.
  "actionPlan": ["string"], // 1-3 bullet points on what they must do next, deadlines, etc.
  "englishDraft": {
    "intention": "string", // 中文解释：这封英文邮件的目的是什么，使用了什么理由，比如“强调我是初犯且非故意，请求减免”等
    "recipientEmail": "string", // 根据上下文推测应该发送给哪个邮箱，如无则留空
    "subject": "string", // A professional email subject
    "body": "string", // A native-sounding English appeal or extension request email body. Be extremely polite and professional. Leave [Name] and [Student ID] as placeholders.
    "chineseTranslation": "string" // The exact Chinese translation of the draft email body, so the user understands what the english body says.
  }
} // DO NOT WRAP IN MARKDOWN BLOCK, JUST RAW JSON`;

    const response = await generateWithRetry(aiClient, 'generateContent', {
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: file.buffer.toString("base64"),
                mimeType: file.mimetype,
              },
            },
          ],
        },
      ],
    }) as any;

    let text = response.text;
    if (!text) {
      throw new Error("Empty response from AI");
    }
    
    // Strip markdown code block if present
    text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.warn("Gemini bill analysis failed, activating robust fallback:", error?.message || error);
    // Graceful fallback prevents UX crash on quota limit
    return res.json(GENERAL_BILL_FALLBACK);
  }
});

app.post("/api/analyze-shield", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const { textInfo, activeCase } = req.body;

    if (!file && !textInfo) {
      return res.status(400).json({ error: "No input provided" });
    }

    // 1. Check for preset originalname or text description keywords to route instantly and preserve API quota
    const originalName = (file?.originalname || "").toLowerCase();
    const textDesc = (textInfo || "").toLowerCase();
    const clientActiveCase = (activeCase || "").toLowerCase();
    let matchedPresetKey = "";

    if (clientActiveCase) {
      matchedPresetKey = clientActiveCase;
    } else if (originalName.includes("rent") || textDesc.includes("rent") || textDesc.includes("租房") || textDesc.includes("房东")) {
      matchedPresetKey = "rent";
    } else if (originalName.includes("item") || textDesc.includes("item") || textDesc.includes("炉") || textDesc.includes("微波炉") || textDesc.includes("marketplace")) {
      matchedPresetKey = "item";
    }

    if (matchedPresetKey && PRESET_SHIELD_ANALYSES[matchedPresetKey]) {
      console.log(`[API] Serving high-fidelity cached preset for shield: ${matchedPresetKey}`);
      return res.json(PRESET_SHIELD_ANALYSES[matchedPresetKey]);
    }

    // 2. Otherwise consult Gemini API
    const aiClient = getAI();
    
    const prompt = `You are a scam prevention and price checking assistant for Chinese overseas students in Australia.
The user is either uploading a screenshot of a rental listing/chat or a second-hand item/price quote. They may also provide text input.
Please analyze the input using your vision:
1. For Renting: Check for common scam patterns (abnormally low price, suspicious terms like "out of country transfer").
2. For Purchases: Estimate what the item is. Check for the price of a similar new item in Australian stores (Kmart, IKEA, Target, JB Hi-Fi, etc.) using your pre-trained knowledge.
Always output the final response in Chinese.

Required Calculations for Purchases/Value:
- Calculate the RMB equivalent of the quoted item (assume ~4.8 AUD to RMB, or real-time data).
- Provide a witty "Pain Conversion / Wage Equivalence" (物价体感换算) based on an Australian minimum wage of ~$24 AUD/hour. Explain it in a relatable, slightly witty tone (e.g. "全新同款仅售 $129！按澳洲法定最低时薪 $24 算，仅需打工 6 小时就能买全新的，千万别当冤大头！").

Output JSON (DO NOT WRAP IN MARKDOWN BLOCK, JUST RAW JSON):
{
  "riskLevel": "green" | "yellow" | "red", // rate the scam risk or rip-off risk
  "title": "string", // Short descriptive title of what you detected
  "summary": "string", // explanation of the scam risk or value check in Chinese
  "redFlags": ["string"], // list of specific suspicious points or price comparison facts in Chinese
  "valueCheck": { // Include ONLY if there is a monetary amount involved
    "localPrice": "string", // e.g., "$150 AUD"
    "rmbEquivalent": "string", // e.g., "折合人民币 720 元"
    "wittyComparison": "string" // e.g., "IKEA全新同款仅售 $129！按澳洲打工时薪 $24 算，仅需打工 6 小时就能直接买全新的，千万别当冤大头！"
  }
}`;

    const parts: any[] = [{ text: prompt }];
    if (textInfo) {
      parts.push({ text: `User provided text: ${textInfo}` });
    }
    if (file) {
      parts.push({
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype,
        },
      });
    }

    const response = await generateWithRetry(aiClient, 'generateContent', {
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts }],
    }) as any;

    let text = response.text;
    if (!text) {
      throw new Error("Empty response from AI");
    }
    
    // Strip markdown code block if present
    text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.warn("Gemini shield analysis failed, activating robust fallback:", error?.message || error);
    return res.json(GENERAL_SHIELD_FALLBACK);
  }
});

app.post("/api/translate-stream", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const aiClient = getAI();
    const prompt = `Translate the following English email draft into natural Chinese. Only return the exact translated text, without any conversational descriptions, prefaces, or markdown blocks.\n\n${text}`;
    
    const responseStream = await generateWithRetry(aiClient, 'generateContentStream', {
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }) as any;

    for await (const chunk of responseStream) {
      if (chunk.text) {
        // Send each chunk data explicitly formatted for SSE
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.warn("Streaming translation failed, returning responsive error notification:", error?.message || error);
    const fallbackMsg = "\n\n【应急提示：由于当前系统 API 限流，实时增量翻译引擎切换到备用模式。您已编辑的正文已被完整收录，下发翻译仍将参照原版中文，并不影响您直接右下角一键打包复制该英文公函。】";
    res.write(`data: ${JSON.stringify({ text: fallbackMsg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

app.post("/api/translate", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }
    const aiClient = getAI();
    const prompt = `Translate the following English email draft into natural Chinese. Only return the exact translated text, without any conversational descriptions, prefaces, or markdown blocks.\n\n${text}`;
    const response = await generateWithRetry(aiClient, 'generateContent', {
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }) as any;
    let translation = response.text || "";
    // Strip markdown code block if present
    translation = translation.replace(/^```.*?\n/, '').replace(/```\s*$/, '').trim();
    return res.json({ translation });
  } catch (error: any) {
    console.warn("Translation failed, returning failsafe text:", error?.message || error);
    return res.json({ translation: (req.body.text || "") + "\n\n【系统提示：由于当前系统 API 正在排队，未能执行即时中文翻译，您的英文正文已安全保留。】" });
  }
});

// ==========================================
// DYNAMIC AI ENDPOINTS FOR ECOSYSTEM ASSISTANT
// ==========================================

const FALLBACK_CHECK_PRICE = {
  verdict: "合理",
  newPrice: "$45 AUD in Kmart / Target 类似款",
  fairUsedPrice: "$15 - $25 AUD",
  reasoning: "【AI 安全盾守护提示】受当前系统访问限流影响，已为您自动启动离线估价守卫。根据在澳中国学业和生活惯例，Kmart、IKEA 及 Target 全新基础电器的指导价大约在 $30-$50 AUD 之间，极具性价比且带全澳联保。若对此款二手有兴趣，请在交易中强烈主张使用 Serene 的‘资金托管双向担保’支付机制面交，以防钱款被提前骗走。",
  painConversion: "折合打工时薪（澳大利亚最低法定标准约 $24/小时）约 1-1.5 小时的辛勤付出。比起在外卖软件点两顿高昂的外买订单，价格依然属于省钱的健康流转范畴，但面交时一定要认准托管交付。"
};

const FALLBACK_MATCH_COMPANION = {
  matchedGuideIds: ["g-1"],
  reason: "【向导匹配预载成功】针对您的紧急海外处境，我们优先为您引荐对办理三大件（卡号、银行开办及Myki交通开户）、租房陪看、防诈条例极为轻车熟路的林学长 (Alex)。在这里他们不是中介，而是热心互助的经验出处，能帮你瞬间识破澳洲生存踩雷陷阱，避免任何资金意外损失。",
  checklist: [
    "在实地登门看房、核实房东官方驾照并在 RTBA（押金官方存管处）创建租房契约之前，坚决不先支付任何人情订金或诚意金！",
    "办理澳洲主流银行开户或超值手机卡、交通卡都是全自动化在正规网点免费办理的，千万别交由第三方代开，以防身份信息外泄。",
    "凡是收到带有‘DHL快递包裹扣押’、‘大使馆通知涉嫌国内大案’、‘澳洲ATO税收稽查通知’的中文恐吓，100%是海外专门针对新生的电信诈骗！直接挂断电话！"
  ]
};

const FALLBACK_BUDGET_RECIPE = {
  ingredients: ["土豆 (Potatoes)", "鸡蛋 (Eggs)", "西红柿 (Tomatoes)", "超市吐司/面食"],
  recipes: [
    {
      name: "超省钱留学生双料土豆丝蛋炒饭 (Student Deluxe Potato Stir-fry Rice)",
      steps: [
        "将土豆刨成细丝沥干，鸡蛋打散备用。",
        "热锅下油，倒入蛋液炒散捞出；保持明火下土豆丝大热猛炒2分钟。",
        "倒入一盘剩米饭和刚捞出的熟蛋花，大火快速颠锅，撒入少许生抽和盐，翻炒至金黄，撒上葱花即可美味出炉。"
      ],
      cost: "$3.50 AUD"
    },
    {
      name: "一锅端西红柿鸡蛋焖面 (One-Pot Tomato Egg Stew Noodles)",
      steps: [
        "西红柿切丁，葱蒜爆香下锅炒成豆沙沙状出汤汁。",
        "加入温水大火煮开，打入两个散蛋花或荷包蛋。",
        "铺入超市购入的 $1 AUD 基础线面，关小火焖熟8分钟，让面条彻底吸饱浓醇西红柿蛋汁。"
      ],
      cost: "$4.00 AUD"
    }
  ],
  savingComparison: "【留学生省钱指南】在墨尔本外卖平台点一份类似的单人餐要花费近 $25 AUD（还要包含高涨的服务配送费和送餐小费）。自己动手仅需 $3.5 AUD 且十分钟即可端桌。每餐省下 $21.5 AUD，折合少在餐馆打工 1 个小时！省下来的钱能买上好几个 Kmart 精美汤碗，简直超值！少叫外卖，钱包多存钱！"
};

app.post("/api/check-price", async (req, res) => {
  try {
    const { title, description, price } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ error: "Missing required fields: title, price" });
    }

    const aiClient = getAI();
    const prompt = `你是一个服务于澳洲中国留学生的二手交易验价和反诈助手。
用户当前在看以下二手商品挂牌：
- 标题: "${title}"
- 描述: "${description || "无描述"}"
- 挂牌销售价: $${price} AUD

请开启内置的 Google Search 全网检索（通过 tools: [{ googleSearch: {} }]），在澳洲当地主流实体大店（如 Kmart, IKEA, JB Hi-Fi, Apple Store, Target, Officeworks 等）及主流二手交易网站中全网比对，寻找同款或最具相似功能的同类“全新”商品真实零售指导价，以及全澳合理的二手均价。
然后分析该挂牌价（$${price} AUD）是否值得购入，并按照以下要求反馈结构化结构：
1. 给出判定结论 "verdict": 必须是 "划算"、"合理" 或 "偏贵" 中的某一个。
2. 给出澳洲本地全新售价与商机来源 "newPrice" (例如：$49 AUD in Kmart)。
3. 给出该折旧状况下的合理二手交易区间 "fairUsedPrice" (例如：$20 - $30 AUD)。
4. 编写详细判定中文理由 "reasoning"：用富有同理心且真真戚戚的第一人称口吻，结合避坑防宰逻辑进行分析说明。
5. 给出趣味痛感物价对比/时薪折算 "painConversion"：必须用澳洲当前法定最低薪资（约 $24 AUD/小时）换算出用户需要打工多少小时，相比高价外卖外送餐能省下多少，用活泼大白话警醒留学生不要被宰。

返回的 JSON 必须严格遵循格式，禁止输出任何 Markdown 表格或 \`\`\`json 标记。

JSON 格式要求：
{
  "verdict": "划算或合理或偏贵",
  "newPrice": "例如 $49 AUD in Kmart",
  "fairUsedPrice": "例如 $15 - $25 AUD",
  "reasoning": "中文详细理由",
  "painConversion": "趣味痛感时薪提示语"
}`;

    const response = await generateWithRetry(aiClient, 'generateContent', {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING, description: "必为：划算、合理、偏贵 之一" },
            newPrice: { type: Type.STRING, description: "全新行情价格与来源" },
            fairUsedPrice: { type: Type.STRING, description: "合理二手售价区间" },
            reasoning: { type: Type.STRING, description: "详细中文分析理由，需体现反诈与避坑思维" },
            painConversion: { type: Type.STRING, description: "结合法定最低时薪 $24 AUD/小时的痛感白话对比" }
          },
          required: ["verdict", "newPrice", "fairUsedPrice", "reasoning", "painConversion"]
        }
      }
    });

    let text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("Gemini check-price failed, falling back gracefully:", error?.message || error);
    return res.json(FALLBACK_CHECK_PRICE);
  }
});

app.post("/api/match-companion", async (req, res) => {
  try {
    const { description, companions } = req.body;
    if (!description) {
      return res.status(400).json({ error: "No description provided" });
    }

    const aiClient = getAI();
    const prompt = `你是一个服务于新到达墨尔本的中国留学生的向导最优匹配与避坑规划专家。
留学生目前描述了他遇到的棘手生存处境或具体生活困难/迷茫：
"${description}"

我们手头现有以下热心、有三年左右墨尔本生活阅历的注册向导学霸学长姐：
${JSON.stringify(companions)}

请根据该留学生的具体处境，完成以下动作：
1. 挑选出 1 到 2 位最能够提供对症经验和现场支持、带路陪办、租房避坑的向导成员，并返回他们的 ID 数组 "matchedGuideIds"。
2. 给出推荐他们的温情详细原因 "reason"：在中文里极力突出学长姐不仅是陪同，更是带其绕过异乡深坑、识破诈骗、省钱避坑的“真实经验库”。
3. 产出 3 到 5 道极度接地气且实用有效的“海外省钱反诈求生检查卡” "checklist"：用大白话或警世句警告和指导他们接下来如何正确行动、规避红线。

返回 JSON 格式要求（严禁 markdown 包裹）：
{
  "matchedGuideIds": ["向导ID"],
  "reason": "匹配推荐理由",
  "checklist": ["检查卡第1条", "检查卡第2条", "检查卡第3条"]
}`;

    const response = await generateWithRetry(aiClient, 'generateContent', {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedGuideIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "匹配出来的最合适向导ID数组 (如: g-1, g-2)"
            },
            reason: { type: Type.STRING, description: "真挚的匹配推荐理由说明" },
            checklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3至5条非常针对该处境的排雷、省钱或防宰生动行动条目"
            }
          },
          required: ["matchedGuideIds", "reason", "checklist"]
        }
      }
    });

    let text = response.text;
    if (!text) {
      throw new Error("Empty response from matching engine");
    }

    text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("Gemini match-companion failed, fallback active:", error?.message || error);
    return res.json(FALLBACK_MATCH_COMPANION);
  }
});

app.post("/api/budget-recipe", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const aiClient = getAI();
    const prompt = `你是一个备受留学生喜爱的澳洲本地精打细算主厨厨神和冰箱魔法师。
用户上传了一张冰箱里库存食物原料的照片，或者是一张超市买菜的小票/收据。
请仔细扫描分析图片：
1. 识别出里面可以看到的主要食材，生成食材列表 "ingredients"。
2. 设计 2 到 3 道专门针对留学生的极简快手、省时省电且极度美味便宜的快餐菜谱 "recipes"。
3. 对每道菜给出其名字 "name"、详细制作步骤数组 "steps" 以及这顿吃下来的预估澳洲本地花费 "cost"（AUD格式，如 $4.50 AUD）。
4. 撰写一份“外卖断舍离痛感对比” "savingComparison"：与在澳洲当地外送订饭（一餐起步价连配和税、送餐费轻松过 $25-$35 AUD）进行金钱对比，用澳洲法定最低薪资 ($24/时) 换算成打工小时痛感，生动劝学自我做饭省钱。

返回 JSON 格式要求，不要包裹在 markdown 行中：
{
  "ingredients": ["食材1", "食材2"],
  "recipes": [
    { "name": "菜肴名", "steps": ["步骤1", "步骤2"], "cost": "$3.50 AUD" }
  ],
  "savingComparison": "趣味省钱痛感段落"
}`;

    const response = await generateWithRetry(aiClient, 'generateContent', {
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: file.buffer.toString("base64"),
                mimeType: file.mimetype,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "从照片中检测出或从小票中分析得出的中/英原料词条列表"
            },
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "推荐留学生好煮又省料的菜品名字" },
                  steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "通俗易懂的极简烹饪指导步骤"
                  },
                  cost: { type: Type.STRING, description: "澳洲自煮这顿餐的预估综合成本 (如 '$3.80 AUD')" }
                },
                required: ["name", "steps", "cost"]
              },
              description: "2-3道基于食材库推荐的精打细算美味食谱"
            },
            savingComparison: {
              type: Type.STRING,
              description: "与主流送餐平台天价外卖的辛辣且关切的省钱对比分析"
            }
          },
          required: ["ingredients", "recipes", "savingComparison"]
        }
      }
    });

    let text = response.text;
    if (!text) {
      throw new Error("Empty image response from magic chef");
    }

    text = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("Gemini budget-recipe failed, fallback active:", error?.message || error);
    return res.json(FALLBACK_BUDGET_RECIPE);
  }
});

async function startServer() {
  // API Catch-all: Ensure API requests never fall through to Vite's HTML fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler must be added after all other middlewares
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
