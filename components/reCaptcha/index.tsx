import React, { use, useEffect, useRef } from "react";

declare global {
  interface Window {
    onRecaptchaLoad: () => void | null;
    grecaptcha?: any;
  }
}
const ReCaptcha = (sitekey: string, callback: any) => {
    const recaptchaRef = useRef(null);
    const [isRecaptchaLoaded, setIsRecaptchaLoaded] = React.useState(false);
    const onRecaptchaLoad = () => {
        setIsRecaptchaLoaded(true);
    }

    useEffect(() => {
        window.onRecaptchaLoad = onRecaptchaLoad;
        if(!window.grecaptcha){
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } else if (window.grecaptcha && window.grecaptcha.render) {
            setIsRecaptchaLoaded(true)
        } 

        return () => {
            window.onRecaptchaLoad = () => null;
        }
    }, [])
    useEffect(() => {
        if(isRecaptchaLoaded){
            window.grecaptcha.render(recaptchaRef.current, {
                'sitekey' : sitekey,
                'callback' : callback
                
            });
        }
    }, [isRecaptchaLoaded]);

    return (
        <div ref={recaptchaRef}></div>
    )
}
export default ReCaptcha;
