# Istruzioni per aggiornare il sito Anthera con Product Preview

## File da aggiornare

### 1. `client/src/pages/PowerLeave.tsx`
Sostituisci l'intero contenuto del file con il contenuto di `PowerLeave.tsx` che trovi in questa cartella.

## Screenshot da catturare

Devi catturare 5 screenshot dal tuo browser. Ecco come:

### URL Demo
```
https://hr-italia-preview.preview.emergentagent.com
```

### Login
- Email: `admin@demo.it`
- Password: `demo123`

### Screenshot da catturare (1920x1080, dark mode):

1. **Dashboard** - Subito dopo il login
2. **Calendario** - Click su "Calendario" nella sidebar
3. **Team** - Click su "Team" nella sidebar
4. **Statistiche** - Click su "Statistiche" nella sidebar
5. **Impostazioni** - Click su "Impostazioni" nella sidebar

### Suggerimenti per screenshot perfetti:
- Usa la risoluzione 1920x1080
- Assicurati che il dark mode sia attivo
- Nascondi la barra del browser se possibile (F11 per fullscreen)
- Usa tool come CleanShot, ShareX o Snagit per qualità migliore

## Hosting degli screenshot

Dopo aver catturato gli screenshot, caricali su uno di questi servizi:
- **Cloudinary** (gratuito, consigliato)
- **ImgBB** (gratuito)
- **GitHub** (nella stessa repo, in `client/public/images/`)

## Aggiornare gli URL nel codice

Nel file `PowerLeave.tsx`, cerca `PRODUCT_SCREENSHOTS` (circa riga 25) e sostituisci gli URL placeholder:

```typescript
const PRODUCT_SCREENSHOTS = [
  {
    id: "dashboard",
    // ... altre proprietà ...
    image: "https://TUO_URL/powerleave_dashboard.png"  // ← Sostituisci qui
  },
  // ... altri screenshot ...
];
```

## Commit e Deploy

```bash
git add client/src/pages/PowerLeave.tsx
git commit -m "feat: add Product Preview gallery to PowerLeave page"
git push origin main
```

Netlify farà il deploy automatico!

---

## Risultato finale

La nuova sezione "Anteprima Prodotto" / "Product Preview" apparirà tra le Features e lo Stack Tecnico, con:
- Carousel di screenshot con frecce di navigazione
- Mockup browser con barra URL
- Thumbnail per navigazione rapida
- Supporto i18n (IT/EN)
- Supporto dark/light mode
