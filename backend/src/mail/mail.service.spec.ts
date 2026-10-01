import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer');

describe('MailService', () => {
  let sendMail: jest.Mock;
  let configService: ConfigService;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue(undefined);
    jest.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
    } as unknown as nodemailer.Transporter);
    configService = {
      get: jest.fn((key: string, fallback?: string) => fallback),
    } as unknown as ConfigService;
  });

  describe('sendUsageAlert', () => {
    it('does nothing when there are no recipients', async () => {
      const service = new MailService(configService);

      await service.sendUsageAlert([], {
        companyName: 'Acme Corp',
        totalCalls: 900,
        usageLimit: 1000,
        percentage: 0.9,
        alertThreshold: 0.8,
      });

      expect(sendMail).not.toHaveBeenCalled();
    });

    it('sends a branded email to every recipient with the usage details', async () => {
      const service = new MailService(configService);

      await service.sendUsageAlert(['admin@acme.test'], {
        companyName: 'Acme Corp',
        totalCalls: 900,
        usageLimit: 1000,
        percentage: 0.9,
        alertThreshold: 0.8,
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@acme.test',
          subject: expect.stringContaining('Acme Corp'),
          html: expect.stringContaining('90%'),
        }),
      );
    });

    it('logs and swallows errors instead of throwing when sending fails', async () => {
      sendMail.mockRejectedValue(new Error('SMTP unreachable'));
      const service = new MailService(configService);

      await expect(
        service.sendUsageAlert(['admin@acme.test'], {
          companyName: 'Acme Corp',
          totalCalls: 900,
          usageLimit: 1000,
          percentage: 0.9,
          alertThreshold: 0.8,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendLicenseAlert', () => {
    it('does nothing when there are no recipients', async () => {
      const service = new MailService(configService);

      await service.sendLicenseAlert([], {
        companyName: 'Acme Corp',
        activeLicenses: 9,
        licenseLimit: 10,
        percentage: 0.9,
        alertThreshold: 0.8,
      });

      expect(sendMail).not.toHaveBeenCalled();
    });

    it('sends a branded email with the license details', async () => {
      const service = new MailService(configService);

      await service.sendLicenseAlert(['admin@acme.test'], {
        companyName: 'Acme Corp',
        activeLicenses: 9,
        licenseLimit: 10,
        percentage: 0.9,
        alertThreshold: 0.8,
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@acme.test',
          subject: expect.stringContaining('licencias'),
          html: expect.stringContaining('9/10'),
        }),
      );
    });
  });
});
