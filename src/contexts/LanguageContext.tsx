import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'ur' | 'es' | 'ar';

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const translations: Record<Lang, Record<string, string>> = {
  en: {
    home: 'Home',
    sign_in: 'Sign In',
    destinations: 'Destinations',
    profile: 'Profile',
    saved_itineraries: 'Saved Itineraries',
    admin_dashboard: 'Admin Dashboard',
    manage_bookings: 'Manage Bookings',
    manage_destinations: 'Manage Destinations',
    manage_itineraries: 'Manage Itineraries',
    manage_users: 'Manage Users',
    sign_out: 'Sign Out',
    trip_planner: 'Trip Planner',
    light_mode: 'Light',
    dark_mode: 'Dark',
    // General UI
    search: 'Search',
    clear_country: 'Clear country',
    price_filter: 'Price filter (base price)',
    tips: 'Tips',
    no_results: 'No results found',
    plan: 'Plan',
    // Trip Planner form
    source: 'Source',
    source_placeholder: 'Type a source city or airport',
    destinations_label: 'Destinations (up to 3)',
    destination_placeholder: 'Type a destination and press Enter or select from suggestions',
    budget_optional: 'Budget (optional)',
    budget_placeholder: 'Total budget (PKR)',
    start_date: 'Start Date',
    end_date: 'End Date',
    travellers: 'Travellers',
    travellers_placeholder: 'Number of people',
    ask_ai: 'Ask AI',
    plan_my_trip: 'Plan my trip',
    // Index page
    hero_title: 'Plan your next adventure',
    hero_sub: 'Get personalized itineraries, budgets, and recommendations.',
    explore_destinations: 'Explore Destinations',
    search_and_filter: 'Search and filter destinations by name, country, or price',
    search_by_name: 'Search by name or highlights...',
    country_region: 'Country / Region',
    all_countries: 'All countries',
    ai_dialog_title: 'Your Perfect Trip Package ✈️',
    ai_dialog_sub: 'Complete itinerary within your budget',
    decline: 'Decline',
    book_all: 'Book All 🎉',
    budget_notes: 'Budget Notes',
    options_within_budget: 'Options within your budget:',
    // Profile
    profile_title: 'Profile',
    profile_sub: 'Manage your personal information and preferences',
    full_name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    save_changes: 'Save Changes',
    back: 'Back',
    delete_profile: 'Delete Profile',
    // Additional controls
    apply: 'Apply',
    reset: 'Reset',
    price_range: 'Price Range',
    min_price: 'Min (PKR)',
    max_price: 'Max (PKR)',
    clear: 'Clear',
  },
  ur: {
    home: 'ہوم',
    sign_in: 'لاگ ان',
    destinations: 'مقامات',
    profile: 'پروفائل',
    saved_itineraries: 'محفوظ منصوبے',
    admin_dashboard: 'ایڈمن ڈیش بورڈ',
    manage_bookings: 'بکنگ مینج کریں',
    manage_destinations: 'مقامات منظم کریں',
    manage_itineraries: 'روٹس منظم کریں',
    manage_users: 'صارفین منظم کریں',
    sign_out: 'لاگ آؤٹ',
    trip_planner: 'ٹریپ پلانر',
    light_mode: 'روشنی',
    dark_mode: 'تاریک',
    // General UI
    search: 'تلاش',
    clear_country: 'ملک صاف کریں',
    price_filter: 'قیمت فلٹر (بنیادی قیمت)',
    tips: 'مشورے',
    no_results: 'کوئی نتیجہ نہیں ملا',
    plan: 'منصوبہ',
    // Trip Planner form
    source: 'ماخذ',
    source_placeholder: 'ماخذ شہر یا ائیرپورٹ درج کریں',
    destinations_label: 'منزلیں (زیادہ سے زیادہ 3)',
    destination_placeholder: 'منزل ٹائپ کریں اور Enter دبائیں یا تجاویز میں سے منتخب کریں',
    budget_optional: 'بجٹ (اختیاری)',
    budget_placeholder: 'کل بجٹ (PKR)',
    start_date: 'شروع ہونے کی تاریخ',
    end_date: 'ختم ہونے کی تاریخ',
    travellers: 'سفر کرنے والے',
    travellers_placeholder: 'لوگوں کی تعداد',
    ask_ai: 'AI سے پوچھیں',
    plan_my_trip: 'میرا سفر پلان کریں',
    // Index page
    hero_title: 'اپنا اگلا ایڈونچر پلان کریں',
    hero_sub: 'شخصی روٹس، بجٹس اور تجاویز حاصل کریں۔',
      explore_destinations: 'منزلیں دریافت کریں',
      search_and_filter: 'نام، ملک یا قیمت کے ذریعے مقامات تلاش اور فلٹر کریں',
      search_by_name: 'نام یا خصوصیات سے تلاش کریں...',
      country_region: 'ملک / خطہ',
      all_countries: 'تمام ممالک',
    ai_dialog_title: 'آپ کا بہترین سفری پیکیج ✈️',
    ai_dialog_sub: 'آپ کے بجٹ کے اندر مکمل روٹ',
    decline: 'انکار',
    book_all: 'سب بک کریں 🎉',
    budget_notes: 'بجٹ نوٹس',
    options_within_budget: 'آپ کے بجٹ کے اندر اختیارات:',
    // Profile
    profile_title: 'پروفائل',
    profile_sub: 'اپنی ذاتی معلومات اور ترجیحات منظم کریں',
    full_name: 'پورا نام',
    email: 'ای میل',
    phone: 'فون',
    save_changes: 'تبدیلیاں محفوظ کریں',
    back: 'واپس',
    delete_profile: 'پروفائل حذف کریں',
    apply: 'لاگو کریں',
    reset: 'دوبارہ ترتیب',
    price_range: 'قیمت کی حد',
    min_price: 'کم از کم (PKR)',
    max_price: 'زیادہ سے زیادہ (PKR)',
    clear: 'صاف کریں',
  },
  es: {
    home: 'Inicio',
    sign_in: 'Iniciar sesión',
    destinations: 'Destinos',
    profile: 'Perfil',
    saved_itineraries: 'Itinerarios Guardados',
    admin_dashboard: 'Panel Admin',
    manage_bookings: 'Gestionar Reservas',
    manage_destinations: 'Gestionar Destinos',
    manage_itineraries: 'Gestionar Itinerarios',
    manage_users: 'Gestionar Usuarios',
    sign_out: 'Cerrar sesión',
    trip_planner: 'Planificador',
    light_mode: 'Claro',
    dark_mode: 'Oscuro',
    // General UI
    search: 'Buscar',
    clear_country: 'Borrar país',
    price_filter: 'Filtro de precio (precio base)',
    tips: 'Consejos',
    no_results: 'No se encontraron resultados',
    plan: 'Planificar',
    // Trip Planner form
    source: 'Origen',
    source_placeholder: 'Escribe una ciudad o aeropuerto de origen',
    destinations_label: 'Destinos (hasta 3)',
    destination_placeholder: 'Escribe un destino y presiona Enter o selecciona sugerencias',
    budget_optional: 'Presupuesto (opcional)',
    budget_placeholder: 'Presupuesto total (PKR)',
    start_date: 'Fecha de inicio',
    end_date: 'Fecha de fin',
    travellers: 'Viajeros',
    travellers_placeholder: 'Número de personas',
    ask_ai: 'Preguntar a AI',
    plan_my_trip: 'Planear mi viaje',
    // Index page
    hero_title: 'Planifica tu próxima aventura',
    hero_sub: 'Obtén itinerarios personalizados, presupuestos y recomendaciones.',
      explore_destinations: 'Explora Destinos',
      search_and_filter: 'Busca y filtra destinos por nombre, país o precio',
      search_by_name: 'Buscar por nombre o destacados...',
      country_region: 'País / Región',
      all_countries: 'Todos los países',
    ai_dialog_title: 'Tu paquete de viaje perfecto ✈️',
    ai_dialog_sub: 'Itinerario completo dentro de tu presupuesto',
    decline: 'Rechazar',
    book_all: 'Reservar todo 🎉',
    budget_notes: 'Notas de presupuesto',
    options_within_budget: 'Opciones dentro de tu presupuesto:',
    // Profile
    profile_title: 'Perfil',
    profile_sub: 'Gestiona tu información personal y preferencias',
    full_name: 'Nombre completo',
    email: 'Correo',
    phone: 'Teléfono',
    save_changes: 'Guardar cambios',
    back: 'Atrás',
    delete_profile: 'Eliminar perfil',
    apply: 'Aplicar',
    reset: 'Restablecer',
    price_range: 'Rango de precios',
    min_price: 'Mín (PKR)',
    max_price: 'Máx (PKR)',
    clear: 'Borrar',
  },
  ar: {
    home: 'الرئيسية',
    sign_in: 'تسجيل الدخول',
    destinations: 'الوجهات',
    profile: 'الملف',
    saved_itineraries: 'المسارات المحفوظة',
    admin_dashboard: 'لوحة المشرف',
    manage_bookings: 'إدارة الحجوزات',
    manage_destinations: 'إدارة الوجهات',
    manage_itineraries: 'إدارة المسارات',
    manage_users: 'إدارة المستخدمين',
    sign_out: 'تسجيل الخروج',
    trip_planner: 'منظم الرحلات',
    light_mode: 'فاتح',
    dark_mode: 'داكن',
    // General UI
    search: 'بحث',
    clear_country: 'مسح الدولة',
    price_filter: 'مرشح السعر (السعر الأساسي)',
    tips: 'نصائح',
    no_results: 'لا توجد نتائج',
    plan: 'خطط',
    // Trip Planner form
    source: 'المصدر',
    source_placeholder: 'اكتب مدينة أو مطار الانطلاق',
    destinations_label: 'الوجهات (حتى 3)',
    destination_placeholder: 'اكتب وجهة واضغط Enter أو اختر من الاقتراحات',
    budget_optional: 'الميزانية (اختياري)',
    budget_placeholder: 'إجمالي الميزانية (PKR)',
    start_date: 'تاريخ البداية',
    end_date: 'تاريخ الانتهاء',
    travellers: 'المسافرون',
    travellers_placeholder: 'عدد الأشخاص',
    ask_ai: 'اسأل الـ AI',
    plan_my_trip: 'خطط رحلتي',
    // Index page
    hero_title: 'خطط لمغامرتك القادمة',
    hero_sub: 'احصل على مسارات مخصصة وميزانيات وتوصيات.',
      explore_destinations: 'استكشف الوجهات',
      search_and_filter: 'ابحث وقم بتصفية الوجهات بالاسم أو البلد أو السعر',
      search_by_name: 'ابحث بالاسم أو المميزات...',
      country_region: 'البلد / المنطقة',
      all_countries: 'جميع الدول',
    ai_dialog_title: 'حزمة رحلتك المثالية ✈️',
    ai_dialog_sub: 'مسار كامل ضمن ميزانيتك',
    decline: 'رفض',
    book_all: 'احجز الكل 🎉',
    budget_notes: 'ملاحظات الميزانية',
    options_within_budget: 'الخيارات ضمن ميزانيتك:',
    // Profile
    profile_title: 'الملف',
    profile_sub: 'قم بإدارة معلوماتك الشخصية وتفضيلاتك',
    full_name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    save_changes: 'حفظ التغييرات',
    back: 'العودة',
    delete_profile: 'حذف الملف',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    price_range: 'نطاق السعر',
    min_price: 'الحد الأدنى (PKR)',
    max_price: 'الحد الأقصى (PKR)',
    clear: 'مسح',
  },
};

const LanguageContext = createContext<LangContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('lang');
      return (saved as Lang) || 'en';
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('lang', lang);
    } catch (e) {
      // ignore
    }
  }, [lang]);

  // Apply language settings to the document root so it affects the whole site
  useEffect(() => {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = lang;
        const isRtl = lang === 'ar' || lang === 'ur';
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('data-lang', lang);
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [lang]);

  const t = (key: string) => {
    return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangState, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export default LanguageContext;
