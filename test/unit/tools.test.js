import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { BluematadorMCPServer } from '../../dist/index-stdio.js';

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

  assert.match(result.content[0].text, /Missing Bluematador credentials: BLUEMATADOR_API_KEY, BLUEMATADOR_ACCOUNT_ID/);
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
  assert.match(text, /184\.72/);
  assert.match(text, /No data returned for: aws\.sqs\.number_of_messages_sent\.count, aws\.sqs\.not_a_metric\./);
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
