
import 'dotenv/config';
import { Resend } from 'resend';
import OpenAI from 'openai';

async function verifyIntegrations() {
  console.log('🔍 Verificando integraciones...\n');

  // 1. OpenAI
  console.log('🤖 Verificando OpenAI...');
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY no encontrada.');
  } else {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: 'Say "OpenAI is working!"' }],
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      });
      console.log('✅ OpenAI:', completion.choices[0].message.content);
    } catch (error: any) {
      console.error('❌ OpenAI Error:', error.message);
    }
  }

  console.log('\n-----------------------------------\n');

  // 2. Twilio
  console.log('📱 Verificando Twilio (Credenciales)...');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    console.error('❌ Credenciales de Twilio faltantes.');
  } else {
    try {
      // Intentamos listar mensajes (operación de lectura segura)
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?PageSize=1`;
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (response.ok) {
        console.log('✅ Twilio: Autenticación exitosa (List Messages OK)');
      } else {
        const data = await response.json();
        console.error('❌ Twilio Error:', data.message || response.statusText);
      }
    } catch (error: any) {
      console.error('❌ Twilio Connection Error:', error.message);
    }
  }

  console.log('\n-----------------------------------\n');

  // 3. Resend
  console.log('📧 Verificando Resend...');
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('❌ RESEND_API_KEY no encontrada.');
  } else {
    try {
      const resend = new Resend(resendKey);
      // Intentamos enviar un correo a 'delivered@resend.dev' (dirección de prueba permitida)
      // O simplemente verificamos el dominio si existe, pero mejor probar envío.
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'delivered@resend.dev', // Dirección especial de Resend que siempre acepta correos
        subject: 'Verificación de Integración Hago Produce',
        html: '<p>Si ves esto, Resend está funcionando correctamente.</p>',
      });

      if (error) {
        console.error('❌ Resend Error:', error.message);
      } else {
        console.log('✅ Resend: Correo enviado exitosamente ID:', data?.id);
      }
    } catch (error: any) {
      console.error('❌ Resend Exception:', error.message);
    }
  }
}

verifyIntegrations();
