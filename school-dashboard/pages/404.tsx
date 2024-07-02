import { useRouter } from 'next/router';
import React, { useEffect } from 'react'

import NewBugReportButton, { CREATE_BUG_REPORT_MUTATION } from '../components/bugreports/NewBugReportButton';
import { useUser } from '../components/User';
import useSendEmail from '../lib/useSendEmail';
import { useMutation } from '@apollo/client';

export default function Page404(): JSX.Element {
 const pathname = window.location.pathname
  const me = useUser();
  const { sendEmail } = useSendEmail();
console.log(pathname)

useEffect(() => {
  // send an email only on initial load to prevent spam
  if (me) {
      const email = {
        toAddress: "rboskind@gmail.com",
        fromAddress: me.email,
        subject: `NCUJHS.Tech 404 Bug Report from ${me.name}`,
        body: `
            <p>This is a bug report from ${me.name}. </p>
            <p>there was a 404 error on ${pathname}</p>
            `,
      };
      sendEmail({
        variables: {
          emailData: email,
        },
      });
    }

  }, [])


      return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>This page ( {pathname} ) does not exist.</p>
        <NewBugReportButton />
    </div>
  )
}
