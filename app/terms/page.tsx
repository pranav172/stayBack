export default function TermsOfService() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#e4e4e7',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '14px' }}>← Back to mujAnon</a>
        
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginTop: '24px', marginBottom: '8px' }}>
          Terms of Service
        </h1>
        <p style={{ color: '#71717a', marginBottom: '32px' }}>Last updated: February 2026</p>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>1. Eligibility</h2>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li>You must be at least <strong style={{color:'#fff'}}>18 years old</strong> to use mujAnon.</li>
            <li>You must be a current student or staff member of Manipal University Jaipur.</li>
            <li>By using mujAnon, you confirm that you meet these requirements.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>2. Acceptable Use</h2>
          <p style={{ marginBottom: '12px' }}>You agree NOT to:</p>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li>Harass, bully, or threaten other users</li>
            <li>Share explicit sexual content or solicitations</li>
            <li>Share personal information (yours or others&apos;) without consent</li>
            <li>Impersonate another person or entity</li>
            <li>Share content that is illegal in India</li>
            <li>Spam, advertise, or promote external services</li>
            <li>Attempt to identify other anonymous users</li>
            <li>Circumvent bans or suspensions using multiple devices</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>3. Anonymity & Privacy</h2>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li>Chat sessions are anonymous. We do not display names or profile information.</li>
            <li>Messages are automatically deleted after <strong style={{color:'#fff'}}>24 hours</strong>.</li>
            <li>We collect device identifiers to prevent abuse and enforce bans.</li>
            <li>Report data may be retained for up to 7 days for moderation purposes.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>4. Moderation & Enforcement</h2>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li>We may suspend or ban accounts that violate these terms.</li>
            <li>Bans are applied to your device and cannot be circumvented.</li>
            <li>We may share information with law enforcement if required by law or in cases of imminent harm.</li>
            <li>False reports may result in suspension of your access.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>5. Disclaimer of Warranties</h2>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li>mujAnon is provided &quot;as is&quot; without warranties of any kind.</li>
            <li>We do not guarantee service availability or uptime.</li>
            <li>We are not responsible for content shared by other users.</li>
            <li>You use mujAnon at your own risk.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>6. Limitation of Liability</h2>
          <p style={{ lineHeight: 1.8 }}>
            To the maximum extent permitted by law, mujAnon and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>7. Changes to Terms</h2>
          <p style={{ lineHeight: 1.8 }}>
            We may update these terms at any time. Continued use of mujAnon after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>8. Contact</h2>
          <p style={{ lineHeight: 1.8 }}>
            For questions about these terms, contact us at: <a href="mailto:support@mujanon.com" style={{ color: '#818cf8' }}>support@mujanon.com</a>
          </p>
        </section>

        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', marginTop: '48px' }}>
          <p style={{ color: '#52525b', fontSize: '14px' }}>
            © 2026 mujAnon. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
