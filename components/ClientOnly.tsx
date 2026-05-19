import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <View style={{ flex: 1 }} />;
  }

  return <>{children}</>;
}
