"use server";

import { Arca } from "@arcasdk/core";
import {
  getArcaConfig,
  getActiveArcaConfig,
  getCurrentArcaEnvironment,
} from "@/lib/arca-config";
import {
  loadAndPreloadTicket,
  saveTicketAfterOp,
} from "@/lib/wsaa-ticket";
import { authorizeAction } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import type {
  ArcaInvoiceInput,
  ArcaCreateVoucherResponse,
  ArcaLastVoucherResponse,
} from "@/types/arca";

/**
 * Server Actions for ARCA/ARCA Integration
 *
 * These actions handle all interactions with Argentina's ARCA (formerly ARCA)
 * electronic invoicing system. All operations require MANAGER role or higher
 * and keep credentials secure on the server.
 */

import type { ActionResult } from "@/types/action-result";

type ServerStatus = {
  environment: string;
  cuit: number;
  serverStatus: {
    appServer: string;
    dbServer: string;
    authServer: string;
  };
};

/**
 * Resolve ARCA config: use per-restaurant DB config if restaurantId is provided,
 * otherwise fall back to global environment variables.
 */
async function resolveArcaConfig(restaurantId?: string) {
  if (restaurantId) {
    return getActiveArcaConfig(restaurantId);
  }
  const environment = getCurrentArcaEnvironment();
  return getArcaConfig(environment);
}

/**
 * Create an Arca SDK instance with WSAA ticket pre-loading from DB.
 *
 * On Vercel, each Lambda invocation starts with an empty /tmp directory. Without
 * this helper, the SDK would try to authenticate with WSAA on every invocation,
 * causing `coe.alreadyAuthenticated` errors when a valid TA already exists.
 *
 * Flow:
 *   1. If restaurantId provided: load cached ticket from DB → write to ticketPath
 *   2. Create new Arca(config) — SDK finds ticket on disk, skips WSAA auth
 *   3. Caller is responsible for calling saveTicket() after the operation completes
 */
async function createArca(restaurantId?: string) {
  const config = await resolveArcaConfig(restaurantId);

  if (restaurantId && config.ticketPath) {
    await loadAndPreloadTicket(
      restaurantId,
      config.ticketPath,
      config.cuit,
      !!config.production,
    );
  }

  return { arca: new Arca(config), config, restaurantId };
}

/**
 * Persist the WSAA ticket written to disk by the SDK to the database.
 * Call this after every successful ARCA operation so the next Lambda invocation
 * can reuse the ticket without re-authenticating.
 */
async function saveTicket(
  restaurantId: string | undefined,
  config: { ticketPath?: string; cuit: number; production?: boolean },
) {
  if (restaurantId && config.ticketPath) {
    await saveTicketAfterOp(
      restaurantId,
      config.ticketPath,
      config.cuit,
      !!config.production,
    );
  }
}

/**
 * Test connection to ARCA servers
 *
 * Verifies that credentials are valid and ARCA servers are accessible.
 * This should be the first test when setting up ARCA integration.
 *
 * @param restaurantId - Optional restaurant ID to use per-restaurant config
 * @returns Server status information or error
 */
export async function testArcaConnection(
  restaurantId?: string,
): Promise<ActionResult<ServerStatus>> {
  try {
    // Authorization check - MANAGER and above
    await authorizeAction(UserRole.MANAGER);

    const { arca, config } = await createArca(restaurantId);
    const environment = config.production ? "production" : "test";
    console.log(`[ARCA] Testing connection to ${environment} environment...`);

    const serverStatus = await arca.electronicBillingService.getServerStatus();
    await saveTicket(restaurantId, config);

    console.log("[ARCA] Connection test successful:", serverStatus);

    return {
      success: true,
      data: {
        environment,
        cuit: config.cuit,
        serverStatus,
      },
    };
  } catch (error) {
    // Retry once on coe.alreadyAuthenticated — another Lambda instance may have
    // just authenticated; wait for it to save the ticket to DB, then retry
    if (
      error instanceof Error &&
      error.message.includes("coe.alreadyAuthenticated")
    ) {
      console.warn("[ARCA] coe.alreadyAuthenticated on testConnection — retrying after 800ms");
      await new Promise((r) => setTimeout(r, 800));
      try {
        const { arca, config } = await createArca(restaurantId);
        const serverStatus = await arca.electronicBillingService.getServerStatus();
        await saveTicket(restaurantId, config);
        return {
          success: true,
          data: {
            environment: config.production ? "production" : "test",
            cuit: config.cuit,
            serverStatus,
          },
        };
      } catch (retryError) {
        console.error("[ARCA] Retry also failed:", retryError);
        return {
          success: false,
          error: retryError instanceof Error ? retryError.message : "Error al conectar con ARCA",
        };
      }
    }

    console.error("[ARCA] Connection test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al conectar con ARCA",
    };
  }
}

/**
 * Get the last issued invoice number for a sales point and invoice type
 *
 * Used to determine the next invoice number to use when emitting new invoices.
 *
 * @param ptoVta - Sales point number (Punto de Venta)
 * @param cbteTipo - Invoice type code (6 for Factura B, etc.)
 * @param restaurantId - Optional restaurant ID to use per-restaurant config
 * @returns Last invoice number or 0 if no invoices exist
 */
export async function getLastInvoiceNumber(
  ptoVta: number,
  cbteTipo: number,
  restaurantId?: string,
): Promise<ActionResult<ArcaLastVoucherResponse>> {
  const run = async () => {
    const { arca, config } = await createArca(restaurantId);
    const response = await arca.electronicBillingService.getLastVoucher(ptoVta, cbteTipo);
    await saveTicket(restaurantId, config);
    return response;
  };

  try {
    await authorizeAction(UserRole.MANAGER);
    console.log(`[ARCA] Getting last invoice number for PtoVta ${ptoVta}, Type ${cbteTipo}...`);
    const response = await run();
    console.log("[ARCA] Last invoice number retrieved:", response);
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof Error && error.message.includes("coe.alreadyAuthenticated")) {
      console.warn("[ARCA] coe.alreadyAuthenticated on getLastVoucher — retrying after 800ms");
      await new Promise((r) => setTimeout(r, 800));
      try {
        return { success: true, data: await run() };
      } catch (retryError) {
        return {
          success: false,
          error: retryError instanceof Error ? retryError.message : "Error al obtener número de comprobante",
        };
      }
    }
    console.error("[ARCA] Get last invoice error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener último número de comprobante",
    };
  }
}

/**
 * Emit an invoice to ARCA
 *
 * Creates an electronic invoice in ARCA's system and returns the CAE
 * (Código de Autorización Electrónico) if successful.
 *
 * @param invoiceData - Invoice parameters
 * @param restaurantId - Optional restaurant ID to use per-restaurant config
 * @returns CAE and expiration date or error
 */
export async function emitTestInvoice(
  invoiceData: ArcaInvoiceInput,
  restaurantId?: string,
): Promise<ActionResult<ArcaCreateVoucherResponse>> {
  const run = async () => {
    const { arca, config } = await createArca(restaurantId);
    const response = await arca.electronicBillingService.createVoucher(invoiceData);
    await saveTicket(restaurantId, config);
    return { response, config };
  };

  try {
    await authorizeAction(UserRole.MANAGER);
    const environment = getCurrentArcaEnvironment();
    console.log(`[ARCA] Emitting invoice to ${environment} environment...`, {
      PtoVta: invoiceData.PtoVta,
      CbteTipo: invoiceData.CbteTipo,
      CbteDesde: invoiceData.CbteDesde,
      ImpTotal: invoiceData.ImpTotal,
    });

    const { response, config } = await run();
    console.log("[ARCA] Invoice emission response:", response);
    if (response.cae) {
      console.log(`[ARCA] Invoice approved! CAE: ${response.cae}`);
    } else {
      console.error("[ARCA] Invoice may have been rejected. Check response:", response);
    }
    return { success: true, data: { ...response, cuit: config.cuit } };
  } catch (error) {
    if (error instanceof Error && error.message.includes("coe.alreadyAuthenticated")) {
      console.warn("[ARCA] coe.alreadyAuthenticated on emitInvoice — retrying after 800ms");
      await new Promise((r) => setTimeout(r, 800));
      try {
        const { response, config } = await run();
        return { success: true, data: { ...response, cuit: config.cuit } };
      } catch (retryError) {
        return {
          success: false,
          error: retryError instanceof Error ? retryError.message : "Error al emitir factura",
        };
      }
    }
    console.error("[ARCA] Invoice emission error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al emitir factura",
    };
  }
}

type SalesPointsResult = {
  resultGet?: {
    ptoVenta?: Array<{
      nro: number;
      emisionTipo: string;
      bloqueado: string;
      fechaBaja?: string;
    }>;
  };
  errors?: {
    err?: Array<{
      code: number;
      msg: string;
    }>;
  };
};

/**
 * Get available sales points (Puntos de Venta) for the configured CUIT
 *
 * Returns the list of authorized sales points that can be used for
 * invoice emission.
 *
 * @param restaurantId - Optional restaurant ID to use per-restaurant config
 * @returns List of sales points or error
 */
export async function getSalesPoints(
  restaurantId?: string,
): Promise<ActionResult<SalesPointsResult>> {
  const run = async () => {
    const { arca, config } = await createArca(restaurantId);
    const response = await arca.electronicBillingService.getSalesPoints();
    await saveTicket(restaurantId, config);
    return response;
  };

  try {
    await authorizeAction(UserRole.MANAGER);
    const environment = getCurrentArcaEnvironment();
    console.log(`[ARCA] Getting sales points for ${environment} environment...`);
    const response = await run();
    console.log("[ARCA] Sales points retrieved:", response);
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof Error && error.message.includes("coe.alreadyAuthenticated")) {
      console.warn("[ARCA] coe.alreadyAuthenticated on getSalesPoints — retrying after 800ms");
      await new Promise((r) => setTimeout(r, 800));
      try {
        return { success: true, data: await run() };
      } catch (retryError) {
        return {
          success: false,
          error: retryError instanceof Error ? retryError.message : "Error al obtener puntos de venta",
        };
      }
    }
    console.error("[ARCA] Get sales points error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener puntos de venta",
    };
  }
}

type VoucherTypesResult = {
  resultGet?: {
    cbteTipo?: Array<{
      id: number;
      desc: string;
      fchDesde: string;
      fchHasta: string;
    }>;
  };
  errors?: {
    err?: Array<{
      code: number;
      msg: string;
    }>;
  };
};

/**
 * Get invoice types available for the configured CUIT
 *
 * Returns the list of invoice types that this CUIT is authorized to emit.
 *
 * @param restaurantId - Optional restaurant ID to use per-restaurant config
 * @returns List of invoice types or error
 */
export async function getInvoiceTypes(
  restaurantId?: string,
): Promise<ActionResult<VoucherTypesResult>> {
  const run = async () => {
    const { arca, config } = await createArca(restaurantId);
    const response = await arca.electronicBillingService.getVoucherTypes();
    await saveTicket(restaurantId, config);
    return response;
  };

  try {
    await authorizeAction(UserRole.MANAGER);
    const environment = getCurrentArcaEnvironment();
    console.log(`[ARCA] Getting invoice types for ${environment} environment...`);
    const response = await run();
    console.log("[ARCA] Invoice types retrieved");
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof Error && error.message.includes("coe.alreadyAuthenticated")) {
      console.warn("[ARCA] coe.alreadyAuthenticated on getInvoiceTypes — retrying after 800ms");
      await new Promise((r) => setTimeout(r, 800));
      try {
        return { success: true, data: await run() };
      } catch (retryError) {
        return {
          success: false,
          error: retryError instanceof Error ? retryError.message : "Error al obtener tipos de comprobantes",
        };
      }
    }
    console.error("[ARCA] Get invoice types error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener tipos de comprobantes",
    };
  }
}
