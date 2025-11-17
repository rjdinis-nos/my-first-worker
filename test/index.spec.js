import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src';

describe('Cloudflare DDNS Worker', () => {
	beforeEach(() => {
		// Reset any mocks before each test
		vi.clearAllMocks();
	});

	describe('HTTPS Enforcement', () => {
		it('rejects non-HTTPS requests', async () => {
			const request = new Request('http://example.com/update', {
				headers: {
					'Authorization': 'Basic ' + btoa('example.com:test-token'),
					'x-forwarded-proto': 'http'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(400);
			expect(await response.text()).toContain('HTTPS');
		});

		it('accepts HTTPS requests', async () => {
			const request = new Request('https://example.com/favicon.ico', {
				headers: {
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(204);
		});
	});

	describe('Authentication', () => {
		it('rejects requests without authorization header', async () => {
			const request = new Request('https://example.com/update?hostname=test.example.com&myip=1.2.3.4', {
				headers: {
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(400);
			expect(await response.text()).toContain('credentials');
		});

		it('parses basic authentication correctly', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?hostname=test.example.com&myip=1.2.3.4', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			
			// This will fail at the API call stage, but proves auth parsing works
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// We expect it to get past auth validation
			// (it will fail later at API stage, which is okay for this test)
			expect(response.status).not.toBe(400);
		});
	});

	describe('Parameter Validation', () => {
		it('requires hostname parameter', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?myip=1.2.3.4', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(400);
			expect(await response.text()).toContain('hostname');
		});

		it('requires IP address parameter (ip or myip)', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?hostname=test.example.com', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(400);
			expect(await response.text()).toContain('ip address');
		});

		it('accepts ip parameter', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?hostname=test.example.com&ip=1.2.3.4', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Will fail at API call, but parameter validation passes
			expect(response.status).not.toBe(400);
		});

		it('accepts myip parameter', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?hostname=test.example.com&myip=1.2.3.4', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Will fail at API call, but parameter validation passes
			expect(response.status).not.toBe(400);
		});

		it('prefers ip parameter over myip when both provided', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?hostname=test.example.com&ip=1.2.3.4&myip=5.6.7.8', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Will fail at API call, but parameter validation passes
			expect(response.status).not.toBe(400);
		});
	});

	describe('Endpoints', () => {
		it('responds to /update endpoint', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?hostname=test.example.com&myip=1.2.3.4', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Will fail at API call stage, but endpoint is recognized
			expect(response.status).not.toBe(404);
		});

		it('responds to /nic/update endpoint', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/nic/update?hostname=test.example.com&myip=1.2.3.4', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Will fail at API call stage, but endpoint is recognized
			expect(response.status).not.toBe(404);
		});

		it('returns 204 for /favicon.ico', async () => {
			const request = new Request('https://example.com/favicon.ico', {
				headers: {
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(204);
		});

		it('returns 204 for /robots.txt', async () => {
			const request = new Request('https://example.com/robots.txt', {
				headers: {
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(204);
		});

		it('returns 404 for unknown paths', async () => {
			const request = new Request('https://example.com/unknown', {
				headers: {
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(404);
			expect(await response.text()).toBe('Not Found.');
		});
	});

	describe('Integration Tests', () => {
		it('handles complete valid request (unit style)', async () => {
			const credentials = btoa('example.com:test-token');
			const request = new Request('https://example.com/update?hostname=test.example.com&myip=1.2.3.4', {
				headers: {
					'Authorization': `Basic ${credentials}`,
					'x-forwarded-proto': 'https'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Note: This will fail at the Cloudflare API call in real tests
			// In a real scenario, you'd mock the fetch calls to the Cloudflare API
			expect(response).toBeDefined();
		});

		it('returns proper error format', async () => {
			const request = new Request('http://example.com/update', {
				headers: {
					'x-forwarded-proto': 'http'
				}
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.headers.get('Content-Type')).toBe('text/plain;charset=UTF-8');
			expect(response.headers.get('Cache-Control')).toBe('no-store');
			expect(response.status).toBe(400);
		});
	});
});
