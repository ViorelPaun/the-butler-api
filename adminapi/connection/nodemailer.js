const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, 
  port: process.env.MAIL_PORT, 
  secure: process.env.MAIL_SMTPSECURE === 'ssl', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME, 
    pass: process.env.MAIL_PASSWORD,
  },
});

async function sendMail(to, subject, html) {
  const mailOptions = {
    from: process.env.MAIL_FROM, 
    to: to, 
    subject: subject, 
    html : html, 
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendMail;
