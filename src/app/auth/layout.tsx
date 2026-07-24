export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Render only the page content — no shared Header, Footer, or SplashScreen
  return <>{children}</>;
}
