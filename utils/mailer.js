import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"VeriMail" <no-reply@verimail.com>',
      to,
      subject,
      html,
    })
    console.log('Message sent: %s', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`
  const html = `
    <h1>Verify your email</h1>
    <p>Please click the button below to verify your email address.</p>
    <a href="${verifyUrl}" style="padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>Or use this code: <strong>${token}</strong></p>
    <p>This link will expire in 24 hours.</p>
  `
  return sendEmail(email, 'Verify your VeriMail account', html)
}
