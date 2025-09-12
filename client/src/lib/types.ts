export interface PostWithUser {
  id: number;
  userId: number;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
    avatar: string | null;
  };
}

export interface CVEWithDetails {
  id: number;
  cveId: string;
  title: string;
  description: string;
  cvssScore: string | null;
  severity: string;
  vendor: string | null;
  publishedDate: string | null;
  updatedDate: string | null;
  tags: string[];
  activelyExploited: boolean;
  edbId: string | null; // ExploitDB ID for direct exploit access
}

export interface MitreTactic {
  tacticId: string;
  tacticName: string;
  tacticDescription: string;
  techniques: {
    id: number;
    tacticId: string;
    tacticName: string;
    tacticDescription: string;
    techniqueId: string;
    techniqueName: string;
    techniqueDescription: string | null;
  }[];
}

export interface ExploitWithDetails {
  id: number;
  cveId: string;
  edbId: string;
  title: string;
  description: string | null;
  exploitType: string | null;
  platform: string | null;
  author: string | null;
  datePublished: string;
  sourceUrl: string | null;
  exploitCode: string | null;
  verified: boolean;
}

export interface NewsArticleType {
  id: number;
  title: string;
  summary: string;
  content: string | null;
  source: string;
  imageUrl: string | null;
  link: string | null; // Original article URL
  tags: string[];
  publishedAt: Date;
}

export interface FullContentResponse {
  success: boolean;
  articleId: number;
  sourceUrl: string;
  title: string;
  content: string;
  extractedAt: string;
  originalSummary: string;
  error?: string;
}

export type TabType = 'feed' | 'mitre' | 'cve' | 'news';
