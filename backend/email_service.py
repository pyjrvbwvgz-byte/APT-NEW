"""Resend email integration for APT."""
import os
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
import resend

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def _code_email_html(name: str, code: str, expires_label: str) -> str:
    return f"""\
<!doctype html>
<html><body style="margin:0;padding:0;background:#FCFDFB;font-family:Arial,Helvetica,sans-serif;color:#111C15;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FCFDFB;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #E5EFE8;border-radius:16px;overflow:hidden;">
      <tr><td style="background:#10B981;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:36px 36px 8px 36px;">
        <div style="font-size:24px;font-weight:bold;letter-spacing:-0.02em;">
          <span style="color:#DC2626;">·</span>APT
        </div>
        <div style="font-size:11px;color:#10B981;letter-spacing:0.2em;text-transform:uppercase;margin-top:2px;">bruddatrain</div>
      </td></tr>
      <tr><td style="padding:24px 36px 0 36px;">
        <div style="font-size:28px;font-weight:bold;letter-spacing:-0.02em;line-height:1.2;">Hey {name.split(' ')[0]},</div>
        <div style="font-size:16px;color:#5C7063;margin-top:8px;line-height:1.55;">Your weekly access code is ready. Use it to log in and grab your meal plan.</div>
      </td></tr>
      <tr><td align="center" style="padding:28px 36px 8px 36px;">
        <div style="display:inline-block;background:#F3F7F4;border:1px solid #E5EFE8;border-radius:12px;padding:20px 28px;">
          <div style="font-size:10px;color:#5C7063;letter-spacing:0.2em;text-transform:uppercase;">Access code</div>
          <div style="font-size:48px;font-weight:bold;color:#10B981;letter-spacing:0.4em;margin-top:6px;">{code}</div>
        </div>
      </td></tr>
      <tr><td style="padding:8px 36px 28px 36px;text-align:center;">
        <div style="font-size:13px;color:#5C7063;">Valid until <strong style="color:#111C15;">{expires_label}</strong></div>
      </td></tr>
      <tr><td style="padding:0 36px 36px 36px;">
        <div style="font-size:14px;color:#5C7063;line-height:1.6;">Eat well, train hard. If you didn’t request this code, ignore this email.</div>
      </td></tr>
      <tr><td style="padding:18px 36px;background:#F3F7F4;border-top:1px solid #E5EFE8;">
        <div style="font-size:11px;color:#5C7063;text-align:center;">APT · Abraham's Personal Training · apttrains.com</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


async def send_code_email(to_email: str, name: str, code: str, expires_label: str) -> bool:
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set; skipping email to %s", to_email)
        return False
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": f"Your APT access code: {code}",
        "html": _code_email_html(name, code, expires_label),
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Sent code email to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send code email to %s: %s", to_email, e)
        return False
