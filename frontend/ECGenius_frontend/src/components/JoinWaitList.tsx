import React, { useEffect, useState } from "react";
import api from "../AxiosInstance";
import toast from "react-hot-toast"
import posthog from "posthog-js";
import type {UTMSource} from "../types/landing"

const JoinWaitList = ({where}: {where:string}) => {
  const [email, setEmail] = useState("");

  // if any other source --> don't capture and default to direct
  const [utmSource, setUtmSource] = useState<UTMSource>("direct");

  // only on 1st render (mount) -> although mostly ek baar render hoga
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");

  const allowedSources: UTMSource[] = [
    "linkedin",
    "insta",
    "reddit",
    "yt",
    "x",
    "facebook",
    "whatsapp",
  ];

    // source as UTMSource, this type of syntax is called Type assertion in TS
    if(source && allowedSources.includes(source as UTMSource)){
      setUtmSource(source as UTMSource);
    }
    else{
      setUtmSource("direct");
    }
  }, [])

  const submitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try{
      const res = await api.post("api/email/", {email})
      console.log("Success: ", res.data)
      toast.success('Verification Email sent!');
      // posthog.identify(email, { email });
      posthog.capture("email_submitted", {
        email_submitted: email,
        utmSource,
        source: where,
      });
    }
    catch(err){
      console.error(`Error: ${err}`)
      toast.error(`${err}`);
    }

  }


  // Why is a form better? than just having input and a submit button
  // enter to submit, native validation
  // more bugs if not used form tag

  return (
      <form className="join w-full max-w-xl mt-8" onSubmit={submitEmail} >

      <input
        type="email"
        placeholder="Email Address"
        required
        className="input input-bordered input-lg join-item w-full text-white placeholder-gray-400"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" className="btn btn-neutral btn-lg join-item">Join</button>

      </form>
  );
};

export default JoinWaitList;
