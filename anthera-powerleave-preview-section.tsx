/*
 * ═══════════════════════════════════════════════════════════════════════════
 * POWERLEAVE PRODUCT PREVIEW SECTION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Aggiungi questa sezione a client/src/pages/PowerLeave.tsx
 * Posizionala DOPO la sezione FEATURES e PRIMA della sezione STACK TECNICO
 * 
 * ISTRUZIONI:
 * 1. Sostituisci i placeholder URL con gli screenshot reali del prodotto
 * 2. Gli screenshot dovrebbero essere 1920x1080 per la migliore qualità
 * 3. Carica le immagini su un hosting (es. Cloudinary, ImgBB, o direttamente su GitHub)
 */

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: Aggiungi questi import all'inizio del file (se non presenti)
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: Aggiungi questa costante dopo le altre costanti (HERO_BG, etc.)
// ═══════════════════════════════════════════════════════════════════════════
const PRODUCT_SCREENSHOTS = [
  {
    id: "dashboard",
    title: "Dashboard",
    titleEN: "Dashboard", 
    desc: "Panoramica completa con statistiche, richieste in attesa e calendario.",
    descEN: "Complete overview with statistics, pending requests and calendar.",
    // SOSTITUISCI con URL reale dello screenshot Dashboard
    image: "https://YOUR_HOSTING/powerleave_dashboard.png"
  },
  {
    id: "calendar",
    title: "Calendario",
    titleEN: "Calendar",
    desc: "Visualizza le assenze del team in un calendario intuitivo con legenda colorata.",
    descEN: "View team absences in an intuitive calendar with color legend.",
    // SOSTITUISCI con URL reale dello screenshot Calendario
    image: "https://YOUR_HOSTING/powerleave_calendar.png"
  },
  {
    id: "team",
    title: "Gestione Team",
    titleEN: "Team Management",
    desc: "Gestisci i membri del team, invita nuovi dipendenti e assegna ruoli.",
    descEN: "Manage team members, invite new employees and assign roles.",
    // SOSTITUISCI con URL reale dello screenshot Team
    image: "https://YOUR_HOSTING/powerleave_team.png"
  },
  {
    id: "stats",
    title: "Analytics",
    titleEN: "Analytics",
    desc: "Analisi dettagliate sull'utilizzo delle ferie e tendenze del team.",
    descEN: "Detailed analysis of leave usage and team trends.",
    // SOSTITUISCI con URL reale dello screenshot Statistiche
    image: "https://YOUR_HOSTING/powerleave_stats.png"
  },
  {
    id: "settings",
    title: "Impostazioni",
    titleEN: "Settings",
    desc: "Configura l'organizzazione, tipi di assenza e regole aziendali.",
    descEN: "Configure organization, leave types and company rules.",
    // SOSTITUISCI con URL reale dello screenshot Impostazioni
    image: "https://YOUR_HOSTING/powerleave_settings.png"
  }
];


// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: Aggiungi questa sezione JSX nel return() del componente PowerLeave
//         Posizionala DOPO </section> di FEATURES e PRIMA di STACK TECNICO
// ═══════════════════════════════════════════════════════════════════════════

/*
Copia da qui:
──────────────────────────────────────────────────────────────────────────────
*/

{/* ── PRODUCT PREVIEW ── */}
<section className="py-24 md:py-32" style={{ background: bg1 }}>
  <div className="container">
    <AnimatedSection className="text-center mb-12">
      <span className="font-mono-brand text-[11px] tracking-wider text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1.5 rounded-md border border-[#3b82f6]/20 inline-block mb-4">
        PRODUCT PREVIEW
      </span>
      <h2 className={`font-display font-bold text-3xl md:text-4xl mb-4 ${textPrimary}`}>
        {/* IT: "Scopri l'interfaccia" | EN: "Explore the Interface" */}
        Scopri l'<span className="gradient-text-blue">interfaccia</span>
      </h2>
      <p className={`text-lg max-w-2xl mx-auto ${textSecondary}`}>
        {/* IT | EN version */}
        Un'esperienza utente moderna e intuitiva, progettata per semplificare la gestione delle ferie.
      </p>
    </AnimatedSection>

    {/* Screenshot Carousel */}
    <ProductPreviewCarousel isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} />
  </div>
</section>

/*
──────────────────────────────────────────────────────────────────────────────
Fine sezione da copiare
*/


// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: Aggiungi questo componente PRIMA di "export default function PowerLeave()"
// ═══════════════════════════════════════════════════════════════════════════

interface CarouselProps {
  isDark: boolean;
  textPrimary: string;
  textSecondary: string;
}

function ProductPreviewCarousel({ isDark, textPrimary, textSecondary }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenshots = PRODUCT_SCREENSHOTS;

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const currentScreen = screenshots[activeIndex];

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
              alt={currentScreen.title}
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
            {currentScreen.title}
          </h3>
          <p className={`text-sm max-w-lg mx-auto ${textSecondary}`}>
            {currentScreen.desc}
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
        <div className="flex justify-center gap-3 mt-8">
          {screenshots.map((screen, idx) => (
            <button
              key={screen.id}
              onClick={() => setActiveIndex(idx)}
              className={`relative rounded-lg overflow-hidden transition-all ${
                idx === activeIndex 
                  ? 'ring-2 ring-[#3b82f6] ring-offset-2 ring-offset-transparent' 
                  : 'opacity-50 hover:opacity-80'
              }`}
              style={{ 
                width: '100px',
                background: isDark ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.9)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <img 
                src={screen.image} 
                alt={screen.title}
                className="w-full aspect-video object-cover object-top"
              />
              <span className={`absolute bottom-0 left-0 right-0 text-[10px] py-1 font-mono-brand truncate px-1 ${
                isDark ? 'bg-black/60 text-white/80' : 'bg-white/80 text-black/80'
              }`}>
                {screen.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: Per il supporto i18n, aggiungi queste chiavi a translations.ts
// ═══════════════════════════════════════════════════════════════════════════
/*
Nel file client/src/i18n/translations.ts, aggiungi:

// Italian
"pl.preview.badge": "ANTEPRIMA PRODOTTO",
"pl.preview.title": "Scopri l'",
"pl.preview.title2": "interfaccia",
"pl.preview.desc": "Un'esperienza utente moderna e intuitiva, progettata per semplificare la gestione delle ferie.",

// English
"pl.preview.badge": "PRODUCT PREVIEW",
"pl.preview.title": "Explore the ",
"pl.preview.title2": "Interface",
"pl.preview.desc": "A modern and intuitive user experience, designed to simplify leave management.",
*/


// ═══════════════════════════════════════════════════════════════════════════
// SCREENSHOT URLs DA SOSTITUIRE
// ═══════════════════════════════════════════════════════════════════════════
/*
Cattura questi screenshot dal tuo browser (1920x1080, dark mode):

1. Dashboard: https://hr-italia-preview.preview.emergentagent.com/#/dashboard
2. Calendario: https://hr-italia-preview.preview.emergentagent.com/#/dashboard (click su Calendario)
3. Team: https://hr-italia-preview.preview.emergentagent.com/#/dashboard (click su Team)
4. Statistiche: https://hr-italia-preview.preview.emergentagent.com/#/dashboard (click su Statistiche)
5. Impostazioni: https://hr-italia-preview.preview.emergentagent.com/#/dashboard (click su Impostazioni)

Login: admin@demo.it / demo123

Suggerimento: Usa un tool come CleanShot, ShareX o semplicemente il browser DevTools 
per catturare screenshot ad alta risoluzione senza la barra del browser.
*/
