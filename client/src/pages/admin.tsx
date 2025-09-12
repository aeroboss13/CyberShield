import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UserSubmission {
  id: number;
  type: "cve" | "exploit";
  title: string;
  description: string;
  severity?: string;
  exploitCode?: string;
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  reviewNotes: string | null;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

function SubmissionCard({ submission, onApprove, onReject }: {
  submission: UserSubmission;
  onApprove: (id: number, notes?: string) => void;
  onReject: (id: number, notes?: string) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600" data-testid={`badge-status-${submission.id}`}><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`badge-status-${submission.id}`}><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-600" data-testid={`badge-status-${submission.id}`}><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${submission.id}`}>Unknown</Badge>;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    
    const colors = {
      CRITICAL: "text-purple-600 border-purple-600",
      HIGH: "text-red-600 border-red-600",
      MEDIUM: "text-orange-600 border-orange-600",
      LOW: "text-yellow-600 border-yellow-600"
    };
    
    return <Badge variant="outline" className={colors[severity as keyof typeof colors] || "text-gray-600 border-gray-600"} data-testid={`badge-severity-${submission.id}`}>
      <AlertTriangle className="w-3 h-3 mr-1" />{severity}
    </Badge>;
  };

  const handleApprove = () => {
    onApprove(submission.id, reviewNotes);
    setShowApproveDialog(false);
    setReviewNotes("");
  };

  const handleReject = () => {
    onReject(submission.id, reviewNotes);
    setShowRejectDialog(false);
    setReviewNotes("");
  };

  return (
    <Card className="mb-4" data-testid={`card-submission-${submission.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg" data-testid={`text-title-${submission.id}`}>{submission.title}</CardTitle>
            <Badge variant="secondary" data-testid={`badge-type-${submission.id}`}>{submission.type.toUpperCase()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {getSeverityBadge(submission.severity)}
            {getStatusBadge(submission.status)}
          </div>
        </div>
        <CardDescription data-testid={`text-description-${submission.id}`}>
          Submitted by <span className="font-semibold">{submission.user.name}</span> (@{submission.user.username}) on {new Date(submission.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Description:</Label>
            <p className="text-sm text-muted-foreground mt-1" data-testid={`text-desc-detail-${submission.id}`}>{submission.description}</p>
          </div>
          
          {submission.exploitCode && (
            <div>
              <Label className="text-sm font-semibold">Exploit Code:</Label>
              <pre className="text-xs bg-muted p-3 rounded-md mt-1 overflow-x-auto" data-testid={`code-exploit-${submission.id}`}>
                <code>{submission.exploitCode}</code>
              </pre>
            </div>
          )}

          {submission.reviewNotes && (
            <div>
              <Label className="text-sm font-semibold">Review Notes:</Label>
              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-review-notes-${submission.id}`}>{submission.reviewNotes}</p>
            </div>
          )}

          {submission.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" data-testid={`button-approve-${submission.id}`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Submission</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to approve this {submission.type} submission?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="approve-notes">Review Notes (Optional)</Label>
                      <Textarea
                        id="approve-notes"
                        placeholder="Add any notes about your review..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        data-testid={`textarea-approve-notes-${submission.id}`}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowApproveDialog(false)} data-testid={`button-cancel-approve-${submission.id}`}>
                      Cancel
                    </Button>
                    <Button onClick={handleApprove} data-testid={`button-confirm-approve-${submission.id}`}>
                      Approve Submission
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" data-testid={`button-reject-${submission.id}`}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Submission</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to reject this {submission.type} submission?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reject-notes">Review Notes (Required)</Label>
                      <Textarea
                        id="reject-notes"
                        placeholder="Please provide a reason for rejection..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        required
                        data-testid={`textarea-reject-notes-${submission.id}`}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRejectDialog(false)} data-testid={`button-cancel-reject-${submission.id}`}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={!reviewNotes.trim()} data-testid={`button-confirm-reject-${submission.id}`}>
                      Reject Submission
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { toast } = useToast();

  // Get all submissions for admin
  const { data: allSubmissions = [], isLoading: allLoading } = useQuery<UserSubmission[]>({
    queryKey: ["/api/admin/submissions"],
  });

  // Get pending submissions
  const { data: pendingSubmissions = [], isLoading: pendingLoading } = useQuery<UserSubmission[]>({
    queryKey: ["/api/admin/submissions/pending"],
  });

  // Approve submission mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: number; reviewNotes?: string }) => {
      const response = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes }),
      });
      if (!response.ok) throw new Error("Failed to approve submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions/pending"] });
      toast({
        title: "Success",
        description: "Submission approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive",
      });
    },
  });

  // Reject submission mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reviewNotes }: { id: number; reviewNotes?: string }) => {
      const response = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes }),
      });
      if (!response.ok) throw new Error("Failed to reject submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions/pending"] });
      toast({
        title: "Success",
        description: "Submission rejected successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number, reviewNotes?: string) => {
    approveMutation.mutate({ id, reviewNotes });
  };

  const handleReject = (id: number, reviewNotes?: string) => {
    rejectMutation.mutate({ id, reviewNotes });
  };

  const approvedSubmissions = allSubmissions.filter(s => s.status === "approved");
  const rejectedSubmissions = allSubmissions.filter(s => s.status === "rejected");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">Admin Panel</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-count">{allSubmissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">{pendingSubmissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600" data-testid="text-approved-count">{approvedSubmissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600" data-testid="text-rejected-count">{rejectedSubmissions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full" data-testid="tabs-admin">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingSubmissions.length})</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved ({approvedSubmissions.length})</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected ({rejectedSubmissions.length})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All ({allSubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingLoading ? (
            <div className="text-center py-8" data-testid="loading-pending">Loading pending submissions...</div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-pending">
              No pending submissions to review.
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Review</h2>
              {pendingSubmissions.map(submission => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-approved">
              No approved submissions yet.
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Approved Submissions</h2>
              {approvedSubmissions.map(submission => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-rejected">
              No rejected submissions yet.
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Rejected Submissions</h2>
              {rejectedSubmissions.map(submission => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {allLoading ? (
            <div className="text-center py-8" data-testid="loading-all">Loading all submissions...</div>
          ) : allSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-all">
              No submissions yet.
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">All Submissions</h2>
              {allSubmissions.map(submission => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}