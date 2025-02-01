import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './context/AuthContext';

function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (user === null) {
        router.push('/login');
      }
    }, [user, router]);

    if (user === null) {
      // Optionally render a loader or null while redirecting
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithAuthComponent;
}

export default withAuth;
