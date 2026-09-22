import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Shared chrome for booking / account / support routes.
 * Homepage keeps its own composition inside Dashboard.
 */
export default function SiteChrome({ children, activeService }) {
  return (
    <div className="site-shell">
      <Header activeService={activeService} showServiceTabs variant="portal" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
