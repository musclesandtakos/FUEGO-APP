export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>FUEGO-APP</h1>
      <p>Welcome to FUEGO-APP - A semantic matching application powered by AI.</p>
      
      <h2>API Endpoints</h2>
      <ul>
        <li><strong>POST /api/save-profile</strong> - Save a user profile with interests</li>
        <li><strong>POST /api/find-matches-cursor</strong> - Find matches using cursor-based pagination</li>
        <li><strong>POST /api/find-matches-paginated</strong> - Find matches with standard pagination</li>
        <li><strong>POST /api/secure-find-matches</strong> - Find matches with authentication</li>
      </ul>
      
      <h2>Getting Started</h2>
      <ol>
        <li>Configure your environment variables in <code>.env</code></li>
        <li>Run database migrations with <code>npm run migrate</code></li>
        <li>Verify your setup with <code>npm run verify</code></li>
        <li>Start using the API endpoints!</li>
      </ol>
    </div>
  )
}
