import { formatParentName } from './nameUtils';

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
<p>Dear ${formatParentName(parent.name) || 'Parent/Guardian'},</p>
<p>A chromebook check has been submitted for ${student.name} by ${teacherName}.</p>
<p><strong>Issue Details:</strong> ${issueDetails}</p>
      `,
    };
    await sendEmail({ emailData: parentEmailData });
    emailsSent++;
    onProgress?.({ sent: emailsSent, total: totalEmails });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between emails
  }
}
