import type { Language } from "@/lib/i18n/types";

/**
 * DEMONSTRATION TRANSLATION DRAFTS for clinical copy.
 *
 * The English wording in `src/content/*` and `src/config/*` is authoritative
 * and is never edited from here. These drafts exist so the demo can show the
 * flow in Singapore's four official languages; they have NOT been reviewed by
 * native-speaking clinicians and must be confirmed before any real use.
 *
 * Keys mirror the ids of the source content so lookups stay stable:
 *   safety.<questionId>            — safety screen questions
 *   feq.<questionId>.domain/prompt — falls-efficacy questionnaire
 *   profile.<profileId>.title/interpretation
 *   recommendation.<id>.title/body
 *   careLinkage.<id>.title/description
 *   disclaimer.decisionSupport
 *   safetyStop.body                — the unsafe-branch stop message
 */
const drafts: Record<Exclude<Language, "en">, Record<string, string>> = {
  zh: {
    "safety.intro":
      "开始之前，我们需要确认您今天进行简单的椅子起立动作测试是安全的。",
    "safetyStop.body":
      "请暂时不要继续进行动作测试。请考虑请人协助，或向社区或医疗专业人员寻求建议。您只能以演示模式继续。",
    "safety.dizziness": "您今天感到头晕吗？",
    "safety.breathlessness": "您今天异常气促吗？",
    "safety.pain": "您是否有胸痛、剧烈疼痛或使站立不安全的疼痛？",
    "safety.recentFallOrInjury": "您最近是否有未经检查的跌倒或受伤？",
    "safety.needsSupervision": "您是否需要有人在旁才能安全站立？",
    "feq.balanceConfidence.domain": "平衡信心",
    "feq.balanceConfidence.prompt":
      "在日常行走或站立时，您对保持平衡有多大信心？",
    "feq.balanceRecoveryConfidence.domain": "恢复平衡信心",
    "feq.balanceRecoveryConfidence.prompt":
      "当您感到不稳时，您对恢复平衡有多大信心？",
    "feq.safeFallingConfidence.domain": "安全跌倒信心",
    "feq.safeFallingConfidence.prompt":
      "如果开始跌倒，您对保护自己有多大信心？",
    "feq.postFallRecoveryConfidence.domain": "跌倒后恢复信心",
    "feq.postFallRecoveryConfidence.prompt":
      "跌倒后，您对获得帮助或安全恢复有多大信心？",
    "profile.stable_profile.title": "能力与信心相互匹配",
    "profile.stable_profile.interpretation":
      "在本次筛查总结中，动作能力与信心表现一致。",
    "profile.under_confidence.title": "能力良好但信心较低",
    "profile.under_confidence.interpretation":
      "这种模式可能表示尽管能力尚可，但存在回避活动的倾向。建立信心和循序渐进的练习可能有帮助。",
    "profile.possible_risk_taking.title": "能力减弱但信心较高",
    "profile.possible_risk_taking.interpretation":
      "这种模式可能表示信心高于目前的动作表现。有监督的支持和安全意识可能有帮助。",
    "profile.high_vulnerability.title": "能力减弱且信心较低",
    "profile.high_vulnerability.interpretation":
      "本次筛查总结显示功能和信心两方面都值得关注。建议在支持下练习并作进一步评估。",
    "recommendation.maintain-activity.title": "保持安全活动",
    "recommendation.maintain-activity.body":
      "继续规律的安全活动，并留意信心或功能的变化。",
    "recommendation.supported-practice.title": "考虑有支持的练习",
    "recommendation.supported-practice.body":
      "有监督或社区型的课程可能有助于保持力量、平衡和信心。",
    "recommendation.community-linkage.title": "连接社区支持",
    "recommendation.community-linkage.body":
      "活跃乐龄中心或社区健康站可以协助护理导航和后续跟进。",
    "recommendation.pause-unsupervised-testing.title":
      "在继续动作测试前先寻求支持",
    "recommendation.pause-unsupervised-testing.body":
      "今天请避免继续无监督的动作测试。请考虑寻求照护者、社区护理人员或医疗专业人员的支持。",
    "recommendation.physiotherapy-review.title": "考虑物理治疗评估",
    "recommendation.physiotherapy-review.body":
      "如果问题持续、加重或影响日常活动，物理治疗评估可能有帮助。",
    "careLinkage.active_ageing_centre.title": "活跃乐龄中心",
    "careLinkage.active_ageing_centre.description":
      "可考虑社区活动、筛查或支持。",
    "careLinkage.community_health_post.title": "社区健康站",
    "careLinkage.community_health_post.description":
      "如有功能方面的顾虑，可考虑评估或护理导航。",
    "careLinkage.physiotherapy_clinic.title": "物理治疗诊所",
    "careLinkage.physiotherapy_clinic.description":
      "如问题持续、加重或风险较高，可考虑物理治疗评估。",
    "disclaimer.decisionSupport":
      "Physio-Aid 提供决策支持和筛查信息。这不是诊断，也不能取代合格医疗专业人员的评估。",
  },
  ms: {
    "safety.intro":
      "Sebelum bermula, kami perlu memastikan selamat untuk anda melakukan ujian pergerakan bangun dari kerusi yang mudah hari ini.",
    "safetyStop.body":
      "Sila jangan teruskan ujian pergerakan buat masa ini. Pertimbangkan untuk meminta seseorang membantu anda, atau dapatkan nasihat daripada profesional komuniti atau kesihatan. Anda hanya boleh teruskan dalam mod demo.",
    "safety.dizziness": "Adakah anda rasa pening hari ini?",
    "safety.breathlessness": "Adakah anda luar biasa sesak nafas hari ini?",
    "safety.pain":
      "Adakah anda mengalami sakit dada, sakit teruk, atau sakit yang menjadikan berdiri tidak selamat?",
    "safety.recentFallOrInjury":
      "Adakah anda baru-baru ini terjatuh atau tercedera dan belum diperiksa?",
    "safety.needsSupervision":
      "Adakah anda memerlukan seseorang berdekatan untuk berdiri dengan selamat?",
    "feq.balanceConfidence.domain": "Keyakinan keseimbangan",
    "feq.balanceConfidence.prompt":
      "Sejauh mana anda yakin dapat mengekalkan keseimbangan semasa berjalan atau berdiri seharian?",
    "feq.balanceRecoveryConfidence.domain": "Keyakinan memulihkan keseimbangan",
    "feq.balanceRecoveryConfidence.prompt":
      "Sejauh mana anda yakin dapat memulihkan keseimbangan jika rasa tidak stabil?",
    "feq.safeFallingConfidence.domain": "Keyakinan jatuh dengan selamat",
    "feq.safeFallingConfidence.prompt":
      "Sejauh mana anda yakin tahu cara melindungi diri jika mula terjatuh?",
    "feq.postFallRecoveryConfidence.domain":
      "Keyakinan pemulihan selepas jatuh",
    "feq.postFallRecoveryConfidence.prompt":
      "Sejauh mana anda yakin dapat mendapatkan bantuan atau pulih dengan selamat selepas terjatuh?",
    "disclaimer.decisionSupport":
      "Physio-Aid menyediakan sokongan keputusan dan maklumat saringan. Ia bukan diagnosis dan tidak menggantikan penilaian oleh profesional penjagaan kesihatan yang bertauliah.",
  },
  ta: {
    "safety.intro":
      "தொடங்கும் முன், இன்று ஒரு எளிய நாற்காலியில் இருந்து எழுந்திருக்கும் இயக்கச் சோதனையைச் செய்வது உங்களுக்குப் பாதுகாப்பானதா என்று சரிபார்க்க வேண்டும்.",
    "safetyStop.body":
      "தற்போது இயக்கச் சோதனையைத் தொடர வேண்டாம். யாரையாவது துணைக்கு அழைக்கவும் அல்லது சமூக அல்லது சுகாதார நிபுணரின் ஆலோசனையைப் பெறவும். டெமோ முறையில் மட்டுமே தொடரலாம்.",
    "safety.dizziness": "இன்று உங்களுக்கு தலைச்சுற்றல் உள்ளதா?",
    "safety.breathlessness":
      "இன்று வழக்கத்திற்கு மாறாக மூச்சுத் திணறல் உள்ளதா?",
    "safety.pain":
      "நெஞ்சு வலி, கடுமையான வலி அல்லது நிற்பதைப் பாதுகாப்பற்றதாக்கும் வலி உள்ளதா?",
    "safety.recentFallOrInjury":
      "சமீபத்தில் பரிசோதிக்கப்படாத விழுகை அல்லது காயம் ஏற்பட்டதா?",
    "safety.needsSupervision":
      "பாதுகாப்பாக நிற்க அருகில் யாராவது தேவையா?",
    "feq.balanceConfidence.domain": "சமநிலை நம்பிக்கை",
    "feq.balanceConfidence.prompt":
      "அன்றாட நடை அல்லது நிற்கும் போது சமநிலையை பராமரிக்க எவ்வளவு நம்பிக்கை உள்ளது?",
    "feq.balanceRecoveryConfidence.domain": "சமநிலை மீட்பு நம்பிக்கை",
    "feq.balanceRecoveryConfidence.prompt":
      "நிலையற்றதாக உணர்ந்தால் சமநிலையை மீட்டெடுக்க எவ்வளவு நம்பிக்கை உள்ளது?",
    "feq.safeFallingConfidence.domain": "பாதுகாப்பான விழுகை நம்பிக்கை",
    "feq.safeFallingConfidence.prompt":
      "விழத் தொடங்கினால் உங்களைப் பாதுகாத்துக்கொள்ளத் தெரியும் என எவ்வளவு நம்பிக்கை உள்ளது?",
    "feq.postFallRecoveryConfidence.domain":
      "விழுகைக்குப் பின் மீட்பு நம்பிக்கை",
    "feq.postFallRecoveryConfidence.prompt":
      "விழுந்த பிறகு உதவி பெற அல்லது பாதுகாப்பாக மீள எவ்வளவு நம்பிக்கை உள்ளது?",
    "disclaimer.decisionSupport":
      "Physio-Aid முடிவு ஆதரவு மற்றும் திரையிடல் தகவலை வழங்குகிறது. இது நோயறிதல் அல்ல; தகுதிவாய்ந்த சுகாதார நிபுணரின் மதிப்பீட்டுக்கு மாற்றாகாது.",
  },
};

/**
 * Returns the draft translation for a clinical string, falling back to the
 * authoritative English text when no draft exists.
 */
export function clinicalText(
  lang: Language,
  id: string,
  englishText: string,
): string {
  if (lang === "en") {
    return englishText;
  }
  return drafts[lang][id] ?? englishText;
}
