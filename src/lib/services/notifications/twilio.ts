interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromWhatsApp: string;
}

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromWhatsApp) {
    return null;
  }

  return {
    accountSid,
    authToken,
    fromWhatsApp,
  };
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const config = getTwilioConfig();
  if (!config) {
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

  const params = new URLSearchParams();
  params.append('From', config.fromWhatsApp);
  params.append('To', to);
  params.append('Body', body);

  const credentials = `${config.accountSid}:${config.authToken}`;
  const authHeader = Buffer.from(credentials).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Twilio WhatsApp request failed');
  }
}

