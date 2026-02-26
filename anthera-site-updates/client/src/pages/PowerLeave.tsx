/*
 * ANTHERA PowerLeave — Product Page
 * Accent: #3b82f6 (blue) | i18n + theme aware
 * Updated: Product Preview Gallery section added
 */

import { useState } from "react";
import { Link } from "wouter";
import { Calendar, Building, Users, BarChart3, Shield, GitBranch, ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import AnimatedSection, { StaggerContainer, StaggerItem } from "@/components/AnimatedSection";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const HERO_BG = "https://files.manuscdn.com/user_upload_by_module/session_file/106888006/BozZNfDvMwFIILLH.png";
const POWERLEAVE_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/106888006/bPlrXnwRZvOYpPUR.png";

const techStack = ["React 18", "FastAPI (Python)", "MongoDB", "JWT Auth", "GitHub Actions", "Docker-ready"];

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT SCREENSHOTS - Replace these URLs with your actual screenshots
// Recommended: 1920x1080, dark mode screenshots
// ══════════════════════════════════════════════════════════════════════════════
const PRODUCT_SCREENSHOTS = [
  {
    id: "dashboard",
    titleIT: "Dashboard",
    titleEN: "Dashboard", 
    descIT: "Panoramica completa con statistiche, richieste in attesa e calendario integrato.",
    descEN: "Complete overview with statistics, pending requests and integrated calendar.",
    // TODO: Replace with actual screenshot URL
    image: "https://placehold.co/1920x1080/0f172a/3b82f6?text=Dashboard+Screenshot"
  },
  {
    id: "calendar",
    titleIT: "Calendario",
    titleEN: "Calendar",
    descIT: "Visualizza le assenze del team in un calendario intuitivo con legenda colorata.",
    descEN: "View team absences in an intuitive calendar with color legend.",
    image: "https://placehold.co/1920x1080/0f172a/3b82f6?text=Calendar+Screenshot"
  },
  {
    id: "team",
    titleIT: "Gestione Team",
    titleEN: "Team Management",
    descIT: "Gestisci i membri del team, invita nuovi dipendenti e assegna ruoli.",
    descEN: "Manage team members, invite new employees and assign roles.",
    image: "https://placehold.co/1920x1080/0f172a/3b82f6?text=Team+Screenshot"
  },
  {
    id: "stats",
    titleIT: "Analytics",
    titleEN: "Analytics",
    descIT: "Analisi dettagliate sull'utilizzo delle ferie e tendenze del team.",
    descEN: "Detailed analysis of leave usage and team trends.",
    image: "https://placehold.co/1920x1080/0f172a/3b82f6?text=Analytics+Screenshot"
  },
  {
    id: "settings",
    titleIT: "Impostazioni",
    titleEN: "Settings",
    descIT: "Configura l'organizzazione, tipi di assenza e regole aziendali.",
    descEN: "Configure organization, leave types and company rules.",
    image: "https://placehold.co/1920x1080/0f172a/3b82f6?text=Settings+Screenshot"
  }
];

// ══════════════════════════════════════════════════════════════════════════════
// ProductPreviewCarousel Component
// ══════════════════════════════════════════════════════════════════════════════
interface CarouselProps {
  isDark: boolean;
  textPrimary: string;
  textSecondary: string;
  lang: "it" | "en";
}

function ProductPreviewCarousel({ isDark, textPrimary, textSecondary, lang }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenshots = PRODUCT_SCREENSHOTS;

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const currentScreen = screenshots[activeIndex];
  const title = lang === "it" ? currentScreen.titleIT : currentScreen.titleEN;
  const desc = lang === "it" ? currentScreen.descIT : currentScreen.descEN;

  return (
    <AnimatedSection delay={0.2}>
      <div className="max-w-5xl mx-auto">
        {/* Browser Frame Mockup */}
        <div 
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            background: isDark ? 'rgba(2,6,23,0.95)' : 'rgba(255,255,255,0.95)', 
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
          }}
        >
          {/* Browser Top Bar */}
          <div 
            className="flex items-center gap-3 px-4 py-3"
            style={{ 
              background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(241,245,249,0.9)',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)'
            }}
          >
            {/* Traffic Lights */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            {/* URL Bar */}
            <div 
              className="flex-1 flex items-center gap-2 px-4 py-1.5 rounded-lg mx-8"
              style={{ 
                background: isDark ? 'rgba(2,6,23,0.6)' : 'rgba(255,255,255,0.8)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <Monitor className="w-4 h-4 text-[#3b82f6]" />
              <span className={`font-mono-brand text-xs ${textSecondary}`}>
                app.powerleave.io/{currentScreen.id}
              </span>
            </div>
          </div>

          {/* Screenshot Display */}
          <div className="relative aspect-[16/9] overflow-hidden">
            <img 
              src={currentScreen.image} 
              alt={title}
              className="w-full h-full object-cover object-top transition-opacity duration-500"
            />
            
            {/* Navigation Arrows */}
            <button 
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm"
              aria-label="Next screenshot"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Caption + Dots */}
        <div className="text-center mt-8">
          <h3 className={`font-display font-semibold text-xl mb-2 ${textPrimary}`}>
            {title}
          </h3>
          <p className={`text-sm max-w-lg mx-auto ${textSecondary}`}>
            {desc}
          </p>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {screenshots.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === activeIndex 
                    ? 'bg-[#3b82f6] w-8' 
                    : isDark ? 'bg-white/20 hover:bg-white/40' : 'bg-black/20 hover:bg-black/40'
                }`}
                aria-label={`Go to screenshot ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex justify-center gap-3 mt-8 flex-wrap">
          {screenshots.map((screen, idx) => {
            const thumbTitle = lang === "it" ? screen.titleIT : screen.titleEN;
            return (
              <button
                key={screen.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative rounded-lg overflow-hidden transition-all ${
                  idx === activeIndex 
                    ? 'ring-2 ring-[#3b82f6] ring-offset-2 ring-offset-transparent scale-105' 
                    : 'opacity-60 hover:opacity-90'
                }`}
                style={{ 
                  width: '100px',
                  background: isDark ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.9)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                }}
              >
                <img 
                  src={screen.image} 
                  alt={thumbTitle}
                  className="w-full aspect-video object-cover object-top"
                />
                <span className={`absolute bottom-0 left-0 right-0 text-[10px] py-1 font-mono-brand truncate px-1 ${
                  isDark ? 'bg-black/70 text-white/80' : 'bg-white/90 text-black/80'
                }`}>
                  {thumbTitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main PowerLeave Component
// ══════════════════════════════════════════════════════════════════════════════
export default function PowerLeave() {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const isDark = theme === "dark";

  const bg1 = isDark ? "#020617" : "#f8fafc";
  const bg2 = isDark ? "#0f172a" : "#f1f5f9";
  const textPrimary = isDark ? "text-white" : "text-[#0f172a]";
  const textSecondary = isDark ? "text-[#94a3b8]" : "text-[#64748b]";

  const features = [
    { icon: Calendar, title: t("pl.f1.title"), desc: t("pl.f1.desc") },
    { icon: Building, title: t("pl.f2.title"), desc: t("pl.f2.desc") },
    { icon: Users, title: t("pl.f3.title"), desc: t("pl.f3.desc") },
    { icon: BarChart3, title: t("pl.f4.title"), desc: t("pl.f4.desc") },
    { icon: Shield, title: t("pl.f5.title"), desc: t("pl.f5.desc") },
    { icon: GitBranch, title: t("pl.f6.title"), desc: t("pl.f6.desc") },
  ];

  const plans = [
    { name: "Starter", desc: t("pl.pricing.starter"), price: t("pl.pricing.tbd"), highlighted: false },
    { name: "Business", desc: t("pl.pricing.business"), price: t("pl.pricing.tbd"), highlighted: true },
    { name: "Enterprise", desc: t("pl.pricing.enterprise"), price: t("pl.pricing.contact"), highlighted: false },
  ];

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-b from-[#020617]/80 via-[#020617]/60 to-[#020617]" : "bg-gradient-to-b from-white/80 via-white/60 to-white"}`} />
        </div>

        <div className="container relative z-10 pt-32 pb-20">
          <div className="max-w-4xl">
            <AnimatedSection>
              <span className="inline-flex items-center gap-3 mb-6">
                <img src={POWERLEAVE_LOGO} alt="PowerLeave" className="h-12 w-auto rounded-lg" />
                <span className="font-mono-brand text-[11px] tracking-wider text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1.5 rounded-md border border-[#3b82f6]/20">
                  ANTHERA POWERLEAVE
                </span>
              </span>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h1 className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.1] mb-6 ${textPrimary}`}>
                {t("pl.hero.title1")}{" "}
                <span className="gradient-text-blue">{t("pl.hero.title2")}</span> {t("pl.hero.title3")}
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className={`text-lg md:text-xl leading-relaxed max-w-2xl mb-10 ${textSecondary}`}>
                {t("pl.hero.desc")}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="btn-gradient px-8 py-3.5 rounded-lg font-display font-semibold text-sm inline-block">
                  {t("pl.hero.cta1")}
                </Link>
                <a href="#features" className="px-8 py-3.5 rounded-lg font-display font-semibold text-sm border border-[#3b82f6]/40 text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors inline-block">
                  {t("pl.hero.cta2")}
                </a>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 md:py-32" style={{ background: bg2 }}>
        <div className="container">
          <AnimatedSection className="text-center mb-16">
            <h2 className={`font-display font-bold text-3xl md:text-4xl mb-4 ${textPrimary}`}>
              {t("pl.features.title")} <span className="gradient-text-blue">{t("pl.features.title2")}</span>
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto" staggerDelay={0.1}>
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <div className="glass-card-hover p-7 h-full" style={{ background: isDark ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.9)', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#3b82f6]/10">
                    <f.icon className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                  <h3 className={`font-display font-semibold text-base mb-2 ${textPrimary}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed ${textSecondary}`}>{f.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── PRODUCT PREVIEW ── */}
      <section id="preview" className="py-24 md:py-32" style={{ background: bg1 }}>
        <div className="container">
          <AnimatedSection className="text-center mb-12">
            <span className="font-mono-brand text-[11px] tracking-wider text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1.5 rounded-md border border-[#3b82f6]/20 inline-block mb-4">
              {lang === "it" ? "ANTEPRIMA PRODOTTO" : "PRODUCT PREVIEW"}
            </span>
            <h2 className={`font-display font-bold text-3xl md:text-4xl mb-4 ${textPrimary}`}>
              {lang === "it" ? "Scopri l'" : "Explore the "}
              <span className="gradient-text-blue">{lang === "it" ? "interfaccia" : "Interface"}</span>
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${textSecondary}`}>
              {lang === "it" 
                ? "Un'esperienza utente moderna e intuitiva, progettata per semplificare la gestione delle ferie."
                : "A modern and intuitive user experience, designed to simplify leave management."
              }
            </p>
          </AnimatedSection>

          {/* Screenshot Carousel */}
          <ProductPreviewCarousel 
            isDark={isDark} 
            textPrimary={textPrimary} 
            textSecondary={textSecondary} 
            lang={lang}
          />
        </div>
      </section>

      {/* ── STACK TECNICO ── */}
      <section className="py-20" style={{ background: bg2 }}>
        <div className="container">
          <AnimatedSection className="text-center">
            <h2 className={`font-display font-bold text-2xl mb-8 ${textPrimary}`}>{t("pl.stack.title")}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {techStack.map((tech) => (
                <span key={tech} className="font-mono-brand text-sm px-5 py-2.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
                  {tech}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 md:py-32" style={{ background: bg1 }}>
        <div className="container">
          <AnimatedSection className="text-center mb-16">
            <h2 className={`font-display font-bold text-3xl md:text-4xl mb-4 ${textPrimary}`}>{t("pl.pricing.title")}</h2>
            <p className={`text-lg ${textSecondary}`}>{t("pl.pricing.desc")}</p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.12}>
            {plans.map((plan) => (
              <StaggerItem key={plan.name}>
                <div className={`glass-card p-8 text-center h-full flex flex-col ${
                  plan.highlighted ? "border-[#3b82f6]/40 shadow-[0_0_40px_rgba(59,130,246,0.1)]" : ""
                }`} style={{ background: isDark ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.9)', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)' }}>
                  {plan.highlighted && (
                    <span className="font-mono-brand text-[10px] tracking-wider text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1 rounded-md self-center mb-4 border border-[#3b82f6]/20">
                      {t("pl.pricing.recommended")}
                    </span>
                  )}
                  <h3 className={`font-display font-bold text-xl mb-2 ${textPrimary}`}>{plan.name}</h3>
                  <p className={`text-sm mb-6 ${textSecondary}`}>{plan.desc}</p>
                  <p className="font-display font-semibold text-[#3b82f6] text-lg mt-auto mb-6">{plan.price}</p>
                  <Link href="/contact" className={`px-6 py-3 rounded-lg font-display font-semibold text-sm block ${
                    plan.highlighted ? "btn-gradient" : "border border-[#3b82f6]/40 text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors"
                  }`}>
                    {plan.price === t("pl.pricing.contact") ? t("pl.pricing.contact") : t("pl.pricing.join")}
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimatedSection delay={0.3} className="text-center mt-10">
            <Link href="/contact" className="text-[#3b82f6] font-display font-semibold text-sm hover:underline">
              {t("pl.pricing.earlyaccess")}
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
