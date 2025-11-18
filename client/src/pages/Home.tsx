import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  BarChart3,
  Users,
  Send,
  CheckCircle2,
  Clock,
  UserCheck,
  Plane,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState<string>("8");
  const [notes, setNotes] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: stats } = trpc.leaves.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: leaveTypes } = trpc.leaves.getTypes.useQuery();
  const { data: pendingRequests } = trpc.leaves.getRequests.useQuery({ status: "pending" }, { enabled: isAuthenticated });
  const { data: announcements } = trpc.announcements.getAll.useQuery();
  const { data: allRequests } = trpc.leaves.getRequests.useQuery(undefined, { enabled: isAuthenticated });

  const createRequestMutation = trpc.leaves.createRequest.useMutation({
    onSuccess: () => {
      toast.success("Richiesta inviata con successo!");
      setLeaveTypeId("");
      setStartDate("");
      setEndDate("");
      setHours("8");
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
      hours: parseInt(hours),
      notes,
    });
  };

  const handleReviewRequest = (requestId: number, status: "approved" | "rejected") => {
    reviewRequestMutation.mutate({ requestId, status });
  };

  // Calendar helpers
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek: startingDayOfWeek === 0 ? 7 : startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Mock data for team members
  const teamMembers = [
    { id: 1, name: "Riccardo Ferracuti", role: "Team Leader", avatar: user?.name?.charAt(0) || "R", f2a: 208, used: 80, available: 128 },
    { id: 2, name: "Angelo Anglani", role: "Team Member", avatar: "A", f2a: 192, used: 40, available: 152 },
    { id: 3, name: "Leyla Lionte", role: "Team Member", avatar: "L", f2a: 192, used: 120, available: 72 },
    { id: 4, name: "Nicola Oro", role: "Team Member", avatar: "N", f2a: 192, used: 16, available: 176 },
  ];

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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-card border-r border-border p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">{user?.name?.charAt(0) || "U"}</span>
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
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Calendar className="w-5 h-5" />
            Calendario
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Users className="w-5 h-5" />
            Team
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast.info("Funzionalità in arrivo")}>
            <BarChart3 className="w-5 h-5" />
            Report
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast.info("Funzionalità in arrivo")}>
            <FileText className="w-5 h-5" />
            Politiche Ferie
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast.info("Funzionalità in arrivo")}>
            <MessageSquare className="w-5 h-5" />
            Messaggi
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Bell className="w-5 h-5" />
            Bacheca
          </Button>
        </nav>

        <div className="mt-auto space-y-2">
          <Button className="w-full" onClick={() => toast.info("Scorri in basso per il form")}>
            <Plane className="w-4 h-4 mr-2" />
            Richiedi Ferie
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast.info("Funzionalità in arrivo")}>
            <Settings className="w-5 h-5" />
            Impostazioni
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => logout()}>
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-black text-foreground mb-2">Dashboard Gestione Ferie</h1>
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
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted opacity-20" />
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

          {/* Request Form and Pending Approvals */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Invia una richiesta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div className="space-y-2">
                      <Label htmlFor="start-date">Data Inizio</Label>
                      <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Data Fine</Label>
                      <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours">Ore per giorno</Label>
                    <Select value={hours} onValueChange={setHours}>
                      <SelectTrigger id="hours">
                        <SelectValue placeholder="Seleziona ore" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 ore (Permesso breve)</SelectItem>
                        <SelectItem value="4">4 ore (Mezza giornata)</SelectItem>
                        <SelectItem value="8">8 ore (Giornata intera)</SelectItem>
                      </SelectContent>
                    </Select>
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

            {user?.role === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle>Richieste da Approvare</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingRequests && pendingRequests.length > 0 ? (
                    pendingRequests.slice(0, 2).map((request) => (
                      <div key={request.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-sm">{request.userName?.charAt(0) || "U"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{request.userName}</p>
                            <p className="text-sm text-muted-foreground">{request.leaveTypeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.startDate && new Date(request.startDate).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} -{" "}
                              {request.endDate && new Date(request.endDate).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleReviewRequest(request.id, "approved")}
                            disabled={reviewRequestMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approva
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReviewRequest(request.id, "rejected")}
                            disabled={reviewRequestMutation.isPending}
                          >
                            Rifiuta
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nessuna richiesta in sospeso</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Team Leave Balance Section */}
          <Card>
            <CardHeader>
              <CardTitle>Il mio saldo ferie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">{member.avatar}</span>
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">in F2A</p>
                        <p className="font-bold text-foreground text-lg">{member.f2a}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Usate</p>
                        <p className="font-bold text-foreground text-lg">{member.used}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Disponibili</p>
                        <p className="font-bold text-green-600 text-lg">{member.available}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calendar and Sidebar */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="xl:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={previousMonth}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-lg font-bold">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-muted-foreground">Approvate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-muted-foreground">In Sospeso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-muted-foreground">Festività</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
                    <div key={day} className="py-2 text-xs font-bold text-muted-foreground uppercase">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startingDayOfWeek - 1 }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();
                    const isWeekend = ((startingDayOfWeek + i) % 7 === 5 || (startingDayOfWeek + i) % 7 === 6);

                    return (
                      <button
                        key={day}
                        className={`aspect-square p-1 rounded-md border border-border flex flex-col items-center justify-center text-sm hover:bg-muted/50 transition-colors ${
                          isToday ? "ring-2 ring-primary bg-primary/10" : ""
                        } ${isWeekend ? "text-muted-foreground" : ""}`}
                      >
                        <span className={isToday ? "font-bold text-primary" : ""}>{day}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bacheca Annunci</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcements && announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h3 className="font-bold text-blue-600 dark:text-blue-400 text-sm">{announcement.title}</h3>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">{announcement.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nessun annuncio</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Messaggi Recenti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">L</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-foreground text-sm">Leyla Lionte</p>
                        <span className="text-xs text-muted-foreground">10:45</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">Ciao, ho inviato la richiesta per il 12 Ago...</p>
                    </div>
                    <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full">1</div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">A</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-foreground text-sm">Angelo Anglani</p>
                        <span className="text-xs text-muted-foreground">Ieri</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">Richiesta inviata, grazie!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Riepilogo Utilizzo Ferie</CardTitle>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtra per tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="ferie">Ferie</SelectItem>
                    <SelectItem value="permesso">Permesso</SelectItem>
                    <SelectItem value="malattia">Malattia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left">Dipendente</th>
                      <th className="px-6 py-3 text-left">Tipo Assenza</th>
                      <th className="px-6 py-3 text-left">Giorni Utilizzati</th>
                      <th className="px-6 py-3 text-left">Saldo Residuo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member, idx) => (
                      <tr key={member.id} className={idx !== teamMembers.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-6 py-4 font-medium text-foreground">{member.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">Ferie</td>
                        <td className="px-6 py-4 text-muted-foreground">{member.used}</td>
                        <td className="px-6 py-4 text-muted-foreground">{member.available}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
