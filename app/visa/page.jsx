import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VisaEnquiryForm from "@/components/services/VisaEnquiryForm";

export const metadata = { title: "Visa enquiry" };

export default function VisaPage() {
  return (
    <div className="site-shell min-h-screen">
      <Header variant="portal" showServiceTabs />
      <main className="container-page py-8">
        <VisaEnquiryForm />
      </main>
      <Footer />
    </div>
  );
}
