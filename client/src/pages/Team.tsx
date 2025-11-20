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
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, User, Mail, Calendar, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Team() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Solo admin può accedere
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>Solo gli amministratori possono accedere a questa pagina</CardDescription>
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

  // Query per ottenere tutti gli utenti
  const { data: allUsers, isLoading } = trpc.team.getAllUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Mutation per cambiare ruolo
  const toggleRole = trpc.team.toggleUserRole.useMutation({
    onSuccess: () => {
      toast.success("Ruolo utente aggiornato");
      utils.team.getAllUsers.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleToggleRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    toggleRole.mutate({ userId, role: newRole });
  };

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
                <h1 className="text-2xl font-bold text-foreground">Gestione Team</h1>
                <p className="text-sm text-muted-foreground">Visualizza e gestisci i membri del team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Membri del Team</CardTitle>
            <CardDescription>
              {allUsers?.length || 0} membri totali
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Caricamento...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Ultimo Accesso</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers?.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {member.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          {member.name || "Senza nome"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {member.email || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                          {member.role === "admin" ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              Utente
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="w-4 h-4" />
                          {member.lastSignedIn
                            ? new Date(member.lastSignedIn).toLocaleDateString("it-IT")
                            : "Mai"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRole(member.id, member.role)}
                          disabled={member.id === user?.id}
                        >
                          {member.role === "admin" ? "Rimuovi Admin" : "Rendi Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informazioni sui Ruoli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Amministratore</p>
                <p className="text-sm text-muted-foreground">
                  Può approvare/rifiutare richieste ferie, visualizzare tutti i dipendenti, gestire ruoli
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Utente</p>
                <p className="text-sm text-muted-foreground">
                  Può inviare richieste ferie, visualizzare solo il proprio saldo e storico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
