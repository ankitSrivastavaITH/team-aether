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

    // Language
    "lang.toggle": "Español",
    "lang.current": "English",
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

    // Language
    "lang.toggle": "English",
    "lang.current": "Español",
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
  }
}
