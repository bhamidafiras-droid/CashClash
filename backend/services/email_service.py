import os

# Placeholder for email service
# In production, use smtplib or a service like SendGrid

async def send_email(to_email: str, subject: str, body: str):
    print(f"--- Sending Email ---")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body}")
    print(f"---------------------")
