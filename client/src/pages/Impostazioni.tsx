import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, Bell, Lock, Database } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Impostazioni() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
              <p className="text-sm text-muted-foreground">
                Configurazione sistema e preferenze
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Configurazione Sistema</CardTitle>
                <CardDescription>Impostazioni generali dell'applicazione</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funzionalità in sviluppo. Qui sarà possibile configurare:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Giorni di ferie annuali predefiniti</li>
              <li>Preavviso minimo richieste</li>
              <li>Approvazione automatica o manuale</li>
              <li>Anno fiscale di riferimento</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Notifiche</CardTitle>
                <CardDescription>Gestione avvisi e comunicazioni</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => toast.info("Funzionalità in arrivo")}>
              Configura Notifiche
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Backup e Dati</CardTitle>
                <CardDescription>Gestione backup e export completo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => toast.info("Funzionalità in arrivo")}>
              Esporta Tutti i Dati
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Sicurezza</CardTitle>
                <CardDescription>Gestione accessi e permessi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Per gestire ruoli e permessi utenti, vai alla sezione <strong>Team</strong>.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/team")}>
              Vai a Gestione Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
