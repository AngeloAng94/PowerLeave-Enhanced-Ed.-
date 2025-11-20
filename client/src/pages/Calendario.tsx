import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Calendario() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Query ferie del mese corrente
  const { data: monthlyLeaves } = trpc.leaves.getMonthlyLeaves.useQuery(
    {
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
    },
    { enabled: isAuthenticated }
  );

  // Query chiusure aziendali
  const { data: companyClosures } = trpc.leaves.getCompanyClosures.useQuery(
    {
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
    },
    { enabled: isAuthenticated }
  );

  // Query tutti gli utenti per filtro
  const { data: allUsers } = trpc.team.getAllUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: leaveTypes } = trpc.leaves.getTypes.useQuery();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Genera giorni del mese
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Filtra ferie
  const filteredLeaves = monthlyLeaves?.filter((leave: any) => {
    if (filterMember !== "all" && leave.userId.toString() !== filterMember) return false;
    if (filterStatus !== "all" && leave.status !== filterStatus) return false;
    return true;
  });

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
                <h1 className="text-2xl font-bold text-foreground">Calendario Ferie</h1>
                <p className="text-sm text-muted-foreground">
                  Visualizza le assenze del team per mese
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="text-2xl font-bold min-w-[200px] text-center">
                    {currentMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                  </span>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </CardTitle>

                {/* Filtri */}
                <div className="flex items-center gap-3">
                  {user?.role === "admin" && allUsers && (
                    <Select value={filterMember} onValueChange={setFilterMember}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tutti i membri" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i membri</SelectItem>
                        {allUsers.map((u: any) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tutti gli stati" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="approved">Approvate</SelectItem>
                      <SelectItem value="pending">In Sospeso</SelectItem>
                      <SelectItem value="rejected">Rifiutate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-muted-foreground">Ferie Approvate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <span className="text-muted-foreground">In Sospeso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600"></div>
                  <span className="text-muted-foreground">Festa Nazionale</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-600"></div>
                  <span className="text-muted-foreground">Chiusura Aziendale</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Calendario */}
            <div className="grid grid-cols-7 gap-2">
              {/* Intestazioni giorni */}
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
                <div key={day} className="py-3 text-center text-sm font-bold text-muted-foreground uppercase">
                  {day}
                </div>
              ))}

              {/* Giorni del mese */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateString = currentDate.toISOString().split("T")[0];
                const isToday =
                  new Date().toDateString() === currentDate.toDateString();
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

                // Ferie del giorno
                const dayLeaves = (filteredLeaves || []).filter((leave: any) => {
                  const start = new Date(leave.startDate);
                  const end = new Date(leave.endDate);
                  return currentDate >= start && currentDate <= end;
                });

                // Chiusure aziendali e feste nazionali
                const closure = companyClosures?.find(
                  (c: any) => c.date === dateString
                );
                const isHoliday = closure?.type === "holiday"; // Festa nazionale (ROSSO)
                const isShutdown = closure?.type === "shutdown"; // Chiusura aziendale (ARANCIONE)

                const hasApproved = dayLeaves.some((l: any) => l.status === "approved");
                const hasPending = dayLeaves.some((l: any) => l.status === "pending");

                return (
                  <div
                    key={day}
                    className={`aspect-square p-3 rounded-lg border flex flex-col items-start justify-start transition-all ${
                      isToday
                        ? "ring-2 ring-primary bg-primary/10 border-primary"
                        : isHoliday
                        ? "bg-red-600/30 border-red-600 font-semibold"
                        : isShutdown
                        ? "bg-amber-600/30 border-amber-600"
                        : hasApproved
                        ? "bg-green-500/10 border-green-500/50"
                        : hasPending
                        ? "bg-orange-500/10 border-orange-500/50"
                        : "border-border hover:bg-muted/50"
                    } ${isWeekend ? "bg-muted/30" : ""}`}
                  >
                    <span
                      className={`text-lg font-semibold ${
                        isToday ? "text-primary" : isWeekend ? "text-muted-foreground" : ""
                      }`}
                    >
                      {day}
                    </span>

                    {/* Indicatori ferie */}
                    {dayLeaves.length > 0 && (
                      <div className="mt-2 space-y-1 w-full">
                        {dayLeaves.slice(0, 4).map((leave: any, idx: number) => (
                          <div
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded truncate ${
                              leave.status === "approved"
                                ? "bg-green-500 text-white"
                                : leave.status === "pending"
                                ? "bg-orange-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                            title={`${leave.userName} - ${leave.leaveTypeName} (${leave.hours}h)`}
                          >
                            {leave.userName?.split(" ")[0]}
                          </div>
                        ))}
                        {dayLeaves.length > 4 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayLeaves.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Indicatore chiusure */}
                    {isHoliday && (
                      <div className="mt-2 text-xs font-bold text-red-700">
                        {closure.reason}
                      </div>
                    )}
                    {isShutdown && (
                      <div className="mt-2 text-xs font-semibold text-amber-700">
                        {closure.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
