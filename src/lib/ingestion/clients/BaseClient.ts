/**
 * Base Client Abstract Class
 *
 * Provides shared functionality for all grant ingestion clients:
 * - Rate limiting with token bucket algorithm
 * - Retry logic with exponential backoff
 * - HTTP fetch with error handling
 * - Common configuration interface
 */

import { IngestionSourceType } from "@prisma/client";
import { NormalizedGrant } from "../types";

// ============================================
// Configuration Types
// ============================================

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstLimit?: number;
}

export interface ClientConfig {
  /** Unique identifier: "grants_gov", "candid", etc. */
  name: string;
  /** Human-readable: "Grants.gov" */
  displayName: string;
  /** From Prisma enum */
  sourceType: IngestionSourceType;
  /** Base API URL */
  baseUrl: string;
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;
}

export interface FetchResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================
// Base Client Abstract Class
// ============================================

export abstract class BaseClient {
  public readonly config: ClientConfig;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private bucketTokens: number;
  private readonly maxTokens: number;

  constructor(config: ClientConfig) {
    this.config = config;
    this.maxTokens = config.rateLimit?.burstLimit || 5;
    this.bucketTokens = this.maxTokens;
  }

  // ============================================
  // Abstract Methods (Each client must implement)
  // ============================================

  /**
   * Fetch grants from the source.
   * Returns raw data in the source's native format.
   */
  abstract fetchGrants(): Promise<FetchResult<unknown>>;

  /**
   * Normalize a single raw grant to our internal schema.
   * Each client knows its own data structure.
   */
  abstract normalizeGrant(rawData: unknown): NormalizedGrant;

  /**
   * Extract the external ID from raw data.
   * Used for deduplication and tracking.
   */
  abstract getExternalId(rawData: unknown): string;

  // ============================================
  // Optional Hooks
  // ============================================

  /**
   * Optional initialization hook.
   * Called before first fetch if implemented.
   */
  async initialize?(): Promise<void>;

  /**
   * Optional cleanup hook.
   * Called after ingestion completes.
   */
  async cleanup?(): Promise<void>;

  // ============================================
  // Shared Rate Limiting
  // ============================================

  /**
   * Wait to respect rate limits using token bucket algorithm.
   * Call this before each API request.
   */
  protected async rateLimit(): Promise<void> {
    const rateConfig = this.config.rateLimit;
    if (!rateConfig) return;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const refillRate = 1000 / rateConfig.requestsPerSecond; // ms per token

    // Refill tokens based on time passed
    const tokensToAdd = Math.floor(timeSinceLastRequest / refillRate);
    this.bucketTokens = Math.min(this.maxTokens, this.bucketTokens + tokensToAdd);

    // If no tokens available, wait for one to refill
    if (this.bucketTokens < 1) {
      const waitTime = refillRate - (timeSinceLastRequest % refillRate);
      await this.delay(waitTime);
      this.bucketTokens = 1;
    }

    // Consume a token
    this.bucketTokens--;
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Simple delay helper.
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // Shared Retry Logic
  // ============================================

  /**
   * Execute an operation with exponential backoff retry.
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      retryOn?: (error: unknown) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      retryOn = this.isRetryableError,
    } = options;

    let lastError: unknown;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !retryOn(error)) {
          throw error;
        }

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay;
        const waitTime = Math.min(delay + jitter, maxDelay);

        console.warn(
          `[${this.config.name}] Attempt ${attempt + 1} failed, retrying in ${Math.round(waitTime)}ms:`,
          (error as Error).message
        );

        await this.delay(waitTime);
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError;
  }

  /**
   * Determine if an error is retryable.
   */
  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Retry on network errors and rate limits
      if (
        message.includes("timeout") ||
        message.includes("econnreset") ||
        message.includes("enotfound") ||
        message.includes("rate limit") ||
        message.includes("429") ||
        message.includes("503")
      ) {
        return true;
      }
    }
    return false;
  }

  // ============================================
  // Shared HTTP Fetch
  // ============================================

  /**
   * Fetch JSON from a URL with error handling.
   */
  protected async fetchJson<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.rateLimit();

    const response = await this.withRetry(async () => {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status}: ${res.statusText}${errorBody ? ` - ${errorBody}` : ""}`
        );
      }

      return res;
    });

    return response.json() as Promise<T>;
  }

  /**
   * Fetch text/CSV from a URL.
   */
  protected async fetchText(
    url: string,
    options: RequestInit = {}
  ): Promise<string> {
    await this.rateLimit();

    const response = await this.withRetry(async () => {
      const res = await fetch(url, options);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    });

    return response.text();
  }

  /**
   * POST JSON and return JSON response.
   */
  protected async postJson<T>(
    url: string,
    body: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    return this.fetchJson<T>(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get the number of requests made by this client.
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request counter (useful for testing).
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }

  /**
   * Log with client name prefix.
   */
  protected log(message: string, ...args: unknown[]): void {
    console.log(`[${this.config.name}] ${message}`, ...args);
  }

  /**
   * Warn with client name prefix.
   */
  protected warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.config.name}] ${message}`, ...args);
  }

  /**
   * Error with client name prefix.
   */
  protected error(message: string, ...args: unknown[]): void {
    console.error(`[${this.config.name}] ${message}`, ...args);
  }
}
