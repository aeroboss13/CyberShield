import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Shield, 
  Bug,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  ExternalLink
} from "lucide-react";
import CreateReportModal from "@/components/CreateReportModal";

interface UserSubmission {
  id: number;
  type: 'vulnerability' | 'exploit';
  title: string;
  description: string;
  severity?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
  };
}

export default function UserReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: submissions = [], isLoading } = useQuery<UserSubmission[]>({
    queryKey: ["/api/submissions"]
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    const matchesType = typeFilter === "all" || submission.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getSeverityColor = (severity?: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">User Reports</h1>
          <p className="text-gray-400 mt-1">
            Community-submitted vulnerability reports and exploits
          </p>
        </div>
        <CreateReportModal />
      </div>

      {/* Filters */}
      <Card className="cyber-bg-card border-cyber-blue">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cyber-input pl-10"
                  data-testid="input-search-reports"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] cyber-input" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] cyber-input" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="vulnerability">Vulnerability</SelectItem>
                <SelectItem value="exploit">Exploit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="cyber-bg-card border-cyber-blue">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">No reports found</h3>
                  <p className="text-gray-400 mt-1">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? "Try adjusting your filters"
                      : "Be the first to submit a vulnerability report"
                    }
                  </p>
                </div>
                <CreateReportModal 
                  trigger={
                    <Button className="cyber-button-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Report
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="cyber-bg-card border-cyber-blue hover:border-cyber-purple transition-colors" data-testid={`card-report-${submission.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {submission.type === 'vulnerability' ? (
                        <Bug className="w-6 h-6 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg" data-testid={`text-report-title-${submission.id}`}>
                        {submission.title}
                      </CardTitle>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center text-sm text-gray-400">
                          <User className="w-3 h-3 mr-1" />
                          {submission.user.name}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(submission.status)} data-testid={`badge-status-${submission.id}`}>
                      {getStatusIcon(submission.status)}
                      <span className="ml-1 capitalize">{submission.status}</span>
                    </Badge>
                    {submission.verified && (
                      <Badge className="bg-blue-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {submission.severity && (
                      <Badge className={getSeverityColor(submission.severity)}>
                        {submission.severity.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-300 mb-4 line-clamp-3" data-testid={`text-report-description-${submission.id}`}>
                  {submission.description}
                </p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {submission.type === 'vulnerability' ? 'Vulnerability Report' : 'Exploit Code'}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-400 hover:text-blue-300"
                    data-testid={`button-view-report-${submission.id}`}
                  >
                    View Details
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}