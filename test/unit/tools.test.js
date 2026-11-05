import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { BluematadorMCPServer } from '../../dist/index-stdio.js';
import { renderToolReference } from '../../scripts/generate-tool-reference.mjs';

const API_KEY = 'test-api-key';
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

async function startApiStub(routes) {
  const requests = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://stub');
    requests.push({ method: req.method, url, headers: req.headers });
    const body = routes[`${req.method} ${url.pathname}`];
    res.writeHead(body === undefined ? 404 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body ?? { message: 'not found' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function connectClient(t, server) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  t.after(() => client.close());
  return client;
}

test('lists the tools the server registers', async (t) => {
  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, 'http://127.0.0.1:1'));
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);

  assert.ok(names.includes('get_active_events'));
  assert.ok(names.includes('get_metrics'));
  assert.ok(names.includes('create_mute_rule'));
});

test('annotates every tool with hints that match its verb', async (t) => {
  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, 'http://127.0.0.1:1'));
  const { tools } = await client.listTools();
  const hints = Object.fromEntries(tools.map((tool) => [tool.name, tool.annotations]));

  for (const [name, annotations] of Object.entries(hints)) {
    assert.ok(annotations, `${name} has annotations`);
    assert.equal(annotations.openWorldHint, true, `${name} openWorldHint`);
  }
  assert.deepEqual(hints.get_active_events, { readOnlyHint: true, openWorldHint: true });
  assert.deepEqual(hints.list_mute_rules, { readOnlyHint: true, openWorldHint: true });
  assert.equal(hints.delete_mute_rule.destructiveHint, true);
  assert.equal(hints.delete_integration.destructiveHint, true);
  assert.equal(hints.create_aws_integration.destructiveHint, false);
  assert.equal(hints.enable_notification.destructiveHint, false);
  assert.equal(hints.disable_notification.idempotentHint, true);
  assert.equal(hints.update_email_notification.destructiveHint, true);
  for (const name of ['create_mute_rule', 'mute_monitors_by_service', 'mute_resources_by_wildcard', 'disable_notification', 'disable_integration']) {
    assert.equal(hints[name].destructiveHint, true, `${name} silences alerts, so it needs a confirmation`);
  }
  for (const [name, annotations] of Object.entries(hints)) {
    if (!/^(get|list)_/.test(name)) assert.equal(annotations.readOnlyHint, false, `${name} writes`);
  }
});

test('docs/API-REFERENCE.md matches the tools the server lists', async (t) => {
  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, 'http://127.0.0.1:1'));
  const { tools } = await client.listTools();
  const committed = readFileSync(new URL('../../docs/API-REFERENCE.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

  assert.equal(committed, renderToolReference(tools), 'run npm run docs and commit the result');
});

test('get_active_events calls the API with the account key and renders each event', async (t) => {
  const api = await startApiStub({
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [
      {
        id: 'event-1',
        accountId: ACCOUNT_ID,
        opened: '2026-11-01T05:00:00Z',
        eventType: 'aws.sqs.queue.depth',
        typeText: 'High Queue Depth',
        summaryText: 'orders-queue has 12000 visible messages',
        detailTexts: [],
        severity: 'alert',
        source: {
          label: 'orders-queue',
          text: 'orders-queue',
          tags: [],
          ref: { arn: 'arn:aws:sqs:us-east-1:123456789012:orders-queue', refType: 'aws.sqs.queue' },
        },
        links: [],
        projects: [],
      },
    ],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'get_active_events', arguments: {} });
  const text = result.content[0].text;

  assert.equal(api.requests.length, 1);
  assert.equal(api.requests[0].headers.authorization, API_KEY);
  assert.match(text, /High Queue Depth/);
  assert.match(text, /orders-queue has 12000 visible messages/);
  assert.match(text, /arn:aws:sqs:us-east-1:123456789012:orders-queue/);
  assert.match(text, /event-1/);
});

test('get_active_events forwards the project filter as a query parameter', async (t) => {
  const api = await startApiStub({ [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [] });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'get_active_events', arguments: { project: 'project-1' } });

  assert.equal(api.requests[0].url.searchParams.get('project'), 'project-1');
  assert.equal(result.content[0].text, 'No active events found for project project-1.');
});

test('tool calls report missing credentials instead of calling the API', async (t) => {
  const saved = { key: process.env.BLUEMATADOR_API_KEY, account: process.env.BLUEMATADOR_ACCOUNT_ID };
  delete process.env.BLUEMATADOR_API_KEY;
  delete process.env.BLUEMATADOR_ACCOUNT_ID;
  t.after(() => {
    if (saved.key !== undefined) process.env.BLUEMATADOR_API_KEY = saved.key;
    if (saved.account !== undefined) process.env.BLUEMATADOR_ACCOUNT_ID = saved.account;
  });

  const client = await connectClient(t, new BluematadorMCPServer());
  const result = await client.callTool({ name: 'get_active_events', arguments: {} });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Missing Bluematador credentials: BLUEMATADOR_API_KEY, BLUEMATADOR_ACCOUNT_ID/);
});

test('API failures come back as tool results the model can read', async (t) => {
  const api = await startApiStub({});
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'list_projects', arguments: {} });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Resource not found/);
  assert.match(result.content[0].text, /HTTP Status:\*\* 404/);
});

test('parameter errors from a tool come back as tool results too', async (t) => {
  const api = await startApiStub({ [`GET /ma/accounts/${ACCOUNT_ID}/mutes/options/monitors`]: { monitors: { SQS: ['queue.depth.high'] } } });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'mute_monitors_by_service', arguments: { serviceName: 'kafka' } });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Service "kafka" not found\. Available services: SQS/);
});

test('unknown tools are still protocol errors', async (t) => {
  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, 'http://127.0.0.1:1'));
  await assert.rejects(client.callTool({ name: 'no_such_tool', arguments: {} }), /Unknown tool: no_such_tool/);
});

test('get_metrics queries metrics v2 with repeated parameters and names metrics without series', async (t) => {
  const api = await startApiStub({
    [`GET /me/api/accounts/${ACCOUNT_ID}/metrics/v2`]: [
      {
        metric: 'aws.sqs.average_message_size.bytes',
        numerator: { unit: 'byte', unitShort: 'B' },
        denominator: { unit: '', unitShort: '' },
        groupedBy: ['arn', 'region'],
        series: [
          {
            group: { arn: 'arn:aws:sqs:us-east-1:123456789012:orders-queue', region: 'us-east-1' },
            points: [['2026-11-01T05:00:00Z', 184.73], ['2026-11-01T05:05:00Z', 184.72]],
          },
        ],
      },
      {
        metric: 'aws.sqs.number_of_messages_sent.count',
        numerator: { unit: 'count', unitShort: '' },
        denominator: { unit: '', unitShort: '' },
        groupedBy: ['arn', 'region'],
        series: [],
      },
    ],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({
    name: 'get_metrics',
    arguments: {
      metrics: ['aws.sqs.average_message_size.bytes', 'aws.sqs.number_of_messages_sent.count', 'aws.sqs.not_a_metric'],
      agg: 'avg',
      start: '2026-11-01T05:00:00.000Z',
      end: '2026-11-01T06:00:00.000Z',
      groups: ['arn', 'region'],
    },
  });
  const { url } = api.requests[0];
  const text = result.content[0].text;

  assert.equal(url.pathname, `/me/api/accounts/${ACCOUNT_ID}/metrics/v2`);
  assert.deepEqual(url.searchParams.getAll('metrics'), [
    'aws.sqs.average_message_size.bytes',
    'aws.sqs.number_of_messages_sent.count',
    'aws.sqs.not_a_metric',
  ]);
  assert.deepEqual(url.searchParams.getAll('groups'), ['arn', 'region']);
  assert.equal(url.searchParams.get('agg'), 'avg');
  assert.match(text, /aws\.sqs\.average_message_size\.bytes \(B, avg\): 1 series/);
  assert.match(text, /arn=arn:aws:sqs:us-east-1:123456789012:orders-queue, region=us-east-1: last 184\.72, min 184\.72, max 184\.73 at 2026-11-01T05:00:00Z, avg 184\.72 \(2 points\)/);
  assert.doesNotMatch(text, /"points"/);
  assert.match(text, /No data returned for: aws\.sqs\.number_of_messages_sent\.count, aws\.sqs\.not_a_metric\./);
});

test('get_metrics returns raw points only when include_points is set', async (t) => {
  const api = await startApiStub({
    [`GET /me/api/accounts/${ACCOUNT_ID}/metrics/v2`]: [
      {
        metric: 'aws.ec2.cpu_utilization.percent',
        numerator: { unit: 'percent', unitShort: '%' },
        denominator: { unit: '', unitShort: '' },
        groupedBy: ['instance_id'],
        series: [
          { group: { instance_id: 'i-quiet' }, points: [['2026-11-01T05:00:00Z', 1], ['2026-11-01T05:05:00Z', 3]] },
          { group: { instance_id: 'i-busy' }, points: [['2026-11-01T05:00:00Z', 90], ['2026-11-01T05:05:00Z', 40]] },
        ],
      },
    ],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const args = { metrics: ['aws.ec2.cpu_utilization.percent'], agg: 'max', start: '2026-11-01T05:00:00Z', end: '2026-11-01T06:00:00Z', groups: ['instance_id'] };
  const compact = (await client.callTool({ name: 'get_metrics', arguments: args })).content[0].text;
  const full = (await client.callTool({ name: 'get_metrics', arguments: { ...args, include_points: true } })).content[0].text;

  assert.ok(compact.indexOf('i-busy') < compact.indexOf('i-quiet'), 'highest max first');
  assert.match(compact, /instance_id=i-busy: last 40, min 40, max 90 at 2026-11-01T05:00:00Z, avg 65 \(2 points\)/);
  assert.doesNotMatch(compact, /"points"/);
  assert.match(full, /"points"/);
});

test('get_metrics skips null points and keeps small values readable', async (t) => {
  const api = await startApiStub({
    [`GET /me/api/accounts/${ACCOUNT_ID}/metrics/v2`]: [
      {
        metric: 'aws.sqs.errors.rate',
        numerator: { unit: 'count', unitShort: '' },
        denominator: { unit: 'second', unitShort: 's' },
        groupedBy: [],
        series: [{ points: [['2026-11-01T05:00:00Z', null], ['2026-11-01T05:05:00Z', 0.004], ['2026-11-01T05:10:00Z', 0.002]] }],
      },
    ],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const text = (await client.callTool({
    name: 'get_metrics',
    arguments: { metrics: ['aws.sqs.errors.rate'], agg: 'avg', start: '2026-11-01T05:00:00Z', end: '2026-11-01T06:00:00Z' },
  })).content[0].text;

  assert.match(text, /aws\.sqs\.errors\.rate \(count\/s, avg\): 1 series/);
  assert.match(text, /- all: last 0\.002, min 0\.002, max 0\.004 at 2026-11-01T05:05:00Z, avg 0\.003 \(2 points\)/);
});

test('get_metrics treats null-only series as no data and caps long lists', async (t) => {
  const series = Array.from({ length: 30 }, (_, i) => ({ group: { instance_id: `i-${String(i).padStart(2, '0')}` }, points: [['2026-11-01T05:00:00Z', i]] }));
  const unit = { numerator: { unit: 'percent', unitShort: '%' }, denominator: { unit: '', unitShort: '' } };
  const api = await startApiStub({
    [`GET /me/api/accounts/${ACCOUNT_ID}/metrics/v2`]: [
      { metric: 'aws.ec2.cpu_utilization.percent', ...unit, groupedBy: ['instance_id'], series },
      { metric: 'aws.ec2.status_check_failed.count', ...unit, groupedBy: ['instance_id'], series: [{ group: { instance_id: 'i-x' }, points: [['2026-11-01T05:00:00Z', null]] }] },
    ],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const text = (await client.callTool({
    name: 'get_metrics',
    arguments: { metrics: ['aws.ec2.cpu_utilization.percent', 'aws.ec2.status_check_failed.count'], agg: 'avg', start: '2026-11-01T05:00:00Z', end: '2026-11-01T06:00:00Z', groups: ['instance_id'] },
  })).content[0].text;

  assert.match(text, /30 series, highest max first/);
  assert.match(text, /instance_id=i-29: last 29/);
  assert.doesNotMatch(text, /instance_id=i-04:/);
  assert.match(text, /5 more series not shown/);
  assert.match(text, /No data returned for: aws\.ec2\.status_check_failed\.count\./);
});

test('get_active_events_summary lists totals and only the days with events', async (t) => {
  const zeroDays = Object.fromEntries(Array.from({ length: 28 }, (_, i) => [`2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z`, 0]));
  const counts = {
    alert: { ...zeroDays },
    warning: { ...zeroDays, '2026-10-19T00:00:00Z': 1, '2026-10-27T00:00:00Z': 2 },
    anomaly: { ...zeroDays, '2026-10-19T00:00:00Z': 48 },
  };
  const api = await startApiStub({ [`GET /ma/api/accounts/${ACCOUNT_ID}/counts`]: { opened: counts, active: counts } });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const text = (await client.callTool({ name: 'get_active_events_summary', arguments: {} })).content[0].text;

  assert.match(text, /Opened: alert 0, warning 3, anomaly 48/);
  assert.match(text, /warning: 2026-10-19 1, 2026-10-27 2/);
  assert.match(text, /anomaly: 2026-10-19 48/);
  assert.doesNotMatch(text, /2026-10-01/);
  assert.ok(text.split('\n').length < 15, 'stays short');
});

test('get_event_context returns the event, its resource, related events, and mute rules', async (t) => {
  const arn = 'arn:aws:rds:us-east-1:123456789012:db:volt-prd-0';
  const event = (id, opened, extra = {}) => ({
    id,
    accountId: ACCOUNT_ID,
    opened,
    eventType: 'rds_cpu',
    typeText: 'High RDS CPU',
    summaryText: `CPU high on volt-prd-0 (${id})`,
    detailTexts: ['CPU utilization above 90% for 15 minutes'],
    severity: 'warning',
    source: { label: 'volt-prd-0', text: 'volt-prd-0', tags: [{ key: 'env', value: 'prd' }], ref: { arn, refType: 'aws_arn' } },
    links: [{ linkType: 'console', text: 'AWS console', url: 'https://console.aws.amazon.com/rds', created: opened }],
    projects: [],
    muted: false,
    hidden: false,
    ...extra,
  });
  const api = await startApiStub({
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [event('event-now', '2026-11-04T05:00:00Z')],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events`]: [
      event('event-now', '2026-11-04T05:00:00Z'),
      event('event-earlier', '2026-11-02T05:00:00Z', { closed: '2026-11-02T06:00:00Z' }),
      event('event-other', '2026-11-03T05:00:00Z', { source: { label: 'other', text: 'other', tags: [], ref: { arn: 'arn:aws:rds:other', refType: 'aws_arn' } } }),
    ],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/mutes`]: [
      { id: 'mute-match', hide: false, active: true, resource: { arn, refType: 'aws_arn' } },
      { id: 'mute-other', hide: false, active: true, resource: { arn: 'arn:aws:rds:other', refType: 'aws_arn' } },
    ],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'get_event_context', arguments: { event_id: 'event-now', days: 3 } });
  const text = result.content[0].text;
  const opened = api.requests.find((request) => request.url.pathname.endsWith('/events'));

  assert.notEqual(result.isError, true);
  assert.match(text, /High RDS CPU \(warning\)/);
  assert.match(text, new RegExp(`ARN: ${arn}`));
  assert.match(text, /Tags: env=prd/);
  assert.match(text, /CPU utilization above 90% for 15 minutes/);
  assert.match(text, /1 other event on this resource in the last 3 days/);
  assert.match(text, /By type: High RDS CPU 1/);
  assert.match(text, /event-earlier/);
  assert.doesNotMatch(text, /event-other/);
  assert.match(text, /mute-match/);
  assert.doesNotMatch(text, /mute-other/);
  assert.ok(opened.url.searchParams.get('start'), 'queries opened events with a start time');
});

test('get_event_context reports an unknown event as a tool error', async (t) => {
  const api = await startApiStub({
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events`]: [],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/mutes`]: [],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'get_event_context', arguments: { event_id: 'missing' } });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /No event with ID missing was active or opened in the last 7 days/);
});

test('get_event_context handles events without a resource and rejects bad days', async (t) => {
  const bare = { id: 'event-bare', accountId: ACCOUNT_ID, opened: '2026-11-04T05:00:00Z', eventType: 'x', typeText: 'Odd event', summaryText: 'no source', detailTexts: [], severity: 'anomaly', links: [], projects: [], muted: true, hidden: false };
  const api = await startApiStub({
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [bare],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events`]: [bare],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/mutes`]: [{ id: 'mute-project', hide: false, active: true, projects: ['p1'] }],
  });
  t.after(api.close);

  const client = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, api.baseUrl));
  const result = await client.callTool({ name: 'get_event_context', arguments: { event_id: 'event-bare' } });
  const text = result.content[0].text;

  assert.notEqual(result.isError, true);
  assert.match(text, /ARN: none/);
  assert.match(text, /Related events were not checked: the event has no resource ARN/);
  assert.match(text, /Mute rules were not checked: the event has no resource ARN/);
  assert.match(text, /Muted by Bluematador: yes/);
  const missingId = await client.callTool({ name: 'get_event_context', arguments: {} });
  assert.equal(missingId.isError, true);
  assert.match(missingId.content[0].text, /event_id is required/);

  for (const days of [0, -1, 1.5, 1e10, 'abc']) {
    const bad = await client.callTool({ name: 'get_event_context', arguments: { event_id: 'event-bare', days } });
    assert.equal(bad.isError, true, `days=${days}`);
    assert.match(bad.content[0].text, /days must be a whole number from 1 to 90/);
  }
});

test('get_event_context keeps the event when the mute lookup fails and shows monitor scope', async (t) => {
  const arn = 'arn:aws:rds:us-east-1:123456789012:db:volt-prd-0';
  const event = { id: 'event-1', accountId: ACCOUNT_ID, opened: '2026-11-04T05:00:00Z', eventType: 'rds_cpu', typeText: 'High RDS CPU', summaryText: 'CPU high', severity: 'warning', source: { label: 'volt-prd-0', text: 'volt-prd-0', tags: [], ref: { arn, refType: 'aws_arn' } }, muted: false, hidden: false };
  const failingMutes = await startApiStub({
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [event],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events`]: [event],
  });
  t.after(failingMutes.close);
  const scopedMutes = await startApiStub({
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events/active`]: [event],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/events`]: [event],
    [`GET /ma/api/accounts/${ACCOUNT_ID}/mutes`]: [{ id: 'mute-cpu', hide: false, active: true, resource: { arn, refType: 'aws_arn' }, monitors: { RDS: ['rds_cpu'] } }],
  });
  t.after(scopedMutes.close);

  const failing = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, failingMutes.baseUrl));
  const degraded = await failing.callTool({ name: 'get_event_context', arguments: { event_id: 'event-1', days: '14' } });
  assert.notEqual(degraded.isError, true);
  assert.match(degraded.content[0].text, /High RDS CPU \(warning\)/);
  assert.match(degraded.content[0].text, /in the last 14 days/);
  assert.match(degraded.content[0].text, /Mute rules were not checked:/);

  const scoped = await connectClient(t, new BluematadorMCPServer(API_KEY, ACCOUNT_ID, scopedMutes.baseUrl));
  const text = (await scoped.callTool({ name: 'get_event_context', arguments: { event_id: 'event-1' } })).content[0].text;
  assert.match(text, /- mute-cpu: mutes only monitors RDS rds_cpu/);
});

test('serves protocol 2026-07-28 over stdio and still accepts the 2025 handshake', async (t) => {
  const api = await startApiStub({ [`GET /zi/api/accounts/${ACCOUNT_ID}/projects`]: [] });
  t.after(api.close);

  for (const [mode, expectedVersion] of [[{ pin: '2026-07-28' }, '2026-07-28'], ['legacy', '2025-11-25']]) {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL('../../dist/index.js', import.meta.url))],
      env: { BLUEMATADOR_API_KEY: API_KEY, BLUEMATADOR_ACCOUNT_ID: ACCOUNT_ID, BLUEMATADOR_BASE_URL: api.baseUrl },
      stderr: 'ignore',
    });
    const client = new Client({ name: 'test-client', version: '0.0.0' }, { versionNegotiation: { mode } });
    t.after(() => transport.close());
    await client.connect(transport);

    const { tools } = await client.listTools();
    assert.ok(tools.some((tool) => tool.name === 'list_projects'));
    await client.callTool({ name: 'list_projects', arguments: {} });
    assert.equal(api.requests.at(-1).url.pathname, `/zi/api/accounts/${ACCOUNT_ID}/projects`);
    assert.equal(client.getNegotiatedProtocolVersion(), expectedVersion);
  }
});

test('accepts the 2025 handshake after a 2026-07-28 discover probe', async (t) => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../../dist/index.js', import.meta.url))], {
    env: { ...process.env, BLUEMATADOR_API_KEY: API_KEY, BLUEMATADOR_ACCOUNT_ID: ACCOUNT_ID },
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  t.after(() => child.kill());
  const replies = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  const request = async (message) => {
    child.stdin.write(`${JSON.stringify(message)}\n`);
    return JSON.parse((await replies.next()).value);
  };

  const discover = await request({
    jsonrpc: '2.0',
    id: 'probe',
    method: 'server/discover',
    params: {
      _meta: {
        'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        'io.modelcontextprotocol/clientInfo': { name: 'test-client', version: '0.0.0' },
        'io.modelcontextprotocol/clientCapabilities': {},
      },
    },
  });
  const initialize = await request({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test-client', version: '0.0.0' } },
  });
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
  const list = await request({ jsonrpc: '2.0', id: 2, method: 'tools/list' });

  assert.deepEqual(discover.result.supportedVersions, ['2026-07-28']);
  assert.equal(initialize.error, undefined);
  assert.equal(initialize.result.protocolVersion, '2025-11-25');
  assert.ok(list.result.tools.some((tool) => tool.name === 'list_projects'));
});
