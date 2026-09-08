export default function PrivacyPage() {
  return (
    <div className="page-wrapper" style={{ padding: '60px 24px', maxWidth: '720px', margin: '0 auto', lineHeight: 1.7 }}>
      <h1>Privacy Policy</h1>
      <p>
        IndieGamer Hub is an independent project and is not affiliated with, endorsed by, or
        sponsored by Valve Corporation, Steam, Epic Games, or any other storefront referenced
        on this site.
      </p>
      <h2>Data we store</h2>
      <p>
        We store the account details you provide (username, email, hashed password) and any
        reviews, forum posts, or game listings you create. We do not sell your data to third parties.
      </p>
      <h2>Third-party game data</h2>
      <p>
        Game titles, descriptions, images, and pricing shown on this site are retrieved live from
        public storefront endpoints (e.g. Steam) at request time or cached briefly to reduce load.
        This data belongs to its respective publishers and platforms.
      </p>
      <h2>Contact</h2>
      <p>Questions about this policy can be sent to the site administrator.</p>
    </div>
  );
}
