import express from "express";
import nodemailer from "nodemailer";
import dotenv from 'dotenv'
dotenv.config()

const mailUser=process.env.MAIL_USER
const mailPass=process.env.MAIL_PASS

const welcomeRoutes = express.Router();

welcomeRoutes.post("/api/welcome", async (req, res) => {
  const { email, name, amount } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true, // true for port 465, false for other ports
      auth: {
        user: `${mailUser}`,
        pass: `${mailPass}`,
      },
    });

    const mailOptions = {
      to: `${email}`,
      from: "no-reply@enigoal.co.in",
      subject: `Warm Welcome to ${name}  from Enigoal Startup Advisory Private Limited
`,
      html: `
        <p>Dear Sir/Madam,</p>

        <p>
          We are pleased to extend a warm welcome to <b>${name}</b> as a valued client of 
          <b>Enigoal Startup Advisory Private  Limited</b>. We sincerely appreciate the trust you’ve placed in us and are 
          excited about the opportunity to collaborate and contribute to your success.
        </p>

        <p>
          At <b>Enigoal Startup Advisory Private  Limited</b>, we are dedicated to offering high-quality, tailored services 
          designed to meet the unique needs of <b>${name}</b>. Our experienced team is committed to providing 
          expert support and guidance at every stage of our partnership to ensure a smooth and successful experience.
        </p>

        <p>
          To facilitate a seamless process, one of our dedicated representatives will be in touch shortly 
          to coordinate with you and gather any necessary information. Please don’t hesitate to reach out 
          with any questions, concerns, or special requests. Your satisfaction is our highest priority, and 
          we are here to support you every step of the way.
        </p>

        <p>
          Thank you once again for choosing <b>Enigoal Startup Advisory Private  Limited</b>. We look forward to a successful 
          and fruitful collaboration, and to helping <b>${name}</b> achieve its business objectives.
        </p>

        <p>
          For any queries kindly mail us at <a href="mailto:support@enego.co.in">support@enego.co.in</a>
        </p>

        <p style="color: #555; font-size: 14px; margin-top: 20px;">
          <i>This is a system-generated email. Please do not reply to this email.</i>
        </p>

        <p>Warm regards,</p>
        <p><b>Enigoal Startup Advisory Private  Limited</b></p>
        <p><a href="https://enigoal.co.in">enigoal.co.in</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Welcome Mail Sent Successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

export default welcomeRoutes;
