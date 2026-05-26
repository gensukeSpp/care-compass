import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const useCreateProfile = (onSuccess: () => void) => {
  const [name, setName] = useState('');
  // ...ラベル管理など
  const [labels, setLabels] = useState({
    can: 'できる',
    cannot: 'できない',
    risk: '危険を伴う',
    request: '頼みたい'
  });
  const createProfile = useAuthStore(s => s.createProfile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const submit = async () => {
    await createProfile(name.trim(), labels);
    onSuccess();
  };

  return { name, setName, labels, setLabels, submit, isLoading, error };
};