import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    searchParams?: Record<string, string>
    url?: string
  } = {}
): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    searchParams = {},
    url = 'http://localhost:3000/api/test',
  } = options

  // Create URL with search params
  const fullUrl = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    fullUrl.searchParams.set(key, value)
  })

  // Create request init
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(fullUrl.toString(), requestInit)
}

/**
 * Create a mock authenticated request
 */
export function createAuthenticatedRequest(
  userId: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    searchParams?: Record<string, string>
    url?: string
  } = {}
): NextRequest {
  return createMockRequest({
    ...options,
    headers: {
      ...options.headers,
      'x-user-id': userId,
    },
  })
}

/**
 * Test helper to expect successful response
 */
export function expectSuccessResponse(response: Response) {
  expect(response.status).toBeLessThan(400)
}

/**
 * Test helper to expect error response
 */
export function expectErrorResponse(response: Response, expectedStatus?: number) {
  if (expectedStatus) {
    expect(response.status).toBe(expectedStatus)
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400)
  }
}
