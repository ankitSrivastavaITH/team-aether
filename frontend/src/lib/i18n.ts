export type Locale = "en" | "es";

const translations = {
  en: {
    // Navigation
    "nav.staff": "Staff Dashboard",
    "nav.public": "Public Transparency",
    "nav.compare": "Compare",

    // Landing
    "landing.title": "RVA Contract Lens",
    "landing.subtitle": "Richmond spends $6.1 billion in public contracts. Now you can see where it goes.",
    "landing.staff": "Staff Dashboard",
    "landing.staffDesc": "Track expiring contracts and manage risk",
    "landing.public": "Public Transparency",
    "landing.publicDesc": "See where your tax dollars go",

    // Public page
    "public.title": "Where Do Your Tax Dollars Go?",
    "public.explore": "Explore",
    "public.contracts": "City of Richmond contracts worth",
    "public.totalValue": "Total Contract Value",
    "public.totalValueDesc": "All active and historical contracts",
    "public.activeContracts": "Active Contracts",
    "public.activeDesc": "Total contracts on record",
    "public.expiring30": "Expiring in 30 Days",
    "public.expiringDesc": "Contracts needing renewal attention",
    "public.spendingBreakdown": "Spending Breakdown",
    "public.spendingByDept": "Spending by Department",
    "public.topVendors": "Top Vendors by Contract Value",
    "public.top20": "Top 20 Vendors",
    "public.top20Desc": "Click any vendor to explore their contracts in detail.",
    "public.deeperAnalysis": "Deeper Analysis",
    "public.insights": "Key Insights",

    // Common
    "common.source": "Source: City of Richmond Open Data",
    "common.disclaimer": "Data from City of Richmond Open Data (Socrata). For informational purposes — not official City reporting.",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.back": "Back",
    "common.contracts": "contracts",
    "common.viewDetails": "View details",

    // Staff Dashboard
    "staff_greeting_morning": "Good morning — here's what needs your attention",
    "staff_greeting_afternoon": "Good afternoon — here's what needs your attention",
    "staff_greeting_evening": "Good evening — here's what needs your attention",
    "decide_today": "Decide Today",
    "plan_this_week": "Plan This Week",
    "review_this_month": "Review This Month",
    "quick_actions": "Quick Actions",
    "contracts_expiring": "contracts expiring",
    "days_left": "days left",
    "all_clear": "All clear",
    "no_critical": "No critical contracts",

    // Decision Engine
    "decision_engine": "AI Decision Engine",
    "decision_subtitle": "AI-powered procurement decision intelligence",
    "select_vendor": "Select vendor",
    "analyze_contract": "Analyze contract",
    "analyzing": "Analyzing...",
    "verdict_renew": "RENEW",
    "verdict_rebid": "REBID",
    "verdict_escalate": "ESCALATE",
    "reasons_to_renew": "Reasons to renew",
    "reasons_to_rebid": "Reasons to rebid",
    "decision_memo": "Decision memo",
    "copy_clipboard": "Copy to clipboard",
    "print": "Print",
    "ai_draft_disclaimer": "AI-generated draft — requires staff review",

    // Sidebar
    "procurement": "Procurement",
    "ai_tools": "AI Tools",
    "analytics": "Analytics",
    "risk_equity": "Risk & Equity",
    "all_contracts": "All contracts",
    "health_scanner": "Health Scanner",
    "pdf_analyzer": "PDF Analyzer",
    "contract_intel": "Contract intel",

    // Common (staff)
    "loading": "Loading...",
    "error_generic": "Something went wrong. Please try again.",
    "contracts": "contracts",
    "vendor": "vendor",
    "department": "department",
    "value": "value",
    "critical": "critical",
    "warning": "warning",
    "expired": "expired",
    "ok": "ok",

    // Language
    "lang.toggle": "Español",
    "lang.current": "English",

    // Decision Engine (extended)
    "verdict_label": "Verdict",
    "confidence_label": "Confidence",
    "reasons_renew": "Reasons to Renew",
    "reasons_rebid": "Reasons to Rebid",
    "confirm_decision": "Confirm Decision",
    "staff_notes": "Staff Notes",
    "decision_recorded": "Decision recorded",
    "analyze": "Analyze",
    "high_contrast": "High Contrast",
    "font_size": "Font Size",
  },
  es: {
    // Navigation
    "nav.staff": "Panel del Personal",
    "nav.public": "Transparencia Pública",
    "nav.compare": "Comparar",

    // Landing
    "landing.title": "RVA Contract Lens",
    "landing.subtitle": "Richmond gasta $6.1 mil millones en contratos públicos. Ahora puede ver a dónde va.",
    "landing.staff": "Panel del Personal",
    "landing.staffDesc": "Rastree contratos que vencen y gestione riesgos",
    "landing.public": "Transparencia Pública",
    "landing.publicDesc": "Vea a dónde van sus impuestos",

    // Public page
    "public.title": "¿A Dónde Van Sus Impuestos?",
    "public.explore": "Explore",
    "public.contracts": "contratos de la Ciudad de Richmond por un valor de",
    "public.totalValue": "Valor Total de Contratos",
    "public.totalValueDesc": "Todos los contratos activos e históricos",
    "public.activeContracts": "Contratos Activos",
    "public.activeDesc": "Total de contratos registrados",
    "public.expiring30": "Vencen en 30 Días",
    "public.expiringDesc": "Contratos que necesitan atención de renovación",
    "public.spendingBreakdown": "Desglose de Gastos",
    "public.spendingByDept": "Gastos por Departamento",
    "public.topVendors": "Principales Proveedores por Valor",
    "public.top20": "Los 20 Principales Proveedores",
    "public.top20Desc": "Haga clic en cualquier proveedor para explorar sus contratos en detalle.",
    "public.deeperAnalysis": "Análisis Más Profundo",
    "public.insights": "Ideas Clave",

    // Common
    "common.source": "Fuente: Datos Abiertos de la Ciudad de Richmond",
    "common.disclaimer": "Datos de la Ciudad de Richmond (Socrata). Solo para fines informativos — no es un informe oficial de la Ciudad.",
    "common.loading": "Cargando...",
    "common.error": "Algo salió mal",
    "common.back": "Volver",
    "common.contracts": "contratos",
    "common.viewDetails": "Ver detalles",

    // Staff Dashboard
    "staff_greeting_morning": "Buenos días — esto necesita su atención",
    "staff_greeting_afternoon": "Buenas tardes — esto necesita su atención",
    "staff_greeting_evening": "Buenas noches — esto necesita su atención",
    "decide_today": "Decidir hoy",
    "plan_this_week": "Planificar esta semana",
    "review_this_month": "Revisar este mes",
    "quick_actions": "Acciones rápidas",
    "contracts_expiring": "contratos que vencen",
    "days_left": "días restantes",
    "all_clear": "Todo en orden",
    "no_critical": "No hay contratos críticos",

    // Decision Engine
    "decision_engine": "Motor de Decisión IA",
    "decision_subtitle": "Inteligencia de decisión de adquisiciones impulsada por IA",
    "select_vendor": "Seleccionar proveedor",
    "analyze_contract": "Analizar contrato",
    "analyzing": "Analizando...",
    "verdict_renew": "RENOVAR",
    "verdict_rebid": "RELICITAR",
    "verdict_escalate": "ESCALAR",
    "reasons_to_renew": "Razones para renovar",
    "reasons_to_rebid": "Razones para relicitar",
    "decision_memo": "Memorando de decisión",
    "copy_clipboard": "Copiar al portapapeles",
    "print": "Imprimir",
    "ai_draft_disclaimer": "Borrador generado por IA — requiere revisión del personal",

    // Sidebar
    "procurement": "Adquisiciones",
    "ai_tools": "Herramientas IA",
    "analytics": "Análisis",
    "risk_equity": "Riesgo y Equidad",
    "all_contracts": "Todos los contratos",
    "health_scanner": "Escáner de salud",
    "pdf_analyzer": "Analizador PDF",
    "contract_intel": "Inteligencia de contratos",

    // Common (staff)
    "loading": "Cargando...",
    "error_generic": "Ocurrió un error. Intente de nuevo.",
    "contracts": "contratos",
    "vendor": "proveedor",
    "department": "departamento",
    "value": "valor",
    "critical": "crítico",
    "warning": "advertencia",
    "expired": "vencido",
    "ok": "en orden",

    // Language
    "lang.toggle": "English",
    "lang.current": "Español",

    // Decision Engine (extended)
    "verdict_label": "Veredicto",
    "confidence_label": "Confianza",
    "reasons_renew": "Razones para renovar",
    "reasons_rebid": "Razones para relicitar",
    "confirm_decision": "Confirmar decisión",
    "staff_notes": "Notas del personal",
    "decision_recorded": "Decisión registrada",
    "analyze": "Analizar",
    "high_contrast": "Alto contraste",
    "font_size": "Tamaño de texto",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, locale: Locale = "en"): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function getLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("rva_locale") as Locale) || "en";
}

export function setLocale(locale: Locale): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("rva_locale", locale);
    document.documentElement.lang = locale;
  }
}
