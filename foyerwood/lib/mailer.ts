import "server-only";
import nodemailer from "nodemailer";

/**
 * Outgoing e-mail through the shop's own mailbox (e.g. contact@foyerwoods.com at LWS).
 * Configure in Vercel → Settings → Environment Variables:
 *   SMTP_HOST (e.g. mail.foyerwoods.com), SMTP_PORT (465), SMTP_USER, SMTP_PASS,
 *   optional SMTP_FROM (defaults to SMTP_USER).
 * Without them, no automatic e-mail is sent and everything else keeps working.
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function mailFromAddress(): string | null {
  return process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || null;
}

let transporter: nodemailer.Transporter | null = null;
function transport(): nodemailer.Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
  fromName?: string;
}

export async function sendMail(m: OutgoingMail): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mailConfigured()) return { ok: false, error: "not_configured" };
  try {
    await transport().sendMail({
      from: { name: m.fromName || "Foyerwood", address: mailFromAddress()! },
      to: m.to,
      subject: m.subject,
      text: m.text,
      html: m.html,
      replyTo: m.replyTo || undefined,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Simple branded HTML e-mail (inline styles: e-mail clients ignore stylesheets). */
export function brandedEmail(opts: {
  brand: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  footer?: string;
  /** Optional key/value block (amount, reference…). */
  facts?: Array<[string, string]>;
}): string {
  const p = opts.paragraphs.map((x) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2f2d2d">${esc(x).replace(/\n/g, "<br>")}</p>`).join("");
  const facts = opts.facts?.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:6px 0 18px;background:#fbf8f2;border:1px solid #ece5d9">${opts.facts
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 14px;font-size:13px;color:#6b6560">${esc(k)}</td><td style="padding:10px 14px;font-size:14px;font-weight:600;color:#1d1b1b;text-align:right">${esc(v)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const button = opts.button
    ? `<p style="margin:22px 0 8px"><a href="${esc(opts.button.url)}" style="display:inline-block;background:#f39a1e;color:#1d1b1b;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:4px">${esc(opts.button.label)}</a></p>
       <p style="margin:0 0 6px;font-size:12px;color:#6b6560;word-break:break-all">${esc(opts.button.url)}</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4efe6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 12px">
<table role="presentation" style="max-width:560px;margin:0 auto;border-collapse:collapse;background:#ffffff">
<tr><td style="background:#161515;padding:18px 24px;border-bottom:4px solid #f39a1e"><span style="font-family:Georgia,serif;font-size:24px;color:#fbf8f2">${esc(opts.brand)}</span></td></tr>
<tr><td style="padding:26px 24px 20px">${p}${facts}${button}</td></tr>
${opts.footer ? `<tr><td style="padding:14px 24px;background:#fbf8f2;font-size:12px;line-height:1.5;color:#6b6560">${esc(opts.footer)}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}
