const JobApplication = require('../Model/JobApplication');
const User = require('../Model/User');
const { google } = require('googleapis');
const { WebClient } = require('@slack/web-api');
const twilio = require('twilio');

// Initialize clients
const calendar = google.calendar({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
const slack = new WebClient(process.env.SLACK_TOKEN);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.scheduleInterview = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.applicationId)
            .populate('applicant')
            .populate({
                path: 'job',
                populate: {
                    path: 'employer'
                }
            });

        if (!application) {
            throw new Error('Application not found');
        }

        // Create Google Meet event
        const event = {
            summary: `Interview for ${application.job.title}`,
            description: `Interview between ${application.applicant.profile.firstName} and ${application.job.employer.profile.firstName}`,
            start: {
                dateTime: req.body.scheduledTime,
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: new Date(new Date(req.body.scheduledTime).getTime() + 60*60*1000).toISOString(), // 1 hour duration
                timeZone: 'Asia/Kolkata',
            },
            conferenceData: {
                createRequest: {
                    requestId: application._id.toString(),
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            attendees: [
                { email: application.applicant.email },
                { email: application.job.employer.email },
                { email: process.env.ADMIN_EMAIL } // Company representative
            ]
        };

        const meetEvent = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1
        });

        // Add interview to application
        application.interviews.push({
            scheduledTime: req.body.scheduledTime,
            platform: 'google_meet',
            meetingLink: meetEvent.data.hangoutLink,
            status: 'scheduled'
        });

        await application.save();

        // Send notifications
        // 1. Email notification (assuming you have an email service set up)
        // 2. WhatsApp notification
        await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+91${application.applicant.profile.phone}`,
            body: `Your interview for ${application.job.title} has been scheduled for ${req.body.scheduledTime}. Join using: ${meetEvent.data.hangoutLink}`
        });

        // 3. SMS notification
        await twilioClient.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${application.applicant.profile.phone}`,
            body: `Interview scheduled for ${application.job.title} on ${req.body.scheduledTime}. Check your email for details.`
        });

        res.status(200).json({
            status: 'success',
            data: {
                interview: application.interviews[application.interviews.length - 1]
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.updateInterviewStatus = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.applicationId);
        
        if (!application) {
            throw new Error('Application not found');
        }

        const interview = application.interviews.id(req.params.interviewId);
        
        if (!interview) {
            throw new Error('Interview not found');
        }

        interview.status = req.body.status;
        interview.feedback = req.body.feedback;

        await application.save();

        // If interview is completed, update application status
        if (req.body.status === 'completed') {
            application.status = 'interview_completed';
            await application.save();
        }

        res.status(200).json({
            status: 'success',
            data: {
                interview
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};


