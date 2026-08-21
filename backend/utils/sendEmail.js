const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendEmail = async (options, legacySubject, legacyMessage) => {
    let email, subject, message, html;

    if (typeof options === 'object' && options !== null) {
        email = options.email;
        subject = options.subject;
        message = options.message;
        html = options.html;
    } else {
        email = options;
        subject = legacySubject;
        message = legacyMessage;
    }

    if (!resend) {
        console.warn('RESEND_API_KEY not found. Email will NOT be sent.');
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'AskUrSenior <noreply@askursenior.org>',
            to: email,
            subject: subject,
            html: html || `<p>${(message || '').replace(/\n/g, '<br>')}</p>`,
        });

        if (error) {
            console.error('Resend email error:', error);
            throw new Error(error.message || 'Email send failed');
        }

        console.log('Message sent successfully via Resend:', data.id);
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
    }
};

module.exports = sendEmail;
