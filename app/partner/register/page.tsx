import { PartnerRegisterForm } from "@/components/partner-register-form";

export default function PartnerRegisterPage() {
  return (
    <main className="shell section">
      <div className="panel">
        <p className="eyebrow">Inquiries</p>
        <h1 className="section-title">Send us an inquiry.</h1>
        <p className="muted">
          Our team will get back within 24 hours. Once submitted, your request appears in the admin portal and
          triggers a notification to the configured partner recipient.
        </p>
        <PartnerRegisterForm />
      </div>
    </main>
  );
}
