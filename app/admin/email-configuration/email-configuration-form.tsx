"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  saveEmailConfigurationAction,
  sendTestEmailAction,
  testSmtpConnectionAction
} from "@/app/admin/email-configuration/actions";
import type { EmailConfiguration, EmailProvider } from "@/lib/email/email-config";

const providerDefaults: Record<EmailProvider, { smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpRequireTls: boolean; description: string }> = {
  google_workspace: {
    smtpHost: "smtp-relay.gmail.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpRequireTls: true,
    description: "Use Google Workspace SMTP relay or authenticated SMTP to send website notifications from your domain."
  },
  microsoft_365: {
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpRequireTls: true,
    description: "Use Microsoft 365 SMTP to send website notifications from your organization mailbox."
  },
  custom_smtp: {
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpRequireTls: true,
    description: "Use any compatible SMTP server by manually entering SMTP connection details."
  }
};

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <p className={error ? "form-status error" : "form-status"}>{error || message}</p>;
}

function statusLabel(config: EmailConfiguration) {
  if (!config.smtpHost || !config.smtpUsername || !config.fromEmail || !config.hasPassword) return "Not Configured";
  if (!config.enabled) return "Disabled";
  if (config.lastTestStatus === "failed") return "Last Test Failed";
  if (config.lastTestStatus === "success") return "Last Test Successful";
  return "Enabled";
}

export function EmailConfigurationForm({ config }: { config: EmailConfiguration }) {
  const [saveState, saveAction, savePending] = useActionState(saveEmailConfigurationAction, undefined);
  const [verifyState, verifyAction, verifyPending] = useActionState(testSmtpConnectionAction, undefined);
  const [testState, testAction, testPending] = useActionState(sendTestEmailAction, undefined);
  const [provider, setProvider] = useState<EmailProvider>(config.provider);
  const [smtpHost, setSmtpHost] = useState(config.smtpHost);
  const [smtpPort, setSmtpPort] = useState(String(config.smtpPort || 587));
  const [smtpSecure, setSmtpSecure] = useState(config.smtpSecure);
  const [smtpRequireTls, setSmtpRequireTls] = useState(config.smtpRequireTls);

  useEffect(() => {
    if (provider === "custom_smtp") return;
    const defaults = providerDefaults[provider];
    setSmtpHost(defaults.smtpHost);
    setSmtpPort(String(defaults.smtpPort));
    setSmtpSecure(defaults.smtpSecure);
    setSmtpRequireTls(defaults.smtpRequireTls);
  }, [provider]);

  const badge = useMemo(() => statusLabel(config), [config]);

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Email Configuration</p>
          <h2>Configure how website notifications are sent.</h2>
          <p>Website enquiries, contact messages, partner alerts, and newsletter notifications use this SMTP configuration.</p>
        </div>
        <span className="status-pill">{badge}</span>
      </div>

      <form action={saveAction} className="stack">
        <div className="panel panel-soft">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Email Service Status</p>
              <h3>Email notifications</h3>
            </div>
          </div>
          <div className="form-grid">
            <label className="field checkbox-field">
              <input name="enabled" type="checkbox" defaultChecked={config.enabled} />
              Enable Email Notifications
            </label>
            <label className="field">
              Active Provider
              <select name="provider" value={provider} onChange={(event) => setProvider(event.target.value as EmailProvider)}>
                <option value="google_workspace">Google Workspace</option>
                <option value="microsoft_365">Microsoft 365</option>
                <option value="custom_smtp">Custom SMTP</option>
              </select>
            </label>
          </div>
          <p className="form-helper">{providerDefaults[provider].description}</p>
        </div>

        <div className="panel panel-soft">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Advanced SMTP Settings</p>
              <h3>SMTP server settings</h3>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              SMTP Host
              <input name="smtpHost" value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} required />
            </label>
            <label className="field">
              SMTP Port
              <input name="smtpPort" value={smtpPort} onChange={(event) => setSmtpPort(event.target.value)} inputMode="numeric" required />
            </label>
            <label className="field checkbox-field">
              <input name="smtpSecure" type="checkbox" checked={smtpSecure} onChange={(event) => setSmtpSecure(event.target.checked)} />
              Secure SSL
            </label>
            <label className="field checkbox-field">
              <input name="smtpRequireTls" type="checkbox" checked={smtpRequireTls} onChange={(event) => setSmtpRequireTls(event.target.checked)} />
              Require TLS
            </label>
          </div>
          <p className="form-helper">Port 587 usually uses Secure SSL off and Require TLS on. Port 465 usually uses Secure SSL on.</p>
        </div>

        <div className="panel panel-soft">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Authentication</p>
              <h3>SMTP mailbox credentials</h3>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              SMTP Username
              <input name="smtpUsername" defaultValue={config.smtpUsername} autoComplete="off" required />
            </label>
            <label className="field">
              SMTP Password / App Password
              <input
                name="smtpPassword"
                type="password"
                placeholder={config.hasPassword ? "Saved password is masked. Enter a new password to change it." : "Enter SMTP password or app password"}
                autoComplete="new-password"
              />
            </label>
          </div>
        </div>

        <div className="panel panel-soft">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Sender Details</p>
              <h3>From and reply-to</h3>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              From Name
              <input name="fromName" defaultValue={config.fromName} required />
            </label>
            <label className="field">
              From Email Address
              <input name="fromEmail" type="email" defaultValue={config.fromEmail} required />
            </label>
            <label className="field">
              Reply-To Email Address
              <input name="replyToEmail" type="email" defaultValue={config.replyToEmail} />
            </label>
          </div>
        </div>

        <div className="panel panel-soft">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Notification Recipients</p>
              <h3>Comma-separated email lists</h3>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              General Notification Emails
              <textarea name="generalRecipients" defaultValue={config.generalRecipients} />
            </label>
            <label className="field">
              Contact Form Recipient Emails
              <textarea name="contactRecipients" defaultValue={config.contactRecipients} />
            </label>
            <label className="field">
              Resort / Hotel / Liveaboard Enquiry Recipient Emails
              <textarea name="enquiryRecipients" defaultValue={config.enquiryRecipients} />
            </label>
            <label className="field">
              Newsletter Notification Emails
              <textarea name="newsletterRecipients" defaultValue={config.newsletterRecipients} />
            </label>
            <label className="field">
              Optional CC Emails
              <textarea name="ccRecipients" defaultValue={config.ccRecipients} />
            </label>
            <label className="field">
              Optional BCC Emails
              <textarea name="bccRecipients" defaultValue={config.bccRecipients} />
            </label>
          </div>
        </div>

        <div className="admin-form-actions">
          <button className="button" type="submit" disabled={savePending}>
            {savePending ? "Saving..." : "Save Email Configuration"}
          </button>
        </div>
        <StatusMessage message={saveState?.message} error={saveState?.error} />
      </form>

      <div className="panel panel-soft">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Test & Verify</p>
            <h3>SMTP testing</h3>
          </div>
        </div>
        <div className="admin-form-actions">
          <form action={verifyAction}>
            <button className="button-muted" type="submit" disabled={verifyPending}>
              {verifyPending ? "Testing..." : "Test SMTP Connection"}
            </button>
          </form>
          <form action={testAction} className="inline-form">
            <input className="admin-input" name="testRecipient" placeholder="Optional test recipient" />
            <button className="button-muted" type="submit" disabled={testPending}>
              {testPending ? "Sending..." : "Send Test Email"}
            </button>
          </form>
        </div>
        <StatusMessage message={verifyState?.message} error={verifyState?.error} />
        <StatusMessage message={testState?.message} error={testState?.error} />
      </div>

      <div className="panel panel-soft">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Status and Audit</p>
            <h3>Recent activity</h3>
          </div>
        </div>
        <div className="admin-detail-list">
          <span>Last test status</span><strong>{config.lastTestStatus || "Not configured"}</strong>
          <span>Last test message</span><strong>{config.lastTestMessage || "-"}</strong>
          <span>Last tested at</span><strong>{config.lastTestedAt || "-"}</strong>
          <span>Last successful connection</span><strong>{config.lastSuccessfulTestAt || "-"}</strong>
          <span>Last successful email</span><strong>{config.lastSuccessfulEmailAt || "-"}</strong>
          <span>Last error</span><strong>{config.lastErrorSummary || "-"}</strong>
          <span>Updated at</span><strong>{config.updatedAt || "-"}</strong>
        </div>
      </div>
    </div>
  );
}
