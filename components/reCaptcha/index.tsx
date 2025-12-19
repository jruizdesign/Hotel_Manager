import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    onRecaptchaLoad: (() => void) | null;
    grecaptcha?: any;
  }
}

interface ReCaptchaProps {
    sitekey: string;
    callback: (token: string) => void;
}

const ReCaptcha: React.FC<ReCaptchaProps> = ({ sitekey, callback }) => {
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);

    const onRecaptchaLoad = () => {
        setIsRecaptchaLoaded(true);
    }

    useEffect(() => {
        window.onRecaptchaLoad = onRecaptchaLoad;
        if (!window.grecaptcha) {
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } else if (window.grecaptcha && window.grecaptcha.render) {
            setIsRecaptchaLoaded(true);
        } 

        return () => {
            window.onRecaptchaLoad = null;
        }
    }, []);

    useEffect(() => {
        if (isRecaptchaLoaded && recaptchaRef.current && window.grecaptcha) {
            window.grecaptcha.render(recaptchaRef.current, {
                'sitekey': sitekey,
                'callback': callback
            });
        }
    }, [isRecaptchaLoaded, sitekey, callback]);

    return (
        <div ref={recaptchaRef}></div>
    );
}

export default ReCaptcha;
