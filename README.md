# 🚀 WA-Mitra: Next-Gen WhatsApp Gateway

WA-Mitra is a powerful, production-ready WhatsApp Gateway designed for developers and businesses to automate communication. It provides a robust multi-instance management system, allowing you to link and control multiple WhatsApp accounts through a unified REST API.

---

## 🌟 Real-World Use Cases

WA-Mitra is built to solve complex communication needs in real-time. Here are some common ways businesses use it:

*   **Automated Customer Support:** Connect your CRM or Helpdesk to WhatsApp. Send automated responses, ticket updates, and resolution notifications instantly.
*   **Transactional Alerts (OTP & Notifications):** Deliver critical information like One-Time Passwords (OTPs), order confirmations, shipping updates, and payment reminders directly to your customers' WhatsApp.
*   **Multi-Agent Support Systems:** Manage multiple support numbers (different departments or regions) from a single dashboard, providing a seamless experience for your team.
*   **Appointment & Booking Reminders:** Automatically send reminders for doctor appointments, restaurant bookings, or service schedules to reduce no-shows.
*   **Business Process Automation:** Integrate WhatsApp into your internal workflows—get notified about server alerts, sales leads, or inventory updates on the go.

---

## 🛠️ How to Use WA-Mitra

Getting started with WA-Mitra is designed to be simple and developer-friendly. Follow these steps:

### 1. Account Setup
*   **Register:** Create your account on the [WA-Mitra Portal](https://your-portal-link.com).
*   **Login:** Access your personalized dashboard to manage your instances and tokens.

### 2. Generate Your Master Token
*   Navigate to the **API Settings** or **Profile** section.
*   Generate your **Master API Token**. This token is your global "key" to authenticate all your API requests securely.

### 3. Initialize a WhatsApp Instance
*   Go to the **Instances** tab.
*   Click **"Add New Instance"** and give it a name (e.g., "Support-Line-1").
*   A **QR Code** will be generated. Scan this QR code using the "Linked Devices" feature in your WhatsApp mobile app.

### 4. Start Sending Messages
*   Once linked, your instance will have a unique `instanceKey`.
*   Use your `Master Token` and `instanceKey` to send messages via our REST API.

**Example API Request:**
```bash
curl -X POST https://api.wa-mitra.com/api/v1/messages/send \
  -H "Authorization: Bearer YOUR_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceKey": "your_instance_key",
    "number": "919876543210",
    "message": "Hello from WA-Mitra! Your order #123 is confirmed."
  }'
```

### 5. Advanced Developer APIs
You can also use the Master Token to programmatically manage your instances and send bulk campaigns.

**Bulk Messaging Endpoint (`POST /api/v1/messages/bulk`)**
Allows you to dispatch an array of numbers and customized messages.
```bash
curl -X POST https://api.wa-mitra.com/api/v1/messages/bulk \
  -H "Authorization: Bearer YOUR_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceKey": "your_instance_key",
    "messages": [
      { "number": "919876543210", "message": "Bulk message 1" },
      { "number": "919876543211", "message": "Bulk message 2" }
    ]
  }'
```

**Scheduled Messaging Endpoint (`POST /api/v1/messages/schedule`)**
Schedule a message for a future date and time (uses `multipart/form-data`). Required fields include `instanceKey`, `targetDate` (YYYY-MM-DD), `targetTime` (HH:mm), `recipients` (JSON array), and `message`.

**Recurring Cycle Endpoint (`POST /api/v1/messages/cycle`)**
Create a recurring drip campaign (uses `multipart/form-data`). Required fields include `instanceKey`, `frequency` (e.g., daily, weekly), `sendTime`, `recipients` (JSON array), and `message`.

**Instance Management Endpoints:**
- `POST /api/v1/instance/create`: Programmatically create a new WhatsApp instance.
- `GET /api/v1/instance/list`: Fetch all instances associated with your account.
- `GET /api/v1/instance/status`: Check the connection status of a specific instance.
- `DELETE /api/v1/instance/delete`: Remove an instance and clear its session.

---

## 📋 What You Need to Use WA-Mitra

To ensure a smooth experience, make sure you have the following ready:

1.  **WhatsApp Account:** A valid WhatsApp account (Personal or Business) on a mobile device.
2.  **Stable Internet:** The device linked to the instance should ideally have a stable connection for initial syncing, though WA-Mitra handles session persistence 24/7 once linked.
3.  **Master API Token:** Generated from the WA-Mitra dashboard for authentication.
4.  **Developer Access:** Basic knowledge of how to make HTTP/REST API calls if you are integrating it into your own software.

---

## 🚀 Key Features

*   **Multi-Instance Management:** Link 10, 20, or even 50+ WhatsApp accounts.
*   **Media & Document Support:** Send not just text, but images (JPG, PNG) and documents (PDF, DOCX) via API.
*   **Session Persistence:** Your sessions stay active 24/7. Even after server reboots, we reconnect automatically.
*   **Real-time Monitoring:** Track message delivery, success rates, and instance health from your dashboard.
*   **High Performance:** Built on top of the lightning-fast Baileys engine for rapid message delivery.
*   **Bulk Messaging:** Queue and send messages to large groups of recipients efficiently.

---

*Built with ❤️ by Allysoft. Powering the future of automated communication.*
.....