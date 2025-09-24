const transactionModel = require("../Model/PhonepeModel");
const axios = require("axios");
const crypto = require('crypto');

const clientId = "SU2509221900139808161172";
const clientSecret = "2d5ea2d9-8043-4d9c-bd52-c586cfa1de5d";

class Transaction {

  // Single payment method for both web and mobile (web URL only)
  async addPaymentPhone(req, res) {
    try {
      const { userId, username, Mobile, orderId, amount, config, successUrl, failedUrl } = req.body;
       
      // Create transaction record
      const data = await transactionModel.create({
        userId,
        username,
        Mobile,
        orderId: orderId || `ORD_${Date.now()}`,
        amount,
        config,
        successUrl,
        failedUrl,
        status: 'INITIATED'
      });

      if (!data) {
        return res.status(400).json({ error: "Something went wrong" });
      }

      const merchantTransactionId = data._id.toString();
      const redirectUrl = successUrl || `https://laborlink.co.in/PaymentSuccess?transactionId=${data._id}&userID=${userId}`;

      // Payment payload for PhonePe API
      const paymentPayload = {
        merchantId: clientId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: amount * 100, // Convert to paise
        redirectUrl: redirectUrl,
        redirectMode: "REDIRECT",
        callbackUrl: `https://laborlink.co.in/api/user/paymentcallback`,
        mobileNumber: Mobile,
        paymentInstrument: {
          type: "PAY_PAGE"
        }
      };

      console.log("Payment payload:", paymentPayload);

      // Generate signature
      const payload = JSON.stringify(paymentPayload);
      const base64Payload = Buffer.from(payload).toString('base64');
      const stringToHash = base64Payload + '/pg/v1/pay' + clientSecret;
      const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const signature = sha256Hash + '###1';

      // Make API call to PhonePe
      const response = await axios.post(
        "https://api.phonepe.com/apis/hermes/pg/v1/pay",
        {
          request: base64Payload,
        },
        {
          headers: {
            "X-VERIFY": signature,
            "Content-Type": "application/json"
          },
        }
      );

      console.log("PhonePe API response:", response.data);

      if (response.data.success && response.data.data) {
        const checkoutUrl = response.data.data.instrumentResponse.redirectInfo.url;

        return res.status(200).json({
          orderId: response.data.data.merchantTransactionId,
          merchantID: merchantTransactionId,
          url: checkoutUrl,
        });
      } else {
        console.error("PhonePe API error:", response.data);
        return res.status(500).json({ error: "PhonePe payment initiation failed" });
      }

    } catch (error) {
      console.error("Payment Error:", error.response?.data || error.message);
      return res.status(500).json({ 
        error: "Payment processing failed",
        details: error.response?.data?.message || error.message
      });
    }
  }

  // Update payment status
  async updateStatuspayment(req, res) {
    try {
      let id = req.params.id;
      let data = await transactionModel.findById(id);
      if (!data) return res.status(400).json({ error: "Data not found" });
      
      data.status = "COMPLETED";
      await data.save();
      
      return res.status(200).json({ success: "Successfully Completed" });
    } catch (error) {
      console.error("Update status error:", error);
      return res.status(500).json({ error: "Failed to update status" });
    }
  }

  // Check payment status
  async checkPayment(req, res) {
    try {
      let id = req.params.id;
      let userId = req.params.userId;
      
      let data = await transactionModel.findById(id);
      if (!data) {
        return res.status(400).json({ error: "Payment Id not found!" });
      }

      // Check status with PhonePe API
      const merchantTransactionId = data._id.toString();
      const stringToHash = `/pg/v1/status/${clientId}/${merchantTransactionId}` + clientSecret;
      const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const signature = sha256Hash + '###1';

      try {
        const statusResponse = await axios.get(
          `https://api.phonepe.com/apis/hermes/pg/v1/status/${clientId}/${merchantTransactionId}`,
          {
            headers: {
              "X-VERIFY": signature,
              "X-MERCHANT-ID": clientId
            }
          }
        );

        console.log("PhonePe status response:", statusResponse.data);
        
        if (statusResponse.data.success && statusResponse.data.data) {
          const paymentState = statusResponse.data.data.state;
          
          // Execute config if payment completed and not already executed
          if (paymentState === "COMPLETED" && data.config && data.status !== "COMPLETED") {
            try {
              const configData = JSON.parse(data.config);
              await axios(configData);
              console.log("Config executed successfully");
              data.config = null; // Clear config after execution
            } catch (configError) {
              console.error("Config execution error:", configError);
            }
          }
          
          data.status = paymentState;
          data = await data.save();
          
          return res.status(200).json({ success: data });
        } else {
          console.log("PhonePe status check failed, returning cached status");
          return res.status(200).json({ 
            success: data,
            note: "PhonePe status check failed, returning cached status"
          });
        }
        
      } catch (statusError) {
        console.error("PhonePe status API error:", statusError.response?.data || statusError.message);
        
        // Return current data if PhonePe check fails
        return res.status(200).json({ 
          success: data,
          note: "PhonePe status check failed, returning cached status"
        });
      }

    } catch (error) {
      console.error("Check payment error:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  // Payment callback handler
  async paymentcallback(req, res) {
    try {
      const { response } = req.body;

      if (!response) {
        return res.status(400).json({ error: "No response data" });
      }

      // Decode the response
      const decodedStr = Buffer.from(response, 'base64').toString('utf-8');
      const responseJson = JSON.parse(decodedStr);
      
      console.log('Payment callback data:', responseJson);
      
      const { merchantTransactionId, state } = responseJson?.data || {};

      if (!merchantTransactionId) {
        return res.status(400).json({ error: "No merchant transaction ID" });
      }

      // Find and update transaction
      let data = await transactionModel.findById(merchantTransactionId);
      
      if (data) {
        const previousStatus = data.status;
        data.status = state;
        
        // Execute config if payment completed and not already executed
        if (state === 'COMPLETED' && data.config && previousStatus !== 'COMPLETED') {
          try {
            const configData = JSON.parse(data.config);
            await axios(configData);
            console.log("Config executed via callback");
            data.config = null; // Clear config after execution
          } catch (configError) {
            console.error("Config execution error:", configError);
          }
        }
        
        await data.save();
        console.log(`Transaction ${merchantTransactionId} updated to ${state}`);
      }

      res.status(200).send('Callback processed successfully');
      
    } catch (error) {
      console.error("Callback processing error:", error);
      res.status(500).send('Callback processing failed');
    }
  }

  // Get all payments
  async getallpayment(req, res) {
    try {
      let data = await transactionModel.find({}).sort({ _id: -1 });
      return res.status(200).json({ success: data });
    } catch (error) {
      console.error("Get all payments error:", error);
      return res.status(500).json({ error: "Failed to fetch payments" });
    }
  }

  // Legacy payment method (kept for backward compatibility)
  async makepayment(req, res) {
    let {
      amount,
      merchantTransactionId,
      merchantUserId,
      redirectUrl,
      callbackUrl,
      mobileNumber,
    } = req.body;

    function generateSignature(payload, saltKey, saltIndex) {
      const encodedPayload = Buffer.from(payload).toString("base64");
      const concatenatedString = encodedPayload + "/pg/v1/pay" + saltKey;
      const hashedValue = crypto
        .createHash("sha256")
        .update(concatenatedString)
        .digest("hex");

      const signature = hashedValue + "###" + saltIndex;
      return signature;
    }

    const paymentDetails = {
      merchantId: clientId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: merchantUserId,
      amount: amount,
      redirectUrl: redirectUrl,
      redirectMode: "POST",
      callbackUrl: callbackUrl,
      mobileNumber: mobileNumber,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(paymentDetails);
    let objJsonB64 = Buffer.from(payload).toString("base64");
    const saltKey = clientSecret;
    const saltIndex = 1;
    const signature = generateSignature(payload, saltKey, saltIndex);

    try {
      const response = await axios.post(
        "https://api.phonepe.com/apis/hermes/pg/v1/pay",
        {
          request: objJsonB64,
        },
        {
          headers: {
            "X-VERIFY": signature,
          },
        }
      );

      return res.status(200).json({
        url: response.data?.data.instrumentResponse?.redirectInfo?.url,
      });
    } catch (error) {
      console.error("Legacy Payment Error:", error);
      return res.status(500).json({ error: "Payment processing failed" });
    }
  }
}

module.exports = new Transaction();