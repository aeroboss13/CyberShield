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
  tags: string[];
  publishedAt: Date;
}

export type TabType = 'feed' | 'mitre' | 'cve' | 'news';
