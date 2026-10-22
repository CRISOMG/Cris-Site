import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PrivateRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Preservar cualquier query param existente (ej. ?token=...)
    const query = typeof window !== 'undefined' ? window.location.search || '' : '';
    router.replace(`/admin${query}`);
  }, [router]);

  return null;
}

export async function getServerSideProps({ query }) {
  const queryParams = new URLSearchParams(query).toString();
  const destination = `/admin${queryParams ? `?${queryParams}` : ''}`;

  return {
    redirect: {
      destination,
      permanent: true,
    },
  };
}
