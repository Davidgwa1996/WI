"""
Email service for sending invite emails with HTTPS links.
Supports multiple providers: Resend, SendGrid, SMTP, AWS SES.
"""

import os
import logging
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION
# ============================================

# Frontend URL for invite links (must be HTTPS in production)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://web3dkintel.netlify.app")

# Email provider selection
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "resend")  # resend, sendgrid, smtp, ses

# Sender email address
FROM_EMAIL = os.getenv("FROM_EMAIL", "invites@web3dkintel.com")
FROM_NAME = os.getenv("FROM_NAME", "Web3 Intel")

# Resend configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

# SendGrid configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")

# SMTP configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# AWS SES configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

# ============================================
# EMAIL TEMPLATES
# ============================================

def get_invite_email_html(
    invite_link: str,
    role: str,
    invited_by: str,
    organization_name: str = "Web3 Intel",
    expires_hours: int = 72
) -> str:
    """Generate beautiful HTML email template for invite."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to join {organization_name}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }}
        .card {{
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            border: 1px solid rgba(6, 182, 212, 0.2);
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }}
        .header {{
            text-align: center;
            padding: 32px 32px 24px;
            border-bottom: 1px solid rgba(34, 211, 238, 0.1);
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
        }}
        .logo {{
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 50%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }}
        .tagline {{
            font-size: 14px;
            color: #94a3b8;
        }}
        .content {{
            padding: 32px;
        }}
        .greeting {{
            font-size: 18px;
            font-weight: 600;
            color: #f8fafc;
            margin-bottom: 16px;
        }}
        .message {{
            color: #cbd5e1;
            margin-bottom: 24px;
            line-height: 1.7;
        }}
        .role-badge {{
            display: inline-block;
            background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%);
            color: white;
            padding: 6px 16px;
            border-radius: 50px;
            font-size: 13px;
            font-weight: 600;
            margin: 16px 0;
        }}
        .button-container {{
            text-align: center;
            margin: 32px 0;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%);
            color: white;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
        }}
        .button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(6, 182, 212, 0.4);
        }}
        .link-fallback {{
            background: rgba(15, 23, 42, 0.8);
            padding: 16px;
            border-radius: 12px;
            margin: 24px 0;
            border: 1px solid rgba(34, 211, 238, 0.2);
        }}
        .link-fallback p {{
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 8px;
        }}
        .link-fallback code {{
            display: block;
            word-break: break-all;
            font-size: 12px;
            color: #06b6d4;
            background: rgba(0, 0, 0, 0.3);
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin: 24px 0;
            padding: 16px;
            background: rgba(15, 23, 42, 0.5);
            border-radius: 16px;
        }}
        .info-item {{
            text-align: center;
        }}
        .info-label {{
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 4px;
        }}
        .info-value {{
            font-size: 14px;
            font-weight: 600;
            color: #f8fafc;
        }}
        .footer {{
            text-align: center;
            padding: 24px 32px;
            border-top: 1px solid rgba(34, 211, 238, 0.1);
            font-size: 12px;
            color: #64748b;
            background: rgba(2, 6, 23, 0.5);
        }}
        .footer a {{
            color: #06b6d4;
            text-decoration: none;
        }}
        .expiry-note {{
            font-size: 12px;
            color: #64748b;
            margin-top: 16px;
            text-align: center;
        }}
        @media (max-width: 600px) {{
            .content {{
                padding: 24px;
            }}
            .info-grid {{
                grid-template-columns: 1fr;
                gap: 12px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Web3 Intel</div>
                <div class="tagline">AI-powered Web3 intelligence platform</div>
            </div>
            
            <div class="content">
                <div class="greeting">Hello,</div>
                
                <div class="message">
                    <strong>{invited_by}</strong> has invited you to join <strong>{organization_name}</strong> 
                    as a <strong style="color: #06b6d4;">{role}</strong>.
                </div>
                
                <div style="text-align: center;">
                    <div class="role-badge">Role: {role.upper()}</div>
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Organization</div>
                        <div class="info-value">{organization_name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Invited by</div>
                        <div class="info-value">{invited_by}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Role</div>
                        <div class="info-value">{role}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Expires in</div>
                        <div class="info-value">{expires_hours} hours</div>
                    </div>
                </div>
                
                <div class="button-container">
                    <a href="{invite_link}" class="button">Accept Invitation →</a>
                </div>
                
                <div class="link-fallback">
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <code>{invite_link}</code>
                </div>
                
                <div class="expiry-note">
                    ⏰ This invitation will expire in {expires_hours} hours.<br>
                    If you didn't request this, you can safely ignore this email.
                </div>
            </div>
            
            <div class="footer">
                <p>© 2024 Web3 Intel. All rights reserved.</p>
                <p>
                    <a href="{FRONTEND_URL}">{FRONTEND_URL}</a> | 
                    Real-time Web3 intelligence for serious decision-making
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    """


def get_invite_email_text(
    invite_link: str,
    role: str,
    invited_by: str,
    organization_name: str = "Web3 Intel",
    expires_hours: int = 72
) -> str:
    """Generate plain text email template for invite (fallback for email clients that don't support HTML)."""
    return f"""
═══════════════════════════════════════
         INVITATION TO JOIN
         {organization_name.upper()}
═══════════════════════════════════════

Hello,

{invited_by} has invited you to join {organization_name} as a {role}.

Click the link below to accept your invitation:

{invite_link}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Details:
   • Organization: {organization_name}
   • Invited by: {invited_by}
   • Role: {role}
   • Expires in: {expires_hours} hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ This invitation will expire in {expires_hours} hours.

If you didn't expect this invitation, you can safely ignore this email.

For support, please contact our team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Web3 Intel - AI-powered Web3 intelligence
{FRONTEND_URL}
═══════════════════════════════════════
    """


def get_welcome_email_html(
    user_name: str,
    organization_name: str = "Web3 Intel"
) -> str:
    """Generate welcome email for new users."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to {organization_name}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
            margin: 0;
            padding: 0;
        }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
        .card {{
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            border: 1px solid rgba(6, 182, 212, 0.2);
            overflow: hidden;
        }}
        .header {{
            text-align: center;
            padding: 32px;
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
        }}
        .logo {{
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 50%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        .content {{ padding: 32px; }}
        .greeting {{ font-size: 24px; font-weight: 700; color: #f8fafc; margin-bottom: 16px; }}
        .message {{ color: #cbd5e1; margin-bottom: 24px; }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%);
            color: white;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 10px;
            font-weight: 600;
        }}
        .footer {{
            text-align: center;
            padding: 24px;
            border-top: 1px solid rgba(34, 211, 238, 0.1);
            font-size: 12px;
            color: #64748b;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Web3 Intel</div>
            </div>
            <div class="content">
                <div class="greeting">Welcome, {user_name}! 🎉</div>
                <div class="message">
                    You've successfully joined <strong>{organization_name}</strong>. We're excited to have you on board!
                </div>
                <div style="text-align: center;">
                    <a href="{FRONTEND_URL}/dashboard" class="button">Go to Dashboard →</a>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 Web3 Intel. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    """


# ============================================
# PROVIDER IMPLEMENTATIONS
# ============================================

def send_email_resend(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send email using Resend API."""
    try:
        import resend
        
        resend.api_key = RESEND_API_KEY
        
        params = {
            "from": f"{FROM_NAME} <{FROM_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        if text_content:
            params["text"] = text_content
        
        email = resend.Emails.send(params)
        logger.info(f"Email sent via Resend to {to_email}: {email}")
        return True
        
    except ImportError:
        logger.error("Resend library not installed. Run: pip install resend")
        return False
    except Exception as e:
        logger.error(f"Failed to send email via Resend to {to_email}: {e}")
        return False


def send_email_sendgrid(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send email using SendGrid API."""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        message = Mail(
            from_email=Email(FROM_EMAIL, FROM_NAME),
            to_emails=To(to_email),
            subject=subject,
            html_content=html_content
        )
        
        if text_content:
            message.content = Content("text/plain", text_content)
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code in [200, 202]:
            logger.info(f"Email sent via SendGrid to {to_email}")
            return True
        else:
            logger.error(f"SendGrid returned status {response.status_code}")
            return False
        
    except ImportError:
        logger.error("SendGrid library not installed. Run: pip install sendgrid")
        return False
    except Exception as e:
        logger.error(f"Failed to send email via SendGrid to {to_email}: {e}")
        return False


def send_email_smtp(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send email using SMTP."""
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        
        if text_content:
            part1 = MIMEText(text_content, "plain")
            msg.attach(part1)
        
        part2 = MIMEText(html_content, "html")
        msg.attach(part2)
        
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT)
        
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent via SMTP to {to_email}")
        return True
        
    except ImportError:
        logger.error("SMTP libraries are built-in")
        return False
    except Exception as e:
        logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
        return False


def send_email_ses(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send email using AWS SES."""
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        session = boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        client = session.client('ses')
        
        body = {}
        if text_content:
            body["Text"] = {"Data": text_content}
        body["Html"] = {"Data": html_content}
        
        response = client.send_email(
            Source=f"{FROM_NAME} <{FROM_EMAIL}>",
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject},
                "Body": body
            }
        )
        
        logger.info(f"Email sent via SES to {to_email}: {response['MessageId']}")
        return True
        
    except ImportError:
        logger.error("boto3 library not installed. Run: pip install boto3")
        return False
    except ClientError as e:
        logger.error(f"Failed to send email via SES to {to_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error with SES: {e}")
        return False


# ============================================
# MAIN EMAIL SENDING FUNCTIONS
# ============================================

def send_invite_email(
    email: str,
    invite_link: str,
    role: str,
    invited_by: str,
    organization_name: str = "Web3 Intel",
    expires_hours: int = 72
) -> bool:
    """
    Send an invite email to a user.
    
    Args:
        email: Recipient email address
        invite_link: Full HTTPS invite link
        role: User role (admin, member, viewer, etc.)
        invited_by: Name of the person who sent the invite
        organization_name: Name of the organization
        expires_hours: Hours until invite expires
    
    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = f"You've been invited to join {organization_name} as a {role}"
    
    html_content = get_invite_email_html(
        invite_link=invite_link,
        role=role,
        invited_by=invited_by,
        organization_name=organization_name,
        expires_hours=expires_hours
    )
    
    text_content = get_invite_email_text(
        invite_link=invite_link,
        role=role,
        invited_by=invited_by,
        organization_name=organization_name,
        expires_hours=expires_hours
    )
    
    # Validate email configuration before sending
    if not email or "@" not in email:
        logger.error(f"Invalid email address: {email}")
        return False
    
    # Route to the appropriate email provider
    if EMAIL_PROVIDER == "resend":
        return send_email_resend(email, subject, html_content, text_content)
    elif EMAIL_PROVIDER == "sendgrid":
        return send_email_sendgrid(email, subject, html_content, text_content)
    elif EMAIL_PROVIDER == "smtp":
        return send_email_smtp(email, subject, html_content, text_content)
    elif EMAIL_PROVIDER == "ses":
        return send_email_ses(email, subject, html_content, text_content)
    else:
        logger.error(f"Unknown EMAIL_PROVIDER: {EMAIL_PROVIDER}")
        return False


def send_welcome_email(
    email: str,
    user_name: str,
    organization_name: str = "Web3 Intel"
) -> bool:
    """
    Send a welcome email to a new user.
    
    Args:
        email: Recipient email address
        user_name: Name of the user
        organization_name: Name of the organization
    
    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = f"Welcome to {organization_name}!"
    
    html_content = get_welcome_email_html(
        user_name=user_name,
        organization_name=organization_name
    )
    
    if EMAIL_PROVIDER == "resend":
        return send_email_resend(email, subject, html_content)
    elif EMAIL_PROVIDER == "sendgrid":
        return send_email_sendgrid(email, subject, html_content)
    elif EMAIL_PROVIDER == "smtp":
        return send_email_smtp(email, subject, html_content)
    elif EMAIL_PROVIDER == "ses":
        return send_email_ses(email, subject, html_content)
    else:
        logger.error(f"Unknown EMAIL_PROVIDER: {EMAIL_PROVIDER}")
        return False


# ============================================
# UTILITY FUNCTIONS
# ============================================

def validate_email_config() -> Dict[str, Any]:
    """Validate that email configuration is complete."""
    config_status = {
        "provider": EMAIL_PROVIDER,
        "from_email": FROM_EMAIL,
        "from_name": FROM_NAME,
        "frontend_url": FRONTEND_URL,
        "configured": False,
        "missing": [],
        "warnings": []
    }
    
    # Check required fields
    if not FROM_EMAIL:
        config_status["missing"].append("FROM_EMAIL")
    
    if not FRONTEND_URL:
        config_status["missing"].append("FRONTEND_URL")
    elif not FRONTEND_URL.startswith("https://"):
        config_status["warnings"].append("FRONTEND_URL should use HTTPS in production")
    
    # Check provider-specific configuration
    if EMAIL_PROVIDER == "resend":
        if not RESEND_API_KEY:
            config_status["missing"].append("RESEND_API_KEY")
    
    elif EMAIL_PROVIDER == "sendgrid":
        if not SENDGRID_API_KEY:
            config_status["missing"].append("SENDGRID_API_KEY")
    
    elif EMAIL_PROVIDER == "smtp":
        if not SMTP_HOST:
            config_status["missing"].append("SMTP_HOST")
        if not SMTP_USER or not SMTP_PASSWORD:
            config_status["missing"].append("SMTP_USER or SMTP_PASSWORD")
    
    elif EMAIL_PROVIDER == "ses":
        if not AWS_REGION:
            config_status["missing"].append("AWS_REGION")
    
    config_status["configured"] = len(config_status["missing"]) == 0
    
    return config_status


def get_email_provider_info() -> Dict[str, Any]:
    """Get information about the current email provider configuration."""
    return {
        "provider": EMAIL_PROVIDER,
        "from_email": FROM_EMAIL,
        "from_name": FROM_NAME,
        "frontend_url": FRONTEND_URL,
        "is_configured": len([x for x in validate_email_config().get("missing", [])]) == 0
    }


# ============================================
# INITIALIZATION
# ============================================

# Log configuration on import
config_status = validate_email_config()
if not config_status["configured"]:
    logger.warning(f"Email service not fully configured. Missing: {config_status['missing']}")
else:
    logger.info(f"Email service configured with provider: {EMAIL_PROVIDER}")