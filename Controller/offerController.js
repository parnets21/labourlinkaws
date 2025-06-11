const applyModel = require("../Model/Employers/apply");
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const twilio = require('twilio');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Get all applications for a job
exports.getApplyList = async (req, res) => {
    try {
        const { jobId } = req.params;
        console.log("Received jobId:", jobId, "Type:", typeof jobId);
        
        let findData = await applyModel
            .find({ companyId: jobId })
            .sort({ _id: -1 })
            .populate("userId");
            
        if (!findData || findData.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No applications found for this job" 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            data: findData 
        });
    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};
// Generate offer letter for selected candidate
exports.generateOfferLetter = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const {
            position,
            salary,
            startDate,
            workLocation,
            employerName,
            companyName
        } = req.body;

        // Find the application
        const application = await applyModel
            .findById(applicationId)
            .populate('userId', 'name email phone');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Embed fonts with Unicode support
        let boldFont, regularFont;
        
        try {
            // Try to embed a Unicode-supporting font first
            // You can use any TrueType font that supports Unicode
            // For now, we'll use a fallback approach with standard fonts
            boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        } catch (fontError) {
            console.error('Font embedding error:', fontError);
            // Fallback to standard fonts
            boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }

        // Function to safely encode text (replace unsupported characters)
        const safeText = (text) => {
            return text
                .replace(/₹/g, 'Rs.') // Replace rupee symbol with Rs.
                .replace(/[^\x00-\x7F]/g, '?'); // Replace other non-ASCII chars with ?
        };

        // Header
        page.drawText('OFFER LETTER', {
            x: 50,
            y: height - 80,
            size: 24,
            font: boldFont,
            color: rgb(0, 0, 0)
        });

        // Date
        const currentDate = new Date().toLocaleDateString('en-IN');
        page.drawText(`Date: ${currentDate}`, {
            x: 400,
            y: height - 80,
            size: 12,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Content
        const yPosition = height - 150;
        const lineHeight = 20;
        let currentY = yPosition;

        const contentLines = [
            `Dear ${employerName},`,
            '',
            `We are pleased to offer you the position of ${position} at ${companyName || 'our organization'}.`,
            '',
            'OFFER DETAILS:',
            `• Position: ${position}`,
            `• Salary: Rs.${salary} per annum`, // Changed from ₹ to Rs.
            `• Start Date: ${startDate}`,
            `• Work Location: ${workLocation}`,
            '',
            'This offer is contingent upon:',
            '• Successful completion of background verification',
            '• Submission of required documents',
            '• Medical fitness certificate (if applicable)',
            '',
            'Please confirm your acceptance of this offer within 7 days from the date of this letter.',
            '',
            'We look forward to welcoming you to our team!',
            '',
            'Best regards,',
            '',
            `${employerName}`,
            `${companyName}`,
            '',
            '---',
            'Please reply with "ACCEPT" or "DECLINE" to confirm your decision.'
        ];

        contentLines.forEach((line, index) => {
            const fontSize = line.startsWith('•') ? 10 : 
                           line === 'OFFER DETAILS:' ? 14 : 12;
            const font = line === 'OFFER DETAILS:' || line.startsWith('Dear') ? boldFont : regularFont;
            
            // Use safeText to ensure compatibility
            const safeLine = safeText(line);
            
            page.drawText(safeLine, {
                x: 50,
                y: currentY - (index * lineHeight),
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
            });
        });

        // Create offers directory if it doesn't exist
        const offersDir = path.join(__dirname, '../public/offers');
        try {
            await fs.access(offersDir);
        } catch {
            await fs.mkdir(offersDir, { recursive: true });
        }

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const offerLetterPath = path.join(offersDir, `${applicationId}.pdf`);
        await fs.writeFile(offerLetterPath, pdfBytes);

        // Update application with offer letter details
        application.offerLetter = {
            url: `/offers/${applicationId}.pdf`,
            generatedAt: new Date(),
            status: 'sent',
            position: position,
            salary: salary,
            startDate: startDate,
            workLocation: workLocation
        };
        application.applicationStatus = 'selected'; // Update status to selected
        await application.save();

        // Send notifications
        try {
            // WhatsApp notification
            if (process.env.TWILIO_WHATSAPP_NUMBER && application.userId.phone) {
                await twilioClient.messages.create({
                    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                    to: `whatsapp:+91${application.userId.phone}`,
                    body: `🎉 Congratulations ${application.userId.name}!\n\nYour offer letter for the position of ${position} has been generated.\n\nPlease check your email and respond within 7 days.\n\nBest wishes!`
                });
            }

            // SMS notification
            if (process.env.TWILIO_PHONE_NUMBER && application.userId.phone) {
                await twilioClient.messages.create({
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: `+91${application.userId.phone}`,
                    body: `Congratulations! Your offer letter for ${position} has been generated. Please check your email. Reply within 7 days.`
                });
            }
        } catch (twilioError) {
            console.error('Notification error:', twilioError);
            // Don't fail the whole process if notifications fail
        }

        res.status(200).json({
            success: true,
            message: 'Offer letter generated successfully',
            data: {
                offerLetter: application.offerLetter,
                downloadUrl: `/offers/${applicationId}.pdf`
            }
        });

    } catch (err) {
        console.error('Generate offer letter error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to generate offer letter',
            error: err.message
        });
    }
};
// Get offer letter details
exports.getOfferLetter = async (req, res) => {
    try {
        const { applicationId } = req.params;
        
        const application = await applyModel
            .findById(applicationId)
            .populate('userId', 'name email phone')
            .select('offerLetter applicationStatus');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (!application.offerLetter) {
            return res.status(404).json({
                success: false,
                message: 'No offer letter found for this application'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                offerLetter: application.offerLetter,
                applicantName: application.userId.name,
                applicationStatus: application.applicationStatus
            }
        });

    } catch (err) {
        console.error('Get offer letter error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get offer letter',
            error: err.message
        });
    }
};
// Respond to offer (accept/decline)
exports.respondToOffer = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, response } = req.body; // status: 'accepted' or 'declined'
        
        const application = await applyModel
            .findById(applicationId)
            .populate('userId', 'name email phone');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (!application.offerLetter) {
            return res.status(400).json({
                success: false,
                message: 'No offer letter found for this application'
            });
        }

        // Update offer letter status
        application.offerLetter.status = status;
        application.offerLetter.respondedAt = new Date();
        application.offerLetter.response = response;
        
        // Update application status
        if (status === 'accepted') {
            application.applicationStatus = 'hired';
        } else if (status === 'declined') {
            application.applicationStatus = 'offer_declined';
        }

        await application.save();

        // Send confirmation notification
        // try {
        //     const message = status === 'accepted' 
        //         ? `Thank you ${application.userId.name} for accepting our offer! We'll be in touch with next steps soon.`
        //         : `We understand your decision to decline the offer. Thank you for your time and consideration.`;

        //     if (process.env.TWILIO_WHATSAPP_NUMBER && application.userId.phone) {
        //         await twilioClient.messages.create({
        //             from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        //             to: `whatsapp:+91${application.userId.phone}`,
        //             body: message
        //         });
        //     }
        // } catch (twilioError) {
        //     console.error('Notification error:', twilioError);
        // }

        res.status(200).json({
            success: true,
            message: `Offer ${status} successfully`,
            data: {
                offerLetter: application.offerLetter,
                applicationStatus: application.applicationStatus
            }
        });

    } catch (err) {
        console.error('Respond to offer error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to process offer response',
            error: err.message
        });
    }
};
// Get all selected candidates with offer letters
exports.getSelectedCandidates = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const selectedApplications = await applyModel
            .find({ 
                companyId: jobId,
                applicationStatus: { $in: ['selected', 'hired'] },
                offerLetter: { $exists: true }
            })
            .populate('userId', 'name email phone')
            .sort({ 'offerLetter.generatedAt': -1 });

        res.status(200).json({
            success: true,
            data: selectedApplications,
            count: selectedApplications.length
        });

    } catch (err) {
        console.error('Get selected candidates error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get selected candidates',
            error: err.message
        });
    }
};

