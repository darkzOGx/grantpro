/**
 * Grant API Clients
 *
 * This module exports all grant ingestion clients and triggers their
 * self-registration with the client registry.
 */

// ============================================
// Import all clients to trigger self-registration
// ============================================

// Federal APIs
import "./grants-gov";
import "./usaspending";
import "./nsf-awards";
import "./sam-gov";

// State Sources
import "./california";

// Foundation Sources
import "./propublica";
import "./candid";

// ============================================
// Re-export Base Class and Registry
// ============================================

export { BaseClient } from "./BaseClient";
export type { ClientConfig, FetchResult } from "./BaseClient";
export { clientRegistry, registerClient } from "../registry";

// ============================================
// Re-export Individual Clients
// ============================================

// Federal APIs
export { GrantsGovClient, grantsGovClient } from "./grants-gov";
export { USAspendingClient, usaSpendingClient } from "./usaspending";
export { NSFAwardsClient, nsfAwardsClient } from "./nsf-awards";
export { SamGovClient, samGovClient } from "./sam-gov";

// State Sources
export { CaliforniaGrantsClient, californiaGrantsClient } from "./california";

// Foundation Sources
export { ProPublicaClient, proPublicaClient } from "./propublica";
export { CandidClient, candidClient } from "./candid";
