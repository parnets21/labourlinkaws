const applyModel = require("../Model/Employers/apply");
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const sent = require("../EmailSender/send");

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
            return res.status(200).json({
                success: true,
                message: "No applications found for this job",
                data: []
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

        console.log('📄 Generate Offer Letter Request:');
        console.log('- Application ID:', applicationId);
        console.log('- Has uploaded file:', !!req.file);
        if (req.file) {
            console.log('- File name:', req.file.originalname);
            console.log('- File size:', req.file.size, 'bytes');
        }

        // Find the application
        const application = await applyModel
            .findById(applicationId)
            .populate('userId', 'fullName name email phone');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        let pdfUrl;
        let uploadedPdfUrl = null;

        // Check if a custom PDF was uploaded (multer uses req.file for single file)
        if (req.file) {
            const uploadedFile = req.file;
            const offersDir = path.join(__dirname, '../public/offers');
            
            // Create offers directory if it doesn't exist
            try {
                await fs.access(offersDir);
            } catch {
                await fs.mkdir(offersDir, { recursive: true });
            }

            // Save uploaded PDF (multer stores file in buffer when using memoryStorage)
            const uploadedPdfPath = path.join(offersDir, `${applicationId}_custom.pdf`);
            await fs.writeFile(uploadedPdfPath, uploadedFile.buffer);
            uploadedPdfUrl = `/api/offers/view/${applicationId}`;
            pdfUrl = uploadedPdfUrl;
            
            console.log('✅ Custom PDF uploaded:', uploadedPdfUrl);
        } else {
            // Generate PDF if no custom PDF was uploaded
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

        // Save generated PDF
        const pdfBytes = await pdfDoc.save();
        const offerLetterPath = path.join(offersDir, `${applicationId}.pdf`);
        await fs.writeFile(offerLetterPath, pdfBytes);
        pdfUrl = `/api/offers/view/${applicationId}`;
        }

        // Update application with offer letter details
        application.offerLetter = {
            url: pdfUrl, // Use the appropriate PDF URL (uploaded or generated)
            uploadedPdfUrl: uploadedPdfUrl, // Store uploaded PDF URL separately
            generatedAt: new Date(),
            status: 'sent',
            position: position,
            salary: salary,
            startDate: startDate,
            workLocation: workLocation
        };
        
        // ✅ Update BOTH status fields (the app uses 'status' field with capital case)
        application.status = 'Selected'; // Main status field (capital case)
        application.applicationStatus = 'selected'; // Secondary status field (lowercase)
        
        await application.save();

        console.log('💾 Saved offer letter to database:');
        console.log('- Status updated to:', application.status);
        console.log('- Application Status updated to:', application.applicationStatus);
        console.log('- URL:', pdfUrl);
        console.log('- Uploaded PDF URL:', uploadedPdfUrl);

        // Send notifications
        try {
            const candidateName = application.userId.fullName || application.userId.name || "Candidate";
            const candidateEmail = application.userId.email;
            const candidatePhone = application.userId.phone;
            const offerLink = `https://laborlink.co.in/api/offers/download/${applicationId}`;

            console.log('📧 Sending notifications to:');
            console.log('- Name:', candidateName);
            console.log('- Email:', candidateEmail);
            console.log('- Phone:', candidatePhone);

            // Send Email
            if (candidateEmail) {
                console.log('📧 Sending email notification...');
                await sent.sendMail(
                    candidateName,
                    candidateEmail,
                    `🎉 Congratulations ${candidateName}!<br><br>Your offer letter for the position of <b>${position}</b> at <b>${companyName}</b> has been generated.<br><br>You can download it here: <a href="${offerLink}">Download Offer Letter</a><br><br>Please review and respond within 7 days.<br><br>Best wishes!<br>Labor Link Team`
                );
                console.log('✅ Email sent successfully');
            }

            // Send WhatsApp Notification
            if (candidatePhone) {
                console.log('📱 Sending WhatsApp notification...');
                const whatsappMsg = `Congratulations ${candidateName}! Your offer letter for ${position} at ${companyName} is ready. View it here: ${offerLink}. Please respond within 7 days.`;
                await sent.sendSelectedWhatsapp(candidateName, candidatePhone, whatsappMsg);
                console.log('✅ WhatsApp sent successfully');
            }

            // Send SMS Notification
            if (candidatePhone) {
                console.log('📲 Sending SMS notification...');
                const smsMsg = `Congratulations ${candidateName}! Your offer letter for ${position} at ${companyName} is ready. Please check your email or WhatsApp for details. - LaborLink`;
                await sent.sendSelectedSMS(candidatePhone, smsMsg);
                console.log('✅ SMS sent successfully');
            }
        } catch (notifError) {
            console.error('❌ Notification error:', notifError);
            // Don't fail the whole process if notifications fail
        }

        // Record application review usage
        try {
            const employerId = req.body.employerId || req.query.employerId;
            if (employerId) {
                const SubscriptionUsageService = require('../services/subscriptionUsageService');
                await SubscriptionUsageService.recordUsage(String(employerId), 'application_review', {
                    endpoint: 'generateOfferLetter',
                    applicationId: req.params.applicationId,
                    candidateId: String(application.userId._id)
                });
            }
        } catch (recErr) {
            console.log('Warning: could not record application_review usage:', recErr?.message || recErr);
        }

        res.status(200).json({
            success: true,
            message: 'Offer letter generated and sent successfully',
            data: {
                applicationId: application._id,
                pdfUrl: pdfUrl // Use the actual pdfUrl (custom or generated)
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
            .populate('userId', 'fullName name email phone')
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
                applicantName: application.userId.fullName || application.userId.name,
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
            .populate('userId', 'fullName name email phone');

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
            .populate('userId', 'fullName name email phone')
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

// Get all sent offer letters for an employer (across all jobs)
exports.getEmployerOfferHistory = async (req, res) => {
    try {
        const { employerId } = req.params;

        if (!employerId) {
            return res.status(400).json({
                success: false,
                message: 'Employer ID is required'
            });
        }

        // Find all applications with offer letters for this employer's jobs
        const offerHistory = await applyModel
            .find({
                offerLetter: { $exists: true, $ne: null }
            })
            .populate('userId', 'fullName name email phone profilePicture')
            .populate('companyId', 'jobtitle companyName companyaddress')
            .sort({ 'offerLetter.generatedAt': -1 });

        // Filter by employer's jobs (companyId should match employer's posted jobs)
        // Since we need to verify the employer owns these jobs, we'll do additional filtering
        const filteredOffers = offerHistory.filter(app => {
            // You may need to add employerId field to job model or application model
            // For now, we'll return all offers and let frontend handle filtering
            return app.offerLetter && app.offerLetter.generatedAt;
        });

        // Format the response with detailed information
        const formattedHistory = filteredOffers.map(app => ({
            _id: app._id,
            candidateName: app.userId?.fullName || app.userId?.name || 'N/A',
            candidateEmail: app.userId?.email || 'N/A',
            candidatePhone: app.userId?.phone || 'N/A',
            candidateProfilePicture: app.userId?.profilePicture || null,
            jobTitle: app.companyId?.jobtitle || 'N/A',
            companyName: app.companyId?.companyName || app.offerLetter?.companyName || 'N/A',
            position: app.offerLetter?.position || 'N/A',
            salary: app.offerLetter?.salary || 'N/A',
            startDate: app.offerLetter?.startDate || 'N/A',
            workLocation: app.offerLetter?.workLocation || 'N/A',
            sentDate: app.offerLetter?.generatedAt || null,
            offerStatus: app.offerLetter?.status || 'pending',
            applicationStatus: app.applicationStatus || 'applied',
            respondedAt: app.offerLetter?.respondedAt || null,
            response: app.offerLetter?.response || null,
            pdfUrl: app.offerLetter?.url || null,
            uploadedPdfUrl: app.offerLetter?.uploadedPdfUrl || null
        }));

        res.status(200).json({
            success: true,
            data: formattedHistory,
            count: formattedHistory.length,
            message: 'Offer history retrieved successfully'
        });

    } catch (err) {
        console.error('Get employer offer history error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get offer history',
            error: err.message
        });
    }
};

