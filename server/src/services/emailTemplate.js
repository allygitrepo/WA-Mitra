const emailTemplates = {
  otpEmail: (otp) => ({
    subject: "Email Verification - WA-Mitra",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email – WA-Mitra</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'DM Sans',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1e;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="cid:logo_dark" alt="WA-Mitra Logo" style="height:48px;width:auto;display:block;border:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(160deg,#111827 0%,#0d1529 100%);border-radius:24px;border:1px solid rgba(37,211,102,0.15);overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#25d366,#128c7e,#075e54);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:48px 48px 40px;">

                    <!-- Icon -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:rgba(37,211,102,0.1);border-radius:16px;padding:12px;">
                          <span style="font-size:28px;line-height:1;">🔑</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="margin:0 0 12px;font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#f0fdf4;letter-spacing:-0.5px;line-height:1.2;">
                      Verify Your Email
                    </h1>
                    
                    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;line-height:1.6;">
                      Hello! Use the one-time passcode below to confirm your email address and activate your WA-Mitra account.
                    </p>

                    <!-- OTP Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:16px;margin-bottom:32px;">
                      <tr>
                        <td align="center" style="padding:28px 20px;">
                          <span style="font-family:'Syne',sans-serif;font-size:38px;font-weight:800;color:#25d366;letter-spacing:8px;padding-left:8px;">${otp}</span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6;text-align:center;">
                      This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
                    </p>

                    <!-- Info Alert Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                            🛡️ &nbsp;If you didn't request this, please ignore this email. Your account remains secure.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer note -->
                    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                      &copy; 2026 WA-Mitra &nbsp;·&nbsp; Professional WhatsApp Messaging Services<br/>
                      <span style="color:#334155;">This is an automated message — please do not reply.</span>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  }),

  welcomeEmail: (username) => ({
    subject: "Welcome to WA-Mitra! 🎉",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to WA-Mitra</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'DM Sans',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1e;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="cid:logo_dark" alt="WA-Mitra Logo" style="height:48px;width:auto;display:block;border:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(160deg,#111827 0%,#0d1529 100%);border-radius:24px;border:1px solid rgba(37,211,102,0.15);overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#25d366,#128c7e,#075e54);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Hero Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,rgba(37,211,102,0.12) 0%,rgba(7,94,84,0.08) 100%);padding:48px 48px 40px;border-bottom:1px solid rgba(37,211,102,0.08);">
                    <p style="margin:0 0 16px;font-size:40px;line-height:1;">🎉</p>
                    <h1 style="margin:0 0 10px;font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#f0fdf4;letter-spacing:-1px;line-height:1.15;">
                      Welcome to the Family!
                    </h1>
                    <p style="margin:0;font-size:15px;color:#64748b;letter-spacing:0.5px;">Your account has been verified</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 48px;">

                    <p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;line-height:1.6;">
                      Hi <strong>${username}</strong>,
                    </p>
                    
                    <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.75;">
                      We are thrilled to welcome you to <strong>WA-Mitra</strong>! You've successfully confirmed your email address. Now, you are ready to send automated WhatsApp broadcasts, manage multi-instance devices, structure templates, and scale your WhatsApp communication seamlessly.
                    </p>

                    <!-- Features/Next Steps Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="padding-bottom:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="top" width="36" style="font-size:20px;line-height:1;padding-top:2px;">📱</td>
                              <td style="font-size:15px;color:#e2e8f0;line-height:1.5;padding-left:12px;">
                                <strong>Link Multiple WhatsApp Accounts</strong><br/>
                                <span style="font-size:13px;color:#64748b;">Scan the QR code to sync your device and begin messaging.</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="top" width="36" style="font-size:20px;line-height:1;padding-top:2px;">📊</td>
                              <td style="font-size:15px;color:#e2e8f0;line-height:1.5;padding-left:12px;">
                                <strong>Upload CSV & Send Bulk Broadcasts</strong><br/>
                                <span style="font-size:13px;color:#64748b;">Broadcast campaigns to thousands of contacts with placeholders.</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="top" width="36" style="font-size:20px;line-height:1;padding-top:2px;">⚙️</td>
                              <td style="font-size:15px;color:#e2e8f0;line-height:1.5;padding-left:12px;">
                                <strong>API Tokens & Webhooks</strong><br/>
                                <span style="font-size:13px;color:#64748b;">Integrate WA-Mitra capabilities into your custom CRM or websites.</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td align="center">
                          <a href="https://wamitra.allysoftsolutions.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#ffffff;text-decoration:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;padding:16px 40px;border-radius:50px;">
                            Get Started Now
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Support note -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:12px;padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center;">
                            Have questions or need assistance? Reach out to support:<br/>
                            <a href="mailto:support@wa-mitra.com" style="color:#25d366;text-decoration:none;font-weight:600;">support@wa-mitra.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer note -->
                    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                      &copy; 2026 WA-Mitra &nbsp;·&nbsp; Professional WhatsApp Messaging Services<br/>
                      <span style="color:#334155;">This is an automated message — please do not reply.</span>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  }),

  // Used when purchasing/activating a plan for the first time
  planActivationEmail: (username, packageName, price, duration, instanceLimit, messageLimit, expiresAt) => {
    const formattedExpiresAt = duration === -1 || !expiresAt
      ? 'Lifetime'
      : new Date(expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    const formattedInstances = instanceLimit === -1 ? 'Unlimited' : instanceLimit;
    const formattedMessages = messageLimit === -1 ? 'Unlimited' : messageLimit.toLocaleString();
    const formattedDuration = duration === -1 ? 'Lifetime' : `${duration} Days`;

    return {
      subject: `Welcome to WA-Mitra - Plan Activated Successfully! 🚀`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to WA-Mitra - Plan Activated</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'DM Sans',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1e;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="cid:logo_dark" alt="WA-Mitra Logo" style="height:48px;width:auto;display:block;border:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(160deg,#111827 0%,#0d1529 100%);border-radius:24px;border:1px solid rgba(37,211,102,0.15);overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#25d366,#128c7e,#075e54);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Hero Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,rgba(37,211,102,0.12) 0%,rgba(7,94,84,0.08) 100%);padding:48px 48px 40px;border-bottom:1px solid rgba(37,211,102,0.08);">
                    <p style="margin:0 0 16px;font-size:40px;line-height:1;">🚀</p>
                    <h1 style="margin:0 0 10px;font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#f0fdf4;letter-spacing:-1px;line-height:1.15;">
                      Plan Activated Successfully!
                    </h1>
                    <p style="margin:0;font-size:15px;color:#64748b;letter-spacing:0.5px;">Your subscription is now active</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 48px;">

                    <p style="margin:0 0 28px;font-size:16px;color:#94a3b8;line-height:1.75;">
                      Hello <strong>${username}</strong>, welcome to WA-Mitra! Your new subscription plan has been activated. Below are the details of your package:
                    </p>

                    <!-- Plan Details Table/Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;margin-bottom:32px;overflow:hidden;">
                      <tr>
                        <td style="padding:24px 28px;">
                          
                          <!-- Plan Name -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Active Plan</td>
                              <td align="right" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#25d366;">${packageName}</td>
                            </tr>
                          </table>
                          
                          <!-- Price -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Amount Paid</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">₹${price}</td>
                            </tr>
                          </table>

                          <!-- Duration -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Plan Duration</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedDuration}</td>
                            </tr>
                          </table>

                          <!-- Validity -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Valid Until</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedExpiresAt}</td>
                            </tr>
                          </table>

                          <!-- Limits -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">WhatsApp Instances Limit</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedInstances}</td>
                            </tr>
                          </table>

                          <!-- Messages limit -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Total Message Quota</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedMessages}</td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td align="center">
                          <a href="https://wamitra.allysoftsolutions.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#ffffff;text-decoration:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;padding:16px 40px;border-radius:50px;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Note -->
                    <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.6;text-align:center;">
                      Your features and limitations are active on your account immediately.
                    </p>

                    <!-- Support note -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:12px;padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center;">
                            Have questions or need assistance? Reach out to support:<br/>
                            <a href="mailto:support@wa-mitra.com" style="color:#25d366;text-decoration:none;font-weight:600;">support@wa-mitra.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer note -->
                    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                      &copy; 2026 WA-Mitra &nbsp;·&nbsp; Professional WhatsApp Messaging Services<br/>
                      <span style="color:#334155;">This is an automated message — please do not reply.</span>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `
    };
  },

  // Used when updating/upgrading a plan
  planChangeEmail: (username, packageName, price, duration, instanceLimit, messageLimit, expiresAt) => {
    const formattedExpiresAt = duration === -1 || !expiresAt
      ? 'Lifetime'
      : new Date(expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    const formattedInstances = instanceLimit === -1 ? 'Unlimited' : instanceLimit;
    const formattedMessages = messageLimit === -1 ? 'Unlimited' : messageLimit.toLocaleString();
    const formattedDuration = duration === -1 ? 'Lifetime' : `${duration} Days`;

    return {
      subject: `Your WA-Mitra Plan Has Been Updated! 🚀`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your WA-Mitra Plan Update</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'DM Sans',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1e;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="cid:logo_dark" alt="WA-Mitra Logo" style="height:48px;width:auto;display:block;border:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(160deg,#111827 0%,#0d1529 100%);border-radius:24px;border:1px solid rgba(37,211,102,0.15);overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#25d366,#128c7e,#075e54);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Hero Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,rgba(37,211,102,0.12) 0%,rgba(7,94,84,0.08) 100%);padding:48px 48px 40px;border-bottom:1px solid rgba(37,211,102,0.08);">
                    <p style="margin:0 0 16px;font-size:40px;line-height:1;">🚀</p>
                    <h1 style="margin:0 0 10px;font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#f0fdf4;letter-spacing:-1px;line-height:1.15;">
                      Plan Updated Successfully!
                    </h1>
                    <p style="margin:0;font-size:15px;color:#64748b;letter-spacing:0.5px;">Your subscription has been updated</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 48px;">

                    <p style="margin:0 0 28px;font-size:16px;color:#94a3b8;line-height:1.75;">
                      Hello <strong>${username}</strong>, your WA-Mitra subscription plan has been updated. Below are the details of your new package:
                    </p>

                    <!-- Plan Details Table/Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;margin-bottom:32px;overflow:hidden;">
                      <tr>
                        <td style="padding:24px 28px;">
                          
                          <!-- Plan Name -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Active Plan</td>
                              <td align="right" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#25d366;">${packageName}</td>
                            </tr>
                          </table>
                          
                          <!-- Price -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Amount Paid</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">₹${price}</td>
                            </tr>
                          </table>

                          <!-- Duration -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Plan Duration</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedDuration}</td>
                            </tr>
                          </table>

                          <!-- Validity -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Valid Until</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedExpiresAt}</td>
                            </tr>
                          </table>

                          <!-- Limits -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">WhatsApp Instances Limit</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedInstances}</td>
                            </tr>
                          </table>

                          <!-- Messages limit -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Total Message Quota</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedMessages}</td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td align="center">
                          <a href="https://wamitra.allysoftsolutions.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#ffffff;text-decoration:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;padding:16px 40px;border-radius:50px;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Note -->
                    <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.6;text-align:center;">
                      Your features and limitations are active on your account immediately.
                    </p>

                    <!-- Support note -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:12px;padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center;">
                            Have questions or need assistance? Reach out to support:<br/>
                            <a href="mailto:support@wa-mitra.com" style="color:#25d366;text-decoration:none;font-weight:600;">support@wa-mitra.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer note -->
                    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                      &copy; 2026 WA-Mitra &nbsp;·&nbsp; Professional WhatsApp Messaging Services<br/>
                      <span style="color:#334155;">This is an automated message — please do not reply.</span>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `
    };
  },

  // Used when an admin manually updates/changes a user's plan
  adminPlanChangeEmail: (username, packageName, price, duration, instanceLimit, messageLimit, expiresAt) => {
    const formattedExpiresAt = duration === -1 || !expiresAt
      ? 'Lifetime'
      : new Date(expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    const formattedInstances = instanceLimit === -1 ? 'Unlimited' : instanceLimit;
    const formattedMessages = messageLimit === -1 ? 'Unlimited' : messageLimit.toLocaleString();
    const formattedDuration = duration === -1 ? 'Lifetime' : `${duration} Days`;

    return {
      subject: `Your WA-Mitra Plan Has Been Modified! ⚙️`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>WA-Mitra Plan Modified by Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'DM Sans',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1e;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="cid:logo_dark" alt="WA-Mitra Logo" style="height:48px;width:auto;display:block;border:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(160deg,#111827 0%,#0d1529 100%);border-radius:24px;border:1px solid rgba(37,211,102,0.15);overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#25d366,#128c7e,#075e54);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Hero Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,rgba(37,211,102,0.12) 0%,rgba(7,94,84,0.08) 100%);padding:48px 48px 40px;border-bottom:1px solid rgba(37,211,102,0.08);">
                    <p style="margin:0 0 16px;font-size:40px;line-height:1;">⚙️</p>
                    <h1 style="margin:0 0 10px;font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#f0fdf4;letter-spacing:-1px;line-height:1.15;">
                      Plan Modified by Admin
                    </h1>
                    <p style="margin:0;font-size:15px;color:#64748b;letter-spacing:0.5px;">Your subscription has been updated by an administrator</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 48px;">

                    <p style="margin:0 0 28px;font-size:16px;color:#94a3b8;line-height:1.75;">
                      Hello <strong>${username}</strong>, an administrator has manually updated your WA-Mitra subscription package. Below are the details of your modified package settings:
                    </p>

                    <!-- Plan Details Table/Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;margin-bottom:32px;overflow:hidden;">
                      <tr>
                        <td style="padding:24px 28px;">
                          
                          <!-- Plan Name -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Active Plan</td>
                              <td align="right" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#25d366;">${packageName}</td>
                            </tr>
                          </table>
                          
                          <!-- Price -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Amount Paid</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">₹${price}</td>
                            </tr>
                          </table>

                          <!-- Duration -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Plan Duration</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedDuration}</td>
                            </tr>
                          </table>

                          <!-- Validity -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Valid Until</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedExpiresAt}</td>
                            </tr>
                          </table>

                          <!-- Limits -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">WhatsApp Instances Limit</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedInstances}</td>
                            </tr>
                          </table>

                          <!-- Messages limit -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(255,255,255,0.04);padding-top:14px;">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">Total Message Quota</td>
                              <td align="right" style="font-size:15px;font-weight:600;color:#e2e8f0;">${formattedMessages}</td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td align="center">
                          <a href="https://wamitra.allysoftsolutions.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#ffffff;text-decoration:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;padding:16px 40px;border-radius:50px;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Note -->
                    <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.6;text-align:center;">
                      These configuration overrides have been applied to your account.
                    </p>

                    <!-- Support note -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:12px;padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center;">
                            Have questions or need assistance? Reach out to support:<br/>
                            <a href="mailto:support@wa-mitra.com" style="color:#25d366;text-decoration:none;font-weight:600;">support@wa-mitra.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer note -->
                    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                      &copy; 2026 WA-Mitra &nbsp;·&nbsp; Professional WhatsApp Messaging Services<br/>
                      <span style="color:#334155;">This is an automated message — please do not reply.</span>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `
    };
  },

  expiryExtensionEmail: (username, newExpiresAt) => {
    const formattedExpiresAt = !newExpiresAt
      ? 'Lifetime'
      : new Date(newExpiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

    return {
      subject: `Your WA-Mitra Subscription Has Been Extended! 🗓️`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Subscription Validity Extended</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'DM Sans',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1e;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="cid:logo_dark" alt="WA-Mitra Logo" style="height:48px;width:auto;display:block;border:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(160deg,#111827 0%,#0d1529 100%);border-radius:24px;border:1px solid rgba(37,211,102,0.15);overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#25d366,#128c7e,#075e54);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Hero Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,rgba(37,211,102,0.12) 0%,rgba(7,94,84,0.08) 100%);padding:48px 48px 40px;border-bottom:1px solid rgba(37,211,102,0.08);">
                    <p style="margin:0 0 16px;font-size:40px;line-height:1;">📅</p>
                    <h1 style="margin:0 0 10px;font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#f0fdf4;letter-spacing:-1px;line-height:1.15;">
                      Subscription Validity Extended!
                    </h1>
                    <p style="margin:0;font-size:15px;color:#64748b;letter-spacing:0.5px;">Your subscription end-date has been updated by an administrator</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 48px;">

                    <p style="margin:0 0 28px;font-size:16px;color:#94a3b8;line-height:1.75;">
                      Hello <strong>${username}</strong>, your WA-Mitra subscription validity has been extended.
                    </p>

                    <!-- Details Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;margin-bottom:32px;overflow:hidden;">
                      <tr>
                        <td style="padding:24px 28px;">
                          
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:14px;color:#64748b;">New Expiry Date</td>
                              <td align="right" style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#25d366;">${formattedExpiresAt}</td>
                            </tr>
                          </table>
                          
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td align="center">
                          <a href="https://wamitra.allysoftsolutions.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#ffffff;text-decoration:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;padding:16px 40px;border-radius:50px;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Note -->
                    <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.6;text-align:center;">
                      Your access has been extended. Thank you for choosing WA-Mitra!
                    </p>

                    <!-- Support note -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:12px;padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center;">
                            Have questions or need assistance? Reach out to support:<br/>
                            <a href="mailto:support@wa-mitra.com" style="color:#25d366;text-decoration:none;font-weight:600;">support@wa-mitra.com</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Footer note -->
                    <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                      &copy; 2026 WA-Mitra &nbsp;·&nbsp; Professional WhatsApp Messaging Services<br/>
                      <span style="color:#334155;">This is an automated message — please do not reply.</span>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `
    };
  }
};

module.exports = emailTemplates;