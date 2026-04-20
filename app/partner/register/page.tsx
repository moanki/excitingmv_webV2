import { PartnerRegisterForm } from "@/components/partner-register-form";

export default function PartnerRegisterPage() {
  return (
    <main className="shell section">
      <div className="panel">
        <p className="eyebrow">Partner Registration</p>
        <h1 className="section-title">Apply for partner access.</h1>
        <p className="muted">
          Once submitted, your request appears in the admin portal, can be exported by the team,
          and triggers a notification to the configured partner recipient.
        </p>
        <PartnerRegisterForm />
      </div>
    </main>
  );
}
