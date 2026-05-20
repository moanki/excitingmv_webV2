import { CheckCircle2 } from "lucide-react";

import { PartnerRegisterForm } from "@/components/partner-register-form";

const benefits = [
  "Protected trade resources and partner access",
  "Commercially fluent resort recommendations",
  "Responsive Maldives-based support",
  "Curated offers for luxury client profiles"
];

export default function PartnerRegisterPage() {
  return (
    <main className="public-lux-page partner-register-page">
      <section className="public-lux-section partner-register">
        <div className="lux-container partner-register__grid">
          <div className="partner-register__copy">
            <p className="lux-eyebrow">Partner Inquiry</p>
            <h1>Travel Partnership</h1>
            <p>
              Send us an inquiry. Our team will get back within 24 hours with the right next step for
              your agency, tour operation, or travel design business.
            </p>
            <div className="partner-register__benefits">
              {benefits.map((benefit) => (
                <span key={benefit}><CheckCircle2 size={17} />{benefit}</span>
              ))}
            </div>
          </div>
          <div className="partner-register__form">
            <p className="lux-eyebrow">Access Request</p>
            <h2>Register interest</h2>
            <PartnerRegisterForm />
          </div>
        </div>
      </section>
    </main>
  );
}
