// src/lib/email.ts

/**
 * Serviço centralizado de emails do Gastometria
 * Usa Resend para envio de emails transacionais
 */

import { Resend } from 'resend';

// Lazy initialization do Resend
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurada');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Gastometria <noreply@gastometria.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gastometria.com';

// ============================================
// Templates de Email
// ============================================

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
  .content { padding: 32px; }
  .content p { color: #374151; line-height: 1.6; margin: 0 0 16px 0; }
  .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  .footer { background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { color: #6b7280; font-size: 12px; margin: 0; }
  .highlight { background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .highlight strong { color: #111827; }
`;

function wrapTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>💰 Gastometria</h1>
      </div>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} Gastometria - Seu controle financeiro inteligente</p>
        <p style="margin-top: 8px;">Este email foi enviado automaticamente. Por favor, não responda.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================
// Email de Convite para Família
// ============================================

interface FamilyInviteEmailParams {
  inviteeEmail: string;
  inviterName: string;
  familyName: string;
  inviteToken: string;
  role: string;
}

export async function sendFamilyInviteEmail({
  inviteeEmail,
  inviterName,
  familyName,
  inviteToken,
  role,
}: FamilyInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  const inviteUrl = `${APP_URL}/family/invite/${inviteToken}`;

  const roleText = role === 'admin' ? 'como administrador(a)' : 'como membro';

  const content = `
    <div class="content">
      <p>Olá! 👋</p>
      <p>
        <strong>${inviterName}</strong> está convidando você para fazer parte da família 
        <strong>"${familyName}"</strong> ${roleText} no Gastometria!
      </p>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>O que é o Modo Família?</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          Com o Modo Família, vocês podem compartilhar carteiras, orçamentos, metas e muito mais.
          Cada membro controla o que quer compartilhar, mantendo total privacidade.
        </p>
      </div>
      
      <p style="text-align: center;">
        <a href="${inviteUrl}" class="button">Aceitar Convite</a>
      </p>
      
      <p style="font-size: 14px; color: #6b7280;">
        Se você não conhece ${inviterName} ou não esperava este convite, 
        pode ignorar este email com segurança.
      </p>
      
      <p style="font-size: 12px; color: #9ca3af;">
        Ou copie e cole este link no navegador:<br>
        <span style="color: #6366f1;">${inviteUrl}</span>
      </p>
    </div>
  `;

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: inviteeEmail,
      subject: `${inviterName} convidou você para a família "${familyName}" - Gastometria`,
      html: wrapTemplate(content, 'Convite para Família'),
    });

    if (result.error) {
      console.error('Erro ao enviar email de convite:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    return { success: false, error: 'Erro interno ao enviar email' };
  }
}

// ============================================
// Email de Reset de Senha (migrado)
// ============================================

interface ResetPasswordEmailParams {
  email: string;
  resetLink: string;
}

export async function sendResetPasswordEmail({
  email,
  resetLink,
}: ResetPasswordEmailParams): Promise<{ success: boolean; error?: string }> {
  const content = `
    <div class="content">
      <p>Olá!</p>
      <p>
        Recebemos uma solicitação para redefinir a senha da sua conta no Gastometria.
      </p>
      
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
      </p>
      
      <p style="font-size: 14px; color: #6b7280;">
        Se você não solicitou a redefinição de senha, pode ignorar este email com segurança.
        O link expira em 1 hora.
      </p>
      
      <p style="font-size: 12px; color: #9ca3af;">
        Ou copie e cole este link no navegador:<br>
        <span style="color: #6366f1;">${resetLink}</span>
      </p>
    </div>
  `;

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Redefinição de Senha - Gastometria',
      html: wrapTemplate(content, 'Redefinição de Senha'),
    });

    if (result.error) {
      console.error('Erro ao enviar email de reset:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de reset:', error);
    return { success: false, error: 'Erro interno ao enviar email' };
  }
}

// ============================================
// Email de Boas-vindas
// ============================================

interface WelcomeEmailParams {
  email: string;
  name: string;
}

export async function sendWelcomeEmail({
  email,
  name,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const content = `
    <div class="content">
      <p>Olá, ${name}! 🎉</p>
      <p>
        Seja bem-vindo(a) ao <strong>Gastometria</strong>! Estamos muito felizes em tê-lo(a) conosco.
      </p>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>O que você pode fazer agora:</strong></p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #374151;">
          <li>Criar suas carteiras para organizar seu dinheiro</li>
          <li>Registrar suas transações de receitas e despesas</li>
          <li>Definir orçamentos para controlar seus gastos</li>
          <li>Usar a IA para categorizar automaticamente suas transações</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/dashboard" class="button">Acessar Meu Painel</a>
      </p>
      
      <p style="font-size: 14px; color: #6b7280;">
        Dúvidas? Acesse nossa <a href="${APP_URL}/faq" style="color: #6366f1;">FAQ</a> 
        ou entre em contato pelo suporte.
      </p>
    </div>
  `;

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Bem-vindo(a) ao Gastometria! 💰',
      html: wrapTemplate(content, 'Bem-vindo ao Gastometria'),
    });

    if (result.error) {
      console.error('Erro ao enviar email de boas-vindas:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return { success: false, error: 'Erro interno ao enviar email' };
  }
}
