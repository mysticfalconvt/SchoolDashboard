export interface EmailData {
  toAddress: string;
  fromAddress: string;
  subject: string;
  body: string;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  parent?: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
}

// Alias for backward compatibility
export type StudentDetails = Student;

export interface ChromebookEmailParams {
  student: Student;
  teacherName: string;
  teacherEmail: string;
  issueDetails: string;
  sendEmail: (params: { emailData: EmailData }) => void | Promise<any>;
  onProgress?: (progress: { sent: number; total: number }) => void;
}

export const chromebookEmails = [
  'robert.boskind@ncsuvt.org',
  'Joyce.Lantagne@ncsuvt.org',
  'katlynn.cochran@ncsuvt.org',
];

/**
 * Sends chromebook check notification emails to staff, student, and parents
 */
export async function sendChromebookCheckEmails({
  student,
  teacherName,
  teacherEmail,
  issueDetails,
  sendEmail,
  onProgress,
}: ChromebookEmailParams): Promise<void> {
  // Calculate total emails to send
  const staffEmailsCount = chromebookEmails.length;
  const studentEmailCount = student?.email ? 1 : 0;
  const parentEmailsCount =
    student?.parent?.filter((parent) => parent.email).length || 0;
  const totalEmails = staffEmailsCount + studentEmailCount + parentEmailsCount;

  let emailsSent = 0;

  // Send email to staff
  for (const email of chromebookEmails) {
    const staffEmailData: EmailData = {
      toAddress: email,
      fromAddress: teacherEmail,
      subject: `New Chromebook Check for ${student.name}`,
      body: `
<p>There is a new Chromebook check for ${student.name} at NCUJHS.TECH created by ${teacherName}. </p>
<p>${issueDetails}</p>
      `,
    };
    await sendEmail({ emailData: staffEmailData });
    emailsSent++;
    onProgress?.({ sent: emailsSent, total: totalEmails });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between emails
  }

  // Send email to student if they have an email
  if (student?.email) {
    const studentEmailData: EmailData = {
      toAddress: student.email,
      fromAddress: teacherEmail,
      subject: `Chromebook Check Notification - ${student.name}`,
      body: `
<p>Dear ${student.name},</p>
<p>A chromebook check has been submitted for you by ${teacherName}.</p>
<p><strong>Issue Details:</strong> ${issueDetails}</p>
      `,
    };
    await sendEmail({ emailData: studentEmailData });
    emailsSent++;
    onProgress?.({ sent: emailsSent, total: totalEmails });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between emails
  }

  // Send email to parents if they have emails
  const parentsWithEmail =
    student?.parent?.filter((parent) => parent.email) || [];
  for (const parent of parentsWithEmail) {
    const parentEmailData: EmailData = {
      toAddress: parent.email!,
      fromAddress: teacherEmail,
      subject: `Chromebook Check Notification - ${student.name}`,
      body: `
<p>Dear parents and guardians,</p>

<p>Each week your child's TA teacher performs a Chromebook check for all students in the TA. This check looks at the overall condition of the Chromebook and reports it to Joyce Lantagne, our Tech Support staff member. Unfortunately, your child's Chromebook has not passed this week's check. The Chromebook will be sent to Mrs. Lantagne for evaluation. If she can repair the Chromebook in house, it will be returned to your child once repairs are completed. If the repairs cannot be completed in house, you will receive a letter with information about repair fees and options for repayment or after school community service.</p>

<p>Please encourage your student to care for their Chromebook for the remainder of the school year to avoid further hassle, fees, or potential loss of privilege.</p>

<p>Remember these 10 key Chromebook guidelines:</p>
<ul>
<li>Keep the Chromebook free of stickers.</li>
<li>Make sure there's never anything between the screen and the keyboard - including paper!</li>
<li>Keep your Chromebook clean - cleaning spray and cloths can be found in all TA Classrooms.</li>
<li>Make sure the Chromebook is put away and plugged in in the Chromebook cart at the end of each day.</li>
<li>Remember that these are school-issued devices, not personal devices. School-issued devices are subject to monitoring through GoGuardian.</li>
<li>Keep the lid of your Chromebook closed when not in use.</li>
<li>Keep your passwords secured and private! Never share your passwords!</li>
<li>Fully shut down your Chromebook at least once a day.</li>
<li>Remember to only use the Chromebook assigned to you - don't let anyone else use your Chromebook either!</li>
<li>Chromebook use is a privilege, so please use them responsibly.</li>
</ul>

<p>Thank you for continuing to encourage your child to be a positive member of our falcon community.</p>

<p>The PBIS Team<br>
"Go the distance; dare to explore"</p>
      `,
    };
    await sendEmail({ emailData: parentEmailData });
    emailsSent++;
    onProgress?.({ sent: emailsSent, total: totalEmails });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between emails
  }
}
