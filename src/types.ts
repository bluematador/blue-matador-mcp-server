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

// Events
export interface Event {
  id: string;
  accountId: string;
  opened: string;
  closed?: string;
  eventType: string;
  typeText: string;
  summaryText: string;
  detailTexts: string[];
  severity: string;
  source: {
    label: string;
    text: string;
    tags: Array<{ key: string; value: string }>;
    ref: {
      arn: string;
      refType: string;
    };
  };
  links: Array<{
    linkType: string;
    text: string;
    url: string;
    created: string;
  }>;
  projects: Array<{
    id: string;
    accountId: string;
    created: string;
    name: string;
  }>;
  muted: boolean;
  hidden: boolean;
}

// Projects
export interface Project {
  id: string;
  name: string;
}

// Users (Account level)
export interface User {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  admin: boolean;
}

export interface InviteUserData {
  email: string;
  admin: boolean;
}

// Notifications
export interface Notification {
  accountId: string;
  id: string;
  created: string;
  enabled: boolean;
  outboundType: string;
  data: {
    status: {
      totalSuccess: number;
      totalError: number;
      lastSuccess?: string;
      recentErrors: Array<{
        message: string;
        when: string;
      }>;
    };
    severities: {
      all: string[];
    };
    [key: string]: any;
  };
  credentials?: string;
}

export interface EmailNotificationData {
  email: string;
  severities: {
    all: string[];
  };
}

export interface PagerDutyNotificationData {
  name: string;
  severities: {
    all: string[];
  };
  account: string;
  serviceName: string;
  serviceSecret: string;
}

export interface OpsGenieNotificationData {
  name: string;
  severities: {
    all: string[];
  };
  apikey: string;
}

export interface SNSNotificationData {
  name: string;
  severities: {
    all: string[];
  };
  topicArn: string;
  accessKeyId: string;
  secretAccessKey: string;
  sendResolve: boolean;
  sendJson: boolean;
}

export interface VictorOpsNotificationData {
  name: string;
  severities: {
    all: string[];
  };
  integrationId: string;
  routingKey: string;
}

export interface SquadCastNotificationData {
  name: string;
  severities: {
    all: string[];
  };
  sourceInstance: string;
}

export interface ServiceNowNotificationData {
  name: string;
  credentials: {
    instanceName: string;
    username: string;
    password: string;
  };
  severities: {
    all: string[];
  };
  sourceInstance: string;
}

// Organizations
export interface OrganizationAccount {
  id: string;
  created: string;
  data: {
    company: string;
    disabled: boolean;
    paid: boolean;
    trialEnd?: string;
    assessment: boolean;
    trialWalled: boolean;
    projectSettings: {
      enabled: boolean;
    };
  };
  organizationId: string;
  organizationData: {
    name: string;
    disabled: boolean;
    stripeId: string;
    paid: boolean;
    trialEnd?: string;
    projectSettings: {
      enabled: boolean;
    };
  };
}

export interface OrganizationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  created: string;
  lastLogin?: string;
  deleted: boolean;
  data: {
    systemPermissions: string[];
    digestFrequency: string;
    lastDigest?: string;
  };
  needsTour: boolean;
}

export interface InviteOrganizationUserData {
  email: string;
  data: {
    permissions: string[];
    autoProvision: boolean;
    autoProvisionPermissions: string[];
  };
}

export interface UpdateOrganizationUserData {
  permissions: string[];
  autoProvision: boolean;
  autoProvisionPermissions: string[];
  backfillPermissions?: boolean;
}

// Metrics
export interface MetricsQuery {
  accountId: string;
  metrics: string;
  agg: string;
  start: string;
  end: string;
  groups?: string;
}

// Mutes
export interface ResourceRef {
  arn: string;
  refType: string;
}

export interface MonitorsMuteRuleMap {
  [serviceName: string]: string[];
}

export interface CreateMuteRuleData {
  hide: boolean;
  resource?: ResourceRef;
  projects?: string[];
  regions?: string[];
  monitors?: MonitorsMuteRuleMap;
}

export interface MuteRule {
  id: string;
  hide: boolean;
  resource?: ResourceRef;
  projects?: string[];
  regions?: string[];
  monitors?: MonitorsMuteRuleMap;
  active: boolean;
}

export interface MuteOptions {
  awsRegions?: string[];
  azureRegions?: string[];
  monitors?: MonitorsMuteRuleMap;
  resources?: ResourceRef[];
}