export default function Page() {
  return (
    <div>
      <h1>Auth API</h1>
      <p>Use the following API routes to test authentication flows:</p>
      <ul>
        <li>POST /api/auth/register {"email","password"}</li>
        <li>GET /api/auth/verify?token=...&email=...</li>
        <li>POST /api/auth/request-reset {"email"}</li>
        <li>POST /api/auth/reset {"email","token","password"}</li>
        <li>POST /api/auth/[...nextauth] for credential sign-in</li>
      </ul>
    </div>
  );
}
