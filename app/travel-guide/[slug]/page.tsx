import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";

import { getHomepageGuide } from "@/lib/site-content";

type TravelGuideArticlePageProps = {
  params: Promise<{ slug: string }>;
};

async function getGuide(slug: string) {
  const { content: guides } = await getHomepageGuide("published");
  const guide = guides.find((item) => item.slug === slug && item.published);
  return { guide, guides };
}

export async function generateMetadata({ params }: TravelGuideArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { guide } = await getGuide(slug);

  if (!guide) {
    return {};
  }

  return {
    title: guide.seoTitle || guide.title,
    description: guide.seoDescription || guide.summary
  };
}

export default async function TravelGuideArticlePage({ params }: TravelGuideArticlePageProps) {
  const { slug } = await params;
  const { guide, guides } = await getGuide(slug);

  if (!guide) {
    notFound();
  }

  const related = guides.filter((item) => guide.relatedSlugs.includes(item.slug) && item.published).slice(0, 3);

  return (
    <main className="guide-article">
      <nav className="guide-article__mobile-nav" aria-label="Article navigation">
        <Link href="/travel-guide" aria-label="Back to Travel Guide"><ArrowLeft size={18} /></Link>
        <button type="button" aria-label="Bookmark article"><Bookmark size={18} /></button>
      </nav>
      <section
        className="guide-article__hero"
        style={guide.imageUrl ? { backgroundImage: `url(${guide.imageUrl})` } : undefined}
      >
        <div className="guide-article__overlay" />
        <div className="lux-container">
          <p className="lux-eyebrow">{guide.category}</p>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
          {guide.lastUpdated ? <span>Last updated {guide.lastUpdated}</span> : null}
        </div>
      </section>

      <article className="guide-article__body lux-container">
        {guide.tips.length ? (
          <aside className="guide-article__quick-info">
            <h2>Tips</h2>
            <ul>
              {guide.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="guide-article__content">
          <p>{guide.mainContent}</p>

          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          {guide.faq.length ? (
            <section className="guide-article__faq">
              <h2>FAQ</h2>
              {guide.faq.map((item) => (
                <details key={item.question} open>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </section>
          ) : null}
        </div>

        {related.length ? (
          <section className="guide-article__related">
            <h2>Related Travel Guides</h2>
            <div>
              {related.map((item) => (
                <Link href={`/travel-guide/${item.slug}`} key={item.slug}>
                  {item.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
