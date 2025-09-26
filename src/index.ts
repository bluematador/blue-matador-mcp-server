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
import { BluematadorConfig, AWSIntegrationData, AzureIntegrationData } from './types.js';

class BluematadorMCPServer {
  private server: Server;

  private getBaseProperties() {
    return {
      apiKey: {
        type: 'string' as const,
        description: 'Bluematador API key (optional if set via environment variable)'
      },
      baseUrl: {
        type: 'string' as const,
        description: 'Bluematador base URL (optional, defaults to https://app.bluematador.com)'
      }
    };
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
                apiKey: {
                  type: 'string',
                  description: 'Bluematador API key (optional if set via environment variable)'
                },
                baseUrl: {
                  type: 'string',
                  description: 'Bluematador base URL (optional, defaults to https://app.bluematador.com)'
                },
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
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
              required: ['accountId', 'name', 'roleArn', 'externalId']
            }
          },
          {
            name: 'create_azure_integration',
            description: 'Create a new Azure integration in Bluematador',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
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
              required: ['accountId', 'name', 'subscriptionId', 'tenantId', 'applicationId', 'secret']
            }
          },
          {
            name: 'list_integrations',
            description: 'List all integrations for a Bluematador account',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
                }
              },
              required: ['accountId']
            }
          },
          {
            name: 'update_aws_integration',
            description: 'Update an existing AWS integration',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
                },
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
              required: ['accountId', 'inboundId', 'name', 'roleArn', 'externalId']
            }
          },
          {
            name: 'update_azure_integration',
            description: 'Update an existing Azure integration',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
                },
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
              required: ['accountId', 'inboundId', 'name', 'subscriptionId', 'tenantId', 'applicationId', 'secret']
            }
          },
          {
            name: 'enable_integration',
            description: 'Enable a Bluematador integration',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
                },
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                }
              },
              required: ['accountId', 'inboundId']
            }
          },
          {
            name: 'disable_integration',
            description: 'Disable a Bluematador integration',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
                },
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                }
              },
              required: ['accountId', 'inboundId']
            }
          },
          {
            name: 'delete_integration',
            description: 'Delete a Bluematador integration',
            inputSchema: {
              type: 'object',
              properties: {
                accountId: {
                  type: 'string',
                  description: 'Bluematador account ID (UUID format)'
                },
                inboundId: {
                  type: 'string',
                  description: 'Integration ID (UUID format)'
                }
              },
              required: ['accountId', 'inboundId']
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

      // Extract API key from arguments or environment
      const apiKey = (args.apiKey as string) || process.env.BLUEMATADOR_API_KEY;
      if (!apiKey) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'API key is required. Provide it via the "apiKey" parameter or BLUEMATADOR_API_KEY environment variable'
        );
      }

      // Create a new client for each request to support different API keys
      const baseUrl = (args.baseUrl as string) || process.env.BLUEMATADOR_BASE_URL || 'https://app.bluematador.com';
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

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        if (error instanceof McpError) {
          throw error;
        }

        const message = error.message || 'An unknown error occurred';
        const status = error.status;

        if (status === 401) {
          throw new McpError(ErrorCode.InvalidRequest, `Authentication failed: ${message}`);
        } else if (status === 404) {
          throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${message}`);
        } else if (status === 400) {
          throw new McpError(ErrorCode.InvalidParams, `Bad request: ${message}`);
        } else {
          throw new McpError(ErrorCode.InternalError, `API error: ${message}`);
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bluematador MCP server running on stdio');
  }
}

const server = new BluematadorMCPServer();
server.run().catch(console.error);