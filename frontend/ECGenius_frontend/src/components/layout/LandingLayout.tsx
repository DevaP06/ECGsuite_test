export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="p-6 shadow">MediAI</header>
      <main>{children}</main>
      <footer className="p-6 bg-gray-100 text-center">© 2025 MediAI</footer>
    </div>
  );
}
