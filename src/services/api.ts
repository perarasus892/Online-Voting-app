const API_BASE = `http://localhost:3002`; // Local backend server
const publicAnonKey = 'local-secret'; // Dummy key for frontend consistency

// Store access token in memory
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('voter_token', token);
  } else {
    localStorage.removeItem('voter_token');
  }
};

export const getAccessToken = () => accessToken || localStorage.getItem('voter_token');

// Helper to make authenticated requests
async function apiRequest(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<any> {
  const { skipAuth, ...fetchOptions } = options;
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error [${endpoint}]:`, data);
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  } catch (error: any) {
    console.error(`API Request failed [${endpoint}]:`, error);
    throw error;
  }
}

// ==================== AUTH API ====================

export const authAPI = {
  async signup(password: string, name: string, voterId: string, mobile: string, role: string = 'voter') {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ password, name, voterId, mobile, role }),
    });
    return data;
  },

  async signin(email: string, password: string) {
    const data = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }

    return data;
  },

  async verifyOTP(email: string, otp: string) {
    const data = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    return data;
  },

  async getSession() {
    const data = await apiRequest('/auth/session');
    return data;
  },

  logout() {
    setAccessToken(null);
    return Promise.resolve({ success: true });
  },
};

// ==================== ELECTION API ====================

export const electionAPI = {
  async getAll() {
    const data = await apiRequest('/elections');
    return data.elections;
  },

  async getById(electionId: string) {
    const data = await apiRequest(`/elections/${electionId}`);
    return data.election;
  },

  async create(title: string, description: string, startDate: string, endDate: string) {
    const data = await apiRequest('/elections', {
      method: 'POST',
      body: JSON.stringify({ title, description, startDate, endDate }),
    });
    return data.election;
  },

  async getCandidates(electionId: string) {
    const data = await apiRequest(`/elections/${electionId}/candidates`);
    return data.candidates;
  },

  async getResults(electionId: string) {
    const data = await apiRequest(`/elections/${electionId}/results`);
    return data;
  },

  async getVoteStatus(electionId: string) {
    const data = await apiRequest(`/elections/${electionId}/vote-status`);
    return data.hasVoted;
  },
};

// ==================== CANDIDATE API ====================

export const candidateAPI = {
  async create(electionId: string, name: string, party: string, symbol: string, photo: string, slogan: string) {
    const data = await apiRequest('/candidates', {
      method: 'POST',
      body: JSON.stringify({ electionId, name, party, symbol, photo, slogan }),
    });
    return data.candidate;
  },
};

// ==================== VOTE API ====================

export const voteAPI = {
  async cast(electionId: string, candidateId: string) {
    const data = await apiRequest('/votes', {
      method: 'POST',
      body: JSON.stringify({ electionId, candidateId }),
    });
    return data;
  },

  async verifyReceipt(receiptId: string) {
    const data = await apiRequest('/votes/verify', {
      method: 'POST',
      body: JSON.stringify({ receiptId }),
    });
    return data;
  },
};

// ==================== ADMIN API ====================

export const adminAPI = {
  async getUsers() {
    const data = await apiRequest('/admin/users');
    return data.users;
  },

  async getVoteRecords() {
    const data = await apiRequest('/admin/vote-records');
    return data.voteRecords;
  },

  async getStats() {
    const data = await apiRequest('/admin/stats');
    return data.stats;
  },

  async getValidVoters() {
    const data = await apiRequest('/admin/valid-voters');
    return data.validVoters;
  },

  async getLogs() {
    const data = await apiRequest('/admin/logs');
    return data.logs;
  },

  async addValidVoters(voters: Array<{ voterId: string, name?: string, district?: string, constituency?: string }>) {
    const data = await apiRequest('/admin/valid-voters', {
      method: 'POST',
      body: JSON.stringify({ voters }),
    });
    return data;
  },

  async deleteValidVoter(voterId: string) {
    const data = await apiRequest(`/admin/valid-voters/${voterId}`, {
      method: 'DELETE',
    });
    return data;
  },
};

// ==================== INIT API ====================

export const initAPI = {
  async initializeData() {
    const data = await apiRequest('/init', {
      method: 'POST',
    });
    return data;
  },
};

// ==================== DEBUG API ====================

export const debugAPI = {
  async checkVoter(voterId: string) {
    const data = await apiRequest(`/debug/voter/${voterId}`, {
      method: 'GET',
      skipAuth: true, // Debug endpoints don't require auth
    });
    return data;
  },

  async clearVoter(voterId: string) {
    const data = await apiRequest(`/debug/clear-voter/${voterId}`, {
      method: 'POST',
      skipAuth: true,
    });
    return data;
  },

  async resetSystem() {
    const data = await apiRequest('/debug/reset-system', {
      method: 'POST',
      skipAuth: true,
    });
    return data;
  },
};