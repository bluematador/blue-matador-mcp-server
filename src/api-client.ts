import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  BluematadorConfig,
  AWSIntegrationData,
  AzureIntegrationData,
  Integration,
  CreateIntegrationResponse,
  ApiError,
  Event,
  Project,
  User,
  InviteUserData,
  Notification,
  EmailNotificationData,
  PagerDutyNotificationData,
  OpsGenieNotificationData,
  SNSNotificationData,
  VictorOpsNotificationData,
  SquadCastNotificationData,
  ServiceNowNotificationData,
  OrganizationAccount,
  OrganizationUser,
  InviteOrganizationUserData,
  UpdateOrganizationUserData,
  MetricsQuery,
  MuteRule,
  CreateMuteRuleData,
  MuteOptions
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
        // Preserve the full error object for detailed error reporting
        const enhancedError = {
          message: (error.response && error.response.data && error.response.data.message) || error.message,
          status: error.response && error.response.status,
          response: error.response ? {
            data: error.response.data,
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers
          } : undefined,
          config: error.config ? {
            url: error.config.url,
            method: error.config.method,
            baseURL: error.config.baseURL
          } : undefined,
          code: error.code,
          stack: error.stack
        };
        return Promise.reject(enhancedError);
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

  // Events
  async getOpenedEvents(accountId: string, start: string, end: string, project?: string): Promise<Event[]> {
    const params: any = { start, end };
    if (project) params.project = project;

    const response: AxiosResponse<Event[]> = await this.client.get(
      `/ma/api/accounts/${accountId}/events`,
      { params }
    );
    return response.data;
  }

  async getActiveEvents(accountId: string, project?: string): Promise<Event[]> {
    const params: any = {};
    if (project) params.project = project;

    const response: AxiosResponse<Event[]> = await this.client.get(
      `/ma/api/accounts/${accountId}/events/active`,
      { params }
    );
    return response.data;
  }

  async getActiveEventsSummary(accountId: string, project?: string): Promise<any> {
    const params: any = {};
    if (project) params.project = project;

    const response: AxiosResponse<any> = await this.client.get(
      `/ma/api/accounts/${accountId}/counts`,
      { params }
    );
    return response.data;
  }

  // Projects
  async listProjects(accountId: string): Promise<Project[]> {
    const response: AxiosResponse<Project[]> = await this.client.get(
      `/zi/api/accounts/${accountId}/projects`
    );
    return response.data;
  }

  // Users (Account level)
  async listUsers(accountId: string): Promise<{ users: User[] }> {
    const response: AxiosResponse<{ users: User[] }> = await this.client.get(
      `/zi/api/accounts/${accountId}/users`
    );
    return response.data;
  }

  async inviteUsers(accountId: string, users: InviteUserData[]): Promise<void> {
    await this.client.post(`/zi/accounts/${accountId}/invitations`, users);
  }

  // Notifications
  async listNotifications(accountId: string): Promise<Notification[]> {
    const response: AxiosResponse<Notification[]> = await this.client.get(
      `/zi/accounts/${accountId}/outbounds`
    );
    return response.data;
  }

  async enableNotification(accountId: string, outboundId: string): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/${outboundId}/enable`
    );
    return response.data;
  }

  async disableNotification(accountId: string, outboundId: string): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/${outboundId}/disable`
    );
    return response.data;
  }

  async deleteNotification(accountId: string, outboundId: string): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.delete(
      `/zi/accounts/${accountId}/outbounds/${outboundId}`
    );
    return response.data;
  }

  // Email Notifications
  async createEmailNotification(accountId: string, data: EmailNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.post(
      `/zi/accounts/${accountId}/outbounds/email`,
      data
    );
    return response.data;
  }

  async updateEmailNotification(accountId: string, outboundId: string, data: EmailNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/email/${outboundId}`,
      data
    );
    return response.data;
  }

  // PagerDuty Notifications
  async createPagerDutyNotification(accountId: string, data: PagerDutyNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.post(
      `/zi/accounts/${accountId}/outbounds/pagerduty`,
      data
    );
    return response.data;
  }

  async updatePagerDutyNotification(accountId: string, outboundId: string, data: PagerDutyNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/pagerduty/${outboundId}`,
      data
    );
    return response.data;
  }

  // OpsGenie Notifications
  async createOpsGenieNotification(accountId: string, data: OpsGenieNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.post(
      `/zi/accounts/${accountId}/outbounds/opsgenie`,
      data
    );
    return response.data;
  }

  async updateOpsGenieNotification(accountId: string, outboundId: string, data: OpsGenieNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/opsgenie/${outboundId}`,
      data
    );
    return response.data;
  }

  // SNS Notifications
  async createSNSNotification(accountId: string, data: SNSNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.post(
      `/zi/accounts/${accountId}/outbounds/sns`,
      data
    );
    return response.data;
  }

  async updateSNSNotification(accountId: string, outboundId: string, data: SNSNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/sns/${outboundId}`,
      data
    );
    return response.data;
  }

  // VictorOps Notifications
  async createVictorOpsNotification(accountId: string, data: VictorOpsNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.post(
      `/zi/accounts/${accountId}/outbounds/victorops`,
      data
    );
    return response.data;
  }

  async updateVictorOpsNotification(accountId: string, outboundId: string, data: VictorOpsNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/victorops/${outboundId}`,
      data
    );
    return response.data;
  }

  // SquadCast Notifications
  async createSquadCastNotification(accountId: string, data: SquadCastNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.post(
      `/zi/accounts/${accountId}/outbounds/squadcast`,
      data
    );
    return response.data;
  }

  async updateSquadCastNotification(accountId: string, outboundId: string, data: SquadCastNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/squadcast/${outboundId}`,
      data
    );
    return response.data;
  }

  // ServiceNow Notifications
  async createServiceNowNotification(accountId: string, data: ServiceNowNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.post(
      `/zi/accounts/${accountId}/outbounds/servicenow`,
      data
    );
    return response.data;
  }

  async updateServiceNowNotification(accountId: string, outboundId: string, data: ServiceNowNotificationData): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.client.put(
      `/zi/accounts/${accountId}/outbounds/servicenow/${outboundId}`,
      data
    );
    return response.data;
  }

  // Organizations
  async listOrganizationAccounts(organizationId: string): Promise<OrganizationAccount[]> {
    const response: AxiosResponse<OrganizationAccount[]> = await this.client.get(
      `/zi/organizations/${organizationId}/accounts`
    );
    return response.data;
  }

  async createOrganizationAccount(organizationId: string, data: { name: string }): Promise<OrganizationAccount> {
    const response: AxiosResponse<OrganizationAccount> = await this.client.post(
      `/zi/organizations/${organizationId}/accounts`,
      data
    );
    return response.data;
  }

  async renameOrganizationAccount(organizationId: string, accountId: string, data: { name: string }): Promise<OrganizationAccount> {
    const response: AxiosResponse<OrganizationAccount> = await this.client.put(
      `/zi/organizations/${organizationId}/accounts/${accountId}/name`,
      data
    );
    return response.data;
  }

  async deleteOrganizationAccount(organizationId: string, accountId: string): Promise<OrganizationAccount> {
    const response: AxiosResponse<OrganizationAccount> = await this.client.delete(
      `/zi/organizations/${organizationId}/accounts/${accountId}`
    );
    return response.data;
  }

  // Organization Users
  async listOrganizationUsers(organizationId: string): Promise<OrganizationUser[]> {
    const response: AxiosResponse<OrganizationUser[]> = await this.client.get(
      `/zi/organizations/${organizationId}/users`
    );
    return response.data;
  }

  async inviteOrganizationUsers(organizationId: string, users: InviteOrganizationUserData[]): Promise<OrganizationUser[]> {
    const response: AxiosResponse<OrganizationUser[]> = await this.client.post(
      `/zi/organizations/${organizationId}/users`,
      users
    );
    return response.data;
  }

  async getOrganizationUser(organizationId: string, userId: string): Promise<OrganizationUser> {
    const response: AxiosResponse<OrganizationUser> = await this.client.get(
      `/zi/organizations/${organizationId}/users/${userId}`
    );
    return response.data;
  }

  async updateOrganizationUser(organizationId: string, userId: string, data: UpdateOrganizationUserData): Promise<void> {
    await this.client.put(`/zi/organizations/${organizationId}/users/${userId}`, data);
  }

  async deleteOrganizationUser(organizationId: string, userId: string): Promise<OrganizationUser> {
    const response: AxiosResponse<OrganizationUser> = await this.client.delete(
      `/zi/organizations/${organizationId}/users/${userId}`
    );
    return response.data;
  }

  async setUserAccountPermissions(organizationId: string, userId: string, accountId: string, data: { permissions: string[] }): Promise<void> {
    await this.client.put(
      `/zi/organizations/${organizationId}/users/${userId}/accounts/${accountId}`,
      data
    );
  }

  async deleteUserAccountPermissions(organizationId: string, userId: string, accountId: string): Promise<void> {
    await this.client.delete(
      `/zi/organizations/${organizationId}/users/${userId}/accounts/${accountId}`
    );
  }

  // Metrics
  async getMetrics(query: MetricsQuery): Promise<any> {
    const { accountId, ...params } = query;
    const response: AxiosResponse<any> = await this.client.get(
      `/me/api/accounts/${accountId}/metrics`,
      { params }
    );
    return response.data;
  }

  // Mutes
  async listMuteRules(accountId: string, includeInactive?: boolean): Promise<MuteRule[]> {
    const params: any = {};
    if (includeInactive !== undefined) params.includeInactive = includeInactive;

    const response: AxiosResponse<MuteRule[]> = await this.client.get(
      `/ma/api/accounts/${accountId}/mutes`,
      { params }
    );
    return response.data;
  }

  async createMuteRule(accountId: string, data: CreateMuteRuleData): Promise<void> {
    await this.client.post(`/ma/api/accounts/${accountId}/mutes`, data);
  }

  async deleteMuteRule(accountId: string, muteId: string): Promise<void> {
    await this.client.delete(`/ma/accounts/${accountId}/mutes/${muteId}`);
  }

  // Mute Options
  async getMuteRegions(accountId: string): Promise<{ awsRegions: string[], azureRegions: string[] }> {
    const response = await this.client.get(`/ma/accounts/${accountId}/mutes/options/regions`);
    return response.data;
  }

  async getMuteMonitors(accountId: string): Promise<{ monitors: { [key: string]: string[] } }> {
    const response = await this.client.get(`/ma/accounts/${accountId}/mutes/options/monitors`);
    return response.data;
  }

  async getMuteResources(accountId: string, page?: number, pageSize?: number): Promise<{ resources: Array<{ arn: string, refType: string }> }> {
    const params: any = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;

    const response = await this.client.get(
      `/ma/accounts/${accountId}/mutes/options/resources`,
      { params }
    );
    return response.data;
  }
}