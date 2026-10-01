import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type UsageAlertEmailParams = {
  companyName: string;
  totalCalls: number;
  usageLimit: number;
  percentage: number;
  alertThreshold: number;
};

export type LicenseAlertEmailParams = {
  companyName: string;
  activeLicenses: number;
  licenseLimit: number;
  percentage: number;
  alertThreshold: number;
};

const BRAND_NAVY = '#081028';
const BRAND_CYAN = '#00c8f0';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: Number(this.configService.get<string>('SMTP_PORT', '1025')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: user && pass ? { user, pass } : undefined,
    });
    this.from = this.configService.get<string>('MAIL_FROM', 'alerts@saas-subscriptions.test');
  }

  async sendUsageAlert(recipients: string[], params: UsageAlertEmailParams): Promise<void> {
    const percentLabel = `${Math.round(params.percentage * 100)}%`;
    const thresholdLabel = `${Math.round(params.alertThreshold * 100)}%`;

    await this.send(recipients, {
      subject: `Alerta de consumo: ${params.companyName} al ${percentLabel} de su límite contratado`,
      text:
        `El consumo de API de ${params.companyName} alcanzó ${params.totalCalls}/${params.usageLimit} ` +
        `llamadas (${percentLabel} del límite contratado, por encima del umbral de alerta del ${thresholdLabel}).`,
      preheader: `Consumo de API al ${percentLabel} del límite contratado`,
      badgeLabel: 'Consumo de API',
      title: `${params.companyName} está al ${percentLabel} de su límite de consumo`,
      metric: {
        value: percentLabel,
        current: params.totalCalls,
        limit: params.usageLimit,
        unit: 'llamadas',
      },
      thresholdLabel,
      bodyText:
        'El consumo de API de esta empresa superó el umbral de alerta configurado. ' +
        'Si continúa creciendo al mismo ritmo, podría agotar su límite contratado antes de fin de ciclo.',
    });
  }

  async sendLicenseAlert(recipients: string[], params: LicenseAlertEmailParams): Promise<void> {
    const percentLabel = `${Math.round(params.percentage * 100)}%`;
    const thresholdLabel = `${Math.round(params.alertThreshold * 100)}%`;

    await this.send(recipients, {
      subject: `Alerta de licencias: ${params.companyName} al ${percentLabel} de su límite contratado`,
      text:
        `Las licencias activas de ${params.companyName} llegaron a ${params.activeLicenses}/${params.licenseLimit} ` +
        `(${percentLabel} del límite contratado, por encima del umbral de alerta del ${thresholdLabel}).`,
      preheader: `Licencias activas al ${percentLabel} del límite contratado`,
      badgeLabel: 'Licencias',
      title: `${params.companyName} está al ${percentLabel} de su límite de licencias`,
      metric: {
        value: percentLabel,
        current: params.activeLicenses,
        limit: params.licenseLimit,
        unit: 'licencias activas',
      },
      thresholdLabel,
      bodyText:
        'Las licencias activas se emiten automáticamente a medida que se asignan a los empleados. ' +
        'Esta empresa está llegando a su límite contratado: considera ampliar el plan antes de que ' +
        'se bloqueen nuevas asignaciones.',
    });
  }

  private async send(
    recipients: string[],
    content: {
      subject: string;
      text: string;
      preheader: string;
      badgeLabel: string;
      title: string;
      metric: { value: string; current: number; limit: number; unit: string };
      thresholdLabel: string;
      bodyText: string;
    },
  ): Promise<void> {
    if (recipients.length === 0) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"SaaS Subscriptions" <${this.from}>`,
        to: recipients.join(', '),
        subject: content.subject,
        text: content.text,
        html: this.renderTemplate(content),
      });
    } catch (error) {
      // A failed email must never break the request/job that triggered it.
      this.logger.error('Failed to send alert email', error instanceof Error ? error.stack : error);
    }
  }

  private renderTemplate(content: {
    preheader: string;
    badgeLabel: string;
    title: string;
    metric: { value: string; current: number; limit: number; unit: string };
    thresholdLabel: string;
    bodyText: string;
  }): string {
    const { preheader, badgeLabel, title, metric, thresholdLabel, bodyText } = content;

    return `
      <!doctype html>
      <html lang="es">
        <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
          <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(8,16,40,0.08);">
                  <tr>
                    <td style="background-color:${BRAND_NAVY};padding:28px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">
                            SaaS Subscriptions
                          </td>
                          <td align="right">
                            <span style="display:inline-block;background-color:${BRAND_CYAN};color:${BRAND_NAVY};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">
                              ${badgeLabel}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:${BRAND_NAVY};">
                        ${title}
                      </h1>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;border-radius:10px;margin-bottom:20px;">
                        <tr>
                          <td style="padding:20px 24px;">
                            <div style="font-size:32px;font-weight:700;color:${BRAND_NAVY};">
                              ${metric.value}
                            </div>
                            <div style="font-size:13px;color:#4b5563;margin-top:4px;">
                              ${metric.current}/${metric.limit} ${metric.unit} &middot; umbral de alerta ${thresholdLabel}
                            </div>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                              <tr>
                                <td style="background-color:#e2e8f0;border-radius:999px;height:8px;">
                                  <div style="background-color:${BRAND_CYAN};height:8px;border-radius:999px;width:${Math.min(100, Math.round((metric.current / Math.max(metric.limit, 1)) * 100))}%;"></div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 24px;">
                        ${bodyText}
                      </p>
                      <p style="font-size:12px;line-height:1.5;color:#94a3b8;margin:0;">
                        Este es un correo automático del sistema de gestión de suscripciones. No responder.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}
