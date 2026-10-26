"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectToCabSearch() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    const query = next.toString();
    router.replace(query ? `/transfers?${query}` : "/?service=transfer");
  }, [params, router]);

  return <p className="container-page py-8">Opening cab search…</p>;
}

export default function TransferEnquireRedirect() {
  return (
    <Suspense fallback={<p className="container-page py-8">Opening cab search…</p>}>
      <RedirectToCabSearch />
    </Suspense>
  );
}
