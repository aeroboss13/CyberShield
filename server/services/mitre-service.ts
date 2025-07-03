import type { MitreAttack } from "@shared/schema";

interface STIXObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  kill_chain_phases?: Array<{ kill_chain_name: string; phase_name: string }>;
  external_references?: Array<{ source_name: string; external_id: string; url?: string }>;
}

interface STIXData {
  objects: STIXObject[];
}

export class MitreService {
  private static instance: MitreService;
  private cache: Map<string, any> = new Map();
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): MitreService {
    if (!MitreService.instance) {
      MitreService.instance = new MitreService();
    }
    return MitreService.instance;
  }

  private async fetchMitreData(): Promise<STIXData> {
    const now = Date.now();
    if (this.cache.has('enterprise') && now - this.lastUpdate < this.CACHE_DURATION) {
      return this.cache.get('enterprise');
    }

    try {
      console.log('Fetching MITRE ATT&CK data from GitHub...');
      const response = await fetch(
        'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json'
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch MITRE data: ${response.status}`);
      }

      const data: STIXData = await response.json();
      this.cache.set('enterprise', data);
      this.lastUpdate = now;
      console.log(`Loaded ${data.objects.length} MITRE objects`);
      
      return data;
    } catch (error) {
      console.error('Error fetching MITRE data:', error);
      // Return fallback data if fetch fails
      return this.getFallbackData();
    }
  }

  private getFallbackData(): STIXData {
    return {
      objects: [
        {
          type: 'x-mitre-tactic',
          id: 'x-mitre-tactic--initial-access',
          name: 'Initial Access',
          description: 'The adversary is trying to get into your network.',
          external_references: [{ source_name: 'mitre-attack', external_id: 'TA0001' }]
        },
        {
          type: 'attack-pattern',
          id: 'attack-pattern--spearphishing-attachment',
          name: 'Spearphishing Attachment',
          description: 'Adversaries may send spearphishing emails with a malicious attachment.',
          kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
          external_references: [{ source_name: 'mitre-attack', external_id: 'T1566.001' }]
        }
      ]
    };
  }

  async getAllTactics(): Promise<{ tacticId: string; tacticName: string; tacticDescription: string; techniques: MitreAttack[] }[]> {
    const data = await this.fetchMitreData();
    
    // Extract tactics
    const tactics = data.objects
      .filter(obj => obj.type === 'x-mitre-tactic')
      .map(tactic => {
        const externalRef = tactic.external_references?.find(ref => ref.source_name === 'mitre-attack');
        return {
          tacticId: externalRef?.external_id || '',
          tacticName: tactic.name || '',
          tacticDescription: tactic.description || '',
          techniques: [] as MitreAttack[]
        };
      });

    // Extract techniques and map them to tactics
    const techniques = data.objects
      .filter(obj => obj.type === 'attack-pattern')
      .map((technique, index) => {
        const externalRef = technique.external_references?.find(ref => ref.source_name === 'mitre-attack');
        const killChainPhase = technique.kill_chain_phases?.[0];
        
        return {
          id: index + 1,
          tacticId: this.mapPhaseNameToTacticId(killChainPhase?.phase_name || ''),
          tacticName: this.mapPhaseNameToTacticName(killChainPhase?.phase_name || ''),
          tacticDescription: '',
          techniqueId: externalRef?.external_id || '',
          techniqueName: technique.name || '',
          techniqueDescription: technique.description || null
        } as MitreAttack;
      });

    // Group techniques by tactic
    techniques.forEach(technique => {
      const tactic = tactics.find(t => t.tacticId === technique.tacticId);
      if (tactic) {
        tactic.techniques.push(technique);
      }
    });

    return tactics.filter(tactic => tactic.techniques.length > 0);
  }

  async searchTechniques(query: string): Promise<MitreAttack[]> {
    const data = await this.fetchMitreData();
    
    const techniques = data.objects
      .filter(obj => obj.type === 'attack-pattern')
      .filter(technique => {
        const name = technique.name?.toLowerCase() || '';
        const description = technique.description?.toLowerCase() || '';
        const externalRef = technique.external_references?.find(ref => ref.source_name === 'mitre-attack');
        const techniqueId = externalRef?.external_id?.toLowerCase() || '';
        
        return name.includes(query.toLowerCase()) || 
               description.includes(query.toLowerCase()) || 
               techniqueId.includes(query.toLowerCase());
      })
      .map((technique, index) => {
        const externalRef = technique.external_references?.find(ref => ref.source_name === 'mitre-attack');
        const killChainPhase = technique.kill_chain_phases?.[0];
        
        return {
          id: index + 1,
          tacticId: this.mapPhaseNameToTacticId(killChainPhase?.phase_name || ''),
          tacticName: this.mapPhaseNameToTacticName(killChainPhase?.phase_name || ''),
          tacticDescription: '',
          techniqueId: externalRef?.external_id || '',
          techniqueName: technique.name || '',
          techniqueDescription: technique.description || null
        } as MitreAttack;
      });

    return techniques;
  }

  private mapPhaseNameToTacticId(phaseName: string): string {
    const mapping: Record<string, string> = {
      'initial-access': 'TA0001',
      'execution': 'TA0002',
      'persistence': 'TA0003',
      'privilege-escalation': 'TA0004',
      'defense-evasion': 'TA0005',
      'credential-access': 'TA0006',
      'discovery': 'TA0007',
      'lateral-movement': 'TA0008',
      'collection': 'TA0009',
      'command-and-control': 'TA0011',
      'exfiltration': 'TA0010',
      'impact': 'TA0040'
    };
    return mapping[phaseName] || 'TA0001';
  }

  private mapPhaseNameToTacticName(phaseName: string): string {
    const mapping: Record<string, string> = {
      'initial-access': 'Initial Access',
      'execution': 'Execution',
      'persistence': 'Persistence',
      'privilege-escalation': 'Privilege Escalation',
      'defense-evasion': 'Defense Evasion',
      'credential-access': 'Credential Access',
      'discovery': 'Discovery',
      'lateral-movement': 'Lateral Movement',
      'collection': 'Collection',
      'command-and-control': 'Command and Control',
      'exfiltration': 'Exfiltration',
      'impact': 'Impact'
    };
    return mapping[phaseName] || 'Initial Access';
  }
}