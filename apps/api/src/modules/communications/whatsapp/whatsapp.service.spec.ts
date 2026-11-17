import { WhatsAppService } from './whatsapp.service';

const makeConfig = (values: Record<string, string> = {}) => ({
  get: (key: string, fallback?: string) => values[key] ?? fallback,
});

describe('WhatsAppService Multi-Provider Gateway', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('defaults to Zero-Cost WHATSAPP_WEB mode when no paid API credentials are configured', () => {
    const service = new WhatsAppService(makeConfig({}) as any);
    const status = service.getGatewayStatus();

    expect(status.activeProvider).toBe('WHATSAPP_WEB');
    expect(status.available).toBe(true);
    expect(status.liveGatewayConfigured).toBe(false);
    expect(status.playschoolWebModeAvailable).toBe(true);
    expect(status.configuredProviders).toContain('WHATSAPP_WEB');
  });

  it('generates clean wa.me and web.whatsapp.com links with encoded Malayalam text for play-schools', async () => {
    const service = new WhatsAppService(makeConfig({}) as any);
    const result = await service.sendMessage({
      to: '09847034567',
      body: 'പ്രിയ രക്ഷിതാവേ, ഫീസ് ഓർമ്മപ്പെടുത്തൽ',
    });

    expect(result).not.toBeNull();
    expect(result?.provider).toBe('WHATSAPP_WEB');
    expect(result?.status).toBe('ready_to_open');
    expect(result?.waLink?.phone).toBe('+919847034567');
    expect(result?.waLink?.waMeUrl).toContain('https://wa.me/919847034567?text=');
    expect(result?.waLink?.webWhatsAppUrl).toContain(
      'https://web.whatsapp.com/send?phone=919847034567&text=',
    );
  });

  it('dispatches live text messages via Meta WhatsApp Cloud API when configured', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.HBgMOTE5ODQ3MDM0NTY3' }],
      }),
    });
    global.fetch = mockFetch as any;

    const service = new WhatsAppService(
      makeConfig({
        WHATSAPP_PROVIDER: 'META_CLOUD_API',
        META_WHATSAPP_ACCESS_TOKEN: 'EAAG_TEST_TOKEN',
        META_WHATSAPP_PHONE_NUMBER_ID: '104829104920192',
        META_WHATSAPP_API_VERSION: 'v19.0',
      }) as any,
    );

    const status = service.getGatewayStatus();
    expect(status.activeProvider).toBe('META_CLOUD_API');
    expect(status.liveGatewayConfigured).toBe(true);

    const result = await service.sendMessage({
      to: '+919847034567',
      body: 'School fee reminder for Aarav Menon',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v19.0/104829104920192/messages');
    expect(init.headers.Authorization).toBe('Bearer EAAG_TEST_TOKEN');
    const parsedBody = JSON.parse(init.body);
    expect(parsedBody.to).toBe('919847034567');
    expect(parsedBody.type).toBe('text');

    expect(result?.provider).toBe('META_CLOUD_API');
    expect(result?.sid).toBe('wamid.HBgMOTE5ODQ3MDM0NTY3');
    expect(result?.status).toBe('sent');
  });

  it('dispatches live messages via Gupshup Enterprise API when configured', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'submitted',
        messageId: 'gs_msg_99123',
      }),
    });
    global.fetch = mockFetch as any;

    const service = new WhatsAppService(
      makeConfig({
        WHATSAPP_PROVIDER: 'GUPSHUP',
        GUPSHUP_API_KEY: 'gs_test_key',
        GUPSHUP_APP_NAME: 'KryptonSchoolApp',
        GUPSHUP_SOURCE_NUMBER: '919847000111',
      }) as any,
    );

    const result = await service.sendMessage({
      to: '+919847034567',
      body: 'Attendance alert for Diya Krishnan',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.gupshup.io/wa/api/v1/msg');
    expect(init.headers.apikey).toBe('gs_test_key');
    expect(init.body).toContain('destination=919847034567');
    expect(init.body).toContain('src.name=KryptonSchoolApp');

    expect(result?.provider).toBe('GUPSHUP');
    expect(result?.sid).toBe('gs_msg_99123');
    expect(result?.status).toBe('submitted');
  });

  it('verifies Meta Cloud API webhook token challenge', () => {
    const service = new WhatsAppService(
      makeConfig({
        META_WHATSAPP_VERIFY_TOKEN: 'my_secret_verify_token',
      }) as any,
    );

    expect(
      service.verifyMetaWebhook('subscribe', 'my_secret_verify_token', 'challenge_123'),
    ).toBe('challenge_123');
    expect(
      service.verifyMetaWebhook('subscribe', 'wrong_token', 'challenge_123'),
    ).toBeNull();
  });
});
