import type { Language } from "@/lib/i18n/types";

/**
 * UI-chrome message catalogue. English is the typed source of truth; the
 * other languages are partial and fall back to English automatically.
 *
 * Clinical wording (safety questions, questionnaire prompts, profile copy,
 * recommendations, disclaimers) does NOT live here — see clinical-drafts.ts.
 */
const en = {
  // Navigation & shared chrome
  "nav.back": "Back",
  "nav.next": "Next",
  "nav.continueAbove": "Continue above",
  "nav.goToSummary": "Go to summary",
  "nav.startAssessment": "Start assessment",
  "nav.viewDemo": "View demo (Mr Tan)",
  "nav.demoLoaded": "Demo data loaded.",
  "nav.openReport": "Open report",
  "nav.backToAssessment": "Back to assessment",
  "progress.step": "Step {current} of {total}",
  "listen.label": "Listen",
  "listen.stop": "Stop",

  // Landing
  "landing.kicker": "A calm, guided health check",
  "landing.pathwayTitle": "What to expect",
  "landing.pathway.safety": "Safety check",
  "landing.pathway.confidence": "Confidence questions",
  "landing.pathway.movement": "Movement check",
  "landing.pathway.summary": "Your summary",
  "landing.pathwayNote":
    "Higher-risk tests are skipped when an earlier screen suggests it is not safe to continue.",
  "landing.plannersLink": "For planners: population insights (demo)",

  // Consent screen
  "consent.title": "Before we begin",
  "consent.support": "Two quick questions about how your answers are used.",
  "consent.assessment.label":
    "I understand this is a guided screening — not a diagnosis — and I agree to take part today.",
  "consent.research.title": "Help Singapore plan better ageing support",
  "consent.research.body":
    "You can contribute your anonymised results — never your name or contact details — to aggregate statistics that help place community programmes like Active Ageing Centres where they are needed. This is optional, and everything works the same if you say no.",
  "consent.research.yes": "Yes, count my anonymised results in",
  "consent.research.no": "No, keep my results on this device only",
  "consent.area.label": "Your neighbourhood",
  "consent.area.help":
    "Helps planners see which neighbourhoods need more support. Choose the area, not your address.",
  "consent.privacyNote":
    "We never track your location — this app cannot access GPS at all. Your neighbourhood is only ever what you choose to tell us, and results are combined with many others before anyone sees them.",

  // Safety screen
  "safety.title": "Let's check it is safe to start",
  "safety.answer.yes": "Yes",
  "safety.answer.no": "No",

  // Contact screen (merged emergency contact + about you)
  "contact.title": "Who should we contact if you need support?",
  "contact.support":
    "Please add someone who can be contacted if you feel unsafe during the movement test.",
  "contact.name": "Name",
  "contact.phone": "Phone",
  "contact.relationship": "Relationship",
  "contact.aboutYou": "About you",
  "contact.aboutYouSupport":
    "These details help the team read the screening summary in context.",
  "contact.displayName": "Your name",
  "contact.age": "Age",
  "contact.livingSituation": "Living situation",
  "contact.trustNote":
    "These details stay in this session on this device. They are used only so someone can support you if needed.",

  // Questionnaire
  "questionnaire.progress": "Question {current} of {total}",
  "questionnaire.scaleLow": "0 = not confident",
  "questionnaire.scaleHigh": "10 = fully confident",

  // Physical tests chrome
  "test.guidedSetup": "Guided setup",
  "test.guidedTest": "Guided test",
  "test.status": "Status",
  "test.results": "Results",
  "test.otherOptions": "Other safe options",
  "test.stopTest": "Stop test",
  "test.elapsed": "Seconds elapsed",
  "test.safetyReminder":
    "Stop at once if you feel dizzy, breathless, or unsafe.",

  // Dashboard
  "dashboard.eyebrow": "Your movement & confidence summary",
  "dashboard.ability": "Ability",
  "dashboard.confidence": "Confidence",
  "dashboard.profileTitle": "Ability-confidence profile",
  "dashboard.riskTitle": "Functional-falls risk",
  "dashboard.recommendationsTitle": "Care recommendations",
  "dashboard.careLinkageTitle": "Care linkage",
  "dashboard.metrics.chairStand": "Chair stand",
  "dashboard.metrics.gait": "Gait walk",
  "dashboard.metrics.floorRising": "Floor rising",
  "dashboard.metrics.confidenceAverage": "Confidence average",
  "dashboard.momentum.title": "Keep the momentum going",
  "dashboard.momentum.body":
    "Join walking groups, classes, and gentle practice near you, and keep track of your active days.",
  "dashboard.momentum.cta": "Visit the community hub",

  // Bands & risk labels (never render raw enum values)
  "band.ability.good": "Good",
  "band.ability.reduced": "Reduced",
  "band.ability.poor": "Low",
  "band.confidence.good": "Good",
  "band.confidence.low": "Lower",
  "band.risk.low": "Low — maintain and monitor",
  "band.risk.moderate": "Moderate — support recommended",
  "band.risk.high": "High — seek support or professional review",

  // Status values
  "status.completed": "Completed",
  "status.stopped": "Stopped",
  "status.skipped": "Skipped",
  "status.demo": "Demo",
  "status.notRecorded": "Not recorded",

  // Community
  "community.title": "Community hub",
  "community.support":
    "Stay active with people near you. Activities, encouragement, and gentle practice clips.",
  "community.weekTitle": "Your week",
  "community.activitiesTitle": "Join an activity",
  "community.clipsTitle": "Gentle practice clips",
  "community.cheer": "Cheer",
  "community.cheered": "Cheered",
  "community.join": "Join",
  "community.joined": "Joined",
  "community.activeDays": "{count} of {total} active days",
  "community.practised": "I practised today",
  "community.practisedDone": "Practised today",
  "community.nearYou": "Near you",
  "community.demoNote":
    "Demonstration content — community posts and activities shown here are fictional.",
} as const;

export type MessageKey = keyof typeof en;

/* Demonstration drafts — confirm with native speakers before real use. */
const zh: Partial<Record<MessageKey, string>> = {
  "nav.back": "返回",
  "nav.next": "下一步",
  "nav.continueAbove": "请在上方继续",
  "nav.goToSummary": "查看总结",
  "nav.startAssessment": "开始评估",
  "nav.viewDemo": "查看演示（陈先生）",
  "nav.demoLoaded": "已载入演示数据。",
  "nav.openReport": "打开报告",
  "nav.backToAssessment": "返回评估",
  "consent.title": "开始之前",
  "consent.support": "两个关于您的回答如何被使用的简短问题。",
  "consent.assessment.label":
    "我了解这是一次引导式筛查（不是诊断），并同意今天参与。",
  "consent.research.title": "帮助新加坡更好地规划乐龄支持",
  "consent.research.body":
    "您可以将匿名结果（绝不包含姓名或联系方式）贡献给汇总统计，帮助在有需要的社区设置活跃乐龄中心等项目。这是自愿的，选择“否”也不影响使用。",
  "consent.research.yes": "好，把我的匿名结果算进去",
  "consent.research.no": "不，结果只保留在本设备",
  "consent.area.label": "您的社区",
  "consent.area.help":
    "帮助规划人员了解哪些社区需要更多支持。只需选择区域，不需要地址。",
  "consent.privacyNote":
    "我们绝不追踪您的位置——本应用完全无法使用 GPS。您的社区只来自您自己的选择，且结果会与许多人的数据合并后才会被查看。",
  "progress.step": "第 {current} 步，共 {total} 步",
  "listen.label": "朗读",
  "listen.stop": "停止",
  "landing.kicker": "平和、有引导的健康检查",
  "landing.pathwayTitle": "评估流程",
  "landing.pathway.safety": "安全检查",
  "landing.pathway.confidence": "信心问题",
  "landing.pathway.movement": "动作测试",
  "landing.pathway.summary": "您的总结",
  "landing.pathwayNote": "如早前检查显示不宜继续，风险较高的测试将被跳过。",
  "landing.plannersLink": "规划人员：人口洞察（演示）",
  "safety.title": "先确认今天适合开始",
  "safety.answer.yes": "是",
  "safety.answer.no": "否",
  "contact.title": "如果您需要支持，我们应联系谁？",
  "contact.support": "请添加一位在动作测试中感到不安全时可以联系的人。",
  "contact.name": "姓名",
  "contact.phone": "电话",
  "contact.relationship": "关系",
  "contact.aboutYou": "关于您",
  "contact.aboutYouSupport": "这些信息帮助团队更好地理解筛查总结。",
  "contact.displayName": "您的姓名",
  "contact.age": "年龄",
  "contact.livingSituation": "居住情况",
  "contact.trustNote":
    "这些信息只保存在本设备的本次会话中，仅用于在需要时联系支持者。",
  "questionnaire.progress": "第 {current} 题，共 {total} 题",
  "questionnaire.scaleLow": "0 = 没有信心",
  "questionnaire.scaleHigh": "10 = 完全有信心",
  "test.guidedSetup": "引导设置",
  "test.guidedTest": "引导测试",
  "test.status": "状态",
  "test.results": "结果",
  "test.otherOptions": "其他安全选项",
  "test.stopTest": "停止测试",
  "test.elapsed": "已用秒数",
  "test.safetyReminder": "如感到头晕、气促或不安全，请立即停止。",
  "dashboard.eyebrow": "您的动作与信心总结",
  "dashboard.ability": "能力",
  "dashboard.confidence": "信心",
  "dashboard.profileTitle": "能力-信心档案",
  "dashboard.riskTitle": "功能性跌倒风险",
  "dashboard.recommendationsTitle": "关怀建议",
  "dashboard.careLinkageTitle": "关怀链接",
  "dashboard.metrics.chairStand": "椅子起立",
  "dashboard.metrics.gait": "步行",
  "dashboard.metrics.floorRising": "地面起身",
  "dashboard.metrics.confidenceAverage": "平均信心",
  "dashboard.momentum.title": "保持这份动力",
  "dashboard.momentum.body":
    "加入附近的步行小组、课程和轻柔练习，并记录您的活跃天数。",
  "dashboard.momentum.cta": "前往社区中心",
  "band.ability.good": "良好",
  "band.ability.reduced": "减弱",
  "band.ability.poor": "较低",
  "band.confidence.good": "良好",
  "band.confidence.low": "较低",
  "band.risk.low": "低 — 保持并观察",
  "band.risk.moderate": "中等 — 建议获得支持",
  "band.risk.high": "高 — 请寻求支持或专业评估",
  "status.completed": "已完成",
  "status.stopped": "已停止",
  "status.skipped": "已跳过",
  "status.demo": "演示",
  "status.notRecorded": "未记录",
  "community.title": "社区中心",
  "community.support": "与身边的人一起保持活跃。活动、鼓励和轻柔的练习短片。",
  "community.weekTitle": "您的一周",
  "community.activitiesTitle": "加入活动",
  "community.clipsTitle": "轻柔练习短片",
  "community.cheer": "加油",
  "community.cheered": "已加油",
  "community.join": "加入",
  "community.joined": "已加入",
  "community.activeDays": "{total} 天中有 {count} 天保持活跃",
  "community.practised": "我今天练习了",
  "community.practisedDone": "今天已练习",
  "community.nearYou": "在您附近",
  "community.demoNote": "演示内容——此处的社区帖子和活动均为虚构。",
};

const ms: Partial<Record<MessageKey, string>> = {
  "nav.back": "Kembali",
  "nav.next": "Seterusnya",
  "nav.continueAbove": "Teruskan di atas",
  "nav.goToSummary": "Ke ringkasan",
  "nav.startAssessment": "Mula penilaian",
  "nav.viewDemo": "Lihat demo (Encik Tan)",
  "nav.demoLoaded": "Data demo dimuatkan.",
  "nav.openReport": "Buka laporan",
  "progress.step": "Langkah {current} daripada {total}",
  "listen.label": "Dengar",
  "listen.stop": "Berhenti",
  "landing.kicker": "Pemeriksaan kesihatan yang tenang dan berpandu",
  "landing.pathwayTitle": "Apa yang dijangkakan",
  "landing.pathway.safety": "Semakan keselamatan",
  "landing.pathway.confidence": "Soalan keyakinan",
  "landing.pathway.movement": "Ujian pergerakan",
  "landing.pathway.summary": "Ringkasan anda",
  "landing.pathwayNote":
    "Ujian berisiko tinggi dilangkau jika semakan awal menunjukkan tidak selamat untuk diteruskan.",
  "safety.title": "Mari pastikan selamat untuk bermula",
  "safety.answer.yes": "Ya",
  "safety.answer.no": "Tidak",
  "questionnaire.progress": "Soalan {current} daripada {total}",
  "questionnaire.scaleLow": "0 = tidak yakin",
  "questionnaire.scaleHigh": "10 = sangat yakin",
  "test.stopTest": "Hentikan ujian",
  "test.safetyReminder":
    "Berhenti serta-merta jika rasa pening, sesak nafas, atau tidak selamat.",
  "band.ability.good": "Baik",
  "band.ability.reduced": "Berkurang",
  "band.ability.poor": "Rendah",
  "band.confidence.good": "Baik",
  "band.confidence.low": "Lebih rendah",
  "band.risk.low": "Rendah — kekalkan dan pantau",
  "band.risk.moderate": "Sederhana — sokongan disyorkan",
  "band.risk.high": "Tinggi — dapatkan sokongan atau semakan profesional",
  "community.title": "Hab komuniti",
  "community.weekTitle": "Minggu anda",
  "community.activitiesTitle": "Sertai aktiviti",
  "community.clipsTitle": "Klip latihan lembut",
  "community.cheer": "Sorak",
  "community.cheered": "Disorak",
  "community.join": "Sertai",
  "community.joined": "Disertai",
};

const ta: Partial<Record<MessageKey, string>> = {
  "nav.back": "பின்",
  "nav.next": "அடுத்து",
  "nav.continueAbove": "மேலே தொடரவும்",
  "nav.goToSummary": "சுருக்கத்திற்கு",
  "nav.startAssessment": "மதிப்பீட்டைத் தொடங்கு",
  "nav.viewDemo": "டெமோ பார்க்க (திரு. டான்)",
  "nav.demoLoaded": "டெமோ தரவு ஏற்றப்பட்டது.",
  "nav.openReport": "அறிக்கையைத் திற",
  "progress.step": "படி {current} / {total}",
  "listen.label": "கேளுங்கள்",
  "listen.stop": "நிறுத்து",
  "landing.kicker": "அமைதியான, வழிகாட்டப்பட்ட உடல்நலப் பரிசோதனை",
  "landing.pathwayTitle": "என்ன எதிர்பார்க்கலாம்",
  "landing.pathway.safety": "பாதுகாப்புச் சரிபார்ப்பு",
  "landing.pathway.confidence": "நம்பிக்கை கேள்விகள்",
  "landing.pathway.movement": "இயக்கச் சோதனை",
  "landing.pathway.summary": "உங்கள் சுருக்கம்",
  "landing.pathwayNote":
    "முந்தைய சரிபார்ப்பு பாதுகாப்பற்றது எனக் காட்டினால், அதிக ஆபத்துள்ள சோதனைகள் தவிர்க்கப்படும்.",
  "safety.title": "தொடங்குவது பாதுகாப்பானதா என்று சரிபார்ப்போம்",
  "safety.answer.yes": "ஆம்",
  "safety.answer.no": "இல்லை",
  "questionnaire.progress": "கேள்வி {current} / {total}",
  "questionnaire.scaleLow": "0 = நம்பிக்கை இல்லை",
  "questionnaire.scaleHigh": "10 = முழு நம்பிக்கை",
  "test.stopTest": "சோதனையை நிறுத்து",
  "test.safetyReminder":
    "தலைச்சுற்றல், மூச்சுத் திணறல் அல்லது பாதுகாப்பின்மை உணர்ந்தால் உடனே நிறுத்துங்கள்.",
  "band.ability.good": "நல்லது",
  "band.ability.reduced": "குறைந்தது",
  "band.ability.poor": "குறைவு",
  "band.confidence.good": "நல்லது",
  "band.confidence.low": "குறைவானது",
  "band.risk.low": "குறைவு — தொடர்ந்து கவனிக்கவும்",
  "band.risk.moderate": "மிதமானது — ஆதரவு பரிந்துரைக்கப்படுகிறது",
  "band.risk.high": "அதிகம் — ஆதரவு அல்லது நிபுணர் மதிப்பாய்வு தேவை",
  "community.title": "சமூக மையம்",
  "community.weekTitle": "உங்கள் வாரம்",
  "community.activitiesTitle": "செயல்பாட்டில் சேருங்கள்",
  "community.clipsTitle": "மென்பயிற்சி காணொளிகள்",
  "community.cheer": "ஊக்கம்",
  "community.cheered": "ஊக்கப்பட்டது",
  "community.join": "சேர்",
  "community.joined": "சேர்ந்தது",
};

export const catalogues: Record<
  Language,
  Partial<Record<MessageKey, string>>
> = { en, zh, ms, ta };

export function getMessage(
  lang: Language,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const raw = catalogues[lang][key] ?? en[key];
  if (!vars) {
    return raw;
  }
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    raw,
  );
}
