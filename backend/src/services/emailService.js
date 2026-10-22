const nodemailer = require("nodemailer");


// CREATE EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
    service: "Gmail",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


// TEST EMAIL CONNECTION
const verifyEmailConnection = async () => {

    try {

        await transporter.verify();

        console.log("Email SMTP connection successful!");

    } catch (error) {

        console.error("Email SMTP connection failed:");
        console.error(error.message);

    }
};


// SEND EMAIL
const sendEmail = async (to, subject, text, html = null) => {

    const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject,
        text
    };

    if (html) {
        mailOptions.html = html;
    }
    const info = await transporter.sendMail(mailOptions);

console.log("Email sent successfully:");
console.log("Message ID:", info.messageId);
console.log("Accepted:", info.accepted);
console.log("Rejected:", info.rejected);
console.log("Response:", info.response);

return info;

};
const sendTestEmail = async (to) => {

    const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: "Modern POS Email Test",
        text: "This is a real test email from the Modern POS backend."
    });

    console.log("TEST EMAIL SENT!");
    console.log("Message ID:", info.messageId);

    return info;
};

module.exports = {
    sendEmail,
    verifyEmailConnection,
    sendTestEmail

};