# Tool reference

The server exposes 42 tools. This file is generated from the tool list by `npm run docs`, and `npm test` fails when it is out of date.

## `create_aws_integration`

Create a new AWS integration in Bluematador

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the AWS integration |
| `roleArn` | string | yes | AWS IAM role ARN for Bluematador to assume |
| `externalId` | string | yes | External ID for the AWS role |

## `create_azure_integration`

Create a new Azure integration in Bluematador

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the Azure integration |
| `subscriptionId` | string | yes | Azure subscription ID |
| `tenantId` | string | yes | Azure tenant ID |
| `applicationId` | string | yes | Azure application (client) ID |
| `secret` | string | yes | Azure client secret |

## `list_integrations`

List all integrations for a Bluematador account

Read-only.

No parameters.

## `update_aws_integration`

Update an existing AWS integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `inboundId` | string | yes | Integration ID (UUID format) |
| `name` | string | yes | Name for the AWS integration |
| `roleArn` | string | yes | AWS IAM role ARN for Bluematador to assume |
| `externalId` | string | yes | External ID for the AWS role |

## `update_azure_integration`

Update an existing Azure integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `inboundId` | string | yes | Integration ID (UUID format) |
| `name` | string | yes | Name for the Azure integration |
| `subscriptionId` | string | yes | Azure subscription ID |
| `tenantId` | string | yes | Azure tenant ID |
| `applicationId` | string | yes | Azure application (client) ID |
| `secret` | string | yes | Azure client secret |

## `enable_integration`

Enable a Bluematador integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `inboundId` | string | yes | Integration ID (UUID format) |

## `disable_integration`

Disable a Bluematador integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `inboundId` | string | yes | Integration ID (UUID format) |

## `delete_integration`

Delete a Bluematador integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `inboundId` | string | yes | Integration ID (UUID format) |

## `get_opened_events`

Get Bluematador events that were opened within a time period

Read-only.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `start` | string | yes | Start time in ISO 8601 format (e.g., 2023-10-23T21:44:58Z) |
| `end` | string | yes | End time in ISO 8601 format (e.g., 2023-10-24T21:44:58Z) |
| `project` | string | no | Project ID to filter events (optional) |

## `get_active_events`

Get currently active Bluematador events

Read-only.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `project` | string | no | Project ID to filter events (optional) |

## `get_event_context`

Everything needed to act on one event: the event and its details, the affected resource (ARN, type, tags), other events on the same resource, and mute rules that cover it. Use this before investigating or fixing an alert.

Read-only.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `event_id` | string | yes | Event ID, from get\_active\_events or get\_opened\_events |
| `days` | number | no | How many days back to look for the event and for related events (default 7) |

## `get_active_events_summary`

Get summary of active events for the last 30 days

Read-only.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `project` | string | no | Project ID to filter events (optional) |

## `list_projects`

List all Bluematador projects for an account

Read-only.

No parameters.

## `list_users`

List all users in a Bluematador account

Read-only.

No parameters.

## `invite_users`

Invite users to a Bluematador account

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `users` | object[] | yes | Array of users to invite |

## `list_notifications`

List all notification integrations for an account

Read-only.

No parameters.

## `create_email_notification`

Create an email notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string | yes | Email address to send notifications to |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `create_pagerduty_notification`

Create a PagerDuty notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the PagerDuty integration |
| `account` | string | yes | PagerDuty account name |
| `serviceName` | string | yes | PagerDuty service name |
| `serviceSecret` | string | yes | PagerDuty service integration key |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `enable_notification`

Enable a notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |

## `disable_notification`

Disable a notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |

## `delete_notification`

Delete a notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |

## `list_mute_rules`

List mute rules for an account

Read-only.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `includeInactive` | boolean | no | Include inactive mute rules (optional) |

## `create_mute_rule`

Create a mute rule to suppress alerts

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `hide` | boolean | yes | If true, hide events completely. If false, show but mute them. |
| `resource` | object | no | Specific resource to mute (optional) |
| `projects` | string[] | no | Project IDs to apply mute rule to (optional) |
| `regions` | string[] | no | AWS/Azure regions to apply mute rule to (optional) |
| `schedule` | object | no | Schedule for when the mute rule is active (optional). If omitted, the rule is always active. |

## `get_mute_regions`

Get available AWS and Azure regions for mute rules

Read-only.

No parameters.

## `create_opsgenie_notification`

Create an OpsGenie notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the OpsGenie integration |
| `apikey` | string | yes | OpsGenie API key |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `create_sns_notification`

Create an AWS SNS notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the SNS integration |
| `topicArn` | string | yes | AWS SNS topic ARN |
| `accessKeyId` | string | yes | AWS access key ID |
| `secretAccessKey` | string | yes | AWS secret access key |
| `sendResolve` | boolean | yes | Send resolution notifications |
| `sendJson` | boolean | yes | Send notifications as JSON |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `create_victorops_notification`

Create a VictorOps notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the VictorOps integration |
| `integrationId` | string | yes | VictorOps integration ID |
| `routingKey` | string | yes | VictorOps routing key |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `create_squadcast_notification`

Create a SquadCast notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the SquadCast integration |
| `sourceInstance` | string | yes | SquadCast source instance URL |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `create_servicenow_notification`

Create a ServiceNow notification integration

Creates or changes data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Name for the ServiceNow integration |
| `instanceName` | string | yes | ServiceNow instance name |
| `username` | string | yes | ServiceNow username |
| `password` | string | yes | ServiceNow password |
| `sourceInstance` | string | yes | ServiceNow source instance |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `update_email_notification`

Update an email notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |
| `email` | string | yes | Email address to send notifications to |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `update_pagerduty_notification`

Update a PagerDuty notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |
| `name` | string | yes | Name for the PagerDuty integration |
| `account` | string | yes | PagerDuty account name |
| `serviceName` | string | yes | PagerDuty service name |
| `serviceSecret` | string | yes | PagerDuty service integration key |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `update_opsgenie_notification`

Update an OpsGenie notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |
| `name` | string | yes | Name for the OpsGenie integration |
| `apikey` | string | yes | OpsGenie API key |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `update_sns_notification`

Update an AWS SNS notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |
| `name` | string | yes | Name for the SNS integration |
| `topicArn` | string | yes | AWS SNS topic ARN |
| `accessKeyId` | string | yes | AWS access key ID |
| `secretAccessKey` | string | yes | AWS secret access key |
| `sendResolve` | boolean | yes | Send resolution notifications |
| `sendJson` | boolean | yes | Send notifications as JSON |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `update_victorops_notification`

Update a VictorOps notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |
| `name` | string | yes | Name for the VictorOps integration |
| `integrationId` | string | yes | VictorOps integration ID |
| `routingKey` | string | yes | VictorOps routing key |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `update_squadcast_notification`

Update a SquadCast notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |
| `name` | string | yes | Name for the SquadCast integration |
| `sourceInstance` | string | yes | SquadCast source instance URL |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `update_servicenow_notification`

Update a ServiceNow notification integration

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `outboundId` | string | yes | Notification ID (UUID format) |
| `name` | string | yes | Name for the ServiceNow integration |
| `instanceName` | string | yes | ServiceNow instance name |
| `username` | string | yes | ServiceNow username |
| `password` | string | yes | ServiceNow password |
| `sourceInstance` | string | yes | ServiceNow source instance |
| `severities` | string[] | yes | Event severities to include (e.g., ["alert", "warning", "anomaly"]) |

## `get_metrics`

Query Bluematador metrics. Returns one line per series with the last, min, max (and when it happened), and average values, highest max first. Pass include\_points for the raw time series.

Read-only.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `metrics` | string[] | yes | Metric names to query (e.g., ["aws.ec2.cpu\_utilization.percent"]) |
| `agg` | string | yes | Aggregation function (e.g., "avg", "max", "min", "sum") |
| `start` | string | yes | Start time in ISO 8601 format |
| `end` | string | yes | End time in ISO 8601 format |
| `groups` | string[] | no | Label dimensions to split the series by. Labels differ per metric (e.g., ["instance\_id"] for aws.ec2.cpu\_utilization.percent). An unknown label returns no series. Optional. |
| `include_points` | boolean | no | Also return every raw [timestamp, value] point. Off by default; the summary per series is usually enough. |

## `get_mute_monitors`

Get available monitors for mute rules

Read-only.

No parameters.

## `get_mute_resources`

Get available resources for mute rules with pagination

Read-only.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | number | no | Page number for pagination (optional) |
| `pageSize` | number | no | Number of resources per page (optional) |

## `delete_mute_rule`

Delete a mute rule

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `muteId` | string | yes | Mute rule ID to delete |

## `mute_monitors_by_service`

Mute monitors for specific services (e.g., SQS, RDS, EC2) by creating a targeted mute rule

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `serviceName` | string | yes | Service name (e.g., "sqs", "rds", "ec2", "lambda") |
| `monitorNames` | string[] | no | Specific monitor names to mute (optional - if not provided, all monitors for the service will be retrieved and muted) |
| `hide` | boolean | no | If true, hide events completely. If false, show but mute them. |
| `projects` | string[] | no | Project IDs to apply mute rule to (optional) |
| `regions` | string[] | no | AWS/Azure regions to apply mute rule to (optional) |
| `schedule` | object | no | Schedule for when the mute rule is active (optional). If omitted, the rule is always active. |

## `mute_resources_by_wildcard`

Mute monitors for resources using wildcard patterns (e.g., "sqs-\*", "\*-prod", "app-\*-db")

Destructive. Clients should ask before running it.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `resourcePattern` | string | yes | Wildcard pattern to match resource names/ARNs (e.g., "sqs-\*", "\*-prod", "app-\*-db"). Use \* for any characters. |
| `serviceType` | string | no | Filter by service type (optional, e.g., "sqs", "rds", "ec2", "lambda") |
| `hide` | boolean | no | If true, hide events completely. If false, show but mute them. |
| `projects` | string[] | no | Project IDs to apply mute rule to (optional) |
| `regions` | string[] | no | AWS/Azure regions to apply mute rule to (optional) |
| `schedule` | object | no | Schedule for when the mute rule is active (optional). If omitted, the rule is always active. |
