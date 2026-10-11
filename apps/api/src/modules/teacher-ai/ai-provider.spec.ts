import axios from 'axios';
import { AIProviderService } from './ai-provider.service';
import { objectSchema, stringSchema } from './ai-output';

jest.mock('axios');
const post = axios.post as jest.Mock;
const config = (values: Record<string, string> = { AI_TEACHER_ENABLED: 'true', OPENAI_API_KEY: 'sk-test-not-a-real-key' }) => ({ get: (key: string, fallback?: string) => values[key] ?? fallback });
const complete = (value: unknown) => ({ data: { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] } });
describe('real AI provider boundary', () => {
  beforeEach(() => { jest.clearAllMocks(); (axios.isAxiosError as unknown as jest.Mock).mockImplementation(error => !!error?.isAxiosError); });
  it('never falls back to canned generation when disabled or without credentials', async () => {
    const service = new AIProviderService(config({}) as any);
    expect(service.status().configured).toBe(false);
    await expect(service.generate('draft', 'Instructions', {}, {})).rejects.toThrow('server configuration'); expect(post).not.toHaveBeenCalled();
  });
  it('uses Responses structured output, disables stored responses and keeps credentials server-side', async () => {
    post.mockResolvedValue(complete({ text: 'A generated draft' }));
    const service = new AIProviderService(config() as any);
    expect(await service.generate('draft', 'Instructions', { evidence: 0 }, objectSchema({ text: stringSchema }))).toEqual({ text: 'A generated draft' });
    const [url, body, options] = post.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/responses'); expect(body.store).toBe(false);
    expect(body.text.format).toMatchObject({ type: 'json_schema', strict: true });
    expect(body.instructions).toContain('untrusted source material'); expect(options.timeout).toBe(60000);
    expect(JSON.stringify(service.status())).not.toContain('sk-test');
  });
  it.each([
    { status: 'incomplete', output: [] },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }] },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'malformed' }] }] },
  ])('rejects incomplete, refused or malformed generation', async response => {
    post.mockResolvedValue({ data: response });
    await expect(new AIProviderService(config() as any).generate('draft', 'Instructions', {}, {})).rejects.toThrow();
  });
  it.each([401, 429, 500])('returns a safe actionable error for upstream status %s without provider details', async status => {
    post.mockRejectedValue({ isAxiosError: true, response: { status, data: { secret: 'sk-never-expose', student: 'PRIVATE STUDENT' } } });
    try { await new AIProviderService(config() as any).generate('draft', 'Instructions', {}, {}); throw new Error('Expected generation failure'); }
    catch (error: any) { expect(error.message).not.toMatch(/sk-never-expose|PRIVATE STUDENT/); expect(error.getStatus()).toBe(status === 500 ? 502 : 503); }
  });
});
