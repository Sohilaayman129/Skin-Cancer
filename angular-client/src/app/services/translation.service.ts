import { Injectable, signal, effect } from '@angular/core';

export type Language = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Header
  brand_name: { en: 'Grounded', ar: 'جراوندد' },
  brand_badge: { en: 'Clinical AI', ar: 'الذكاء الاصطناعي السريري' },
  brand_subtitle: { 
    en: 'USPSTF Skin Cancer & ATSDR Toxicology Guidelines', 
    ar: 'إرشادات USPSTF لسرطان الجلد وسموم ATSDR' 
  },
  stack_text: { en: 'Angular 19 + .NET 9 API', ar: 'أنغيولار 19 + .NET 9 API' },
  incognito_active: { en: 'Incognito Mode Active', ar: 'وضع التصفح الخفي نشط' },
  incognito_tooltip: { 
    en: 'Toggle Incognito Consultation (No History Stored)', 
    ar: 'تبديل وضع الاستشارة الخفية (بدون حفظ السجل)' 
  },
  theme_tooltip: { en: 'Toggle Dark/Light Mode', ar: 'تبديل الوضع الليلي / النهاري' },
  lang_name: { en: 'العربية', ar: 'English' },

  // Sidebar
  new_consultation: { en: 'New Consultation', ar: 'استشارة سريرية جديدة' },
  clinical_history: { en: 'Clinical History', ar: 'سجل الاستشارات' },
  no_saved_consultations: { en: 'No saved consultations yet.', ar: 'لا توجد استشارات محفوظة حتى الآن.' },
  guideline_benchmarks: { en: 'Guideline Benchmarks', ar: 'نماذج أسئلة استرشادية' },
  delete_session: { en: 'Delete Session', ar: 'حذف الجلسة' },
  uspstf_policy: { en: 'USPSTF 2018 Policy', ar: 'سياسة USPSTF 2018' },
  target_group: { en: 'Target Group:', ar: 'الفئة المستهدفة:' },
  target_group_val: { en: '6 mo – 24 yrs (Grade B)', ar: '6 أشهر – 24 سنة (توصية B)' },
  adults_val_label: { en: 'Adults >24y:', ar: 'البالغون >24 سنة:' },
  adults_val: { en: 'Insufficient Ev. (Grade I)', ar: 'أدلة غير كافية (توصية I)' },
  safety_gate_label: { en: 'Safety Gate:', ar: 'حائط الأمان:' },
  safety_gate_val: { en: '5-Tier Pre-Gen Filter', ar: 'فلتر أمان خماسي المراحل' },

  // Pipeline Stage Tracker
  pipeline_title: { en: 'Evidence-Bound Pipeline Execution', ar: 'مراحل معالجة الأدلة السريرية' },
  step_risk: { en: '1. Risk Classifier', ar: '1. مصنف الأمان' },
  step_retrieval: { en: '2. Dense Retrieval', ar: '2. استرجاع الأدلة' },
  step_grounded: { en: '3. Grounded LLM', ar: '3. التوليد المقيد' },
  step_validation: { en: '4. Fact Gate', ar: '4. بوابـة التحقق' },
  thinking_default: { 
    en: 'Retrieving evidence & generating grounded response...', 
    ar: 'جاري استرجاع الأدلة السريرية وتوليد الإجابة الموثقة...' 
  },

  // Chat Input
  input_placeholder: { 
    en: 'Ask an evidence-bound clinical question (e.g. USPSTF counseling recommendations, ABCDE screening, ATSDR toxicology)...', 
    ar: 'اطرح سؤالاً إكلينيكياً مقيداً بالأدلة (مثل إرشادات USPSTF، معايير ABCDE للشامات، سموم ATSDR)...' 
  },
  send_consultation: { en: 'Send Consultation', ar: 'إرسال الاستشارة' },
  clear_input: { en: 'Clear', ar: 'تفريغ' },
  disclaimer_note: { 
    en: 'Clinical Decision Support Assistant strictly grounded in USPSTF 2018/2023 guidelines & ATSDR profile. Educational and clinical support only.', 
    ar: 'نظام دعم قرار سريري مقيد بإرشادات USPSTF و ATSDR. للاستخدام التعليمي والاسترشادي الطبي فقط.' 
  },

  // Message Card & Claims
  risk_tier_label: { en: 'Risk Tier', ar: 'مستوى الخطر' },
  confidence_label: { en: 'Confidence', ar: 'مستوى الثقة' },
  safety_notice: { en: 'Safety Notice', ar: 'تنبيه الأمان' },
  evidence_citations_title: { en: 'Verifiable Evidence Citations', ar: 'الأدلة والاقتباسات السريرية الموثقة' },
  claims_verified_suffix: { en: 'claims · verified', ar: 'ادعاءات · تم التحقق' },
  source_passage_btn: { en: 'Source Passage', ar: 'المقطع الأصلي' },
  grounded_claim_tag: { en: 'Grounded Claim', ar: 'ادعاء موثق' },
  gap_title: { en: 'Evidence Boundary & Diagnostic Limitation (Gap)', ar: 'الحدود التشخيصية والفجوة المعرفية' },
  retrieval_inspect_title: { en: 'Dense Retrieval Inspection', ar: 'فحص مقاطع الاسترجاع الدلالي' },
  top_score_label: { en: 'Top Score', ar: 'أعلى درجة' },
  gate_threshold_label: { en: 'Gate Threshold', ar: 'عتبة القبول' },
  copy_response: { en: 'Copy Consultation', ar: 'نسخ الاستشارة' },

  // Evidence Drawer
  drawer_title: { en: 'Evidence & Guideline Passage', ar: 'تفاصيل المقطع والدليل السريري' },
  drawer_subtitle: { 
    en: 'Verifiable clinical excerpt from official guideline', 
    ar: 'مقتطف سريري موثق من الإرشادات الرسمية' 
  },
  claim_statement: { en: 'Claim Statement:', ar: 'نص الادعاء الطبي:' },
  official_passage: { en: 'Official Guideline Excerpt:', ar: 'النص الرسمي من الإرشادات:' },
  meta_document: { en: 'Document', ar: 'الوثيقة' },
  meta_section: { en: 'Section', ar: 'القسم' },
  meta_page: { en: 'Page', ar: 'الصفحة' },
  meta_chunk_id: { en: 'Chunk ID', ar: 'معرف المقطع' },
  copy_passage_btn: { en: 'Copy Passage', ar: 'نسخ المقطع' },
  copied_text: { en: 'Copied!', ar: 'تم النسخ!' },
  close_btn: { en: 'Close Drawer', ar: 'إغلاق' }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'grounded_app_lang';
  
  // Current language signal
  currentLang = signal<Language>(this.getInitialLanguage());

  constructor() {
    // Synchronize HTML dir and lang attributes
    effect(() => {
      const lang = this.currentLang();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      }
    });
  }

  private getInitialLanguage(): Language {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem(this.STORAGE_KEY) as Language;
    return saved === 'ar' || saved === 'en' ? saved : 'en';
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch {}
  }

  toggleLanguage() {
    const next = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(next);
  }

  isArabic(): boolean {
    return this.currentLang() === 'ar';
  }

  t(key: string): string {
    const item = TRANSLATIONS[key];
    if (!item) return String(key);
    return item[this.currentLang()] || item['en'] || String(key);
  }
}
