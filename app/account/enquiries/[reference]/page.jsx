"use client";

import { useParams } from "next/navigation";
import EnquiryDetail from "@/components/account/EnquiryDetail";

export default function EnquiryDetailPage() {
  const params = useParams();
  const reference = decodeURIComponent(String(params?.reference || ""));
  return <EnquiryDetail reference={reference} />;
}
