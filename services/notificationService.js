const twilio = require('twilio');
const nodemailer = require('nodemailer');
const User = require('../Model/User');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

class NotificationService {
    static async sendMultiChannelNotification(userId, notification) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const promises = [];

            // Email notification
            if (notification.email) {
                promises.push(this.sendEmail(
                    user.email,
                    notification.email.subject,
                    notification.email.content
                ));
            }

            // WhatsApp notification
            if (notification.whatsapp && user.profile.phone) {
                promises.push(this.sendWhatsApp(
                    user.profile.phone,
                    notification.whatsapp.content
                ));
            }

            // SMS notification
            if (notification.sms && user.profile.phone) {
                promises.push(this.sendSMS(
                    user.profile.phone,
                    notification.sms.content
                ));
            }

            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    }

    static async sendEmail(email, subject, content) {
        try {
            await emailTransporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: subject,
                html: content
            });
            return true;
        } catch (error) {
            console.error('Email error:', error);
            return false;
        }
    }

    static async sendWhatsApp(phone, content) {
        try {
            await twilioClient.messages.create({
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:+91${phone}`,
                body: content
            });
            return true;
        } catch (error) {
            console.error('WhatsApp error:', error);
            return false;
        }
    }

    static async sendSMS(phone, content) {
        try {
            await twilioClient.messages.create({
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+91${phone}`,
                body: content
            });
            return true;
        } catch (error) {
            console.error('SMS error:', error);
            return false;
        }
    }

    // Predefined notification templates
    static getInterviewTemplate(interviewDetails) {
        return {
            email: {
                subject: 'Interview Scheduled',
                content: `
                    <h2>Interview Scheduled</h2>
                    <p>Your interview has been scheduled for ${interviewDetails.scheduledTime}</p>
                    <p>Platform: ${interviewDetails.platform}</p>
                    <p>Link: ${interviewDetails.meetingLink}</p>
                `
            },
            whatsapp: {
                content: `Interview Scheduled!\nTime: ${interviewDetails.scheduledTime}\nPlatform: ${interviewDetails.platform}\nLink: ${interviewDetails.meetingLink}`
            },
            sms: {
                content: `Interview scheduled for ${interviewDetails.scheduledTime}. Check email for details.`
            }
        };
    }

    static getOfferTemplate(offerDetails) {
        return {
            email: {
                subject: 'Job Offer Letter',
                content: `
                    <h2>Congratulations!</h2>
                    <p>Your offer letter for ${offerDetails.position} has been generated.</p>
                    <p>Please review and respond within 7 days.</p>
                    <p>Offer Letter Link: ${offerDetails.offerLink}</p>
                `
            },
            whatsapp: {
                content: `Congratulations! Your offer letter for ${offerDetails.position} has been generated. Check your email.`
            },
            sms: {
                content: `Your offer letter has been generated. Please check your email.`
            }
        };
    }

    static getTravelTemplate(travelDetails) {
        return {
            email: {
                subject: 'Travel Arrangements Confirmed',
                content: `
                    <h2>Travel Booking Confirmed</h2>
                    <p>PNR: ${travelDetails.pnr}</p>
                    <p>From: ${travelDetails.from}</p>
                    <p>To: ${travelDetails.to}</p>
                    <p>Departure: ${travelDetails.departure}</p>
                    <p>Arrival: ${travelDetails.arrival}</p>
                `
            },
            whatsapp: {
                content: `Travel Booking Confirmed!\nPNR: ${travelDetails.pnr}\nFrom: ${travelDetails.from}\nTo: ${travelDetails.to}\nDeparture: ${travelDetails.departure}`
            },
            sms: {
                content: `Travel booked! PNR: ${travelDetails.pnr}. Check email for details.`
            }
        };
    }
}

module.exports = NotificationService;
