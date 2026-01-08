// Definições de tipos compartilhados para garantir contrato entre Front e Back

export interface ApiError {
  error: string;
  message: string;
  requestId: string;
  details?: any;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  meta: {
    status: 'disconnected' | 'connected' | 'configured';
    businessId?: string;
    adAccountId?: string;
    currency?: string;
    timezone?: string;
  };
}

export interface MetaConfig {
  appId: string;
  // appSecret nunca é enviado ao frontend
  redirectUri: string;
}

export interface MetaBusiness {
  id: string;
  name: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
}

export interface MetaInsight {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  date_start: string;
  date_stop: string;
}
