"use server";

import { Arca } from "@arcasdk/core";
import {
  getArcaConfig,
  getActiveArcaConfig,
  getCurrentArcaEnvironment,
} from "@/lib/arca-config";
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

    const environment = getCurrentArcaEnvironment();
    console.log(`[ARCA] Testing connection to ${environment} environment...`);

    const config = await resolveArcaConfig(restaurantId);
    const arca = new Arca(config);

    // Get actual server status from ARCA
    const serverStatus = await arca.electronicBillingService.getServerStatus();

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
    console.error("[ARCA] Connection test error:", error);

    // Return user-friendly error message
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error desconocido al conectar con ARCA";

    return {
      success: false,
      error: errorMessage,
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
  try {
    await authorizeAction(UserRole.MANAGER);

    console.log(
      `[ARCA] Getting last invoice number for PtoVta ${ptoVta}, Type ${cbteTipo}...`,
    );

    const config = await resolveArcaConfig(restaurantId);
    const arca = new Arca(config);

    // Get last voucher number
    const response = await arca.electronicBillingService.getLastVoucher(
      ptoVta,
      cbteTipo,
    );

    console.log("[ARCA] Last invoice number retrieved:", response);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("[ARCA] Get last invoice error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al obtener último número de comprobante";

    return {
      success: false,
      error: errorMessage,
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
  try {
    await authorizeAction(UserRole.MANAGER);

    const environment = getCurrentArcaEnvironment();
    console.log(`[ARCA] Emitting invoice to ${environment} environment...`, {
      PtoVta: invoiceData.PtoVta,
      CbteTipo: invoiceData.CbteTipo,
      CbteDesde: invoiceData.CbteDesde,
      ImpTotal: invoiceData.ImpTotal,
    });

    const config = await resolveArcaConfig(restaurantId);
    const arca = new Arca(config);

    // Create voucher (invoice)
    const response =
      await arca.electronicBillingService.createVoucher(invoiceData);

    console.log("[ARCA] Invoice emission response:", response);

    // Check if invoice was approved
    if (response.cae) {
      console.log(`[ARCA] Invoice approved! CAE: ${response.cae}`);
    } else {
      console.error(
        "[ARCA] Invoice may have been rejected. Check response:",
        response,
      );
    }

    return {
      success: true,
      data: {
        ...response,
        cuit: config.cuit, // Include CUIT for QR code generation
      },
    };
  } catch (error) {
    console.error("[ARCA] Invoice emission error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error al emitir factura";

    return {
      success: false,
      error: errorMessage,
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
  try {
    await authorizeAction(UserRole.MANAGER);

    const environment = getCurrentArcaEnvironment();
    console.log(
      `[ARCA] Getting sales points for ${environment} environment...`,
    );

    const config = await resolveArcaConfig(restaurantId);
    const arca = new Arca(config);

    // Get sales points
    const response = await arca.electronicBillingService.getSalesPoints();

    console.log("[ARCA] Sales points retrieved:", response);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("[ARCA] Get sales points error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al obtener puntos de venta";

    return {
      success: false,
      error: errorMessage,
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
  try {
    await authorizeAction(UserRole.MANAGER);

    const environment = getCurrentArcaEnvironment();
    console.log(
      `[ARCA] Getting invoice types for ${environment} environment...`,
    );

    const config = await resolveArcaConfig(restaurantId);
    const arca = new Arca(config);

    // Get invoice types
    const response = await arca.electronicBillingService.getVoucherTypes();

    console.log("[ARCA] Invoice types retrieved");

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("[ARCA] Get invoice types error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al obtener tipos de comprobantes";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
