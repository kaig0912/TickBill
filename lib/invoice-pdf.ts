/**
 * TickBill — Invoice PDF Generator
 * DIN 5008 Form B / EN 16931 compliant
 * Austrian UStG formatting
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { InvoiceData } from '@/stores/invoiceStore';
import { ClientData } from '@/stores/clientStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatCurrency, formatDate, formatDecimal, formatIBAN } from './utils';

let isSharing = false;

// Kleinbetragsrechnung threshold (§11 Abs. 6 UStG): up to €400 gross
const KLEINBETRAG_THRESHOLD = 400;

/**
 * Downloads an image from a URL and returns it as a base64 data URI.
 */
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const tmpPath = `${FileSystem.cacheDirectory}logo_tmp_${Date.now()}`;
    const result = await FileSystem.downloadAsync(url, tmpPath);
    if (result.status !== 200) return null;
    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? 'png';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    };
    return `data:${mimeMap[ext] ?? 'image/png'};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function generateInvoicePDF(invoice: InvoiceData, client: ClientData | undefined) {
  if (isSharing) return;
  isSharing = true;

  const profile = useSettingsStore.getState().profile;
  const totalAmount = invoice.total_amount ?? invoice.total ?? 0;

  // -- Logo --
  let logoDataUri: string | null = null;
  if (profile.logoUri) {
    logoDataUri = await urlToBase64(profile.logoUri);
  } else if (profile.logoBase64) {
    logoDataUri = `data:image/jpeg;base64,${profile.logoBase64}`;
  }

  // -- Seller info (Austrian Impressum Compliance) --
  const isCorporate = ['gmbh', 'og', 'kg', 'ag', 'gmbh & co. kg'].includes(profile.legalForm?.toLowerCase() || '');
  let sellerName = '';
  let sellerSubName = '';

  if (isCorporate) {
    sellerName = profile.companyName || profile.fullName || '';
    if (profile.legalForm) sellerName += ` ${profile.legalForm}`;
  } else {
    // Einzelunternehmer/Freiberufler: Personal name is strictly mandatory!
    if (profile.companyName) {
      sellerName = profile.companyName;
      sellerSubName = `Inhaber: ${profile.fullName}`;
    } else {
      sellerName = profile.fullName || '';
    }
  }

  const sellerTaxInfoParts = [];
  if (profile.uidNumber) sellerTaxInfoParts.push(`UID: ${profile.uidNumber}`);
  if (profile.taxNumber) sellerTaxInfoParts.push(`StNr: ${profile.taxNumber}`);
  
  if (isCorporate) {
    if (profile.firmenbuchNumber) sellerTaxInfoParts.push(`FN: ${profile.firmenbuchNumber}`);
    if (profile.firmenbuchGericht) sellerTaxInfoParts.push(`Firmenbuchgericht: ${profile.firmenbuchGericht}`);
    if (profile.city) sellerTaxInfoParts.push(`Sitz: ${profile.city}`);
  }
  const sellerTaxInfo = sellerTaxInfoParts.join(' | ');

  // -- Recipient address lines --
  const recipientLines = [
    client?.company_name || '',
    client?.contact_person || '',
    client?.street || '',
    `${client?.zip || ''} ${client?.city || ''}`.trim(),
    client?.country || '',
  ].filter(Boolean);

  const clientUid = client?.uid_number ? `UID: ${client.uid_number}` : '';

  // -- Return address (Rücksendeadresse) --
  const returnAddressOneLiner = [
    profile.fullName || profile.companyName,
    profile.street,
    `${profile.zip} ${profile.city}`,
  ].filter(Boolean).join(', ');

  // -- Kleinbetragsrechnung (§11 Abs. 6 UStG): gross ≤ €400 --
  const isKleinbetrag = totalAmount <= KLEINBETRAG_THRESHOLD;
  const showSeparateVAT = !isKleinbetrag && (!invoice.tax_type || invoice.tax_type === 'standard') && !profile.isKleinunternehmer;

  const isCancelled = invoice.status === 'cancelled';

  // -- Tax / legal notes --
  let taxNote = '';
  if (isCancelled) {
    taxNote = `<p class="legal-note" style="border-left-color: #EF4444; background: #FFF5F5; color: #B91C1C;"><strong>STORNO / RECHNUNGSKORREKTUR:</strong> Diese Rechnung wurde storniert und ist steuerlich ungültig.</p>`;
  } else if (invoice.tax_type === 'reverse_charge') {
    taxNote = `<p class="legal-note"><strong>Reverse Charge:</strong> Steuerfreie innergemeinschaftliche Lieferung/Leistung gem. § 19 UStG. Die Steuerschuld geht auf den Leistungsempfänger über.</p>`;
  } else if (invoice.tax_type === 'export') {
    taxNote = `<p class="legal-note"><strong>Steuerfreie Exportleistung</strong> gem. § 7 UStG.</p>`;
  } else if (profile.isKleinunternehmer) {
    taxNote = `<p class="legal-note">Umsatzsteuerbefreit aufgrund der Kleinunternehmerregelung.</p>`;
  } else if (isKleinbetrag) {
    taxNote = `<p class="legal-note">Kleinbetragsrechnung gemäß § 11 Abs. 6 UStG. Gesamtbetrag inkl. ${invoice.tax_rate}% USt.</p>`;
  }

  // -- IBAN formatting --
  const ibanFormatted = profile.iban ? formatIBAN(profile.iban) : '–';

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Rechnung ${invoice.invoice_number}</title>
      <style>
        /* ==========================================
           A4 Page Setup (DIN 5008 Form B)
           210mm × 297mm
           Margins: top 10mm, left 25mm, right 15mm, bottom 15mm
           ========================================== */
        @page {
          size: A4 portrait;
          margin: 10mm 15mm 15mm 25mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 170mm; /* 210 - 25 - 15 */
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 10pt;
          color: #1a1a1a;
          line-height: 1.5;
        }

        /* ==========================================
           ZONE 1: BRIEFKOPF (0–35mm from page top)
           ========================================== */
        .zone-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 5mm;
          border-bottom: 0.3mm solid #ccc;
          margin-bottom: 5mm;
        }
        .logo img { max-height: 20mm; max-width: 55mm; object-fit: contain; display: block; }
        .logo-text { font-size: 17pt; font-weight: bold; color: #111; line-height: 1; }
        .sender-block {
          text-align: right;
          font-size: 8.5pt;
          line-height: 1.55;
          color: #333;
        }
        .sender-block .sender-name { font-size: 10pt; font-weight: bold; color: #000; }

        /* ==========================================
           ZONE 2: ANSCHRIFTFELD + BEZUGSZEICHEN
           DIN 5008: Anschriftfeld ab 45mm Blattkante
           = 35mm vom content-start (45 - 10 top-margin)
           ========================================== */
        .zone-address {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          min-height: 45mm;
          margin-bottom: 5mm;
        }

        /* DIN 5008 Anschriftfeld: 85mm breit, 45mm hoch */
        .address-field {
          width: 85mm;
          min-height: 40mm;
        }
        /* Rücksendeadresse: 1 Zeile à 5mm Höhe (DIN 5008) */
        .return-address {
          font-size: 7pt;
          color: #888;
          border-bottom: 0.2mm solid #aaa;
          padding-bottom: 1.5mm;
          margin-bottom: 2mm;
          white-space: nowrap;
          overflow: hidden;
          max-width: 83mm;
        }
        .recipient-name { font-size: 10pt; font-weight: bold; line-height: 1.5; }
        .recipient-line { font-size: 10pt; line-height: 1.5; }
        .recipient-uid  { font-size: 8pt; color: #666; margin-top: 1mm; }

        /* Bezugszeichen rechts neben dem Anschriftfeld */
        .reference-block {
          width: 73mm;
          font-size: 9pt;
          line-height: 1.5;
          text-align: right;
          margin-top: 5mm; /* Vertikal exakt mit Empfänger-Namen auf einer Linie */
        }
        .ref-label { font-size: 7.5pt; color: #888; text-transform: uppercase; letter-spacing: 0.03em; }

        /* ==========================================
           ZONE 3: BETREFF (Rechnungstitel)
           ========================================== */
        .zone-subject { margin-bottom: 5mm; }
        .zone-subject h1 { font-size: 13pt; font-weight: bold; color: #000; }

        /* ==========================================
           ZONE 4: LEISTUNGSTABELLE
           ========================================== */
        table.items {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5mm;
          font-size: 9.5pt;
        }
        table.items thead th {
          background: #f5f5f5;
          padding: 2.5mm 3mm;
          border-top: 0.4mm solid #aaa;
          border-bottom: 0.4mm solid #aaa;
          font-size: 8.5pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #444;
        }
        table.items tbody td {
          padding: 2.5mm 3mm;
          border-bottom: 0.2mm solid #e5e5e5;
          vertical-align: top;
        }
        table.items tfoot td {
          border-top: 0.4mm solid #aaa;
          padding-top: 2mm;
        }

        /* ==========================================
           ZONE 5: SUMMENBLOCK
           ========================================== */
        .totals-wrap {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 5mm;
        }
        .totals {
          width: 75mm;
          font-size: 9.5pt;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 1.5mm 0;
          color: #333;
        }
        .total-row.grand {
          font-size: 12pt;
          font-weight: bold;
          color: #000;
          border-top: 0.5mm solid #000;
          margin-top: 1.5mm;
          padding-top: 2mm;
        }

        /* ==========================================
           LEGAL NOTE
           ========================================== */
        .legal-note {
          font-size: 8.5pt;
          color: #444;
          margin-bottom: 4mm;
          padding: 2mm 3mm;
          background: #f9f9f9;
          border-left: 1mm solid #bbb;
          line-height: 1.5;
        }

        /* ==========================================
           ZONE 6: FUSSZEILE (ans Seitenende)
           Expo-print unterstützt position:fixed für Footer
           ========================================== */
        .zone-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding-top: 3mm;
          border-top: 0.3mm solid #ccc;
          font-size: 8pt;
          color: #555;
          line-height: 1.6;
        }
        .footer-thanks {
          font-size: 9pt;
          color: #222;
          margin-bottom: 1.5mm;
        }
        .footer-grid {
          display: flex;
          gap: 8mm;
          margin-top: 1.5mm;
        }
        .footer-col { flex: 1; }
        .footer-col strong { color: #222; font-size: 8.5pt; display: block; margin-bottom: 0.5mm; }
        .footer-bottom-info { margin-top: 2mm; font-size: 7.5pt; color: #888; border-top: 0.2mm solid #eee; padding-top: 1mm;}
      </style>
    </head>
    <body>

      <!-- ZONE 1: Briefkopf -->
      <div class="zone-header">
        <div class="logo">
          ${logoDataUri
            ? `<img src="${logoDataUri}" alt="Logo">`
            : `<span class="logo-text">${profile.companyName || profile.fullName || ''}</span>`
          }
        </div>
        <div class="sender-block">
          <span class="sender-name">${sellerName}</span><br>
          ${sellerSubName ? `${sellerSubName}<br>` : ''}
          ${profile.street}<br>
          ${profile.zip} ${profile.city}<br>
          ${profile.country}<br>
          ${profile.email ? `${profile.email}<br>` : ''}
          ${profile.phone ? profile.phone : ''}
        </div>
      </div>

      <!-- ZONE 2: Adressfeld (DIN 5008 Fensterkuvert) + Bezugszeichen -->
      <div class="zone-address">
        <!-- Anschriftfeld 85mm × 45mm -->
        <div class="address-field">
          <div class="return-address">✉ ${returnAddressOneLiner}</div>
          <div class="recipient-name">${client?.company_name || ''}</div>
          ${recipientLines.slice(1).map(l => `<div class="recipient-line">${l}</div>`).join('')}
          ${clientUid ? `<div class="recipient-uid">${clientUid}</div>` : ''}
        </div>

        <!-- Bezugszeichen -->
        <div class="reference-block">
          <div class="ref-label">Rechnungsnummer</div>
          <strong>#${invoice.invoice_number}</strong>
          <br><br>
          <div class="ref-label">Ausstellungsdatum</div>
          ${formatDate(invoice.issue_date)}
          <br><br>
          <div class="ref-label">Fälligkeitsdatum</div>
          ${formatDate(invoice.due_date)}
          <br><br>
          <div class="ref-label">Leistungszeitraum</div>
          ${formatDate(invoice.service_period_start)}<br>
          bis ${formatDate(invoice.service_period_end)}
        </div>
      </div>

      <!-- ZONE 3: Betreff -->
      <div class="zone-subject">
        <h1>${isCancelled ? 'Stornorechnung / Rechnungskorrektur zur' : ''} Rechnung #${invoice.invoice_number}</h1>
      </div>

      <!-- ZONE 4: Leistungstabelle -->
      <table class="items">
        <thead>
          <tr>
            <th style="text-align:left; width:55%;">Beschreibung</th>
            <th style="text-align:center; width:15%;">Menge</th>
            <th style="text-align:right; width:15%;">Einzelpreis</th>
            <th style="text-align:right; width:15%;">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align:center;">${formatDecimal(item.quantity)} ${item.unit}</td>
              <td style="text-align:right;">${formatCurrency(item.unit_price)}</td>
              <td style="text-align:right;">${formatCurrency(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- ZONE 5: Summenblock -->
      <div class="totals-wrap">
        <div class="totals">
          ${showSeparateVAT ? `
          <div class="total-row">
            <span>Zwischensumme (Netto)</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>Umsatzsteuer (${invoice.tax_rate}%)</span>
            <span>${formatCurrency(invoice.tax_amount)}</span>
          </div>
          ` : ''}
          <div class="total-row grand">
            <span>Gesamtbetrag${isKleinbetrag && !profile.isKleinunternehmer && invoice.tax_type === 'standard' ? ` (inkl. ${invoice.tax_rate}% USt.)` : ''}</span>
            <span>${formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      ${taxNote}

      <!-- ZONE 6: Fußzeile (fixiert am Seitenende) -->
      <div class="zone-footer">
        <p class="footer-thanks">Vielen Dank für Ihre Zusammenarbeit!</p>
        <p>${profile.paymentTermsText || 'Zahlbar innerhalb von 14 Tagen ohne Abzug.'}</p>
        <div class="footer-grid">
          <div class="footer-col">
            <strong>Bankverbindung</strong>
            ${profile.bankName ? `${profile.bankName}<br>` : ''}
            IBAN: ${ibanFormatted}<br>
            BIC: ${profile.bic || '–'}
          </div>
          <div class="footer-col">
            <strong>Kontakt & Rechnungssteller</strong>
            ${sellerName}<br>
            ${profile.phone ? `Tel: ${profile.phone}<br>` : ''}
            ${profile.email || ''}<br>
            ${profile.uidNumber ? `<strong>UID: ${profile.uidNumber}</strong>` : ''}
          </div>
        </div>
        ${sellerTaxInfo ? `<div class="footer-bottom-info">${sellerTaxInfo}</div>` : ''}
      </div>

    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const newUri = `${FileSystem.documentDirectory}${invoice.invoice_number}.pdf`;
    await FileSystem.moveAsync({ from: uri, to: newUri });
    await Sharing.shareAsync(newUri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Rechnung ${invoice.invoice_number} teilen`,
    });
  } catch (error: any) {
    if (!error?.message?.includes('Another share request')) {
      console.error('[PDF] Error generating invoice:', error);
    }
  } finally {
    isSharing = false;
  }
}
