import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async sendPasswordReset(email: string, name: string, token: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const from = process.env.SMTP_FROM;
    const adminUrl = process.env.ADMIN_PUBLIC_URL;
    if (!host || !from || !adminUrl || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Configuração de e-mail incompleta.');
    }

    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: user && password ? { user, pass: password } : undefined,
    });
    const resetUrl = new URL('/reset-password', adminUrl);
    resetUrl.searchParams.set('token', token);

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Redefinição de senha — Ceasaminas Digital',
      text: `Olá, ${name}. Use este link para redefinir sua senha: ${resetUrl.toString()} O link expira em 30 minutos. Se você não fez esta solicitação, ignore esta mensagem.`,
      html: `<p>Olá, ${this.escape(name)}.</p><p>Use o link abaixo para redefinir sua senha:</p><p><a href="${this.escape(resetUrl.toString())}">Redefinir senha</a></p><p>O link expira em 30 minutos. Se você não fez esta solicitação, ignore esta mensagem.</p>`,
    });
  }

  private escape(value: string) {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
        character,
    );
  }
}
