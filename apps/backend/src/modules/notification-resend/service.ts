import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types";
import { Resend } from "resend";
import {
  orderPlacedEmail,
  shipmentCreatedEmail,
  orderCanceledEmail,
  EmailTemplate,
} from "./templates";

type InjectedDependencies = { logger: Logger };

export type ResendOptions = {
  apiKey: string;
  from: string;
  replyTo?: string;
};

const TEMPLATES: Record<string, EmailTemplate<any>> = {
  "order-placed": orderPlacedEmail,
  "shipment-created": shipmentCreatedEmail,
  "order-canceled": orderCanceledEmail,
};

/**
 * Resend-backed email provider for the notification module.
 * `template` on the notification maps to one of TEMPLATES; `data` is the payload.
 */
export default class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend";

  protected readonly logger_: Logger;
  protected readonly options_: ResendOptions;
  protected readonly client_: Resend;

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super();
    this.logger_ = logger;
    this.options_ = options;
    this.client_ = new Resend(options.apiKey);
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend provider requires an `apiKey` option"
      );
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend provider requires a `from` option"
      );
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification.to) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Notification is missing a `to` address"
      );
    }

    const template = TEMPLATES[notification.template];
    if (!template) {
      this.logger_.warn(
        `[notification-resend] no template registered for "${notification.template}" — skipping`
      );
      return {};
    }

    const { subject, html } = template(notification.data ?? {});

    try {
      const { data, error } = await this.client_.emails.send({
        from: this.options_.from,
        to: [notification.to],
        replyTo: this.options_.replyTo,
        subject,
        html,
      });
      if (error) {
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message);
      }
      return { id: data?.id };
    } catch (e) {
      this.logger_.error(
        `[notification-resend] failed to send "${notification.template}" to ${notification.to}: ${
          (e as Error).message
        }`
      );
      throw e;
    }
  }
}
