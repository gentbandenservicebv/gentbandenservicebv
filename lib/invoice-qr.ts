import QRCode from "qrcode";

export const DEFAULT_COMPANY_IBAN = (process.env.COMPANY_IBAN || "BE54 7310 7753 4697").replace(/\s+/g, "");
export const DEFAULT_COMPANY_BIC = (process.env.COMPANY_BIC || "KREDBEBB").replace(/\s+/g, "");
export const COMPANY_BENEFICIARY_NAME = "Gent Bandenservice BV";

export interface EpcQrParams {
  name?: string;
  iban?: string;
  bic?: string;
  amount: number;
  invoiceNumber: string;
}

/**
 * Builds the official EPC (European Payments Council) SEPA QR code payload.
 * Supported by Belgian & European banking apps (KBC, Belfius, BNP Paribas Fortis, ING, etc.)
 */
export function buildEpcQrString(params: EpcQrParams): string {
  const name = (params.name || COMPANY_BENEFICIARY_NAME).trim().slice(0, 70);
  const iban = (params.iban || DEFAULT_COMPANY_IBAN).replace(/\s+/g, "").toUpperCase();
  const bic = (params.bic || DEFAULT_COMPANY_BIC).replace(/\s+/g, "").toUpperCase();
  const amount = `EUR${params.amount.toFixed(2)}`;
  const reference = `Factuur #${params.invoiceNumber}`.slice(0, 140);

  return [
    "BCD",
    "002",
    "1",
    "SCT",
    bic,
    name,
    iban,
    amount,
    "", // Purpose code (optional)
    "", // Structured remittance info (optional)
    reference, // Unstructured remittance info
    "", // Beneficiary to originator information (optional)
  ].join("\n");
}

/**
 * Returns a base64 PNG data URL of the EPC QR code
 */
export async function generateEpcQrDataUrl(params: EpcQrParams): Promise<string> {
  const payload = buildEpcQrString(params);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 200,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

/**
 * Returns a PNG Buffer for embedding in PDFKit
 */
export async function generateEpcQrBuffer(params: EpcQrParams): Promise<Buffer> {
  const payload = buildEpcQrString(params);
  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
