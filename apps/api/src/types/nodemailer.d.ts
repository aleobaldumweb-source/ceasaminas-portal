declare module 'nodemailer' {
  type TransportOptions = {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
  };

  type Message = {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  };

  type Transporter = {
    sendMail(message: Message): Promise<unknown>;
  };

  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };

  export default nodemailer;
}
