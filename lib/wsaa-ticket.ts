import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

/**
 * WSAA Ticket Cache
 *
 * Persists AFIP WSAA authentication tickets (TA - Ticket de Autorización) in the
 * database so Vercel Lambda cold starts can reuse them instead of re-authenticating
 * with WSAA on every invocation.
 *
 * The @arcasdk/core SDK stores tickets as JSON files in `ticketPath`. By pre-loading
 * a valid ticket from DB to disk before SDK calls, the SDK finds it and skips WSAA auth.
 * After each operation, we read the (possibly renewed) ticket from disk and persist to DB.
 *
 * Ticket filename format used by the SDK:
 *   - Test:       {ticketPath}/TA-{cuit}-wsfev1.json
 *   - Production: {ticketPath}/TA-{cuit}-wsfev1-production.json
 */

const WSFE_SERVICE = "wsfev1";

interface TicketFileData {
  header: {
    0: { version: string };
    1: {
      source: string;
      destination: string;
      uniqueid: string;
      generationtime: string;
      expirationtime: string;
    };
  };
  credentials: {
    token: string;
    sign: string;
  };
}

function getTicketFilePath(
  ticketPath: string,
  cuit: number,
  isProduction: boolean,
): string {
  const suffix = isProduction ? "-production" : "";
  return path.join(ticketPath, `TA-${cuit}-${WSFE_SERVICE}${suffix}.json`);
}

function isTicketValid(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  // 60-second buffer so we don't use a ticket about to expire
  return new Date(expiresAt.getTime() - 60_000) > new Date();
}

/**
 * Write a cached DB ticket to the SDK's ticket file path so it's found on disk.
 */
function writeTicketToDisk(
  ticketPath: string,
  cuit: number,
  isProduction: boolean,
  token: string,
  sign: string,
  header: unknown,
): void {
  try {
    fs.mkdirSync(ticketPath, { recursive: true });
    const filePath = getTicketFilePath(ticketPath, cuit, isProduction);
    const data: TicketFileData = {
      header: header as TicketFileData["header"],
      credentials: { token, sign },
    };
    fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
    console.log(`[wsaa-ticket] Wrote cached ticket to disk: ${filePath}`);
  } catch (err) {
    console.warn(
      "[wsaa-ticket] Could not write ticket to disk (non-fatal):",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Read the ticket file the SDK saved to disk after authenticating.
 * Returns null if the file doesn't exist or can't be parsed.
 */
function readTicketFromDisk(
  ticketPath: string,
  cuit: number,
  isProduction: boolean,
): TicketFileData | null {
  try {
    const filePath = getTicketFilePath(ticketPath, cuit, isProduction);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as TicketFileData;
  } catch {
    return null;
  }
}

/**
 * Load a valid ticket from the database and write it to disk.
 * Called BEFORE creating a new Arca() instance.
 * If no valid ticket is in DB, does nothing — the SDK will handle WSAA auth.
 */
export async function loadAndPreloadTicket(
  restaurantId: string,
  ticketPath: string,
  cuit: number,
  isProduction: boolean,
): Promise<void> {
  try {
    const config = await prisma.fiscalConfiguration.findUnique({
      where: { restaurantId },
      select: {
        wsaaToken: true,
        wsaaSign: true,
        wsaaExpiresAt: true,
        wsaaHeader: true,
      },
    });

    if (
      config?.wsaaToken &&
      config.wsaaSign &&
      isTicketValid(config.wsaaExpiresAt)
    ) {
      writeTicketToDisk(
        ticketPath,
        cuit,
        isProduction,
        config.wsaaToken,
        config.wsaaSign,
        config.wsaaHeader,
      );
    } else {
      console.log(
        "[wsaa-ticket] No valid cached ticket in DB — SDK will authenticate with WSAA",
      );
    }
  } catch (err) {
    console.warn(
      "[wsaa-ticket] Could not load ticket from DB (non-fatal):",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Read the ticket from disk (written by the SDK after WSAA auth) and save to DB.
 * Called AFTER a successful ARCA operation.
 * Non-throwing — failures are logged but don't affect invoice flow.
 */
export async function saveTicketAfterOp(
  restaurantId: string,
  ticketPath: string,
  cuit: number,
  isProduction: boolean,
): Promise<void> {
  try {
    const ticket = readTicketFromDisk(ticketPath, cuit, isProduction);
    if (!ticket) return;

    const expirationtime = ticket.header?.[1]?.expirationtime;
    if (!expirationtime) return;

    const expiresAt = new Date(expirationtime);

    // Only update if the disk ticket is newer than what's in DB (avoid redundant writes)
    const existing = await prisma.fiscalConfiguration.findUnique({
      where: { restaurantId },
      select: { wsaaExpiresAt: true },
    });

    if (existing?.wsaaExpiresAt && existing.wsaaExpiresAt >= expiresAt) {
      return; // DB already has the same or newer ticket
    }

    await prisma.fiscalConfiguration.update({
      where: { restaurantId },
      data: {
        wsaaToken: ticket.credentials.token,
        wsaaSign: ticket.credentials.sign,
        wsaaExpiresAt: expiresAt,
        wsaaHeader: ticket.header as object,
      },
    });

    console.log(
      `[wsaa-ticket] Saved WSAA ticket to DB, expires: ${expiresAt.toISOString()}`,
    );
  } catch (err) {
    console.warn(
      "[wsaa-ticket] Could not save ticket to DB (non-fatal):",
      err instanceof Error ? err.message : String(err),
    );
  }
}
