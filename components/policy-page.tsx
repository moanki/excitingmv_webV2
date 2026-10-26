import Link from "next/link";
import { getSitePolicy } from "@/lib/site-content";
import { type PolicyId } from "@/lib/site-policies";
import { ShowCookieNotice } from "@/components/cookie-notice";

export async function PolicyPage({ id }: { id: PolicyId }) {
  const { content } = await getSitePolicy(id);
  return <main className="policy-page">
    <article>
      <p className="lux-eyebrow">Exciting Maldives</p>
      <h1>{content.title}</h1>
      {content.effectiveDate ? <p className="policy-page__date">Effective date: <time dateTime={content.effectiveDate}>{content.effectiveDate}</time></p> : null}
      {content.body.trim() ? <div className="policy-page__body">{content.body}</div> : <p>For {id === "privacy" ? "privacy" : "cookie"} information, please <Link href="/contact">contact us</Link>.</p>}
      {id === "cookies" && content.noticeEnabled ? <ShowCookieNotice /> : null}
    </article>
  </main>;
}
