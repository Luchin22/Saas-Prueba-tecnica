export type CompanyEntity = {
  id: string;
  name: string;
  licenseLimit: number;
  usageLimit: number;
  usageAlertSentAt: Date | null;
  licenseAlertSentAt: Date | null;
  createdAt: Date;
};

export type AlertStateUpdate = {
  usageAlertSentAt?: Date | null;
  licenseAlertSentAt?: Date | null;
};
