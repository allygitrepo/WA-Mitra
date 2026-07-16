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
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#25d366,#128c7e);border-radius:14px;padding:10px 18px;">
                    <span style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">WA-Mitra</span>
                  </td>
                </tr>
              </table>
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
                        <td style="background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.25);border-radius:16px;width:56px;height:56px;text-align:center;vertical-align:middle;">
                          <span style="font-size:26px;line-height:56px;">🔐</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <h1 style="margin:0 0 12px;font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:#f0fdf4;letter-spacing:-0.8px;line-height:1.2;">
                      Verify Your Email
                    </h1>

                    <p style="margin:0 0 32px;font-size:16px;color:#94a3b8;line-height:1.7;">
                      Hello! Use the one-time passcode below to confirm your email address and activate your WA-Mitra account.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td align="center" style="background:linear-gradient(135deg,rgba(37,211,102,0.08),rgba(18,140,126,0.06));border:1px solid rgba(37,211,102,0.3);border-radius:16px;padding:32px 24px;">
                          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:3px;color:#25d366;text-transform:uppercase;">Your OTP Code</p>
                          <p style="margin:0;font-family:'Syne',sans-serif;font-size:48px;font-weight:800;letter-spacing:12px;color:#f0fdf4;line-height:1.1;">${otp}</p>
                          <p style="margin:12px 0 0;font-size:13px;color:#64748b;">Expires in <strong style="color:#f59e0b;">10 minutes</strong></p>
                        </td>
                      </tr>
                    </table>

                    <!-- Warning note -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:40px;">
                      <tr>
                        <td style="background:rgba(251,191,36,0.06);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
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
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#25d366,#128c7e);border-radius:14px;padding:10px 18px;">
                    <span style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">WA-Mitra</span>
                  </td>
                </tr>
              </table>
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
                    <h1 style="margin:0 0 10px;font-family:'Syne',sans-serif;font-size:34px;font-weight:800;color:#f0fdf4;letter-spacing:-1px;line-height:1.15;">
                      Welcome aboard,<br/><span style="color:#25d366;">${username}!</span>
                    </h1>
                    <p style="margin:0;font-size:15px;color:#64748b;letter-spacing:0.5px;">Your WA-Mitra journey starts now</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 48px;">

                    <p style="margin:0 0 32px;font-size:16px;color:#94a3b8;line-height:1.75;">
                      We're thrilled to have you with us. WA-Mitra is your all-in-one platform for professional WhatsApp messaging — built to help you automate, manage, and scale your communication effortlessly.
                    </p>

                    <!-- Features grid -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <!-- Feature 1 -->
                        <td width="48%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px 18px;vertical-align:top;">
                          <p style="margin:0 0 10px;font-size:24px;">💬</p>
                          <p style="margin:0 0 6px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e2e8f0;">Session Management</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Manage multiple WhatsApp sessions from a single dashboard.</p>
                        </td>
                        <td width="4%"></td>
                        <!-- Feature 2 -->
                        <td width="48%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px 18px;vertical-align:top;">
                          <p style="margin:0 0 10px;font-size:24px;">⚡</p>
                          <p style="margin:0 0 6px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e2e8f0;">Smart Automation</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Automate messaging workflows and responses at scale.</p>
                        </td>
                      </tr>
                      <tr><td colspan="3" style="height:12px;font-size:0;line-height:0;"></td></tr>
                      <tr>
                        <!-- Feature 3 -->
                        <td width="48%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px 18px;vertical-align:top;">
                          <p style="margin:0 0 10px;font-size:24px;">📊</p>
                          <p style="margin:0 0 6px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e2e8f0;">Analytics</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Track delivery rates and engagement with real-time insights.</p>
                        </td>
                        <td width="4%"></td>
                        <!-- Feature 4 -->
                        <td width="48%" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px 18px;vertical-align:top;">
                          <p style="margin:0 0 10px;font-size:24px;">🔒</p>
                          <p style="margin:0 0 6px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e2e8f0;">Secure & Reliable</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Enterprise-grade security keeps your data protected.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td align="center">
                          <a href="#" style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#ffffff;text-decoration:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;padding:16px 40px;border-radius:50px;">
                            Get Started →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Support note -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:12px;padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;text-align:center;">
                            Have questions? Our support team is here for you.<br/>
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
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#25d366,#128c7e);border-radius:14px;padding:10px 18px;">
                    <span style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">WA-Mitra</span>
                  </td>
                </tr>
              </table>
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
                    <p style="margin:0;font-size:15px;color:#64748b;letter-spacing:0.5px;">Your subscription has been updated</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 48px;">

                    <p style="margin:0 0 28px;font-size:16px;color:#94a3b8;line-height:1.75;">
                      Hello <strong>${username}</strong>, your WA-Mitra subscription has been updated. Below are the details of your new package:
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
                      Your new features and limitations are now active on your account immediately.
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
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#25d366,#128c7e);border-radius:14px;padding:10px 18px;">
                    <span style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">WA-Mitra</span>
                  </td>
                </tr>
              </table>
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