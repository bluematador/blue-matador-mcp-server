import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  BluematadorConfig,
  AWSIntegrationData,
  AzureIntegrationData,
  Integration,
  CreateIntegrationResponse,
  ApiError
} from './types.js';

export class BluematadorApiClient {
  private client: AxiosInstance;

  constructor(config: BluematadorConfig) {
    const baseUrl = config.baseUrl || 'https://app.bluematador.com';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message,
          status: error.response?.status
        };
        return Promise.reject(apiError);
      }
    );
  }

  async createAWSIntegration(accountId: string, data: AWSIntegrationData): Promise<CreateIntegrationResponse> {
    const response: AxiosResponse<CreateIntegrationResponse> = await this.client.post(
      `/zi/accounts/${accountId}/inbounds/aws`,
      data
    );
    return response.data;
  }

  async createAzureIntegration(accountId: string, data: AzureIntegrationData): Promise<CreateIntegrationResponse> {
    const response: AxiosResponse<CreateIntegrationResponse> = await this.client.post(
      `/zi/accounts/${accountId}/inbounds/azure`,
      data
    );
    return response.data;
  }

  async listIntegrations(accountId: string): Promise<Integration[]> {
    const response: AxiosResponse<Integration[]> = await this.client.get(
      `/zi/accounts/${accountId}/inbounds`
    );
    return response.data;
  }

  async updateAWSIntegration(accountId: string, inboundId: string, data: AWSIntegrationData): Promise<CreateIntegrationResponse> {
    const response: AxiosResponse<CreateIntegrationResponse> = await this.client.put(
      `/zi/accounts/${accountId}/inbounds/aws/${inboundId}`,
      data
    );
    return response.data;
  }

  async updateAzureIntegration(accountId: string, inboundId: string, data: AzureIntegrationData): Promise<CreateIntegrationResponse> {
    const response: AxiosResponse<CreateIntegrationResponse> = await this.client.put(
      `/zi/accounts/${accountId}/inbounds/azure/${inboundId}`,
      data
    );
    return response.data;
  }

  async enableIntegration(accountId: string, inboundId: string): Promise<void> {
    await this.client.put(`/zi/accounts/${accountId}/inbounds/${inboundId}/enable`);
  }

  async disableIntegration(accountId: string, inboundId: string): Promise<void> {
    await this.client.put(`/zi/accounts/${accountId}/inbounds/${inboundId}/disable`);
  }

  async deleteIntegration(accountId: string, inboundId: string): Promise<void> {
    await this.client.delete(`/zi/accounts/${accountId}/inbounds/${inboundId}`);
  }
}