/**
 * InfoSearch API Service
 * Integration with infosearch54321.xyz for data lookup
 */

const BASE_URL = 'https://infosearch54321.xyz';

const getApiToken = () => {
  const token = process.env.INFOSEARCH_API_TOKEN;
  if (!token) {
    console.warn('⚠️ INFOSEARCH_API_TOKEN not configured');
  }
  return token;
};

export interface InfoSearchProfile {
  name: string;
  creation_date: string;
  balance: number;
}

export interface InfoSearchResult {
  [key: string]: string;
}

export interface InfoSearchResponse {
  result: {
    [index: number]: InfoSearchResult;
  };
}

export interface InfoSearchProfileResponse {
  profile: InfoSearchProfile;
}

export class InfoSearchService {
  /**
   * Get API profile information
   */
  async getProfile(): Promise<InfoSearchProfile> {
    const API_TOKEN = getApiToken();
    if (!API_TOKEN) {
      throw new Error('API token not configured');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/${API_TOKEN}/profile`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid API token');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data: InfoSearchProfileResponse = await response.json();
      return data.profile;
    } catch (error) {
      console.error('InfoSearch getProfile error:', error);
      throw error;
    }
  }

  /**
   * Perform basic search
   */
  async search(query: string): Promise<InfoSearchResult[]> {
    const API_TOKEN = getApiToken();
    if (!API_TOKEN) {
      throw new Error('API token not configured');
    }

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(`${BASE_URL}/api/${API_TOKEN}/search/${encodedQuery}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid API token');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data: InfoSearchResponse = await response.json();
      
      // Convert indexed object to array
      const results: InfoSearchResult[] = [];
      if (data.result) {
        Object.values(data.result).forEach(item => {
          results.push(item);
        });
      }
      
      return results;
    } catch (error) {
      console.error('InfoSearch search error:', error);
      throw error;
    }
  }

  /**
   * Perform extended (multi-level) search
   */
  async extendedSearch(query: string): Promise<InfoSearchResult[]> {
    const API_TOKEN = getApiToken();
    if (!API_TOKEN) {
      throw new Error('API token not configured');
    }

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(`${BASE_URL}/api/${API_TOKEN}/extended_search/${encodedQuery}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid API token');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data: InfoSearchResponse = await response.json();
      
      // Convert indexed object to array
      const results: InfoSearchResult[] = [];
      if (data.result) {
        Object.values(data.result).forEach(item => {
          results.push(item);
        });
      }
      
      return results;
    } catch (error) {
      console.error('InfoSearch extendedSearch error:', error);
      throw error;
    }
  }
}

export const infoSearchService = new InfoSearchService();
