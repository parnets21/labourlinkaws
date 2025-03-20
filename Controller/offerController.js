const JobApplication = require('../Model/JobApplication');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const twilio = require('twilio');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.generateOfferLetter = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.applicationId)
            .populate('applicant')
            .populate('job');

        if (!application) {
            throw new Error('Application not found');
        }

        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Add company logo
        const logoPath = path.join(__dirname, '../public/images/company-logo.png');
        const logoImage = await fs.readFile(logoPath);
        const logo = await pdfDoc.embedPng(logoImage);
        
        // Add content to PDF
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText('OFFER LETTER', {
            x: 50,
            y: height - 100,
            size: 24,
            font,
            color: rgb(0, 0, 0)
        });

        // Add offer details
        const content = `
            Dear ${application.applicant.profile.firstName} ${application.applicant.profile.lastName},

            We are pleased to offer you the position of ${application.job.title} at our organization.

            Salary: ${application.job.salary.min} - ${application.job.salary.max} ${application.job.salary.currency}
            Location: ${application.job.location.address}
            Start Date: ${req.body.startDate}

            Please confirm your acceptance within 7 days.

            Best regards,
            ${application.job.employer.profile.firstName} ${application.job.employer.profile.lastName}
        `;

        page.drawText(content, {
            x: 50,
            y: height - 200,
            size: 12,
            font: await pdfDoc.embedFont(StandardFonts.Helvetica),
            color: rgb(0, 0, 0),
            lineHeight: 16
        });

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const offerLetterPath = path.join(__dirname, `../public/offers/${application._id}.pdf`);
        await fs.writeFile(offerLetterPath, pdfBytes);

        // Update application with offer letter details
        application.offerLetter = {
            url: `/offers/${application._id}.pdf`,
            generatedAt: new Date(),
            status: 'pending'
        };
        await application.save();

        // Send notifications
        // 1. WhatsApp
        await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+91${application.applicant.profile.phone}`,
            body: 'Congratulations! Your offer letter has been generated. Please check your email.'
        });

        // 2. SMS
        await twilioClient.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${application.applicant.profile.phone}`,
            body: 'Your offer letter has been generated. Please check your email.'
        });

        res.status(200).json({
            status: 'success',
            data: {
                offerLetter: application.offerLetter
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.respondToOffer = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.applicationId);
        
        if (!application) {
            throw new Error('Application not found');
        }

        application.offerLetter.status = req.body.status;
        await application.save();

        if (req.body.status === 'accepted') {
            // Trigger travel arrangements if needed
            if (req.body.requiresTravel) {
                await this.arrangeTravelForCandidate(application);
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                offerLetter: application.offerLetter
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.arrangeTravelForCandidate = async (application) => {
    try {
        // Integrate with travel booking API (example using a mock API)
        const travelBooking = await axios.post(process.env.TRAVEL_API_URL, {
            passenger: {
                name: `${application.applicant.profile.firstName} ${application.applicant.profile.lastName}`,
                phone: application.applicant.profile.phone,
                email: application.applicant.email
            },
            journey: {
                from: application.applicant.profile.location.address,
                to: application.job.location.address,
                date: req.body.travelDate,
                preferredMode: req.body.travelMode
            }
        });

        // Add travel arrangement to application
        application.travelArrangements.push({
            type: travelBooking.data.mode,
            bookingDetails: {
                pnr: travelBooking.data.pnr,
                departure: travelBooking.data.departureTime,
                arrival: travelBooking.data.arrivalTime,
                from: travelBooking.data.origin,
                to: travelBooking.data.destination
            },
            status: 'booked'
        });

        await application.save();

        // Send travel details via WhatsApp
        await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+91${application.applicant.profile.phone}`,
            body: `Travel Booking Confirmed!
                PNR: ${travelBooking.data.pnr}
                From: ${travelBooking.data.origin}
                To: ${travelBooking.data.destination}
                Departure: ${travelBooking.data.departureTime}
                Arrival: ${travelBooking.data.arrivalTime}`
        });

        return application.travelArrangements[application.travelArrangements.length - 1];
    } catch (err) {
        throw new Error(`Failed to arrange travel: ${err.message}`);
    }
};
