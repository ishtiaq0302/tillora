import { Link } from "react-router-dom";
import PublicLayout from "./PublicLayout";

const EFFECTIVE_DATE = "June 1, 2025";
const COMPANY = "Fincode POS";
const EMAIL = "billing@fincode.com";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "var(--tx2)", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

function Highlight({ color = "var(--gbg)", textColor = "var(--green)", children }) {
  return (
    <div
      style={{
        background: color,
        borderRadius: "var(--r)",
        padding: "14px 18px",
        marginBottom: 24,
        fontSize: 14,
        color: textColor,
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

export default function RefundPolicy() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--tx)", margin: "0 0 10px" }}>
            Refund Policy
          </h1>
          <p style={{ fontSize: 13, color: "var(--tx3)", margin: 0 }}>
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>

        <Highlight>
          <strong>Summary:</strong> We offer a 7-day free trial so you can evaluate {COMPANY} before
          committing. Paid subscriptions are generally non-refundable, but we review refund requests on
          a case-by-case basis.
        </Highlight>

        <Section title="1. Free Trial">
          <p>
            All new accounts receive a 7-day free trial with full access to the Service. No credit card
            is required during the trial period. You are not charged anything, and there is nothing to
            refund if you decide not to continue after the trial ends.
          </p>
          <p style={{ marginTop: 10 }}>
            We strongly encourage you to evaluate the Service thoroughly during your trial before
            subscribing to a paid plan.
          </p>
        </Section>

        <Section title="2. Paid Subscriptions — General Policy">
          <p>
            All subscription fees are <strong>non-refundable</strong> once the billing period has begun,
            except as described below. By subscribing, you acknowledge that you have had the opportunity
            to evaluate the Service during the free trial and agree to these terms.
          </p>
        </Section>

        <Section title="3. Eligible Refund Situations">
          <p style={{ marginBottom: 10 }}>
            We will consider refund requests in the following circumstances:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 10 }}>
              <strong>Duplicate charges:</strong> If you were charged more than once for the same billing
              period due to a technical error, we will refund the duplicate charge in full.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong>Unauthorized charges:</strong> If you believe a charge was made without your
              authorization, contact us within 30 days. We will investigate and refund if verified.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong>Service unavailability:</strong> If the Service experiences significant downtime
              (more than 24 continuous hours) due to issues on our end, you may be eligible for a
              pro-rated credit or refund for the affected period.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong>Charged after cancellation:</strong> If you were charged after your cancellation
              was properly processed, we will refund the charge.
            </li>
          </ul>
        </Section>

        <Section title="4. Non-Eligible Situations">
          <p style={{ marginBottom: 10 }}>
            Refunds will <strong>not</strong> be issued for:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>Change of mind after subscribing.</li>
            <li style={{ marginBottom: 6 }}>Failure to cancel before the next billing cycle.</li>
            <li style={{ marginBottom: 6 }}>Unused portion of an active subscription period.</li>
            <li style={{ marginBottom: 6 }}>Account suspension due to violation of our Terms of Service.</li>
            <li style={{ marginBottom: 6 }}>Dissatisfaction with features available during your free trial.</li>
          </ul>
        </Section>

        <Section title="5. Cancellation">
          <p>
            You may cancel your subscription at any time from your account's Billing page. Cancellation
            takes effect at the end of the current billing period — you will retain access to the Service
            until that date. No further charges will be made after cancellation. Cancellation does not
            entitle you to a refund for the remaining days of the current period.
          </p>
        </Section>

        <Section title="6. How to Request a Refund">
          <p style={{ marginBottom: 10 }}>
            To request a refund, email us at{" "}
            <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)" }}>{EMAIL}</a> with the
            following information:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>Your account email address.</li>
            <li style={{ marginBottom: 6 }}>The date and amount of the charge.</li>
            <li style={{ marginBottom: 6 }}>The reason for the refund request.</li>
          </ul>
          <p style={{ marginTop: 10 }}>
            We aim to respond to all refund requests within 3 business days. Approved refunds are
            processed through Paddle (our payment processor) and typically appear within 5–10 business
            days depending on your bank or payment provider.
          </p>
        </Section>

        <Section title="7. Changes to This Policy">
          <p>
            We reserve the right to update this Refund Policy at any time. Changes will be posted on
            this page with an updated effective date. For significant changes, we will notify subscribers
            by email at least 14 days in advance.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            For billing questions or refund requests, contact us at{" "}
            <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)" }}>{EMAIL}</a>.
          </p>
        </Section>

        <div
          style={{
            background: "var(--bg2)", border: "1px solid var(--bd)",
            borderRadius: "var(--r)", padding: 24, marginTop: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)", marginBottom: 4 }}>
              Have a billing question?
            </div>
            <div style={{ fontSize: 13, color: "var(--tx3)" }}>
              We're happy to help. Reach out and we'll get back to you within one business day.
            </div>
          </div>
          <a
            href={`mailto:${EMAIL}`}
            style={{
              display: "inline-flex", alignItems: "center",
              background: "var(--accent)", color: "#fff",
              borderRadius: "var(--r)", padding: "10px 20px",
              fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Contact Billing
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}
