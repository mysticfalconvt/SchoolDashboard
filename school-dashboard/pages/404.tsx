import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import NewBugReportButton from "../components/bugreports/NewBugReportButton";
import { useUser } from "../components/User";
import useSendEmail from "../lib/useSendEmail";

export default function Page404(): JSX.Element {
  const [pathname, setPathname] = useState("");
  const me = useUser();
  const { sendEmail } = useSendEmail();

  useEffect(() => {
    // Set pathname only on the client side
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }

    // send an email only on initial load to prevent spam
    if (me && pathname) {
      const email = {
        toAddress: "rboskind@gmail.com",
        fromAddress: me.email,
        subject: `NCUJHS.Tech 404 Bug Report from ${me.name}`,
        body: `
            <p>This is a bug report from ${me.name}. </p>
            <p>There was a 404 error on ${pathname}</p>
            `,
      };
      sendEmail({
        variables: {
          emailData: email,
        },
      });
    }
  }, [me, pathname, sendEmail]);

  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>This page ( {pathname} ) does not exist.</p>
      <NewBugReportButton />
    </div>
  );
}
