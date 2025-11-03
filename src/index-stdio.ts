#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { BluematadorApiClient } from './api-client.js';
import {
  BluematadorConfig,
  AWSIntegrationData,
  AzureIntegrationData,
  InviteUserData,
  EmailNotificationData,
  PagerDutyNotificationData,
  OpsGenieNotificationData,
  SNSNotificationData,
  VictorOpsNotificationData,
  SquadCastNotificationData,
  ServiceNowNotificationData,
  CreateMuteRuleData,
  MetricsQuery
} from './types.js';

class BluematadorMCPServer {
  private server: Server;

  private getBaseAuthProperties() {
    return {
      apiKey: {
        type: 'string' as const,
        description: 'Bluematador API key - Get from https://app.bluematador.com/ur/app#/account/apikeys'
      },
      accountId: {
        type: 'string' as const,
        description: 'Bluematador account ID in UUID format - Get from https://app.bluematador.com/ur/app#/account/apikeys'
      }
    };
  }

  private getOptionalProperties() {
    return {
      baseUrl: {
        type: 'string' as const,
        description: 'Bluematador base URL (optional, defaults to https://app.bluematador.com)'
      }
    };
  }

  private getAuthRequiredFields() {
    // API key and account ID are always required
    return ['apiKey', 'accountId'];
  }

  private formatResourceInfo(source: any): string {
    if (!source) return '🔍 Resource: Unknown';

    // Detect resource type and get appropriate icon
    const { icon, serviceType } = this.getResourceTypeInfo(source);

    let resourceInfo = `${icon} **${serviceType}:** ${source.label || source.text || 'Unknown'}\n`;

    // Add ARN or Azure ID
    if (source.ref && source.ref.arn) {
      const refType = source.ref.refType || 'resource';
      const isAzure = refType.toLowerCase().includes('azure') || source.ref.arn.includes('azure');
      const arnIcon = isAzure ? '🔷' : '🟠';
      resourceInfo += `${arnIcon} **${isAzure ? 'Azure ID' : 'ARN'}:** ${source.ref.arn}\n`;
    }

    // Add tags/labels (show most important ones first)
    if (source.tags && source.tags.length > 0) {
      const importantTags = source.tags.filter((tag: any) =>
        ['Name', 'Environment', 'Project', 'Owner', 'Application'].includes(tag.key)
      );
      const otherTags = source.tags.filter((tag: any) =>
        !['Name', 'Environment', 'Project', 'Owner', 'Application'].includes(tag.key)
      );

      const allTags = [...importantTags, ...otherTags];
      const tagList = allTags
        .map((tag: any) => `${tag.key}=${tag.value}`)
        .join(', ');
      resourceInfo += `🏷️ **Tags:** ${tagList}\n`;
    }

    // Add additional descriptive text if different from label
    if (source.text && source.text !== source.label) {
      resourceInfo += `📋 **Details:** ${source.text}`;
    }

    return resourceInfo.trim();
  }

  private getResourceTypeInfo(source: any): { icon: string; serviceType: string } {
    const arn = (source.ref && source.ref.arn) ? source.ref.arn : '';
    const label = source.label || '';

    // AWS Services
    if (arn.includes(':ec2:')) {
      if (arn.includes(':instance/')) return { icon: '🖥️', serviceType: 'EC2 Instance' };
      if (arn.includes(':volume/')) return { icon: '💾', serviceType: 'EBS Volume' };
      if (arn.includes(':security-group/')) return { icon: '🛡️', serviceType: 'Security Group' };
      if (arn.includes(':vpc/')) return { icon: '🌐', serviceType: 'VPC' };
      if (arn.includes(':subnet/')) return { icon: '🔀', serviceType: 'Subnet' };
    }

    if (arn.includes(':rds:')) return { icon: '🗄️', serviceType: 'RDS Database' };
    if (arn.includes(':s3:')) return { icon: '🪣', serviceType: 'S3 Bucket' };
    if (arn.includes(':sqs:')) return { icon: '📬', serviceType: 'SQS Queue' };
    if (arn.includes(':lambda:')) return { icon: '⚡', serviceType: 'Lambda Function' };
    if (arn.includes(':route53:')) return { icon: '🌍', serviceType: 'Route53 Zone' };
    if (arn.includes(':elasticloadbalancing:')) return { icon: '⚖️', serviceType: 'Load Balancer' };
    if (arn.includes(':ecs:')) return { icon: '📦', serviceType: 'ECS Service' };
    if (arn.includes(':eks:')) return { icon: '☸️', serviceType: 'EKS Cluster' };
    if (arn.includes(':cloudfront:')) return { icon: '🌐', serviceType: 'CloudFront Distribution' };
    if (arn.includes(':sns:')) return { icon: '📢', serviceType: 'SNS Topic' };
    if (arn.includes(':dynamodb:')) return { icon: '⚡', serviceType: 'DynamoDB Table' };
    if (arn.includes(':redshift:')) return { icon: '🔺', serviceType: 'Redshift Cluster' };

    // Azure Services
    if (arn.includes('/Microsoft.Compute/virtualMachines/')) return { icon: '🖥️', serviceType: 'Azure VM' };
    if (arn.includes('/Microsoft.Storage/storageAccounts/')) return { icon: '🪣', serviceType: 'Storage Account' };
    if (arn.includes('/Microsoft.Sql/servers/')) return { icon: '🗄️', serviceType: 'Azure SQL' };
    if (arn.includes('/Microsoft.Web/sites/')) return { icon: '🌐', serviceType: 'App Service' };
    if (arn.includes('/Microsoft.ContainerService/')) return { icon: '☸️', serviceType: 'AKS Cluster' };
    if (arn.includes('/Microsoft.Network/')) return { icon: '🔀', serviceType: 'Network Resource' };

    // Generic fallback
    if (arn.includes('azure')) return { icon: '🔷', serviceType: 'Azure Resource' };
    if (arn.includes('aws')) return { icon: '🟠', serviceType: 'AWS Resource' };

    return { icon: '🔍', serviceType: 'Resource' };
  }

  private formatDetailedError(error: any, toolName: string, args: any): string {
    const timestamp = new Date().toISOString();
    let errorInfo = `\n🔍 **Error Details:**\n`;
    errorInfo += `📅 **Time:** ${timestamp}\n`;
    errorInfo += `🛠️ **Tool:** ${toolName}\n`;

    // HTTP status information
    const status = error.status || (error.response && error.response.status);
    if (status) {
      errorInfo += `📊 **HTTP Status:** ${status}\n`;
    }

    // Error message
    const message = error.message || 'Unknown error';
    errorInfo += `💬 **Error Message:** ${message}\n`;

    // Response data if available
    if (error.response && error.response.data) {
      const responseData = typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data, null, 2);

      errorInfo += `📄 **Response Data:**\n\`\`\`\n${responseData}\n\`\`\`\n`;
    }

    // Request information (sanitized)
    if (args) {
      const sanitizedArgs = { ...args };
      // Remove sensitive information
      if (sanitizedArgs.apiKey) sanitizedArgs.apiKey = '***REDACTED***';
      if (sanitizedArgs.secret) sanitizedArgs.secret = '***REDACTED***';
      if (sanitizedArgs.password) sanitizedArgs.password = '***REDACTED***';
      if (sanitizedArgs.serviceSecret) sanitizedArgs.serviceSecret = '***REDACTED***';
      if (sanitizedArgs.secretAccessKey) sanitizedArgs.secretAccessKey = '***REDACTED***';

      errorInfo += `📋 **Request Parameters:**\n\`\`\`json\n${JSON.stringify(sanitizedArgs, null, 2)}\n\`\`\`\n`;
    }

    // Error stack trace (development info)
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5); // First 5 lines only
      errorInfo += `🔧 **Stack Trace (first 5 lines):**\n\`\`\`\n${stackLines.join('\n')}\n\`\`\`\n`;
    }

    // Network/Connection specific information
    if (error.code) {
      errorInfo += `🌐 **Error Code:** ${error.code}\n`;
    }

    if (error.config && error.config.url) {
      errorInfo += `🔗 **Request URL:** ${error.config.url}\n`;
    }

    if (error.config && error.config.method) {
      errorInfo += `📡 **HTTP Method:** ${error.config.method.toUpperCase()}\n`;
    }

    // Axios specific error information
    if (error.response && error.response.headers) {
      const contentType = error.response.headers['content-type'];
      if (contentType) {
        errorInfo += `📄 **Response Content-Type:** ${contentType}\n`;
      }
    }

    // Request timeout information
    if (error.timeout || error.code === 'ETIMEDOUT') {
      errorInfo += `⏱️ **Timeout:** Request timed out\n`;
    }

    // Connection errors
    if (error.code === 'ECONNREFUSED') {
      errorInfo += `❌ **Connection:** Connection refused - API server may be down\n`;
    }

    if (error.code === 'ENOTFOUND') {
      errorInfo += `❌ **DNS:** Could not resolve hostname\n`;
    }

    // Additional troubleshooting suggestions
    errorInfo += `\n💡 **Troubleshooting Suggestions:**\n`;

    if (status === 401) {
      errorInfo += `- Verify your API key is correct and has not expired\n`;
      errorInfo += `- Check if your account has the necessary permissions\n`;
    } else if (status === 403) {
      errorInfo += `- Your API key may not have permission for this resource\n`;
      errorInfo += `- Check if the account ID is correct\n`;
    } else if (status === 404) {
      errorInfo += `- Verify the resource ID exists in your account\n`;
      errorInfo += `- Check if the resource was recently deleted\n`;
    } else if (status === 429) {
      errorInfo += `- You're making requests too quickly - implement rate limiting\n`;
      errorInfo += `- Wait a few seconds and try again\n`;
    } else if (status >= 500) {
      errorInfo += `- Bluematador API server is experiencing issues\n`;
      errorInfo += `- Try again in a few minutes\n`;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorInfo += `- Check your internet connection\n`;
      errorInfo += `- Verify the API base URL is correct\n`;
    }

    return errorInfo;
  }

  constructor() {
    this.server = new Server(
      {
        name: 'bluematador-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_aws_integration',
            description: 'Create a new AWS integration in Bluematador',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the AWS integration'
                },
                roleArn: {
                  type: 'string',
                  description: 'AWS IAM role ARN for Bluematador to assume'
                },
                externalId: {
                  type: 'string',
                  description: 'External ID for the AWS role'
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'roleArn', 'externalId']
            }
          },
          {
            name: 'create_azure_integration',
            description: 'Create a new Azure integration in Bluematador',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the Azure integration'
                },
                subscriptionId: {
                  type: 'string',
                  description: 'Azure subscription ID'
                },
                tenantId: {
                  type: 'string',
                  description: 'Azure tenant ID'
                },
                applicationId: {
                  type: 'string',
                  description: 'Azure application (client) ID'
                },
                secret: {
                  type: 'string',
                  description: 'Azure client secret'
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'subscriptionId', 'tenantId', 'applicationId', 'secret']
            }
          },
          {
            name: 'list_integrations',
            description: 'List all integrations for a Bluematador account',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties()
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          {
            name: 'update_aws_integration',
            description: 'Update an existing AWS integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the AWS integration'
                },
                roleArn: {
                  type: 'string',
                  description: 'AWS IAM role ARN for Bluematador to assume'
                },
                externalId: {
                  type: 'string',
                  description: 'External ID for the AWS role'
                }
              },
              required: [...this.getAuthRequiredFields(), 'inboundId', 'name', 'roleArn', 'externalId']
            }
          },
          {
            name: 'update_azure_integration',
            description: 'Update an existing Azure integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the Azure integration'
                },
                subscriptionId: {
                  type: 'string',
                  description: 'Azure subscription ID'
                },
                tenantId: {
                  type: 'string',
                  description: 'Azure tenant ID'
                },
                applicationId: {
                  type: 'string',
                  description: 'Azure application (client) ID'
                },
                secret: {
                  type: 'string',
                  description: 'Azure client secret'
                }
              },
              required: [...this.getAuthRequiredFields(), 'inboundId', 'name', 'subscriptionId', 'tenantId', 'applicationId', 'secret']
            }
          },
          {
            name: 'enable_integration',
            description: 'Enable a Bluematador integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'inboundId']
            }
          },
          {
            name: 'disable_integration',
            description: 'Disable a Bluematador integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'inboundId']
            }
          },
          {
            name: 'delete_integration',
            description: 'Delete a Bluematador integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'inboundId']
            }
          },
          // Events Management
          {
            name: 'get_opened_events',
            description: 'Get Bluematador events that were opened within a time period',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                start: {
                  type: 'string',
                  description: 'Start time in ISO 8601 format (e.g., 2023-10-23T21:44:58Z)'
                },
                end: {
                  type: 'string',
                  description: 'End time in ISO 8601 format (e.g., 2023-10-24T21:44:58Z)'
                },
                project: {
                  type: 'string',
                  description: 'Project ID to filter events (optional)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'start', 'end']
            }
          },
          {
            name: 'get_active_events',
            description: 'Get currently active Bluematador events',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                project: {
                  type: 'string',
                  description: 'Project ID to filter events (optional)'
                }
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          {
            name: 'get_active_events_summary',
            description: 'Get summary of active events for the last 30 days',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                project: {
                  type: 'string',
                  description: 'Project ID to filter events (optional)'
                }
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          // Projects
          {
            name: 'list_projects',
            description: 'List all Bluematador projects for an account',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties()
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          // Users Management
          {
            name: 'list_users',
            description: 'List all users in a Bluematador account',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties()
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          {
            name: 'invite_users',
            description: 'Invite users to a Bluematador account',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                users: {
                  type: 'array',
                  description: 'Array of users to invite',
                  items: {
                    type: 'object',
                    properties: {
                      email: {
                        type: 'string',
                        format: 'email',
                        description: 'User email address'
                      },
                      admin: {
                        type: 'boolean',
                        description: 'Whether the user should have admin privileges'
                      }
                    },
                    required: ['email', 'admin']
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'users']
            }
          },
          // Notifications
          {
            name: 'list_notifications',
            description: 'List all notification integrations for an account',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties()
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          {
            name: 'create_email_notification',
            description: 'Create an email notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Email address to send notifications to'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'email', 'severities']
            }
          },
          {
            name: 'create_pagerduty_notification',
            description: 'Create a PagerDuty notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the PagerDuty integration'
                },
                account: {
                  type: 'string',
                  description: 'PagerDuty account name'
                },
                serviceName: {
                  type: 'string',
                  description: 'PagerDuty service name'
                },
                serviceSecret: {
                  type: 'string',
                  description: 'PagerDuty service integration key'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'account', 'serviceName', 'serviceSecret', 'severities']
            }
          },
          {
            name: 'enable_notification',
            description: 'Enable a notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId']
            }
          },
          {
            name: 'disable_notification',
            description: 'Disable a notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId']
            }
          },
          {
            name: 'delete_notification',
            description: 'Delete a notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId']
            }
          },
          // Mute Rules
          {
            name: 'list_mute_rules',
            description: 'List mute rules for an account',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                includeInactive: {
                  type: 'boolean',
                  description: 'Include inactive mute rules (optional)'
                }
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          {
            name: 'create_mute_rule',
            description: 'Create a mute rule to suppress alerts',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                hide: {
                  type: 'boolean',
                  description: 'If true, hide events completely. If false, show but mute them.'
                },
                resource: {
                  type: 'object',
                  description: 'Specific resource to mute (optional)',
                  properties: {
                    arn: {
                      type: 'string',
                      description: 'Resource ARN/ID'
                    },
                    refType: {
                      type: 'string',
                      description: 'Resource reference type (e.g., aws_arn, azure_id)'
                    }
                  }
                },
                projects: {
                  type: 'array',
                  description: 'Project IDs to apply mute rule to (optional)',
                  items: {
                    type: 'string'
                  }
                },
                regions: {
                  type: 'array',
                  description: 'AWS/Azure regions to apply mute rule to (optional)',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'hide']
            }
          },
          {
            name: 'get_mute_regions',
            description: 'Get available AWS and Azure regions for mute rules',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties()
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          // Additional Notification Types
          {
            name: 'create_opsgenie_notification',
            description: 'Create an OpsGenie notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the OpsGenie integration'
                },
                apikey: {
                  type: 'string',
                  description: 'OpsGenie API key'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'apikey', 'severities']
            }
          },
          {
            name: 'create_sns_notification',
            description: 'Create an AWS SNS notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the SNS integration'
                },
                topicArn: {
                  type: 'string',
                  description: 'AWS SNS topic ARN'
                },
                accessKeyId: {
                  type: 'string',
                  description: 'AWS access key ID'
                },
                secretAccessKey: {
                  type: 'string',
                  description: 'AWS secret access key'
                },
                sendResolve: {
                  type: 'boolean',
                  description: 'Send resolution notifications'
                },
                sendJson: {
                  type: 'boolean',
                  description: 'Send notifications as JSON'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'topicArn', 'accessKeyId', 'secretAccessKey', 'sendResolve', 'sendJson', 'severities']
            }
          },
          {
            name: 'create_victorops_notification',
            description: 'Create a VictorOps notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the VictorOps integration'
                },
                integrationId: {
                  type: 'string',
                  description: 'VictorOps integration ID'
                },
                routingKey: {
                  type: 'string',
                  description: 'VictorOps routing key'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'integrationId', 'routingKey', 'severities']
            }
          },
          {
            name: 'create_squadcast_notification',
            description: 'Create a SquadCast notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the SquadCast integration'
                },
                sourceInstance: {
                  type: 'string',
                  description: 'SquadCast source instance URL'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'sourceInstance', 'severities']
            }
          },
          {
            name: 'create_servicenow_notification',
            description: 'Create a ServiceNow notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                name: {
                  type: 'string',
                  description: 'Name for the ServiceNow integration'
                },
                instanceName: {
                  type: 'string',
                  description: 'ServiceNow instance name'
                },
                username: {
                  type: 'string',
                  description: 'ServiceNow username'
                },
                password: {
                  type: 'string',
                  description: 'ServiceNow password'
                },
                sourceInstance: {
                  type: 'string',
                  description: 'ServiceNow source instance'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'name', 'instanceName', 'username', 'password', 'sourceInstance', 'severities']
            }
          },
          // Update Notification Methods
          {
            name: 'update_email_notification',
            description: 'Update an email notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Email address to send notifications to'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId', 'email', 'severities']
            }
          },
          {
            name: 'update_pagerduty_notification',
            description: 'Update a PagerDuty notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the PagerDuty integration'
                },
                account: {
                  type: 'string',
                  description: 'PagerDuty account name'
                },
                serviceName: {
                  type: 'string',
                  description: 'PagerDuty service name'
                },
                serviceSecret: {
                  type: 'string',
                  description: 'PagerDuty service integration key'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId', 'name', 'account', 'serviceName', 'serviceSecret', 'severities']
            }
          },
          {
            name: 'update_opsgenie_notification',
            description: 'Update an OpsGenie notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the OpsGenie integration'
                },
                apikey: {
                  type: 'string',
                  description: 'OpsGenie API key'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId', 'name', 'apikey', 'severities']
            }
          },
          {
            name: 'update_sns_notification',
            description: 'Update an AWS SNS notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the SNS integration'
                },
                topicArn: {
                  type: 'string',
                  description: 'AWS SNS topic ARN'
                },
                accessKeyId: {
                  type: 'string',
                  description: 'AWS access key ID'
                },
                secretAccessKey: {
                  type: 'string',
                  description: 'AWS secret access key'
                },
                sendResolve: {
                  type: 'boolean',
                  description: 'Send resolution notifications'
                },
                sendJson: {
                  type: 'boolean',
                  description: 'Send notifications as JSON'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId', 'name', 'topicArn', 'accessKeyId', 'secretAccessKey', 'sendResolve', 'sendJson', 'severities']
            }
          },
          {
            name: 'update_victorops_notification',
            description: 'Update a VictorOps notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the VictorOps integration'
                },
                integrationId: {
                  type: 'string',
                  description: 'VictorOps integration ID'
                },
                routingKey: {
                  type: 'string',
                  description: 'VictorOps routing key'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId', 'name', 'integrationId', 'routingKey', 'severities']
            }
          },
          {
            name: 'update_squadcast_notification',
            description: 'Update a SquadCast notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the SquadCast integration'
                },
                sourceInstance: {
                  type: 'string',
                  description: 'SquadCast source instance URL'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId', 'name', 'sourceInstance', 'severities']
            }
          },
          {
            name: 'update_servicenow_notification',
            description: 'Update a ServiceNow notification integration',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                outboundId: {
                  type: 'string',
                  description: 'Notification ID (UUID format)'
                },
                name: {
                  type: 'string',
                  description: 'Name for the ServiceNow integration'
                },
                instanceName: {
                  type: 'string',
                  description: 'ServiceNow instance name'
                },
                username: {
                  type: 'string',
                  description: 'ServiceNow username'
                },
                password: {
                  type: 'string',
                  description: 'ServiceNow password'
                },
                sourceInstance: {
                  type: 'string',
                  description: 'ServiceNow source instance'
                },
                severities: {
                  type: 'array',
                  description: 'Event severities to include (e.g., ["alert", "warning", "anomaly"])',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'outboundId', 'name', 'instanceName', 'username', 'password', 'sourceInstance', 'severities']
            }
          },
          // Metrics
          {
            name: 'get_metrics',
            description: 'Query Bluematador metrics data',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                metrics: {
                  type: 'string',
                  description: 'Metric name to query (e.g., "aws.ec2.cpuutilization")'
                },
                agg: {
                  type: 'string',
                  description: 'Aggregation function (e.g., "avg", "max", "min", "sum")'
                },
                start: {
                  type: 'string',
                  description: 'Start time in ISO 8601 format'
                },
                end: {
                  type: 'string',
                  description: 'End time in ISO 8601 format'
                },
                groups: {
                  type: 'string',
                  description: 'Grouping dimensions (optional)'
                }
              },
              required: [...this.getAuthRequiredFields(), 'metrics', 'agg', 'start', 'end']
            }
          },
          // Advanced Mute Rules
          {
            name: 'get_mute_monitors',
            description: 'Get available monitors for mute rules',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties()
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          {
            name: 'get_mute_resources',
            description: 'Get available resources for mute rules with pagination',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                page: {
                  type: 'number',
                  description: 'Page number for pagination (optional)'
                },
                pageSize: {
                  type: 'number',
                  description: 'Number of resources per page (optional)'
                }
              },
              required: [...this.getAuthRequiredFields()]
            }
          },
          {
            name: 'delete_mute_rule',
            description: 'Delete a mute rule',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                muteId: {
                  type: 'string',
                  description: 'Mute rule ID to delete'
                }
              },
              required: [...this.getAuthRequiredFields(), 'muteId']
            }
          },
          {
            name: 'mute_monitors_by_service',
            description: 'Mute monitors for specific services (e.g., SQS, RDS, EC2) by creating a targeted mute rule',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                serviceName: {
                  type: 'string',
                  description: 'Service name (e.g., "sqs", "rds", "ec2", "lambda")'
                },
                monitorNames: {
                  type: 'array',
                  description: 'Specific monitor names to mute (optional - if not provided, all monitors for the service will be retrieved and muted)',
                  items: {
                    type: 'string'
                  }
                },
                hide: {
                  type: 'boolean',
                  description: 'If true, hide events completely. If false, show but mute them.',
                  default: false
                },
                projects: {
                  type: 'array',
                  description: 'Project IDs to apply mute rule to (optional)',
                  items: {
                    type: 'string'
                  }
                },
                regions: {
                  type: 'array',
                  description: 'AWS/Azure regions to apply mute rule to (optional)',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'serviceName']
            }
          },
          {
            name: 'mute_resources_by_wildcard',
            description: 'Mute monitors for resources using wildcard patterns (e.g., "sqs-*", "*-prod", "app-*-db")',
            inputSchema: {
              type: 'object',
              properties: {
                ...this.getBaseAuthProperties(),
                ...this.getOptionalProperties(),
                resourcePattern: {
                  type: 'string',
                  description: 'Wildcard pattern to match resource names/ARNs (e.g., "sqs-*", "*-prod", "app-*-db"). Use * for any characters.'
                },
                serviceType: {
                  type: 'string',
                  description: 'Filter by service type (optional, e.g., "sqs", "rds", "ec2", "lambda")'
                },
                hide: {
                  type: 'boolean',
                  description: 'If true, hide events completely. If false, show but mute them.',
                  default: false
                },
                projects: {
                  type: 'array',
                  description: 'Project IDs to apply mute rule to (optional)',
                  items: {
                    type: 'string'
                  }
                },
                regions: {
                  type: 'array',
                  description: 'AWS/Azure regions to apply mute rule to (optional)',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: [...this.getAuthRequiredFields(), 'resourcePattern']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new McpError(ErrorCode.InvalidParams, 'Arguments are required');
      }

      // Extract API key and account ID from arguments
      const apiKey = args.apiKey as string;
      if (!apiKey) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'API key is required. Get your API key from https://app.bluematador.com/ur/app#/account/apikeys'
        );
      }

      const accountId = args.accountId as string;
      if (!accountId) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Account ID is required. Get your account ID (UUID format) from https://app.bluematador.com/ur/app#/account/apikeys'
        );
      }

      // Add accountId to args for handlers that expect it
      args.accountId = accountId;

      // Create a new client for each request to support different API keys
      const baseUrl = (args.baseUrl as string) || 'https://app.bluematador.com';
      const apiClient = new BluematadorApiClient({
        apiKey,
        baseUrl
      });

      try {
        switch (name) {
          case 'create_aws_integration':
            return await this.handleCreateAWSIntegration(args, apiClient);

          case 'create_azure_integration':
            return await this.handleCreateAzureIntegration(args, apiClient);

          case 'list_integrations':
            return await this.handleListIntegrations(args, apiClient);

          case 'update_aws_integration':
            return await this.handleUpdateAWSIntegration(args, apiClient);

          case 'update_azure_integration':
            return await this.handleUpdateAzureIntegration(args, apiClient);

          case 'enable_integration':
            return await this.handleEnableIntegration(args, apiClient);

          case 'disable_integration':
            return await this.handleDisableIntegration(args, apiClient);

          case 'delete_integration':
            return await this.handleDeleteIntegration(args, apiClient);

          // Events
          case 'get_opened_events':
            return await this.handleGetOpenedEvents(args, apiClient);

          case 'get_active_events':
            return await this.handleGetActiveEvents(args, apiClient);

          case 'get_active_events_summary':
            return await this.handleGetActiveEventsSummary(args, apiClient);

          // Projects
          case 'list_projects':
            return await this.handleListProjects(args, apiClient);

          // Users
          case 'list_users':
            return await this.handleListUsers(args, apiClient);

          case 'invite_users':
            return await this.handleInviteUsers(args, apiClient);

          // Notifications
          case 'list_notifications':
            return await this.handleListNotifications(args, apiClient);

          case 'create_email_notification':
            return await this.handleCreateEmailNotification(args, apiClient);

          case 'create_pagerduty_notification':
            return await this.handleCreatePagerDutyNotification(args, apiClient);

          case 'enable_notification':
            return await this.handleEnableNotification(args, apiClient);

          case 'disable_notification':
            return await this.handleDisableNotification(args, apiClient);

          case 'delete_notification':
            return await this.handleDeleteNotification(args, apiClient);

          // Mute Rules
          case 'list_mute_rules':
            return await this.handleListMuteRules(args, apiClient);

          case 'create_mute_rule':
            return await this.handleCreateMuteRule(args, apiClient);

          case 'get_mute_regions':
            return await this.handleGetMuteRegions(args, apiClient);

          // Additional Notification Types
          case 'create_opsgenie_notification':
            return await this.handleCreateOpsGenieNotification(args, apiClient);

          case 'create_sns_notification':
            return await this.handleCreateSNSNotification(args, apiClient);

          case 'create_victorops_notification':
            return await this.handleCreateVictorOpsNotification(args, apiClient);

          case 'create_squadcast_notification':
            return await this.handleCreateSquadCastNotification(args, apiClient);

          case 'create_servicenow_notification':
            return await this.handleCreateServiceNowNotification(args, apiClient);

          // Update Notification Methods
          case 'update_email_notification':
            return await this.handleUpdateEmailNotification(args, apiClient);

          case 'update_pagerduty_notification':
            return await this.handleUpdatePagerDutyNotification(args, apiClient);

          case 'update_opsgenie_notification':
            return await this.handleUpdateOpsGenieNotification(args, apiClient);

          case 'update_sns_notification':
            return await this.handleUpdateSNSNotification(args, apiClient);

          case 'update_victorops_notification':
            return await this.handleUpdateVictorOpsNotification(args, apiClient);

          case 'update_squadcast_notification':
            return await this.handleUpdateSquadCastNotification(args, apiClient);

          case 'update_servicenow_notification':
            return await this.handleUpdateServiceNowNotification(args, apiClient);

          // Metrics
          case 'get_metrics':
            return await this.handleGetMetrics(args, apiClient);

          // Advanced Mute Rules
          case 'get_mute_monitors':
            return await this.handleGetMuteMonitors(args, apiClient);

          case 'get_mute_resources':
            return await this.handleGetMuteResources(args, apiClient);

          case 'delete_mute_rule':
            return await this.handleDeleteMuteRule(args, apiClient);

          case 'mute_monitors_by_service':
            return await this.handleMuteMonitorsByService(args, apiClient);

          case 'mute_resources_by_wildcard':
            return await this.handleMuteResourcesByWildcard(args, apiClient);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        if (error instanceof McpError) {
          throw error;
        }

        // Enhanced error handling with detailed information
        const errorDetails = this.formatDetailedError(error, name, args);

        const status = error.status || (error.response && error.response.status);
        const message = error.message || 'An unknown error occurred';

        if (status === 401) {
          throw new McpError(ErrorCode.InvalidRequest, `Authentication failed: ${errorDetails}`);
        } else if (status === 404) {
          throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${errorDetails}`);
        } else if (status === 400) {
          throw new McpError(ErrorCode.InvalidParams, `Bad request: ${errorDetails}`);
        } else if (status === 403) {
          throw new McpError(ErrorCode.InvalidRequest, `Access forbidden: ${errorDetails}`);
        } else if (status === 429) {
          throw new McpError(ErrorCode.InternalError, `Rate limit exceeded: ${errorDetails}`);
        } else if (status >= 500) {
          throw new McpError(ErrorCode.InternalError, `Server error: ${errorDetails}`);
        } else {
          throw new McpError(ErrorCode.InternalError, `API error: ${errorDetails}`);
        }
      }
    });
  }

  private async handleCreateAWSIntegration(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, roleArn, externalId } = args;
    const integrationData: AWSIntegrationData = { name, roleArn, externalId };

    const result = await apiClient.createAWSIntegration(accountId, integrationData);

    return {
      content: [
        {
          type: 'text',
          text: `AWS integration created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Role ARN: ${roleArn}\n- External ID: ${externalId}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleCreateAzureIntegration(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, subscriptionId, tenantId, applicationId, secret } = args;
    const integrationData: AzureIntegrationData = { name, subscriptionId, tenantId, applicationId, secret };

    const result = await apiClient.createAzureIntegration(accountId, integrationData);

    return {
      content: [
        {
          type: 'text',
          text: `Azure integration created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Subscription ID: ${subscriptionId}\n- Tenant ID: ${tenantId}\n- Application ID: ${applicationId}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleListIntegrations(args: any, apiClient: BluematadorApiClient) {
    const { accountId } = args;
    const integrations = await apiClient.listIntegrations(accountId);

    if (integrations.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No integrations found for this account.'
          }
        ]
      };
    }

    const integrationList = integrations.map(integration => {
      const status = integration.data.status;
      return `- ${integration.data.name} (${integration.inboundType})\n  ID: ${integration.id}\n  Enabled: ${integration.enabled}\n  Success: ${status.totalSuccess}, Errors: ${status.totalError}\n  Created: ${integration.created}`;
    }).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${integrations.length} integration(s):\n\n${integrationList}`
        }
      ]
    };
  }

  private async handleUpdateAWSIntegration(args: any, apiClient: BluematadorApiClient) {
    const { accountId, inboundId, name, roleArn, externalId } = args;
    const integrationData: AWSIntegrationData = { name, roleArn, externalId };

    const result = await apiClient.updateAWSIntegration(accountId, inboundId, integrationData);

    return {
      content: [
        {
          type: 'text',
          text: `AWS integration updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Role ARN: ${roleArn}\n- External ID: ${externalId}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleUpdateAzureIntegration(args: any, apiClient: BluematadorApiClient) {
    const { accountId, inboundId, name, subscriptionId, tenantId, applicationId, secret } = args;
    const integrationData: AzureIntegrationData = { name, subscriptionId, tenantId, applicationId, secret };

    const result = await apiClient.updateAzureIntegration(accountId, inboundId, integrationData);

    return {
      content: [
        {
          type: 'text',
          text: `Azure integration updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Subscription ID: ${subscriptionId}\n- Tenant ID: ${tenantId}\n- Application ID: ${applicationId}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleEnableIntegration(args: any, apiClient: BluematadorApiClient) {
    const { accountId, inboundId } = args;
    await apiClient.enableIntegration(accountId, inboundId);

    return {
      content: [
        {
          type: 'text',
          text: `Integration ${inboundId} has been enabled successfully.`
        }
      ]
    };
  }

  private async handleDisableIntegration(args: any, apiClient: BluematadorApiClient) {
    const { accountId, inboundId } = args;
    await apiClient.disableIntegration(accountId, inboundId);

    return {
      content: [
        {
          type: 'text',
          text: `Integration ${inboundId} has been disabled successfully.`
        }
      ]
    };
  }

  private async handleDeleteIntegration(args: any, apiClient: BluematadorApiClient) {
    const { accountId, inboundId } = args;
    await apiClient.deleteIntegration(accountId, inboundId);

    return {
      content: [
        {
          type: 'text',
          text: `Integration ${inboundId} has been deleted successfully.`
        }
      ]
    };
  }

  // Events handlers
  private async handleGetOpenedEvents(args: any, apiClient: BluematadorApiClient) {
    const { accountId, start, end, project } = args;
    const events = await apiClient.getOpenedEvents(accountId, start, end, project);

    if (events.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No events found between ${start} and ${end}${project ? ` for project ${project}` : ''}.`
          }
        ]
      };
    }

    const eventDetails = events.map(event => {
      const resourceInfo = this.formatResourceInfo(event.source);
      return `**${event.typeText}** (${event.severity})\n` +
             `📝 ${event.summaryText}\n` +
             `🕒 Opened: ${event.opened}\n` +
             `${resourceInfo}\n` +
             `🆔 Event ID: ${event.id}` +
             (event.muted ? '\n🔇 Muted' : '') +
             (event.hidden ? '\n👁️ Hidden' : '');
    }).join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${events.length} events opened between ${start} and ${end}${project ? ` for project ${project}` : ''}:\n\n---\n\n${eventDetails}`
        }
      ]
    };
  }

  private async handleGetActiveEvents(args: any, apiClient: BluematadorApiClient) {
    const { accountId, project } = args;
    const events = await apiClient.getActiveEvents(accountId, project);

    if (events.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No active events found${project ? ` for project ${project}` : ''}.`
          }
        ]
      };
    }

    const eventDetails = events.map(event => {
      const resourceInfo = this.formatResourceInfo(event.source);
      return `**${event.typeText}** (${event.severity})\n` +
             `📝 ${event.summaryText}\n` +
             `🕒 Opened: ${event.opened}\n` +
             `${resourceInfo}\n` +
             `🆔 Event ID: ${event.id}` +
             (event.muted ? '\n🔇 Muted' : '') +
             (event.hidden ? '\n👁️ Hidden' : '');
    }).join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${events.length} active events${project ? ` for project ${project}` : ''}:\n\n---\n\n${eventDetails}`
        }
      ]
    };
  }

  private async handleGetActiveEventsSummary(args: any, apiClient: BluematadorApiClient) {
    const { accountId, project } = args;
    const summary = await apiClient.getActiveEventsSummary(accountId, project);

    return {
      content: [
        {
          type: 'text',
          text: `Events summary for the last 30 days${project ? ` for project ${project}` : ''}:\n\n${JSON.stringify(summary, null, 2)}`
        }
      ]
    };
  }

  // Projects handlers
  private async handleListProjects(args: any, apiClient: BluematadorApiClient) {
    const { accountId } = args;
    const projects = await apiClient.listProjects(accountId);

    if (projects.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No projects found for this account.'
          }
        ]
      };
    }

    const projectList = projects.map(project => `- ${project.name} (ID: ${project.id})`).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${projects.length} project(s):\n\n${projectList}`
        }
      ]
    };
  }

  // Users handlers
  private async handleListUsers(args: any, apiClient: BluematadorApiClient) {
    const { accountId } = args;
    const result = await apiClient.listUsers(accountId);

    if (result.users.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No users found for this account.'
          }
        ]
      };
    }

    const userList = result.users.map(user => `- ${user.firstName} ${user.lastName} (${user.email}) - ${user.admin ? 'Admin' : 'User'}`).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${result.users.length} user(s):\n\n${userList}`
        }
      ]
    };
  }

  private async handleInviteUsers(args: any, apiClient: BluematadorApiClient) {
    const { accountId, users } = args;
    await apiClient.inviteUsers(accountId, users as InviteUserData[]);

    const userList = users.map((user: InviteUserData) => `- ${user.email} (${user.admin ? 'Admin' : 'User'})`).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Successfully invited ${users.length} user(s) to account ${accountId}:\n\n${userList}\n\nUsers will receive email invitations to set up their accounts.`
        }
      ]
    };
  }

  // Notifications handlers
  private async handleListNotifications(args: any, apiClient: BluematadorApiClient) {
    const { accountId } = args;
    const notifications = await apiClient.listNotifications(accountId);

    if (notifications.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No notification integrations found for this account.'
          }
        ]
      };
    }

    const notificationList = notifications.map(notification =>
      `- ${notification.outboundType} (ID: ${notification.id})\n  Enabled: ${notification.enabled}\n  Success: ${notification.data.status.totalSuccess}, Errors: ${notification.data.status.totalError}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${notifications.length} notification integration(s):\n\n${notificationList}`
        }
      ]
    };
  }

  private async handleCreateEmailNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, email, severities } = args;
    const data: EmailNotificationData = {
      email,
      severities: { all: severities }
    };

    const result = await apiClient.createEmailNotification(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `Email notification created successfully!\n\nDetails:\n- ID: ${result.id}\n- Email: ${email}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleCreatePagerDutyNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, account, serviceName, serviceSecret, severities } = args;
    const data: PagerDutyNotificationData = {
      name,
      account,
      serviceName,
      serviceSecret,
      severities: { all: severities }
    };

    const result = await apiClient.createPagerDutyNotification(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `PagerDuty notification created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Account: ${account}\n- Service: ${serviceName}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleEnableNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId } = args;
    await apiClient.enableNotification(accountId, outboundId);

    return {
      content: [
        {
          type: 'text',
          text: `Notification ${outboundId} has been enabled successfully.`
        }
      ]
    };
  }

  private async handleDisableNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId } = args;
    await apiClient.disableNotification(accountId, outboundId);

    return {
      content: [
        {
          type: 'text',
          text: `Notification ${outboundId} has been disabled successfully.`
        }
      ]
    };
  }

  private async handleDeleteNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId } = args;
    await apiClient.deleteNotification(accountId, outboundId);

    return {
      content: [
        {
          type: 'text',
          text: `Notification ${outboundId} has been deleted successfully.`
        }
      ]
    };
  }

  // Mute Rules handlers
  private async handleListMuteRules(args: any, apiClient: BluematadorApiClient) {
    const { accountId, includeInactive } = args;
    const muteRules = await apiClient.listMuteRules(accountId, includeInactive);

    if (muteRules.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No mute rules found for this account.'
          }
        ]
      };
    }

    const rulesList = muteRules.map(rule =>
      `- Rule ID: ${rule.id}\n  Hide: ${rule.hide}\n  Active: ${rule.active}\n  Resource: ${(rule.resource && rule.resource.arn) ? rule.resource.arn : 'All resources'}\n  Projects: ${rule.projects ? rule.projects.length : 0}\n  Regions: ${rule.regions ? rule.regions.length : 0}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${muteRules.length} mute rule(s):\n\n${rulesList}`
        }
      ]
    };
  }

  private async handleCreateMuteRule(args: any, apiClient: BluematadorApiClient) {
    const { accountId, hide, resource, projects, regions } = args;
    const data: CreateMuteRuleData = {
      hide,
      resource,
      projects,
      regions
    };

    await apiClient.createMuteRule(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `Mute rule created successfully!\n\nDetails:\n- Hide events: ${hide}\n- Resource: ${(resource && resource.arn) ? resource.arn : 'All resources'}\n- Projects: ${projects ? projects.length : 0}\n- Regions: ${regions ? regions.length : 0}`
        }
      ]
    };
  }

  private async handleGetMuteRegions(args: any, apiClient: BluematadorApiClient) {
    const { accountId } = args;
    const regions = await apiClient.getMuteRegions(accountId);

    return {
      content: [
        {
          type: 'text',
          text: `Available regions for mute rules:\n\n**AWS Regions:**\n${regions.awsRegions.join(', ')}\n\n**Azure Regions:**\n${regions.azureRegions.join(', ')}`
        }
      ]
    };
  }

  // Additional Notification handlers
  private async handleCreateOpsGenieNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, apikey, severities } = args;
    const data: OpsGenieNotificationData = {
      name,
      apikey,
      severities: { all: severities }
    };

    const result = await apiClient.createOpsGenieNotification(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `OpsGenie notification created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleCreateSNSNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, topicArn, accessKeyId, secretAccessKey, sendResolve, sendJson, severities } = args;
    const data: SNSNotificationData = {
      name,
      topicArn,
      accessKeyId,
      secretAccessKey,
      sendResolve,
      sendJson,
      severities: { all: severities }
    };

    const result = await apiClient.createSNSNotification(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `AWS SNS notification created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Topic ARN: ${topicArn}\n- Send Resolve: ${sendResolve}\n- Send JSON: ${sendJson}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleCreateVictorOpsNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, integrationId, routingKey, severities } = args;
    const data: VictorOpsNotificationData = {
      name,
      integrationId,
      routingKey,
      severities: { all: severities }
    };

    const result = await apiClient.createVictorOpsNotification(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `VictorOps notification created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Integration ID: ${integrationId}\n- Routing Key: ${routingKey}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleCreateSquadCastNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, sourceInstance, severities } = args;
    const data: SquadCastNotificationData = {
      name,
      sourceInstance,
      severities: { all: severities }
    };

    const result = await apiClient.createSquadCastNotification(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `SquadCast notification created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Source Instance: ${sourceInstance}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  private async handleCreateServiceNowNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, name, instanceName, username, password, sourceInstance, severities } = args;
    const data: ServiceNowNotificationData = {
      name,
      credentials: {
        instanceName,
        username,
        password
      },
      sourceInstance,
      severities: { all: severities }
    };

    const result = await apiClient.createServiceNowNotification(accountId, data);

    return {
      content: [
        {
          type: 'text',
          text: `ServiceNow notification created successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Instance: ${instanceName}\n- Username: ${username}\n- Source Instance: ${sourceInstance}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}\n- Created: ${result.created}`
        }
      ]
    };
  }

  // Update Notification handlers
  private async handleUpdateEmailNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId, email, severities } = args;
    const data: EmailNotificationData = {
      email,
      severities: { all: severities }
    };

    const result = await apiClient.updateEmailNotification(accountId, outboundId, data);

    return {
      content: [
        {
          type: 'text',
          text: `Email notification updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Email: ${email}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleUpdatePagerDutyNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId, name, account, serviceName, serviceSecret, severities } = args;
    const data: PagerDutyNotificationData = {
      name,
      account,
      serviceName,
      serviceSecret,
      severities: { all: severities }
    };

    const result = await apiClient.updatePagerDutyNotification(accountId, outboundId, data);

    return {
      content: [
        {
          type: 'text',
          text: `PagerDuty notification updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Account: ${account}\n- Service: ${serviceName}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleUpdateOpsGenieNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId, name, apikey, severities } = args;
    const data: OpsGenieNotificationData = {
      name,
      apikey,
      severities: { all: severities }
    };

    const result = await apiClient.updateOpsGenieNotification(accountId, outboundId, data);

    return {
      content: [
        {
          type: 'text',
          text: `OpsGenie notification updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleUpdateSNSNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId, name, topicArn, accessKeyId, secretAccessKey, sendResolve, sendJson, severities } = args;
    const data: SNSNotificationData = {
      name,
      topicArn,
      accessKeyId,
      secretAccessKey,
      sendResolve,
      sendJson,
      severities: { all: severities }
    };

    const result = await apiClient.updateSNSNotification(accountId, outboundId, data);

    return {
      content: [
        {
          type: 'text',
          text: `AWS SNS notification updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Topic ARN: ${topicArn}\n- Send Resolve: ${sendResolve}\n- Send JSON: ${sendJson}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleUpdateVictorOpsNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId, name, integrationId, routingKey, severities } = args;
    const data: VictorOpsNotificationData = {
      name,
      integrationId,
      routingKey,
      severities: { all: severities }
    };

    const result = await apiClient.updateVictorOpsNotification(accountId, outboundId, data);

    return {
      content: [
        {
          type: 'text',
          text: `VictorOps notification updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Integration ID: ${integrationId}\n- Routing Key: ${routingKey}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleUpdateSquadCastNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId, name, sourceInstance, severities } = args;
    const data: SquadCastNotificationData = {
      name,
      sourceInstance,
      severities: { all: severities }
    };

    const result = await apiClient.updateSquadCastNotification(accountId, outboundId, data);

    return {
      content: [
        {
          type: 'text',
          text: `SquadCast notification updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Source Instance: ${sourceInstance}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  private async handleUpdateServiceNowNotification(args: any, apiClient: BluematadorApiClient) {
    const { accountId, outboundId, name, instanceName, username, password, sourceInstance, severities } = args;
    const data: ServiceNowNotificationData = {
      name,
      credentials: {
        instanceName,
        username,
        password
      },
      sourceInstance,
      severities: { all: severities }
    };

    const result = await apiClient.updateServiceNowNotification(accountId, outboundId, data);

    return {
      content: [
        {
          type: 'text',
          text: `ServiceNow notification updated successfully!\n\nDetails:\n- ID: ${result.id}\n- Name: ${name}\n- Instance: ${instanceName}\n- Username: ${username}\n- Source Instance: ${sourceInstance}\n- Severities: ${severities.join(', ')}\n- Enabled: ${result.enabled}`
        }
      ]
    };
  }

  // Metrics handler
  private async handleGetMetrics(args: any, apiClient: BluematadorApiClient) {
    const { accountId, metrics, agg, start, end, groups } = args;
    const query: MetricsQuery = {
      accountId,
      metrics,
      agg,
      start,
      end,
      groups
    };

    const result = await apiClient.getMetrics(query);

    return {
      content: [
        {
          type: 'text',
          text: `Metrics query results:\n\n**Query:** ${metrics} (${agg})\n**Time Range:** ${start} to ${end}\n**Groups:** ${groups || 'None'}\n\n**Results:**\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  // Advanced Mute Rule handlers
  private async handleGetMuteMonitors(args: any, apiClient: BluematadorApiClient) {
    const { accountId } = args;
    const result = await apiClient.getMuteMonitors(accountId);

    const monitorsList = Object.entries(result.monitors)
      .map(([service, monitors]) => `**${service}:**\n  ${monitors.join(', ')}`)
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available monitors for mute rules:\n\n${monitorsList}`
        }
      ]
    };
  }

  private async handleGetMuteResources(args: any, apiClient: BluematadorApiClient) {
    const { accountId, page, pageSize } = args;
    const result = await apiClient.getMuteResources(accountId, page, pageSize);

    if (result.resources.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No resources found for mute rules.'
          }
        ]
      };
    }

    const resourceList = result.resources.map(resource =>
      `- ${resource.arn} (${resource.refType})`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available resources for mute rules${page ? ` (Page ${page})` : ''}:\n\n${resourceList}`
        }
      ]
    };
  }

  private async handleDeleteMuteRule(args: any, apiClient: BluematadorApiClient) {
    const { accountId, muteId } = args;
    await apiClient.deleteMuteRule(accountId, muteId);

    return {
      content: [
        {
          type: 'text',
          text: `Mute rule ${muteId} has been deleted successfully.`
        }
      ]
    };
  }

  private async handleMuteMonitorsByService(args: any, apiClient: BluematadorApiClient) {
    const { accountId, serviceName, monitorNames, hide = false, projects, regions } = args;

    // First, get available monitors to validate the service name and get monitor names
    const availableMonitorsResponse = await apiClient.getMuteMonitors(accountId);
    const availableMonitors = availableMonitorsResponse.monitors;

    // Find the service in the available monitors (case-insensitive)
    const serviceKey = Object.keys(availableMonitors).find(
      key => key.toLowerCase() === serviceName.toLowerCase()
    );

    if (!serviceKey) {
      const availableServices = Object.keys(availableMonitors).join(', ');
      throw new McpError(
        ErrorCode.InvalidParams,
        `Service "${serviceName}" not found. Available services: ${availableServices}`
      );
    }

    // Use provided monitor names or get all monitors for the service
    const monitorsToMute = monitorNames && monitorNames.length > 0
      ? monitorNames
      : availableMonitors[serviceKey];

    // Validate that all specified monitors exist for this service
    if (monitorNames && monitorNames.length > 0) {
      const invalidMonitors = monitorNames.filter(
        (monitor: string) => !availableMonitors[serviceKey].includes(monitor)
      );
      if (invalidMonitors.length > 0) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid monitors for service "${serviceKey}": ${invalidMonitors.join(', ')}. ` +
          `Available monitors: ${availableMonitors[serviceKey].join(', ')}`
        );
      }
    }

    // Create the mute rule data
    const muteRuleData: CreateMuteRuleData = {
      hide,
      monitors: {
        [serviceKey]: monitorsToMute
      },
      projects,
      regions
    };

    await apiClient.createMuteRule(accountId, muteRuleData);

    return {
      content: [
        {
          type: 'text',
          text: `Mute rule created successfully for ${serviceKey} service!\n\n` +
                `Details:\n` +
                `- Service: ${serviceKey}\n` +
                `- Monitors muted: ${monitorsToMute.join(', ')}\n` +
                `- Hide events: ${hide}\n` +
                `- Projects: ${projects ? projects.length : 0}\n` +
                `- Regions: ${regions ? regions.length : 0}\n\n` +
                `${hide ? 'Events will be completely hidden.' : 'Events will be shown but muted.'}`
        }
      ]
    };
  }

  private async handleMuteResourcesByWildcard(args: any, apiClient: BluematadorApiClient) {
    const { accountId, resourcePattern, serviceType, hide = false, projects, regions } = args;

    // Get available resources to find matches
    const resourcesResponse = await apiClient.getMuteResources(accountId);
    const allResources = resourcesResponse.resources;

    if (!allResources || allResources.length === 0) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No resources found in the account to apply wildcard pattern to.'
      );
    }

    // Convert wildcard pattern to regex
    const wildcardToRegex = (pattern: string): RegExp => {
      const escapedPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except *
        .replace(/\*/g, '.*'); // Replace * with .*
      return new RegExp(`^${escapedPattern}$`, 'i'); // Case insensitive
    };

    const patternRegex = wildcardToRegex(resourcePattern);

    // Filter resources by wildcard pattern and optional service type
    const matchingResources = allResources.filter(resource => {
      // Check if resource ARN matches the pattern
      const resourceName = resource.arn || '';
      const nameMatches = patternRegex.test(resourceName);

      // If service type is specified, also filter by it
      if (serviceType) {
        // Extract service type from ARN (e.g., arn:aws:sqs:... -> sqs)
        const arnParts = resource.arn.split(':');
        const resourceServiceType = arnParts.length > 2 ? arnParts[2].toLowerCase() : '';
        const targetServiceType = serviceType.toLowerCase();
        return nameMatches && resourceServiceType === targetServiceType;
      }

      return nameMatches;
    });

    if (matchingResources.length === 0) {
      const serviceFilter = serviceType ? ` and service type "${serviceType}"` : '';
      throw new McpError(
        ErrorCode.InvalidRequest,
        `No resources found matching pattern "${resourcePattern}"${serviceFilter}. ` +
        `Total resources available: ${allResources.length}`
      );
    }

    // Create individual mute rules for each matching resource
    const muteResults = [];

    for (const resource of matchingResources) {
      if (resource.arn) {
        const muteRuleData: CreateMuteRuleData = {
          hide,
          resource: { arn: resource.arn, refType: resource.refType },
          projects,
          regions
        };

        try {
          await apiClient.createMuteRule(accountId, muteRuleData);
          muteResults.push(`✅ ${resource.arn}`);
        } catch (error: any) {
          muteResults.push(`❌ ${resource.arn} (Error: ${error.message})`);
        }
      }
    }

    const successCount = muteResults.filter(result => result.startsWith('✅')).length;
    const failureCount = muteResults.filter(result => result.startsWith('❌')).length;

    return {
      content: [
        {
          type: 'text',
          text: `Wildcard mute rules created!\n\n` +
                `**Pattern:** ${resourcePattern}\n` +
                `**Service Filter:** ${serviceType || 'All services'}\n` +
                `**Matched Resources:** ${matchingResources.length}\n` +
                `**Successfully Muted:** ${successCount}\n` +
                `**Failed:** ${failureCount}\n` +
                `**Hide Events:** ${hide}\n` +
                `**Projects:** ${projects ? projects.length : 0}\n` +
                `**Regions:** ${regions ? regions.length : 0}\n\n` +
                `**Results:**\n${muteResults.join('\n')}\n\n` +
                `${hide ? 'Events will be completely hidden.' : 'Events will be shown but muted.'}`
        }
      ]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bluematador MCP server running on stdio');
  }

  async connect(transport: any): Promise<void> {
    await this.server.connect(transport);
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new BluematadorMCPServer();
  server.run().catch(console.error);
}

export { BluematadorMCPServer };