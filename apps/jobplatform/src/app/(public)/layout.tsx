import { useRouter } from 'next/navigation';

export const metadata = {
  title: 'JobPlatform — Find Your Next Role',
  description: 'Find your next IT opportunity at InherentTech',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: '#2563eb',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            IT
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>InherentTech</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a
            href="/jobs"
            style={{
              fontSize: 14,
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Jobs
          </a>
          <a
            href="/sign-in"
            style={{
              fontSize: 14,
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '8px 16px',
              border: '1px solid #2563eb',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Sign In
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e5e7eb',
          padding: '32px 24px',
          marginTop: 64,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 32,
              marginBottom: 32,
            }}
          >
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>About</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                InherentTech connects talented IT professionals with leading technology companies.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Contact</h3>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Email: careers@inherenttech.com</p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Phone: (555) 123-4567</p>
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Legal</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              © 2026 InherentTech. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
