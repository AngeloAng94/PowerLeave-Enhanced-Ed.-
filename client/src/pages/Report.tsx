import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, FileText, Users, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Report() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Solo admin può accedere
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>Solo gli amministratori possono accedere ai report</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Query statistiche
  const { data: stats } = trpc.leaves.getStats.useQuery();
  const { data: summary } = trpc.leaveUsage.getSummary.useQuery();

  const handleExportCSV = () => {
    if (!summary || summary.length === 0) {
      toast.error("Nessun dato da esportare");
      return;
    }

    // Genera CSV
    const headers = ["Dipendente", "Tipo Assenza", "Giorni Utilizzati", "Saldo Residuo"];
    const rows = summary.map((s: any) => [
      s.userName,
      s.leaveTypeName,
      s.daysUsed,
      s.remainingBalance,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) => row.join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_ferie_${selectedYear}.csv`;
    link.click();

    toast.success("Report esportato con successo");
  };

  const years = [2024, 2025, 2026].map(String);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Report e Statistiche</h1>
                <p className="text-sm text-muted-foreground">
                  Analisi utilizzo ferie e export dati
                </p>
              </div>
            </div>

            {/* Export */}
            <div className="flex items-center gap-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Esporta CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-6">
        {/* Statistiche Generali */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ferie Approvate</p>
                  <p className="text-2xl font-bold">{stats?.approvedCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Sospeso</p>
                  <p className="text-2xl font-bold">{stats?.pendingCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Staff Totale</p>
                  <p className="text-2xl font-bold">{stats?.totalStaff || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Utilizzo Medio</p>
                  <p className="text-2xl font-bold">{stats?.utilizationRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabella Dettagliata */}
        <Card>
          <CardHeader>
            <CardTitle>Riepilogo Utilizzo per Dipendente</CardTitle>
            <CardDescription>
              Dettaglio giorni utilizzati e saldo residuo per ogni membro del team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Tipo Assenza</TableHead>
                  <TableHead className="text-right">Giorni Utilizzati</TableHead>
                  <TableHead className="text-right">Saldo Residuo</TableHead>
                  <TableHead className="text-right">% Utilizzo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary?.map((item: any, index: number) => {
                  const totalDays = item.daysUsed + item.remainingBalance;
                  const utilizationPercent = totalDays > 0 
                    ? Math.round((item.daysUsed / totalDays) * 100) 
                    : 0;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.userName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.leaveTypeName}</TableCell>
                      <TableCell className="text-right">{item.daysUsed}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.remainingBalance}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            utilizationPercent > 75
                              ? "bg-red-500/10 text-red-600"
                              : utilizationPercent > 50
                              ? "bg-orange-500/10 text-orange-600"
                              : "bg-green-500/10 text-green-600"
                          }`}
                        >
                          {utilizationPercent}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              • Il file CSV esportato contiene tutti i dati di utilizzo ferie per l'anno selezionato
            </p>
            <p>
              • Puoi aprire il file con Excel, Google Sheets o qualsiasi software di fogli di calcolo
            </p>
            <p>
              • I dati includono: nome dipendente, tipo assenza, giorni utilizzati e saldo residuo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
