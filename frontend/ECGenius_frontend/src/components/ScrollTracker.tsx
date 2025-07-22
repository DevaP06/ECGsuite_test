import {useEffect, useRef} from 'react'
import posthog from 'posthog-js'

const ScrollTracker = () => {
    // intial value is empty set
    const triggered = useRef(new Set<number>());

    // Pass an array to the new Set() constructor:
    // The new Set() Method
    // Create a Set
    // Example
    // const letters = new Set(["a","b","c"]);

    useEffect(()=>{
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            //? scrollHeight (of <html>): The total height of the entire webpage, including the part not visible in the viewport.
            //? window.innerHeight: the height og the visible viewport --> the portion you currently see in the browser 
            //? docHeight --> The total scrollable height of the page, the remaining part is scrollable
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            // The documentElement property returns a document's element (as an Element object).
            // The documentElement is read-only.
            // For HTML documents the returned object is the <html> element.

            const scrolledPercent = Math.round((scrollTop / docHeight)*100);

            const thresholds = [25,50,75,100];

            thresholds.forEach((threshold)=>{
                if(scrolledPercent >= threshold && !triggered.current.has(threshold)){
                    // set syntax to add new element in the set
                    triggered.current.add(threshold);
                    console.log(threshold);
                    

                    posthog.capture("scroll_depth", {
                        percent: threshold,
                    })
                }
            })
        }
        window.addEventListener("scroll", handleScroll);
        // In React, the function you return from useEffect is called a cleanup function. It’s run:

        // when the component unmounts, or
        // before re-running the effect again (if the dependency array changes).

        // so basically this says whenever the compount is unmounted remove the event listener to avoid lingering in memory and executing unecessarily

        // when is a compount unmounted from dom?

        // rotue changes (react router dom)
        // conditonal rendering
        // app exit or page reload

        return () => window.removeEventListener("scroll", handleScroll)
    },[])

    return null
}

export default ScrollTracker
