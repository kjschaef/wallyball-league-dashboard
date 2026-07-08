import { createChatCompletion } from '../modelClient';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  const mCreate = jest.fn();
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mCreate
        }
      }
    };
  });
});

describe('modelClient - createChatCompletion', () => {
  const originalEnv = process.env;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Get a reference to the mocked create function
    const client = new OpenAI({ apiKey: 'test' });
    mockCreate = client.chat.completions.create as jest.Mock;

    mockCreate.mockResolvedValue({
      id: 'mock-id',
      choices: [{ message: { content: 'mock-response' } }]
    });

    // Mock console.error to avoid polluting terminal on deliberate failure tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('uses default gpt-5-mini if no model provided and no env var', async () => {
    delete process.env.OPENAI_MODEL;

    await createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }]
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: 'hello' }]
    });
  });

  it('uses OPENAI_MODEL env var if no model provided', async () => {
    process.env.OPENAI_MODEL = 'gpt-4o';

    await createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }]
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'hello' }]
    });
  });

  it('uses explicitly provided model over env var', async () => {
    process.env.OPENAI_MODEL = 'gpt-4o';

    await createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'hello' }]
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'hello' }]
    });
  });

  it('passes through defined explicit options', async () => {
    await createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.7,
      max_completion_tokens: 100,
      response_format: { type: 'json_object' }
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.7,
      max_completion_tokens: 100,
      response_format: { type: 'json_object' }
    });
  });

  it('passes through arbitrary unknown options', async () => {
    await createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
      top_p: 0.9,
      frequency_penalty: 0.5,
      stream: true
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: 'hello' }],
      top_p: 0.9,
      frequency_penalty: 0.5,
      stream: true
    });
  });

  it('throws and logs error on API failure', async () => {
    const error = new Error('API failure');
    mockCreate.mockRejectedValueOnce(error);

    await expect(createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }]
    })).rejects.toThrow('API failure');

    expect(console.error).toHaveBeenCalledWith('Error in modelClient.createChatCompletion:', error);
  });
});
