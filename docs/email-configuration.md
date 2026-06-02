# Email Configuration

The Admin Center Email Configuration module controls website notification email delivery through SMTP. Resend is no longer used as the active sending path.

## Access

Go to `Admin Center -> Email Configuration`.

Only authenticated admin users with `super_admin` or `admin` roles can save settings, test SMTP, or send a test email.

## Providers

The provider dropdown contains:

- Google Workspace
- Microsoft 365
- Custom SMTP

Google Workspace defaults:

- SMTP Host: `smtp-relay.gmail.com`
- SMTP Port: `587`
- Secure SSL: `false`
- Require TLS: `true`

Microsoft 365 defaults:

- SMTP Host: `smtp.office365.com`
- SMTP Port: `587`
- Secure SSL: `false`
- Require TLS: `true`

Custom SMTP allows the admin to manually enter all SMTP details.

## Required Vercel environment variable

Set this in Vercel Project Settings for Preview and Production:

```env
EMAIL_CONFIG_ENCRYPTION_KEY=
```

Use a 32-byte secret, preferably base64 encoded. Redeploy after adding or changing it.

Do not store SMTP passwords, app passwords, or encryption keys in GitHub.

## Password security

SMTP passwords are encrypted server-side with AES-256-GCM before storage in Supabase. The decrypted password is only used server-side by Nodemailer when testing or sending mail.

## Recipient routing

- Contact forms use Contact Form Recipient Emails, then fall back to General Notification Emails.
- Resort, hotel, and liveaboard enquiry notifications can use Enquiry Recipient Emails, then fall back to General Notification Emails.
- Newsletter notifications use Newsletter Recipient Emails, then fall back to General Notification Emails.

## Testing

Use:

- Test SMTP Connection: verifies the SMTP connection and authentication without sending mail.
- Send Test Email: sends a real email using the saved configuration.

Safe admin-facing error messages are shown for authentication, connection, TLS, and recipient failures. SMTP passwords and encryption keys are never displayed or logged.
