import PublicLayout from "./PublicLayout";

const EFFECTIVE_DATE = "June 1, 2025";
const COMPANY = "Fincode POS";
const EMAIL = "legal@fincode.com";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "var(--tx2)", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--tx)", margin: "0 0 10px" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: "var(--tx3)", margin: 0 }}>
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using {COMPANY} ("the Service"), you agree to be bound by these Terms of
            Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These
            Terms apply to all users, including businesses and their employees who access the Service
            through a company account.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            {COMPANY} is a cloud-based point-of-sale (POS) platform that provides tools for inventory
            management, sales processing, purchase tracking, reporting, and multi-store operations.
            The Service is provided on a subscription basis.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <p style={{ marginBottom: 10 }}>
            To use the Service, you must create an account. You agree to:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>Provide accurate, current, and complete information during registration.</li>
            <li style={{ marginBottom: 6 }}>Maintain and promptly update your account information.</li>
            <li style={{ marginBottom: 6 }}>Keep your password secure and confidential.</li>
            <li style={{ marginBottom: 6 }}>Notify us immediately of any unauthorized access or breach of security.</li>
            <li style={{ marginBottom: 6 }}>Accept responsibility for all activities that occur under your account.</li>
          </ul>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <p style={{ marginBottom: 10 }}>
            Access to the Service beyond the free trial period requires a paid subscription. By
            subscribing:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>You authorize us to charge the applicable fees to your selected payment method.</li>
            <li style={{ marginBottom: 6 }}>Subscription fees are billed at the start of each billing period.</li>
            <li style={{ marginBottom: 6 }}>All fees are non-refundable except as specified in our Refund Policy.</li>
            <li style={{ marginBottom: 6 }}>
              We reserve the right to change pricing with 30 days' advance notice. Continued use after
              the notice period constitutes acceptance of the new pricing.
            </li>
          </ul>
          <p style={{ marginTop: 10 }}>
            Payments are processed securely through Paddle, our authorized payment processor.
          </p>
        </Section>

        <Section title="5. Free Trial">
          <p>
            New accounts receive a 7-day free trial with full access to the Service. No credit card is
            required to start your trial. At the end of the trial, your account will be suspended unless
            you subscribe to a paid plan. We reserve the right to modify or terminate the trial offer at
            any time.
          </p>
        </Section>

        <Section title="6. Acceptable Use">
          <p style={{ marginBottom: 10 }}>You agree not to:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>Use the Service for any unlawful purpose or in violation of any regulations.</li>
            <li style={{ marginBottom: 6 }}>Attempt to gain unauthorized access to any part of the Service or its related systems.</li>
            <li style={{ marginBottom: 6 }}>Reverse engineer, decompile, or disassemble any portion of the Service.</li>
            <li style={{ marginBottom: 6 }}>Transmit viruses, malware, or any other malicious code.</li>
            <li style={{ marginBottom: 6 }}>Resell, sublicense, or otherwise transfer your access to the Service to third parties.</li>
            <li style={{ marginBottom: 6 }}>Use the Service to process fraudulent transactions or conduct illegal activities.</li>
          </ul>
        </Section>

        <Section title="7. Data and Privacy">
          <p>
            Your use of the Service is also governed by our Privacy Policy, which is incorporated into
            these Terms by reference. You retain ownership of the data you input into the Service.
            By using the Service, you grant us a limited license to store and process your data solely
            to provide the Service.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            The Service, including all software, design, text, graphics, and other content, is owned by
            {" "}{COMPANY} and is protected by intellectual property laws. Nothing in these Terms transfers
            any intellectual property rights to you. You are granted a limited, non-exclusive,
            non-transferable license to access and use the Service for your business operations.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            We may suspend or terminate your account at any time if you breach these Terms or if we
            determine that your use of the Service poses a risk to us or other users. You may cancel your
            subscription at any time through your account settings. Upon termination, your right to
            access the Service ceases immediately. We may retain your data for a limited period after
            termination as described in our Privacy Policy.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {COMPANY} shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising out of your use of or
            inability to use the Service, even if we have been advised of the possibility of such
            damages. Our total liability to you for any claims arising under these Terms shall not
            exceed the amount you paid us in the 3 months preceding the claim.
          </p>
        </Section>

        <Section title="11. Disclaimer of Warranties">
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, either
            express or implied, including but not limited to implied warranties of merchantability,
            fitness for a particular purpose, or non-infringement. We do not warrant that the Service
            will be uninterrupted, error-free, or completely secure.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws. Any
            disputes arising from these Terms or your use of the Service shall be resolved through
            binding arbitration or in the courts of the applicable jurisdiction.
          </p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>
            We reserve the right to update these Terms at any time. We will notify you of material
            changes via email or a notice within the Service at least 14 days before the changes take
            effect. Your continued use of the Service after the effective date constitutes acceptance of
            the updated Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            If you have questions about these Terms, please contact us at{" "}
            <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)" }}>{EMAIL}</a>.
          </p>
        </Section>
      </div>
    </PublicLayout>
  );
}
