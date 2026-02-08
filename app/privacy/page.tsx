export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p style={{ color: '#71717a', marginBottom: '32px' }}>Last updated: February 2026</p>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>1. Information We Collect</h2>
          
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#a1a1aa', marginTop: '16px', marginBottom: '8px' }}>Automatically Collected</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li><strong style={{color:'#fff'}}>Device Fingerprint:</strong> A unique identifier generated from your browser and device characteristics, used to prevent abuse and enforce bans.</li>
            <li><strong style={{color:'#fff'}}>Anonymous User ID:</strong> A random identifier assigned when you use mujAnon. This is not linked to your real identity.</li>
            <li><strong style={{color:'#fff'}}>Session Data:</strong> Information about your connection, including timestamps and online status.</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#a1a1aa', marginTop: '16px', marginBottom: '8px' }}>User-Provided</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li><strong style={{color:'#fff'}}>Chat Messages:</strong> Text messages you send during chat sessions.</li>
            <li><strong style={{color:'#fff'}}>Reports:</strong> Information you provide when reporting another user.</li>
            <li><strong style={{color:'#fff'}}>Feedback:</strong> Ratings you provide after chat sessions.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>2. How We Use Your Information</h2>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li><strong style={{color:'#fff'}}>Matchmaking:</strong> To connect you with other users based on selected modes and interests.</li>
            <li><strong style={{color:'#fff'}}>Moderation:</strong> To review reports and take action against users who violate our terms.</li>
            <li><strong style={{color:'#fff'}}>Abuse Prevention:</strong> To identify and ban users who engage in harmful behavior.</li>
            <li><strong style={{color:'#fff'}}>Service Improvement:</strong> To understand usage patterns and improve the service.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>3. Data Retention</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#a1a1aa' }}>Data Type</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#a1a1aa' }}>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '12px 0' }}>Chat Messages</td>
                <td style={{ padding: '12px 0' }}>24 hours</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '12px 0' }}>Reports</td>
                <td style={{ padding: '12px 0' }}>7 days</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '12px 0' }}>Device Fingerprints</td>
                <td style={{ padding: '12px 0' }}>1 year (for ban enforcement)</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0' }}>Feedback</td>
                <td style={{ padding: '12px 0' }}>30 days</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>4. Data Sharing</h2>
          <p style={{ marginBottom: '12px' }}>We do NOT sell your data. We may share data in these limited cases:</p>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li><strong style={{color:'#fff'}}>Law Enforcement:</strong> When required by law or court order.</li>
            <li><strong style={{color:'#fff'}}>Imminent Harm:</strong> If we believe disclosure is necessary to prevent harm to any person.</li>
            <li><strong style={{color:'#fff'}}>Service Providers:</strong> With Firebase (Google) for hosting and database services, under their privacy policies.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>5. Your Rights</h2>
          <ul style={{ lineHeight: 1.8, paddingLeft: '24px' }}>
            <li><strong style={{color:'#fff'}}>Access:</strong> Request a copy of data we have about your device.</li>
            <li><strong style={{color:'#fff'}}>Deletion:</strong> Request deletion of your data (subject to legal requirements).</li>
            <li><strong style={{color:'#fff'}}>Opt-out:</strong> Stop using the service at any time.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            To exercise these rights, contact: <a href="mailto:privacy@mujanon.com" style={{ color: '#818cf8' }}>privacy@mujanon.com</a>
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>6. Security</h2>
          <p style={{ lineHeight: 1.8 }}>
            We use industry-standard security measures including encrypted connections (HTTPS), Firebase security rules, and device-based authentication. However, no system is 100% secure.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>7. Children&apos;s Privacy</h2>
          <p style={{ lineHeight: 1.8 }}>
            mujAnon is not intended for users under 18 years of age. We do not knowingly collect information from minors.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>8. Changes to This Policy</h2>
          <p style={{ lineHeight: 1.8 }}>
            We may update this policy from time to time. We will notify users of significant changes by posting a notice on the app.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>9. Contact</h2>
          <p style={{ lineHeight: 1.8 }}>
            For privacy questions or concerns:<br />
            Email: <a href="mailto:privacy@mujanon.com" style={{ color: '#818cf8' }}>privacy@mujanon.com</a>
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
