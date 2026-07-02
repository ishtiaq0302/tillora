import PublicLayout from "./PublicLayout";

const EFFECTIVE_DATE = "June 1, 2025";
const COMPANY = "Fincode POS";
const EMAIL = "privacy@fincode.com";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "var(--tx2)", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--tx)", margin: "0 0 10px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: "var(--tx3)", margin: 0 }}>
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>

        <p style={{ fontSize: 14, color: "var(--tx2)", lineHeight: 1.8, marginBottom: 36 }}>
          {COMPANY} ("we", "us", or "our") is committed to protecting the privacy of your data. This
          Privacy Policy explains what information we collect, how we use it, and your rights regarding
          your information when you use our Service.
        </p>

        <Section title="1. Information We Collect">
          <p style={{ marginBottom: 10 }}>We collect the following categories of information:</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Account Information</p>
          <p style={{ marginBottom: 12 }}>
            Name, email address, password (hashed), and business details provided during registration.
          </p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Business Data</p>
          <p style={{ marginBottom: 12 }}>
            Data you enter into the Service, including products, inventory, sales records, customer
            information, purchase orders, and financial transactions.
          </p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Payment Information</p>
          <p style={{ marginBottom: 12 }}>
            We do not store your payment card details. All payment processing is handled by Paddle,
            our PCI-compliant payment processor. We receive a transaction confirmation and the last
            four digits of the payment method for record-keeping.
          </p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Usage Data</p>
          <p>
            Log files, IP addresses, browser type, pages visited, and actions taken within the Service
            for security, debugging, and analytics purposes.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>To provide, operate, and maintain the Service.</li>
            <li style={{ marginBottom: 6 }}>To process payments and manage your subscription.</li>
            <li style={{ marginBottom: 6 }}>To send transactional emails (invoices, password resets, important notices).</li>
            <li style={{ marginBottom: 6 }}>To detect, investigate, and prevent fraud or unauthorized use.</li>
            <li style={{ marginBottom: 6 }}>To improve and develop new features of the Service.</li>
            <li style={{ marginBottom: 6 }}>To respond to support requests and inquiries.</li>
            <li style={{ marginBottom: 6 }}>To comply with legal obligations.</li>
          </ul>
        </Section>

        <Section title="3. Data Sharing">
          <p style={{ marginBottom: 10 }}>
            We do not sell your data. We share information only in the following circumstances:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Service Providers:</strong> We use trusted third-party vendors (e.g., Paddle for
              payments, cloud hosting providers) who process data on our behalf under strict
              confidentiality agreements.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Legal Requirements:</strong> We may disclose information if required by law,
              court order, or governmental authority.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
              assets, your data may be transferred. We will notify you before your data is subject to a
              different privacy policy.
            </li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>
            We retain your account data for as long as your account is active or as needed to provide the
            Service. Business data (sales records, inventory, etc.) is retained for the duration of your
            subscription plus an additional 90 days after cancellation, after which it is permanently
            deleted unless you request earlier deletion.
          </p>
        </Section>

        <Section title="5. Data Security">
          <p>
            We implement industry-standard security measures, including encryption in transit (TLS/HTTPS),
            hashed passwords, and access controls. While we strive to protect your data, no method of
            transmission over the internet is 100% secure. We encourage you to use a strong, unique
            password and to contact us immediately if you suspect unauthorized access.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            We use essential cookies to maintain your session and authentication state. We do not use
            third-party tracking or advertising cookies. You can disable cookies in your browser settings,
            but this may prevent certain features of the Service from functioning correctly.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p style={{ marginBottom: 10 }}>
            Depending on your jurisdiction, you may have the following rights:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li style={{ marginBottom: 6 }}><strong>Correction:</strong> Request that inaccurate data be corrected.</li>
            <li style={{ marginBottom: 6 }}><strong>Deletion:</strong> Request that your personal data be deleted.</li>
            <li style={{ marginBottom: 6 }}><strong>Portability:</strong> Request a machine-readable export of your data.</li>
            <li style={{ marginBottom: 6 }}><strong>Objection:</strong> Object to certain types of processing.</li>
          </ul>
          <p style={{ marginTop: 10 }}>
            To exercise any of these rights, please contact us at{" "}
            <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)" }}>{EMAIL}</a>.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            The Service is not directed at individuals under the age of 16. We do not knowingly collect
            personal information from children. If you believe we have inadvertently collected such
            information, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="9. Third-Party Links">
          <p>
            The Service may contain links to third-party websites or services. We are not responsible for
            the privacy practices of those third parties. We encourage you to review their privacy
            policies before providing any personal information.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes via
            email or an in-app notice. Your continued use of the Service after the effective date of an
            updated policy constitutes acceptance of the changes.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            If you have questions or concerns about this Privacy Policy, please contact our privacy team
            at{" "}
            <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)" }}>{EMAIL}</a>.
          </p>
        </Section>
      </div>
    </PublicLayout>
  );
}
