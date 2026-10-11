import axios from 'axios';
import { AIProviderService } from './ai-provider.service';

jest.mock('axios');
const post = axios.post as jest.Mock;
const config = (values: Record<string, string> = {}) => ({
  get: (key: string, fallback?: string) => values[key] ?? fallback,
});

describe('Free AI provider boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (axios.isAxiosError as unknown as jest.Mock).mockImplementation(error => !!error?.isAxiosError);
  });

  it('reports disabled when AI_TEACHER_ENABLED is explicitly false', async () => {
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'false' }) as any);
    expect(service.status().configured).toBe(false);
    await expect(service.generate('draft', 'Instructions', {}, {})).rejects.toThrow('server configuration');
    expect(post).not.toHaveBeenCalled();
  });

  it('works out-of-the-box with FreeAI without requiring any paid OpenAI key', async () => {
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true' }) as any);
    const status = service.status();
    expect(status.configured).toBe(true);
    expect(status.provider).toBe('FreeAI');
    expect(status.model).toBe('free-smart-engine');
    expect(JSON.stringify(status)).not.toContain('sk-');
  });

  it('generates high quality student remarks without paid API keys', async () => {
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true' }) as any);
    const result = await service.generate('student_remarks', 'Instructions', {
      language: 'English',
      students: [{ key: 'S1', average: 85, attendanceRate: 95, recordedAttendanceDays: 30, subjectPerformance: [{ subject: 'Math', percentage: 90 }] }],
    }, {}) as any;
    expect(result.remarks).toBeDefined();
    expect(result.remarks.length).toBe(1);
    expect(result.remarks[0].key).toBe('S1');
    expect(result.remarks[0].text.length).toBeGreaterThan(40);
    expect(result.remarks[0].evidence).toContain('Term average: 85%.');
  });

  it('generates 10 questions for question paper without paid API keys', async () => {
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true' }) as any);
    const result = await service.generate('question_paper', 'Instructions', {
      subject: 'Science',
      chapter: 'Photosynthesis',
      sourceText: 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.',
      questionType: 'MCQ',
    }, {}) as any;
    expect(result.questions).toBeDefined();
    expect(result.questions.length).toBe(10);
    expect(result.questions[0].options.length).toBe(4);
    expect(result.questions[0].options).toContain(result.questions[0].answer);
  });

  it('generates early warning risk review without paid API keys', async () => {
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true' }) as any);
    const result = await service.generate('early_warning_review', 'Instructions', {
      students: [{ key: 'S1', latestAverage: 75, trendProjection: 55, academic: { score: 80 } }],
    }, {}) as any;
    expect(result.students).toBeDefined();
    expect(result.students.length).toBe(1);
    expect(result.students[0].priority).toBe('HIGH');
    expect(result.students[0].reasons.length).toBeGreaterThan(0);
    expect(result.students[0].supportPlan.length).toBeGreaterThan(0);
  });

  it('routes to Gemini when GEMINI_API_KEY is configured', async () => {
    post.mockResolvedValue({
      data: {
        candidates: [{ content: { parts: [{ text: JSON.stringify({ remarks: [{ key: 'S1', text: 'Good progress.', evidence: [] }] }) }] } }],
      },
    });
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true', GEMINI_API_KEY: 'test-gemini-free-key' }) as any);
    expect(service.status().provider).toBe('Gemini');
    const result = await service.generate('student_remarks', 'Instructions', { students: [{ key: 'S1' }] }, {}) as any;
    expect(result.remarks[0].key).toBe('S1');
    expect(post).toHaveBeenCalled();
    const [url] = post.mock.calls[0];
    expect(url).toContain('googleapis.com');
  });

  it('routes to Groq when GROQ_API_KEY is configured', async () => {
    post.mockResolvedValue({
      data: {
        choices: [{ message: { content: JSON.stringify({ remarks: [{ key: 'S1', text: 'Solid work.', evidence: [] }] }) } }],
      },
    });
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true', GROQ_API_KEY: 'gsk_test' }) as any);
    expect(service.status().provider).toBe('Groq');
    const result = await service.generate('student_remarks', 'Instructions', { students: [{ key: 'S1' }] }, {}) as any;
    expect(result.remarks[0].key).toBe('S1');
    expect(post).toHaveBeenCalled();
    const [url] = post.mock.calls[0];
    expect(url).toContain('api.groq.com');
  });

  it('falls back to smart generator gracefully when remote call fails', async () => {
    post.mockRejectedValue(new Error('Network error'));
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true', AI_PROVIDER: 'pollinations' }) as any);
    const result = await service.generate('student_remarks', 'Instructions', {
      students: [{ key: 'S1', average: 70 }],
    }, {}) as any;
    expect(result.remarks[0].key).toBe('S1');
  });

  it('handles OpenAI upstream errors securely if OpenAI is explicitly selected', async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { status: 401, data: { secret: 'secret_key' } } });
    const service = new AIProviderService(config({ AI_TEACHER_ENABLED: 'true', AI_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-test' }) as any);
    try {
      await service.generate('student_remarks', 'Instructions', {}, {});
      throw new Error('Expected failure');
    } catch (error: any) {
      expect(error.message).not.toContain('secret_key');
      expect(error.getStatus()).toBe(503);
    }
  });
});
