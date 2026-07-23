interface PasswordResetEmailData {
  userName: string;
  restaurantName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function generatePasswordResetEmail(
  data: PasswordResetEmailData
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #111827; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 26px; font-weight: 700;">
                ${data.restaurantName}
              </h1>
              <p style="margin: 0; color: #9ca3af; font-size: 15px;">Recuperación de contraseña</p>
            </td>
          </tr>

          <!-- Status banner -->
          <tr>
            <td style="background-color: #b91c1c; padding: 16px 24px; text-align: center;">
              <span style="color: #ffffff; font-size: 16px; font-weight: 700;">
                Solicitud de nueva contraseña
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px;">

              <!-- Greeting -->
              <h2 style="margin: 0 0 8px; color: #111827; font-size: 22px; font-weight: 700;">
                Hola, ${data.userName}
              </h2>
              <p style="margin: 0 0 28px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>${data.restaurantName}</strong>.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 28px;">
                <a
                  href="${data.resetUrl}"
                  style="display: inline-block; background-color: #b91c1c; color: #ffffff; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none;"
                >
                  Restablecer contraseña
                </a>
              </div>

              <!-- Expiry notice -->
              <div style="background-color: #fffbeb; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  Este enlace es válido por <strong>${data.expiresInMinutes} minutos</strong> y solo puede usarse una vez.
                </p>
              </div>

              <!-- Fallback URL -->
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
              </p>
              <p style="margin: 0 0 24px; word-break: break-all;">
                <a href="${data.resetUrl}" style="color: #b91c1c; font-size: 13px;">${data.resetUrl}</a>
              </p>

              <!-- Security notice -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px 20px;">
                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                  Si no solicitaste este cambio, podés ignorar este correo. Tu contraseña actual seguirá siendo la misma.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Este es un correo automático. Por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
