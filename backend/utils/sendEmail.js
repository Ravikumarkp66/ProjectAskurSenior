const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendEmail = async (options) => {
    if (!resend) {
        console.warn('RESEND_API_KEY not found. Email will NOT be sent.');
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'AskUrSenior <onboarding@resend.dev>',
            to: options.email,
            subject: options.subject,
            html: `<p>${options.message.replace(/\n/g, '<br>')}</p>`,
        });

        if (error) {
            console.error('Resend email error:', error);
            throw new Error(error.message);
        }

        console.log('Message sent successfully via Resend:', data.id);
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
    }
};

module.exports = sendEmail;
