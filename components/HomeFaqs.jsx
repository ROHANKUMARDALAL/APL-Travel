"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Reveal, { revealVariant } from "@/components/motion/Reveal";
import { HOME_FAQ_TOPICS, HOME_FAQS } from "@/data/mock/homeFaqs";

export default function HomeFaqs() {
  const [topicId, setTopicId] = useState("all");
  const [openId, setOpenId] = useState(null);

  const faqs = useMemo(() => {
    if (topicId === "all") return HOME_FAQS;
    return HOME_FAQS.filter((item) => item.topicId === topicId);
  }, [topicId]);

  function toggleItem(id) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section id="faqs" className="home-faq-band">
      <div className="container-page">
        <Reveal variant="up">
          <p className="section-eyebrow">Help before you book</p>
          <h2 className="section-title">Frequently asked questions</h2>
          <p className="section-copy">
            Clear answers for flights, hotels, buses, payments, and your account —
            open any question below.
          </p>
        </Reveal>

        <Reveal variant="up" step={1}>
          <div className="home-faq-topics" role="tablist" aria-label="FAQ topics">
            {HOME_FAQ_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                role="tab"
                aria-selected={topicId === topic.id}
                className={`home-faq-topic ${topicId === topic.id ? "is-active" : ""}`}
                onClick={() => {
                  setTopicId(topic.id);
                  setOpenId(null);
                }}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="home-faq-list">
          {faqs.map((item, index) => {
            const isOpen = openId === item.id;
            return (
              <Reveal
                key={item.id}
                variant={revealVariant(index + 2)}
                step={index}
                className="home-faq-reveal"
              >
                <div
                  className={`home-faq-item home-faq-tone-${item.topicId} ${isOpen ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="home-faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                    id={`faq-trigger-${item.id}`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <span className="home-faq-question">{item.question}</span>
                    <span className="home-faq-chevron" aria-hidden="true" />
                  </button>
                  <div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${item.id}`}
                    className="home-faq-panel"
                    hidden={!isOpen}
                  >
                    <p>{item.answer}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal variant="up" step={2}>
          <p className="home-faq-more">
            Need something else?{" "}
            <Link href="/support" className="home-faq-more-link">
              Visit the support centre
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
