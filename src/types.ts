export interface BluematadorConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AWSIntegrationData {
  name: string;
  roleArn: string;
  externalId: string;
}

export interface AzureIntegrationData {
  name: string;
  subscriptionId: string;
  tenantId: string;
  applicationId: string;
  secret: string;
}

export interface Integration {
  id: string;
  accountId: string;
  inboundType: string;
  created: string;
  enabled: boolean;
  data: {
    name: string;
    status: {
      totalSuccess: number;
      totalError: number;
      recentErrors: string[];
    };
    [key: string]: any;
  };
}

export interface CreateIntegrationResponse {
  id: string;
  accountId: string;
  inboundType: string;
  created: string;
  enabled: boolean;
  data: any;
}

export interface ApiError {
  message: string;
  status?: number;
}