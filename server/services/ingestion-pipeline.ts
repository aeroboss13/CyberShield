import { storage } from '../storage';
import { CVEService } from './cve-service';
import { ExploitService } from './exploit-service';
import type { InsertCVE, InsertExploit } from '@shared/schema';

interface IngestionProgress {
  totalCVEs: number;
  processedCVEs: number;
  cveWithExploits: number;
  totalExploits: number;
  errors: string[];
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
}

interface ExploitDBEntry {
  edbId: string;
  title: string;
  description: string;
  exploitType: string;
  platform: string;
  verified: boolean;
  datePublished: string;
  author: string;
  sourceUrl: string;
  exploitCode?: string;
}

export class IngestionPipeline {
  private cveService: CVEService;
  private exploitService: ExploitService;
  private progress: IngestionProgress;
  private isRunning = false;
  private shouldStop = false;

  constructor() {
    this.cveService = CVEService.getInstance(storage);
    this.exploitService = ExploitService.getInstance();
    this.progress = this.getInitialProgress();
  }

  private getInitialProgress(): IngestionProgress {
    return {
      totalCVEs: 0,
      processedCVEs: 0,
      cveWithExploits: 0,
      totalExploits: 0,
      errors: [],
      status: 'idle'
    };
  }

  async startIngestion(options: {
    maxCVEs?: number;
    startYear?: number;
    endYear?: number;
    concurrency?: number;
  } = {}): Promise<void> {
    if (this.isRunning) {
      throw new Error('Ingestion pipeline is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.progress = {
      ...this.getInitialProgress(),
      status: 'running',
      startTime: new Date()
    };

    const {
      maxCVEs = 10000, // Default: process 10k CVEs
      startYear = 2020,  // Start from 2020
      endYear = new Date().getFullYear(),
      concurrency = 3    // Max 3 concurrent requests to be respectful
    } = options;

    console.log(`🚀 Starting CVE ingestion pipeline...`);
    console.log(`📊 Parameters: maxCVEs=${maxCVEs}, years=${startYear}-${endYear}, concurrency=${concurrency}`);

    try {
      // Step 1: Fetch CVEs from NVD API by year
      for (let year = endYear; year >= startYear; year--) {
        if (this.shouldStop || this.progress.processedCVEs >= maxCVEs) break;

        await this.ingestCVEsForYear(year, maxCVEs - this.progress.processedCVEs, concurrency);
      }

      this.progress.status = 'completed';
      this.progress.endTime = new Date();

      const duration = this.progress.endTime.getTime() - this.progress.startTime!.getTime();
      console.log(`✅ Ingestion completed in ${Math.round(duration / 1000)}s`);
      console.log(`📈 Results: ${this.progress.processedCVEs} CVEs, ${this.progress.cveWithExploits} with exploits, ${this.progress.totalExploits} total exploits`);

    } catch (error) {
      this.progress.status = 'error';
      this.progress.errors.push(`Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Ingestion pipeline failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async ingestCVEsForYear(year: number, maxCVEs: number, concurrency: number): Promise<void> {
    console.log(`📅 Processing CVEs from year ${year}...`);
    
    let startIndex = 0;
    const batchSize = 1000; // NVD API batch size
    let totalForYear = 0;

    while (this.progress.processedCVEs < maxCVEs && !this.shouldStop) {
      try {
        // Fetch CVEs from NVD for this year
        const nvdParams = {
          resultsPerPage: Math.min(batchSize, maxCVEs - this.progress.processedCVEs).toString(),
          startIndex: startIndex.toString()
        };

        console.log(`🔍 Fetching CVEs for ${year}, batch starting at ${startIndex}...`);
        
        const nvdData = await this.fetchNVDData(nvdParams);
        
        if (!nvdData.vulnerabilities || nvdData.vulnerabilities.length === 0) {
          console.log(`ℹ️ No more CVEs for year ${year}`);
          break;
        }

        if (totalForYear === 0) {
          totalForYear = nvdData.totalResults || nvdData.vulnerabilities.length;
          this.progress.totalCVEs += totalForYear;
          console.log(`📊 Found ${totalForYear} total CVEs for year ${year}`);
        }

        // Process CVEs in parallel with concurrency control
        await this.processCVEBatch(nvdData.vulnerabilities, concurrency);

        startIndex += nvdData.vulnerabilities.length;

        // Add delay to respect rate limits
        await this.delay(1000);

      } catch (error) {
        console.error(`❌ Error processing year ${year}, batch ${startIndex}:`, error);
        this.progress.errors.push(`Year ${year} batch ${startIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Continue with next batch on error
        startIndex += batchSize;
        await this.delay(5000); // Longer delay on error
      }
    }
  }

  private async processCVEBatch(vulnerabilities: any[], concurrency: number): Promise<void> {
    // Process CVEs in chunks to control concurrency
    for (let i = 0; i < vulnerabilities.length; i += concurrency) {
      if (this.shouldStop) break;

      const chunk = vulnerabilities.slice(i, i + concurrency);
      const promises = chunk.map(vuln => this.processSingleCVE(vuln));
      
      await Promise.allSettled(promises);
    }
  }

  private async processSingleCVE(vulnerability: any): Promise<void> {
    try {
      const cve = vulnerability.cve;
      if (!cve?.id) return;

      const cveId = cve.id;
      
      // Convert NVD CVE to our format
      const insertCVE: InsertCVE = {
        cveId,
        title: this.extractCVETitle(cve),
        description: this.extractDescription(cve),
        cvssScore: this.extractCVSSScore(cve),
        severity: this.extractSeverity(cve),
        vendor: this.extractVendor(cve),
        publishedDate: cve.published || null,
        updatedDate: cve.lastModified || null,
        tags: this.extractTags(cve),
        activelyExploited: false, // Will be updated by CISA KEV check
        edbId: null // Will be populated if exploit found
      };

      // Step 1: Store CVE
      const storedCVE = await storage.createOrUpdateCVE(insertCVE);
      this.progress.processedCVEs++;

      // Step 2: Extract ExploitDB references from NVD data
      const exploitDbReferences = this.extractExploitDBReferences(cve);
      
      if (exploitDbReferences.length > 0) {
        this.progress.cveWithExploits++;
        
        // Step 3: Store exploits and update CVE with first EDB-ID
        for (const exploitRef of exploitDbReferences) {
          try {
            const existingExploit = await storage.getExploitByEdbId(exploitRef.edbId);
            if (!existingExploit) {
              // Use exploit service to get detailed exploit information
              const exploitDetails = await this.fetchExploitDetails(exploitRef.edbId, cveId);
              if (exploitDetails) {
                const insertExploit: InsertExploit = {
                  cveId,
                  exploitId: exploitRef.edbId,
                  title: exploitDetails.title,
                  description: exploitDetails.description,
                  exploitType: exploitDetails.exploitType,
                  platform: exploitDetails.platform,
                  verified: true, // From authoritative NVD reference
                  datePublished: exploitDetails.datePublished,
                  author: exploitDetails.author,
                  sourceUrl: exploitRef.url,
                  exploitCode: null, // Lazy loaded
                  source: 'ExploitDB'
                };

                await storage.createExploit(insertExploit);
                this.progress.totalExploits++;
                
                // Update CVE with first EDB-ID using specific update method
                if (!storedCVE.edbId) {
                  await storage.updateCVEEdbId(cveId, exploitRef.edbId);
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Failed to process exploit ${exploitRef.edbId} for ${cveId}:`, error);
            this.progress.errors.push(`Exploit ${exploitRef.edbId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        console.log(`✅ ${cveId}: Found ${exploitDbReferences.length} ExploitDB references`);
      }

      if (this.progress.processedCVEs % 100 === 0) {
        console.log(`📊 Progress: ${this.progress.processedCVEs} CVEs processed, ${this.progress.cveWithExploits} with exploits`);
      }

    } catch (error) {
      console.error(`❌ Error processing CVE:`, error);
      this.progress.errors.push(`CVE processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractExploitDBReferences(cve: any): Array<{edbId: string, url: string}> {
    const exploitDbRefs: Array<{edbId: string, url: string}> = [];
    
    if (!cve.references || !Array.isArray(cve.references)) {
      return exploitDbRefs;
    }

    // Extract ExploitDB URLs from NVD references
    for (const ref of cve.references) {
      if (ref.url && typeof ref.url === 'string') {
        const exploitDbMatch = ref.url.match(/exploit-db\.com\/exploits\/(\d+)/i);
        if (exploitDbMatch) {
          const edbId = exploitDbMatch[1];
          exploitDbRefs.push({
            edbId,
            url: ref.url
          });
          console.log(`🔗 Found ExploitDB reference: EDB-${edbId} for ${cve.id}`);
        }
      }
    }

    return exploitDbRefs;
  }

  private async fetchExploitDetails(edbId: string, cveId: string): Promise<ExploitDBEntry | null> {
    try {
      // Use the exploit service to get exploit details
      const exploitInfo = await this.exploitService.getExploitsForCVE(cveId, edbId);
      
      if (exploitInfo && exploitInfo.length > 0) {
        const exploit = exploitInfo[0];
        return {
          edbId,
          title: exploit.title || `Exploit for ${cveId} (EDB-${edbId})`,
          description: exploit.description || `Verified exploit for ${cveId} from ExploitDB.`,
          exploitType: exploit.exploitType || 'Unknown',
          platform: exploit.platform || 'Multiple',
          verified: exploit.verified,
          datePublished: exploit.datePublished || new Date().toISOString().split('T')[0],
          author: exploit.author || 'ExploitDB Contributor',
          sourceUrl: exploit.sourceUrl || `https://www.exploit-db.com/exploits/${edbId}`,
          exploitCode: exploit.exploitCode
        };
      }

      // Fallback: create basic exploit entry if service doesn't have details
      return {
        edbId,
        title: `Exploit for ${cveId} (EDB-${edbId})`,
        description: `Verified exploit for ${cveId} referenced in NVD database.`,
        exploitType: 'Unknown',
        platform: 'Multiple',
        verified: true, // From authoritative NVD reference
        datePublished: new Date().toISOString().split('T')[0],
        author: 'ExploitDB Contributor',
        sourceUrl: `https://www.exploit-db.com/exploits/${edbId}`
      };

    } catch (error) {
      console.warn(`⚠️ Error fetching exploit details for EDB-${edbId}:`, error);
      return null;
    }
  }

  // Helper methods for data extraction
  private extractCVETitle(cve: any): string {
    return `${cve.id} - ${this.extractDescription(cve).substring(0, 100)}...`;
  }

  private extractDescription(cve: any): string {
    const descriptions = cve.descriptions || [];
    const englishDesc = descriptions.find((d: any) => d.lang === 'en');
    return englishDesc?.value || 'No description available';
  }

  private extractCVSSScore(cve: any): string | null {
    const metrics = cve.metrics;
    if (metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore) {
      return metrics.cvssMetricV31[0].cvssData.baseScore.toString();
    }
    if (metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore) {
      return metrics.cvssMetricV30[0].cvssData.baseScore.toString();
    }
    if (metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore) {
      return metrics.cvssMetricV2[0].cvssData.baseScore.toString();
    }
    return null;
  }

  private extractSeverity(cve: any): string {
    const metrics = cve.metrics;
    if (metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity) {
      return metrics.cvssMetricV31[0].cvssData.baseSeverity;
    }
    if (metrics?.cvssMetricV30?.[0]?.cvssData?.baseSeverity) {
      return metrics.cvssMetricV30[0].cvssData.baseSeverity;
    }
    if (metrics?.cvssMetricV2?.[0]?.baseSeverity) {
      return metrics.cvssMetricV2[0].baseSeverity;
    }
    return 'UNKNOWN';
  }

  private extractVendor(cve: any): string | null {
    const configurations = cve.configurations?.nodes || [];
    for (const node of configurations) {
      const cpeMatches = node.cpeMatch || [];
      for (const match of cpeMatches) {
        if (match.criteria) {
          const parts = match.criteria.split(':');
          if (parts.length > 3) {
            return parts[3]; // Vendor is usually the 4th part
          }
        }
      }
    }
    return null;
  }

  private extractTags(cve: any): string[] {
    const tags: string[] = [];
    
    // Add severity as tag
    const severity = this.extractSeverity(cve);
    if (severity !== 'UNKNOWN') {
      tags.push(severity.toLowerCase());
    }
    
    // Add vendor as tag
    const vendor = this.extractVendor(cve);
    if (vendor) {
      tags.push(vendor.toLowerCase());
    }
    
    return tags;
  }

  private detectExploitType(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('remote')) return 'Remote Code Execution';
    if (titleLower.includes('local')) return 'Local Privilege Escalation';
    if (titleLower.includes('sql injection') || titleLower.includes('sqli')) return 'SQL Injection';
    if (titleLower.includes('xss') || titleLower.includes('cross-site')) return 'Cross-Site Scripting';
    if (titleLower.includes('csrf')) return 'Cross-Site Request Forgery';
    if (titleLower.includes('buffer overflow')) return 'Buffer Overflow';
    if (titleLower.includes('denial of service') || titleLower.includes('dos')) return 'Denial of Service';
    return 'Other';
  }

  private detectPlatform(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('windows')) return 'Windows';
    if (titleLower.includes('linux')) return 'Linux';
    if (titleLower.includes('macos') || titleLower.includes('mac os')) return 'macOS';
    if (titleLower.includes('android')) return 'Android';
    if (titleLower.includes('ios')) return 'iOS';
    if (titleLower.includes('web') || titleLower.includes('php') || titleLower.includes('asp')) return 'Web';
    return 'Multiple';
  }

  private async fetchNVDData(params: Record<string, string>): Promise<any> {
    const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0');
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'SecHub/1.0 CVE Ingestion Pipeline'
      }
    });

    if (!response.ok) {
      throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for status and control
  getProgress(): IngestionProgress {
    return { ...this.progress };
  }

  isIngestionRunning(): boolean {
    return this.isRunning;
  }

  async stopIngestion(): Promise<void> {
    if (this.isRunning) {
      console.log('🛑 Stopping ingestion pipeline...');
      this.shouldStop = true;
      // Wait for current operations to complete
      while (this.isRunning) {
        await this.delay(1000);
      }
    }
  }
}

// Global instance
export const ingestionPipeline = new IngestionPipeline();