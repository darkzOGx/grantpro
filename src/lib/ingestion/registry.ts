/**
 * Client Registry
 *
 * Central registry for all grant ingestion clients.
 * Enables self-registration pattern and eliminates hardcoded switch statements.
 */

import { BaseClient, ClientConfig } from "./clients/BaseClient";

// ============================================
// Registry Types
// ============================================

export interface RegisteredClient {
  client: BaseClient;
  config: ClientConfig;
  enabled: boolean;
}

// ============================================
// Client Registry Class
// ============================================

class ClientRegistry {
  private clients: Map<string, RegisteredClient> = new Map();
  private initialized: boolean = false;

  /**
   * Register a client in the registry.
   * Typically called at module load time via self-registration.
   */
  register(client: BaseClient): void {
    const name = client.config.name;

    if (this.clients.has(name)) {
      console.warn(
        `[ClientRegistry] Client "${name}" is already registered. Skipping duplicate.`
      );
      return;
    }

    this.clients.set(name, {
      client,
      config: client.config,
      enabled: true,
    });

    console.log(`[ClientRegistry] Registered client: ${name}`);
  }

  /**
   * Get a client by name.
   */
  getClient(name: string): BaseClient | undefined {
    return this.clients.get(name)?.client;
  }

  /**
   * Get a registered client entry (includes enabled status).
   */
  getRegisteredClient(name: string): RegisteredClient | undefined {
    return this.clients.get(name);
  }

  /**
   * Get all registered clients.
   */
  getAllClients(): BaseClient[] {
    return Array.from(this.clients.values()).map((r) => r.client);
  }

  /**
   * Get all enabled clients.
   */
  getEnabledClients(): BaseClient[] {
    return Array.from(this.clients.values())
      .filter((r) => r.enabled)
      .map((r) => r.client);
  }

  /**
   * Get all registered client names.
   */
  getClientNames(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Get all enabled client names.
   */
  getEnabledClientNames(): string[] {
    return Array.from(this.clients.entries())
      .filter(([, r]) => r.enabled)
      .map(([name]) => name);
  }

  /**
   * Enable or disable a client.
   */
  setEnabled(name: string, enabled: boolean): boolean {
    const registered = this.clients.get(name);
    if (!registered) {
      console.warn(`[ClientRegistry] Client "${name}" not found.`);
      return false;
    }

    registered.enabled = enabled;
    console.log(
      `[ClientRegistry] Client "${name}" ${enabled ? "enabled" : "disabled"}`
    );
    return true;
  }

  /**
   * Check if a client is registered.
   */
  hasClient(name: string): boolean {
    return this.clients.has(name);
  }

  /**
   * Check if a client is enabled.
   */
  isEnabled(name: string): boolean {
    return this.clients.get(name)?.enabled ?? false;
  }

  /**
   * Get configuration for all clients.
   */
  getAllConfigs(): ClientConfig[] {
    return Array.from(this.clients.values()).map((r) => r.config);
  }

  /**
   * Get summary of all registered clients.
   */
  getSummary(): Array<{
    name: string;
    displayName: string;
    sourceType: string;
    enabled: boolean;
  }> {
    return Array.from(this.clients.values()).map((r) => ({
      name: r.config.name,
      displayName: r.config.displayName,
      sourceType: r.config.sourceType,
      enabled: r.enabled,
    }));
  }

  /**
   * Initialize all clients that have an initialize hook.
   */
  async initializeAll(): Promise<void> {
    if (this.initialized) return;

    for (const [name, registered] of this.clients) {
      if (registered.enabled && registered.client.initialize) {
        try {
          await registered.client.initialize();
          console.log(`[ClientRegistry] Initialized client: ${name}`);
        } catch (error) {
          console.error(
            `[ClientRegistry] Failed to initialize client "${name}":`,
            error
          );
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Cleanup all clients that have a cleanup hook.
   */
  async cleanupAll(): Promise<void> {
    for (const [name, registered] of this.clients) {
      if (registered.client.cleanup) {
        try {
          await registered.client.cleanup();
          console.log(`[ClientRegistry] Cleaned up client: ${name}`);
        } catch (error) {
          console.error(
            `[ClientRegistry] Failed to cleanup client "${name}":`,
            error
          );
        }
      }
    }

    this.initialized = false;
  }

  /**
   * Clear all registered clients (useful for testing).
   */
  clear(): void {
    this.clients.clear();
    this.initialized = false;
  }
}

// ============================================
// Singleton Instance
// ============================================

export const clientRegistry = new ClientRegistry();

// ============================================
// Registration Helper
// ============================================

/**
 * Register a client in the global registry.
 * Call this at the end of each client module file.
 *
 * @example
 * // At bottom of grants-gov.ts
 * registerClient(new GrantsGovClient());
 */
export function registerClient(client: BaseClient): void {
  clientRegistry.register(client);
}
