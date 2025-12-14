// src/app/api/auth/send-reset-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/mongodb";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user) {
      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save token to database
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            resetToken,
            resetTokenExpiry,
          },
        }
      );

      // Build reset URL
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:9002";
      const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

      // Send email via Resend
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Gastometria <onboarding@resend.dev>",
          to: email,
          subject: "Redefinição de Senha - Gastometria",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Redefinição de Senha</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Gastometria</h1>
                </div>
                
                <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                  <h2 style="color: #1f2937; margin-top: 0;">Olá, ${user.name || "usuário"}!</h2>
                  
                  <p style="color: #4b5563;">
                    Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Redefinir Minha Senha
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px;">
                    Este link expira em <strong>1 hora</strong>.
                  </p>
                  
                  <p style="color: #6b7280; font-size: 14px;">
                    Se você não solicitou a redefinição de senha, pode ignorar este email com segurança.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Se o botão não funcionar, copie e cole este link no seu navegador:
                    <br>
                    <a href="${resetUrl}" style="color: #9333EA; word-break: break-all;">${resetUrl}</a>
                  </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                  <p style="margin: 0;">© ${new Date().getFullYear()} Gastometria. Todos os direitos reservados.</p>
                </div>
              </body>
            </html>
          `,
        });
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't expose email sending errors to client
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: "Se o email estiver cadastrado, você receberá um link de redefinição.",
    });
  } catch (error) {
    console.error("Error in send-reset-email:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
