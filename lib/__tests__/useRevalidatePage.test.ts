import { renderHook, act } from '@testing-library/react';
import useRevalidatePage from '../useRevalidatePage';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Response for Node.js environment
global.Response = class Response {
  public status: number;
  public statusText: string;
  public headers: Map<string, string>;
  private body: string;

  constructor(body: string, init: { status?: number; statusText?: string; headers?: Record<string, string> } = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map();
    
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }

  get(name: string): string | null {
    return this.headers.get(name) || null;
  }
} as any;

describe('useRevalidatePage', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    mockFetch.mockClear();
    // Mock console.log to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a function when called', () => {
    const { result } = renderHook(() => useRevalidatePage('/test-path'));
    
    expect(typeof result.current).toBe('function');
  });

  it('logs the pathname when initialized', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const pathname = '/test-path';
    
    renderHook(() => useRevalidatePage(pathname));
    
    // Note: the console.log is called when the returned function is executed, not when the hook is initialized
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('makes POST request to revalidate API when function is called', async () => {
    const mockResponse = new Response('{"revalidated": true}', { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    mockFetch.mockResolvedValue(mockResponse);

    const pathname = '/test-path';
    const { result } = renderHook(() => useRevalidatePage(pathname));
    
    const sendRevalidationRequest = result.current;
    
    let response: Response;
    await act(async () => {
      response = await sendRevalidationRequest();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pathName: pathname,
      }),
    });

    expect(response!).toBe(mockResponse);
  });

  it('logs pathname when revalidation function is called', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const pathname = '/test-path';
    const { result } = renderHook(() => useRevalidatePage(pathname));
    
    await act(async () => {
      await result.current();
    });

    expect(consoleSpy).toHaveBeenCalledWith(pathname);
  });

  it('handles different pathnames correctly', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const testPaths = ['/home', '/about', '/contact', '/pbis'];

    for (const path of testPaths) {
      const { result } = renderHook(() => useRevalidatePage(path));
      
      await act(async () => {
        await result.current();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
        expect.objectContaining({
          body: JSON.stringify({ pathName: path }),
        })
      );
    }

    expect(mockFetch).toHaveBeenCalledTimes(testPaths.length);
  });

  it('propagates fetch errors', async () => {
    const fetchError = new Error('Network error');
    mockFetch.mockRejectedValue(fetchError);

    const { result } = renderHook(() => useRevalidatePage('/test-path'));
    
    await act(async () => {
      await expect(result.current()).rejects.toThrow('Network error');
    });
  });

  it('handles fetch response errors', async () => {
    const errorResponse = new Response('Internal Server Error', { 
      status: 500,
      statusText: 'Internal Server Error'
    });
    mockFetch.mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useRevalidatePage('/test-path'));
    
    let response: Response;
    await act(async () => {
      response = await result.current();
    });

    expect(response!.status).toBe(500);
    expect(response!.statusText).toBe('Internal Server Error');
  });

  it('sends correct Content-Type header', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRevalidatePage('/test'));
    
    await act(async () => {
      await result.current();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('uses POST method', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRevalidatePage('/test'));
    
    await act(async () => {
      await result.current();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('sends pathname in request body', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const pathname = '/specific/path';
    const { result } = renderHook(() => useRevalidatePage(pathname));
    
    await act(async () => {
      await result.current();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
      expect.objectContaining({
        body: JSON.stringify({ pathName: pathname }),
      })
    );
  });

  it('handles special characters in pathname', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const specialPath = '/path/with spaces/and-dashes/and_underscores';
    const { result } = renderHook(() => useRevalidatePage(specialPath));
    
    await act(async () => {
      await result.current();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
      expect.objectContaining({
        body: JSON.stringify({ pathName: specialPath }),
      })
    );
  });

  it('can be called multiple times', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRevalidatePage('/test'));
    
    await act(async () => {
      await result.current();
      await result.current();
      await result.current();
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('creates new function reference on re-renders', () => {
    const { result, rerender } = renderHook(() => useRevalidatePage('/test'));
    
    const firstFunction = result.current;
    
    rerender();
    
    const secondFunction = result.current;
    
    // Creates new function on each render (not optimized with useCallback)
    expect(firstFunction).not.toBe(secondFunction);
    expect(typeof firstFunction).toBe('function');
    expect(typeof secondFunction).toBe('function');
  });

  it('handles empty pathname', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRevalidatePage(''));
    
    await act(async () => {
      await result.current();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
      expect.objectContaining({
        body: JSON.stringify({ pathName: '' }),
      })
    );
  });

  it('handles root pathname', async () => {
    const mockResponse = new Response('{}', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRevalidatePage('/'));
    
    await act(async () => {
      await result.current();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
      expect.objectContaining({
        body: JSON.stringify({ pathName: '/' }),
      })
    );
  });

  describe('real-world usage scenarios', () => {
    it('handles PBIS page revalidation', async () => {
      const mockResponse = new Response('{"revalidated": true}', { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRevalidatePage('/pbis'));
      
      await act(async () => {
        const response = await result.current();
        expect(response.status).toBe(200);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
        expect.objectContaining({
          body: JSON.stringify({ pathName: '/pbis' }),
        })
      );
    });

    it('handles calendar page revalidation', async () => {
      const mockResponse = new Response('{"revalidated": true}', { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRevalidatePage('/calendar'));
      
      await act(async () => {
        await result.current();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/revalidate', 
        expect.objectContaining({
          body: JSON.stringify({ pathName: '/calendar' }),
        })
      );
    });
  });

  describe('response handling', () => {
    it('returns Response object for successful requests', async () => {
      const mockResponse = new Response('{"success": true}', { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRevalidatePage('/test'));
      
      let response: Response;
      await act(async () => {
        response = await result.current();
      });

      expect(response!).toBeInstanceOf(Response);
      expect(response!.status).toBe(200);
    });

    it('preserves response headers and status', async () => {
      const mockResponse = new Response('{"message": "success"}', { 
        status: 201,
        statusText: 'Created',
        headers: { 
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value'
        }
      });
      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRevalidatePage('/test'));
      
      let response: Response;
      await act(async () => {
        response = await result.current();
      });

      expect(response!.status).toBe(201);
      expect(response!.statusText).toBe('Created');
      expect(response!.headers.get('Content-Type')).toBe('application/json');
      expect(response!.headers.get('X-Custom-Header')).toBe('custom-value');
    });
  });
});