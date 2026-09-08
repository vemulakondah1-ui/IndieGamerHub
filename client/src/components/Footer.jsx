export default function Footer() {
  return (
    <footer style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      IndieGamer Hub is an independent fan project and is not affiliated with, endorsed by, or sponsored by Valve Corporation or Steam.{' '}
      <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</a>
    </footer>
  );
}
