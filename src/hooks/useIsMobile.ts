import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export const useIsMobile = (breakpoint: number = MOBILE_BREAKPOINT): boolean => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

        const handler = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        setIsMobile(mediaQuery.matches);

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [breakpoint]);

    return isMobile;
};
