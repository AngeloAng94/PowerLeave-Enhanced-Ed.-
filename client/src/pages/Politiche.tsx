import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Politiche() {
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
              <h1 className="text-2xl font-bold text-foreground">Politiche Ferie</h1>
              <p className="text-sm text-muted-foreground">
                Regolamento aziendale e linee guida per la gestione delle assenze
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl space-y-6">
        {/* Giorni di Ferie */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Giorni di Ferie Annuali</CardTitle>
                <CardDescription>Diritti e modalità di fruizione</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Maturazione</h4>
              <p className="text-sm text-muted-foreground">
                Ogni dipendente matura <strong>26 giorni di ferie</strong> all'anno (per contratti full-time),
                calcolati proporzionalmente ai mesi di servizio effettivo.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Periodo di Godimento</h4>
              <p className="text-sm text-muted-foreground">
                Le ferie devono essere fruite preferibilmente entro l'anno di maturazione.
                Il saldo residuo può essere riportato all'anno successivo secondo normativa vigente.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Preavviso</h4>
              <p className="text-sm text-muted-foreground">
                Le richieste di ferie devono essere inviate con almeno <strong>7 giorni di preavviso</strong>.
                Per periodi superiori a 5 giorni consecutivi, si consiglia un preavviso di 15 giorni.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permessi */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Permessi Orari</CardTitle>
                <CardDescription>ROL e permessi retribuiti</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Permessi Disponibili</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Permesso 2 ore</strong> - Per esigenze personali brevi</li>
                <li><strong>Permesso 4 ore</strong> - Per mezza giornata</li>
                <li><strong>Permesso 8 ore</strong> - Giornata intera (ROL)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Modalità di Richiesta</h4>
              <p className="text-sm text-muted-foreground">
                I permessi orari possono essere richiesti con <strong>24 ore di preavviso</strong> minimo,
                salvo situazioni di urgenza documentate.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Approvazione */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Processo di Approvazione</CardTitle>
                <CardDescription>Come vengono gestite le richieste</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Tempistiche</h4>
              <p className="text-sm text-muted-foreground">
                Le richieste vengono esaminate entro <strong>48 ore lavorative</strong> dalla data di invio.
                In caso di necessità operative, l'approvazione potrebbe essere subordinata a disponibilità del team.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Criteri di Approvazione</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Disponibilità di personale sufficiente per garantire la continuità operativa</li>
                <li>Assenza di sovrapposizioni critiche con altri colleghi</li>
                <li>Rispetto del preavviso minimo richiesto</li>
                <li>Saldo ferie disponibile</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Chiusure Aziendali */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Chiusure Aziendali</CardTitle>
                <CardDescription>Festività e periodi di chiusura</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Festività Nazionali</h4>
              <p className="text-sm text-muted-foreground">
                L'azienda osserva tutte le festività nazionali previste dalla legge italiana
                (Capodanno, Epifania, Pasqua, 25 Aprile, 1° Maggio, 2 Giugno, Ferragosto, Ognissanti, Immacolata, Natale, Santo Stefano).
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Chiusure Estive e Natalizie</h4>
              <p className="text-sm text-muted-foreground">
                L'azienda può prevedere periodi di chiusura collettiva durante l'estate (es. settimana di Ferragosto)
                e le festività natalizie (es. 26 dicembre - 6 gennaio). Tali periodi saranno comunicati con congruo anticipo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Questo regolamento è soggetto a modifiche. Per informazioni specifiche
              o casi particolari, contattare l'ufficio Risorse Umane o il proprio responsabile diretto.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
