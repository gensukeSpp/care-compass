/* Stubbed useProfileStore - implement real store logic as needed */

export type Profile = {
  id?: string;
  name?: string;
};

export const useProfileStore = () => {
  return {
    getProfile: (): Profile | null => null,
    setProfile: (_p: Profile) => {},
  };
};

export default useProfileStore;
