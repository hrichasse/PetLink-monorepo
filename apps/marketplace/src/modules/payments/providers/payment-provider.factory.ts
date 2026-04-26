import { PaymentProvider } from "@prisma/client";

import { MercadoPagoProvider } from "@/modules/payments/providers/mercado-pago.provider";
import { TransbankProvider } from "@/modules/payments/providers/transbank.provider";
import type { PaymentProviderAdapter } from "@/modules/payments/providers/payment-provider.interface";

export const paymentProviderFactory = {
  create(provider: PaymentProvider): PaymentProviderAdapter {
    switch (provider) {
      case PaymentProvider.MERCADOPAGO:
        return new MercadoPagoProvider();
      case PaymentProvider.TRANSBANK:
        return new TransbankProvider();
      default:
        return new MercadoPagoProvider();
    }
  }
};
