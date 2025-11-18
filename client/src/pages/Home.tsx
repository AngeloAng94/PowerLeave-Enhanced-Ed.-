import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, BarChart3, Users, Send, CheckCircle2, Clock, UserCheck, Plane } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: stats } = trpc.leaves.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: leaveTypes } = trpc.leaves.getTypes.useQuery();
  const { data: pendingRequests } = trpc.leaves.getRequests.useQuery({ status: "pending" }, { enabled: isAuthenticated });
  const { data: announcements } = trpc.announcements.getAll.useQuery();

  const createRequestMutation = trpc.leaves.createRequest.useMutation({
    onSuccess: () => {
      toast.success("Richiesta inviata con successo!");
      setLeaveTypeId("");
      setStartDate("");
      setEndDate("");
      setNotes("");
    },
    onError: (error) => {
      toast.error("Errore nell'invio della richiesta: " + error.message);
    },
  });

  const reviewRequestMutation = trpc.leaves.reviewRequest.useMutation({
    onSuccess: () => {
      toast.success("Richiesta aggiornata con successo!");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento: " + error.message);
    },
  });

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    createRequestMutation.mutate({
      leaveTypeId: parseInt(leaveTypeId),
      startDate,
      endDate,
      notes,
    });
  };

  const handleReviewRequest = (requestId: number, status: "approved" | "rejected") => {
    reviewRequestMutation.mutate({ requestId, status });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Dashboard Gestione Ferie</CardTitle>
            <CardDescription>Accedi per gestire le ferie del tuo team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <a href={getLoginUrl()}>Accedi con Manus</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">{user?.name?.charAt(0) || "U"}</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{user?.name || "Utente"}</h2>
            <p className="text-xs text-muted-foreground">{user?.role === "admin" ? "Team Leader" : "Membro Team"}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <Button variant="secondary" className="w-full justify-start gap-3">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Calendar className="w-5 h-5" />
            Calendario
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Users className="w-5 h-5" />
            Team
          </Button>
        </nav>

        <div className="mt-auto space-y-2">
          <Button className="w-full" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Plane className="w-4 h-4 mr-2" />
            Richiedi Ferie
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard Gestione Ferie</h1>
            <p className="text-muted-foreground">Pianifica, visualizza e approva le ferie del tuo team con facilità.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Plane className="w-6 h-6 text-blue-500" />
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
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Richieste in Sospeso</p>
                    <p className="text-2xl font-bold">{stats?.pendingCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <UserCheck className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Staff Disponibile Oggi</p>
                    <p className="text-2xl font-bold">
                      {stats?.availableStaff || 0}/{stats?.totalStaff || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Utilizzo Ferie Team</p>
                    <p className="text-2xl font-bold">{stats?.utilizationRate || 0}%</p>
                  </div>
                  <div className="relative w-12 h-12">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={`${((stats?.utilizationRate || 0) / 100) * 125.6} 125.6`}
                        className="text-primary"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Request Form */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Invia una richiesta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leave-type">Tipo di assenza</Label>
                      <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                        <SelectTrigger id="leave-type">
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {leaveTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Data Inizio</Label>
                        <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Data Fine</Label>
                        <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Note aggiuntive (opzionale)</Label>
                    <Textarea id="notes" placeholder="Es. Motivo della richiesta..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={createRequestMutation.isPending}>
                      <Send className="w-4 h-4 mr-2" />
                      {createRequestMutation.isPending ? "Invio..." : "Invia Richiesta"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Pending Requests (Admin Only) */}
            {user?.role === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle>Richieste da Approvare</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingRequests && pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                        <div>
                          <p className="font-semibold text-foreground">{request.userName}</p>
                          <p className="text-sm text-muted-foreground">{request.leaveTypeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.startDate && new Date(request.startDate).toLocaleDateString()} -{" "}
                            {request.endDate && new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{request.days} giorni</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleReviewRequest(request.id, "approved")} disabled={reviewRequestMutation.isPending}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approva
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReviewRequest(request.id, "rejected")} disabled={reviewRequestMutation.isPending}>
                            Rifiuta
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nessuna richiesta in sospeso</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Announcements */}
            {!user?.role || user.role !== "admin" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Bacheca Annunci</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcements && announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h3 className="font-bold text-blue-400">{announcement.title}</h3>
                        <p className="text-sm text-blue-300/80 mt-1">{announcement.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nessun annuncio</p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
