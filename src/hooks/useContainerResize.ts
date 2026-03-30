import { useEffect } from "react";

import { useStore } from "../store/useStore";

export function useContainerResize() {
  const setContainerDimensions = useStore(s => s.setContainerDimensions);
  useEffect(() => {
    const updateSize = () => setContainerDimensions(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [setContainerDimensions]);
}
