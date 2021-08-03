import config from 'config';
import nodemailer from 'nodemailer';

const mailConfig = config.get('mail');
const transporter = nodemailer.createTransport({ ...mailConfig });

export default transporter;
