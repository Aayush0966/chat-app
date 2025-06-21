import {
    SendSmtpEmail,
    TransactionalEmailsApi,
    TransactionalEmailsApiApiKeys
} from '@getbrevo/brevo';

// Define your EmailParams interface before using it
interface EmailParams {
    toEmail: string;
    toName?: string;
    fromEmail: string;
    fromName?: string;
    replyToEmail?: string;
    replyToName?: string;
    subject: string;
    htmlContent: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}

const apiInstance = new TransactionalEmailsApi();

// ✅ Use setApiKey instead of accessing `authentications`
apiInstance.setApiKey(
    TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY ?? ''
);

export async function sendTransactionalEmail(emailParams: EmailParams): Promise<void> {
    const {
        toEmail,
        toName,
        fromEmail,
        fromName,
        replyToEmail,
        replyToName,
        subject,
        htmlContent,
        params,
        headers
    } = emailParams;

    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.sender = { email: fromEmail, name: fromName };
    sendSmtpEmail.to = [{ email: toEmail, name: toName ?? '' }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    if (replyToEmail) {
        sendSmtpEmail.replyTo = { email: replyToEmail, name: replyToName ?? '' };
    }
    if (headers) {
        sendSmtpEmail.headers = headers;
    }
    if (params) {
        sendSmtpEmail.params = params;
    }

    try {
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', response);
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
}
