"use client";

import { useActionState, useEffect, useState } from "react";

import {
  saveEmailConfigurationAction,
  sendTestEmailAction,
  testSmtpConnectionAction
} from "@/app/admin/email-configuration/actions";
import { ActionMessage } from "@/components/admin/action-feedback";
import type { EmailConfiguration, EmailProvider } from "@/lib/email/email-config";

const providerDefaults: Record<EmailProvider, { smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpRequireTls: boolean }> = {
  google_workspace: { smtpHost: "smtp.gmail.com", smtpPort: 587, smtpSecure: false, smtpRequireTls: true },
  microsoft_365: { smtpHost: "smtp.office365.com", smtpPort: 587, smtpSecure: false, smtpRequireTls: true },
  custom_smtp: { smtpHost: "", smtpPort: 587, smtpSecure: false, smtpRequireTls: true }
};

function StatusMessage({ message, error }: { message?: string; error?: string }) {
  return <ActionMessage state={error || message ? { error, message } : undefined} />;
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

  return (
    <div className="email-config-v3">
      <form action={saveAction} className="email-config-v3__form">
        <section className="email-section">
          <h2 className="email-section-title">SMTP Settings</h2>
          <div className="settings-form-2col">
            <label className="field">
              Provider
              <select name="provider" value={provider} onChange={(event) => setProvider(event.target.value as EmailProvider)}>
                <option value="google_workspace">Google Workspace</option>
                <option value="microsoft_365">Microsoft 365</option>
                <option value="custom_smtp">Custom SMTP</option>
              </select>
            </label>
            <label className="field">
              SMTP Host
              <input name="smtpHost" value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} required />
            </label>
            <label className="field">
              Port
              <input name="smtpPort" value={smtpPort} onChange={(event) => setSmtpPort(event.target.value)} inputMode="numeric" required />
            </label>
            <label className="field">
              Username
              <input name="smtpUsername" defaultValue={config.smtpUsername} autoComplete="off" required />
            </label>
            <label className="field field--full">
              Password
              <input
                name="smtpPassword"
                type="password"
                placeholder={config.hasPassword ? "Saved - enter a new password only to replace it" : "SMTP password or app password"}
                autoComplete="new-password"
              />
            </label>
          </div>
          <div className="email-inline-options">
            <label><input name="smtpSecure" type="checkbox" checked={smtpSecure} onChange={(event) => setSmtpSecure(event.target.checked)} /> SSL/TLS</label>
            <label><input name="smtpRequireTls" type="checkbox" checked={smtpRequireTls} onChange={(event) => setSmtpRequireTls(event.target.checked)} /> Require STARTTLS</label>
          </div>
        </section>

        <section className="email-section">
          <h2 className="email-section-title">Sender Identity</h2>
          <div className="settings-form-2col">
            <label className="field">From Name<input name="fromName" defaultValue={config.fromName} required /></label>
            <label className="field">From Address<input name="fromEmail" type="email" defaultValue={config.fromEmail} required /></label>
            <label className="field field--full">Reply-To<input name="replyToEmail" type="email" defaultValue={config.replyToEmail} /></label>
          </div>
        </section>

        <section className="email-section">
          <h2 className="email-section-title">Notification Recipients</h2>
          <label className="settings-row email-enabled-row">
            <span className="settings-row-info">
              <strong className="settings-row-label">Enable email notifications</strong>
              <span className="settings-row-desc">Use this configuration for website and admin notifications.</span>
            </span>
            <input name="enabled" type="checkbox" defaultChecked={config.enabled} />
          </label>
          <div className="settings-form-2col email-recipient-grid">
            <label className="field">General<input name="generalRecipients" defaultValue={config.generalRecipients} placeholder="admin@example.com" /></label>
            <label className="field">Contact Forms<input name="contactRecipients" defaultValue={config.contactRecipients} /></label>
            <label className="field">Property Enquiries<input name="enquiryRecipients" defaultValue={config.enquiryRecipients} /></label>
            <label className="field">Newsletter<input name="newsletterRecipients" defaultValue={config.newsletterRecipients} /></label>
            <label className="field">CC<input name="ccRecipients" defaultValue={config.ccRecipients} /></label>
            <label className="field">BCC<input name="bccRecipients" defaultValue={config.bccRecipients} /></label>
          </div>
        </section>

        <div className="email-config-v3__actions">
          <button className="button" type="submit" disabled={savePending}>{savePending ? "Saving..." : "Save Configuration"}</button>
        </div>
        <StatusMessage message={saveState?.message} error={saveState?.error} />
      </form>

      <section className="email-section email-test-section">
        <h2 className="email-section-title">Test & Verify</h2>
        <div className="email-test-actions">
          <form action={verifyAction}>
            <button className="button-muted" type="submit" disabled={verifyPending}>{verifyPending ? "Testing..." : "Test SMTP Connection"}</button>
          </form>
          <form action={testAction} className="inline-form">
            <input className="admin-input" name="testRecipient" placeholder="Optional test recipient" />
            <button className="button-muted" type="submit" disabled={testPending}>{testPending ? "Sending..." : "Send Test Email"}</button>
          </form>
        </div>
        <StatusMessage message={verifyState?.message || testState?.message} error={verifyState?.error || testState?.error} />
        <p className="email-audit-line">Last test: {config.lastTestStatus || "Not configured"}{config.lastTestedAt ? ` - ${config.lastTestedAt}` : ""}</p>
      </section>
    </div>
  );
}
