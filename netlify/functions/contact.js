
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

function clean(value, maxLength) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Method not allowed."
      })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");

    if (clean(payload.website, 200)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Thanks for your message."
        })
      };
    }

    const name = clean(payload.name, 80);
    const email = clean(payload.email, 254);
    const subject = clean(payload.subject, 120);
    const message = clean(payload.message, 3000);

    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !subject ||
      message.length < 10
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Please check your details and try again."
        })
      };
    }

    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SECRET_KEY ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS ||
      !process.env.NOTIFY_EMAIL
    ) {
      throw new Error("Required environment variables are missing.");
    }

    // Save the message in Supabase
    const { error } = await supabase
      .from("contact_messages")
      .insert([{ name, email, subject, message }]);

    if (error) {
      console.error("Supabase error:", error.message);
      throw new Error("Could not save the contact message.");
    }

    // Send an email notification
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFY_EMAIL,
      replyTo: email,
      subject: `Portfolio contact: ${subject}`,
      text:
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Subject: ${subject}\n\n` +
        `Message:\n${message}`
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Thanks for contacting me!"
      })
    };
  } catch (error) {
    console.error("Contact function error:", error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Unable to send your message right now. Please try again later."
      })
    };
  }
};
