import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Clock, Store, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/untyped-client";
import { format } from "date-fns";

interface ShopRequest {
  id: string;
  user_id: string;
  shop_name: string;
  shop_slug: string;
  description: string | null;
  category: string | null;
  location: string | null;
  phone: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile?: { username: string; email: string };
}

export function ShopRequestsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ShopRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ShopRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("shop_creation_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, username, email").in("user_id", userIds as string[]);
      const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setRequests(data.map((r: any) => ({ ...r, profile: pMap.get(r.user_id) })));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (action: "approved" | "declined") => {
    if (!selected || !user) return;
    setIsProcessing(true);
    const { error } = await supabase
      .from("shop_creation_requests")
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        admin_notes: adminNotes || null,
      })
      .eq("id", selected.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "approved" ? "Shop request approved! Shop created." : "Shop request declined." });
      setSelected(null);
      setAdminNotes("");
      fetchRequests();
    }
    setIsProcessing(false);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" />Shop Requests</CardTitle>
            <CardDescription>Review and approve shop creation requests</CardDescription>
          </div>
          {pendingCount > 0 && <Badge variant="destructive">{pendingCount} Pending</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No shop requests yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.shop_name}</TableCell>
                  <TableCell>
                    <p className="font-medium">{req.profile?.username || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{req.profile?.email}</p>
                  </TableCell>
                  <TableCell>{req.category || "—"}</TableCell>
                  <TableCell>{format(new Date(req.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === "approved" ? "default" : req.status === "declined" ? "destructive" : "secondary"}>
                      {req.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {req.status === "approved" && <Check className="h-3 w-3 mr-1" />}
                      {req.status === "declined" && <X className="h-3 w-3 mr-1" />}
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={req.status === "pending" ? "default" : "ghost"} onClick={() => { setSelected(req); setAdminNotes(req.admin_notes || ""); }}>
                      {req.status === "pending" ? "Review" : <Eye className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected?.status === "pending" ? "Review Shop Request" : "Request Details"}</DialogTitle>
              <DialogDescription>{selected?.shop_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Requester</p><p className="font-medium">{selected?.profile?.username}</p></div>
                <div><p className="text-muted-foreground">Category</p><p className="font-medium">{selected?.category || "—"}</p></div>
                <div><p className="text-muted-foreground">Location</p><p className="font-medium">{selected?.location || "—"}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selected?.phone || "—"}</p></div>
              </div>
              {selected?.description && (
                <div className="p-3 rounded-lg bg-muted text-sm"><p className="text-muted-foreground mb-1">Description:</p><p>{selected.description}</p></div>
              )}
              {selected?.status === "pending" ? (
                <>
                  <div className="space-y-2">
                    <Label>Admin Notes (sent to user on decline)</Label>
                    <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Reason for declining..." rows={3} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="destructive" onClick={() => handleAction("declined")} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}Decline
                    </Button>
                    <Button onClick={() => handleAction("approved")} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Approve & Create
                    </Button>
                  </div>
                </>
              ) : selected?.admin_notes && (
                <div className="p-3 rounded-lg bg-muted"><p className="text-sm text-muted-foreground">Admin Notes:</p><p className="text-sm">{selected.admin_notes}</p></div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
