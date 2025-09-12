import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Bug, AlertTriangle, Code, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateReportModalProps {
  trigger?: React.ReactNode;
}

export default function CreateReportModal({ trigger }: CreateReportModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vulnerability' | 'exploit'>('vulnerability');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Vulnerability form data
  const [vulnFormData, setVulnFormData] = useState({
    title: "",
    description: "",
    severity: "",
    category: "",
    affectedSoftware: "",
    versions: "",
  });

  // Exploit form data
  const [exploitFormData, setExploitFormData] = useState({
    title: "",
    description: "",
    category: "",
    platform: "",
    exploitType: "",
    exploitCode: "",
    targetCve: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/submissions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Report Submitted",
        description: "Your security report has been submitted for review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setVulnFormData({
      title: "",
      description: "",
      severity: "",
      category: "",
      affectedSoftware: "",
      versions: "",
    });
    setExploitFormData({
      title: "",
      description: "",
      category: "",
      platform: "",
      exploitType: "",
      exploitCode: "",
      targetCve: "",
    });
    setTags([]);
    setTagInput("");
    setActiveTab('vulnerability');
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseData = {
      type: activeTab,
      tags,
    };

    if (activeTab === 'vulnerability') {
      createSubmissionMutation.mutate({
        ...baseData,
        ...vulnFormData,
      });
    } else {
      createSubmissionMutation.mutate({
        ...baseData,
        ...exploitFormData,
      });
    }
  };

  const defaultTrigger = (
    <Button className="cyber-button-primary">
      <Plus className="w-4 h-4 mr-2" />
      Submit Report
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild data-testid="button-create-report">
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="cyber-bg-dark border-cyber-blue max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Submit Security Report</DialogTitle>
          <DialogDescription className="cyber-text-dim">
            Share vulnerability discoveries and exploit code with the community
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'vulnerability' | 'exploit')}>
          <TabsList className="grid w-full grid-cols-2 cyber-bg-surface">
            <TabsTrigger value="vulnerability" className="data-[state=active]:cyber-bg-blue">
              <Bug className="w-4 h-4 mr-2" />
              Vulnerability
            </TabsTrigger>
            <TabsTrigger value="exploit" className="data-[state=active]:cyber-bg-blue">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Exploit
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="vulnerability" className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label className="text-white text-sm font-medium">Title *</Label>
                  <Input
                    value={vulnFormData.title}
                    onChange={(e) => setVulnFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="cyber-input mt-2"
                    placeholder="e.g., SQL Injection in User Authentication"
                    required
                    data-testid="input-vuln-title"
                  />
                </div>

                <div>
                  <Label className="text-white text-sm font-medium">Description *</Label>
                  <Textarea
                    value={vulnFormData.description}
                    onChange={(e) => setVulnFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="cyber-input mt-2 min-h-[120px] resize-none"
                    placeholder="Detailed description of the vulnerability, impact, and steps to reproduce..."
                    required
                    maxLength={2000}
                    data-testid="input-vuln-description"
                  />
                  <div className="text-xs cyber-text-dim mt-1 text-right">
                    {vulnFormData.description.length}/2000 characters
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white text-sm font-medium">Severity *</Label>
                    <Select value={vulnFormData.severity} onValueChange={(value) => setVulnFormData(prev => ({ ...prev, severity: value }))}>
                      <SelectTrigger className="cyber-input mt-2" data-testid="select-vuln-severity">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium">Category *</Label>
                    <Select value={vulnFormData.category} onValueChange={(value) => setVulnFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="cyber-input mt-2" data-testid="select-vuln-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="authentication">Authentication</SelectItem>
                        <SelectItem value="authorization">Authorization</SelectItem>
                        <SelectItem value="xss">Cross-Site Scripting</SelectItem>
                        <SelectItem value="csrf">CSRF</SelectItem>
                        <SelectItem value="rce">Remote Code Execution</SelectItem>
                        <SelectItem value="lfi">Local File Inclusion</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white text-sm font-medium">Affected Software</Label>
                    <Input
                      value={vulnFormData.affectedSoftware}
                      onChange={(e) => setVulnFormData(prev => ({ ...prev, affectedSoftware: e.target.value }))}
                      className="cyber-input mt-2"
                      placeholder="e.g., WordPress, Apache, etc."
                      data-testid="input-vuln-software"
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium">Versions</Label>
                    <Input
                      value={vulnFormData.versions}
                      onChange={(e) => setVulnFormData(prev => ({ ...prev, versions: e.target.value }))}
                      className="cyber-input mt-2"
                      placeholder="e.g., 5.0-5.2, < 2.1.0"
                      data-testid="input-vuln-versions"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exploit" className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label className="text-white text-sm font-medium">Title *</Label>
                  <Input
                    value={exploitFormData.title}
                    onChange={(e) => setExploitFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="cyber-input mt-2"
                    placeholder="e.g., WordPress SQL Injection Exploit"
                    required
                    data-testid="input-exploit-title"
                  />
                </div>

                <div>
                  <Label className="text-white text-sm font-medium">Description *</Label>
                  <Textarea
                    value={exploitFormData.description}
                    onChange={(e) => setExploitFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="cyber-input mt-2 min-h-[120px] resize-none"
                    placeholder="Description of the exploit, usage instructions, and precautions..."
                    required
                    maxLength={2000}
                    data-testid="input-exploit-description"
                  />
                  <div className="text-xs cyber-text-dim mt-1 text-right">
                    {exploitFormData.description.length}/2000 characters
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white text-sm font-medium">Platform *</Label>
                    <Select value={exploitFormData.platform} onValueChange={(value) => setExploitFormData(prev => ({ ...prev, platform: value }))}>
                      <SelectTrigger className="cyber-input mt-2" data-testid="select-exploit-platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linux">Linux</SelectItem>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="macos">macOS</SelectItem>
                        <SelectItem value="web">Web Application</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="multi">Multiple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium">Type *</Label>
                    <Select value={exploitFormData.exploitType} onValueChange={(value) => setExploitFormData(prev => ({ ...prev, exploitType: value }))}>
                      <SelectTrigger className="cyber-input mt-2" data-testid="select-exploit-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="webapp">Web Application</SelectItem>
                        <SelectItem value="dos">DoS</SelectItem>
                        <SelectItem value="poc">Proof of Concept</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white text-sm font-medium">Category *</Label>
                    <Select value={exploitFormData.category} onValueChange={(value) => setExploitFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="cyber-input mt-2" data-testid="select-exploit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rce">Remote Code Execution</SelectItem>
                        <SelectItem value="privilege-escalation">Privilege Escalation</SelectItem>
                        <SelectItem value="information-disclosure">Information Disclosure</SelectItem>
                        <SelectItem value="buffer-overflow">Buffer Overflow</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-white text-sm font-medium">Related CVE ID</Label>
                  <Input
                    value={exploitFormData.targetCve}
                    onChange={(e) => setExploitFormData(prev => ({ ...prev, targetCve: e.target.value }))}
                    className="cyber-input mt-2"
                    placeholder="e.g., CVE-2024-1234"
                    data-testid="input-exploit-cve"
                  />
                </div>

                <div>
                  <Label className="text-white text-sm font-medium">Exploit Code *</Label>
                  <Textarea
                    value={exploitFormData.exploitCode}
                    onChange={(e) => setExploitFormData(prev => ({ ...prev, exploitCode: e.target.value }))}
                    className="cyber-input mt-2 min-h-[200px] resize-none font-mono text-sm"
                    placeholder="#!/bin/bash&#10;# Exploit code here...&#10;&#10;# Usage: ./exploit.sh [target]"
                    required
                    data-testid="input-exploit-code"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs cyber-text-dim">
                      <Code className="w-3 h-3 mr-1" />
                      Use responsible disclosure - Test only on authorized systems
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tags Section (common for both tabs) */}
            <div>
              <Label className="text-white text-sm font-medium">Tags</Label>
              <div className="flex space-x-2 mb-3 mt-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tags like php, sql-injection, rce..."
                  className="cyber-input flex-1"
                  maxLength={20}
                  data-testid="input-tags"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                  className="cyber-button-secondary"
                  data-testid="button-add-tag"
                >
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="cyber-bg-blue text-white flex items-center space-x-1"
                      data-testid={`tag-${tag}`}
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="cyber-button-ghost"
                data-testid="button-cancel-report"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSubmissionMutation.isPending}
                className="cyber-button-primary"
                data-testid="button-submit-report"
              >
                {createSubmissionMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}