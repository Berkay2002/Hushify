import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './context/AuthContext';

const withAuth = (WrappedComponent) => {
  const WithAuthComponent = (props) => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (user === null) {
        router.push('/login');
      }
    }, [user, router]);

    if (user === null) {
      return null; // Optionally, you can return a loading spinner or some placeholder content here
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;