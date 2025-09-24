const transactionModel = require("../Model/PhonepeModel");
const axios = require("axios");
const crypto = require('crypto');

const {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
  MetaInfo,
  CreateSdkOrderRequest
} = require("pg-sdk-node");

const clientId = "SU2509221900139808161172";
const clientSecret = "2d5ea2d9-8043-4d9c-bd52-c586cfa1de5d";
const clientVersion = 1;
const env = Env.PRODUCTION;

const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

class Transaction {


  async addPaymentPhone(req, res) {
    try {
      const { userId, username, Mobile, orderId, amount, config, successUrl, failedUrl } = req.body;
       
      const data = await transactionModel.create({
        userId,
        username,
        Mobile,
        orderId,
        amount,
        config,
        successUrl,
        failedUrl
      });

      if (!data)
        return res.status(400).json({ error: "Something went wrong" });

      const merchantOrderId = data._id.toString();
      const redirectUrl = successUrl || `https://sbwears.com/PaymentSuccess?transactionId=${data._id}&userID=${userId}`;

      // Build the payment request for web
      const paymentRequest = CreateSdkOrderRequest.StandardCheckoutBuilder()
        .merchantOrderId(merchantOrderId)
        .amount(amount * 100) // Convert to paise
        .redirectUrl(redirectUrl)
        .build();

      // Send payment request to PhonePe
      const response = await client.pay(paymentRequest);
      console.log("PhonePe SDK response:", response);
      
      const checkoutUrl = response.redirectUrl;

      if (!checkoutUrl) {
        console.error("Invalid PhonePe response:", response);
        return res.status(500).json({ error: "PhonePe did not return a URL" });
      }

      return res.status(200).json({
        orderId: response.orderId,
        merchantID: merchantOrderId,
        url: checkoutUrl,
      });
    } catch (error) {
      console.error("Payment Error:", error);
      return res.status(500).json({ error: "Payment processing failed" });
    }
  }

  // Mobile SDK integration - returns checksum for native app
  async addPaymentMobile(req, res) {
    let transaction;

    try {
      // Validate input
      const { userId, username, Mobile, orderId, amount, config } = req.body;
      if (!userId || !username || !Mobile || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create transaction record
      transaction = await transactionModel.create({
        userId,
        username,
        Mobile,
        orderId: orderId || `ORD_${Date.now()}`,
        amount,
        config,
        status: 'INITIATED'
      });

      const merchantTransactionId = transaction._id.toString();

      // Prepare payment payload for mobile SDK
      const paymentPayload = {
        merchantId: clientId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: amount * 100, // Convert to paise
        redirectUrl: `https://laborlink.co.in/PaymentSuccess?transactionId=${transaction._id}&userID=${userId}`,
        callbackUrl: `https://laborlink.co.in/api/user/checkPayment/${transaction._id}/${userId}`,
        mobileNumber: Mobile,
        paymentInstrument: {
          type: "PAY_PAGE"
        }
      };

      console.log("Payment payload:", paymentPayload);

      // Generate base64 encoded payload
      const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
      
      // Generate checksum for mobile SDK
      const stringToHash = base64Payload + '/pg/v1/pay' + clientSecret;
      const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const checksum = sha256Hash + '###' + clientVersion;

      console.log("Generated checksum:", checksum);

      res.status(200).json({
        success: true,
        data: {
          transactionBody: base64Payload,
          checksum: checksum,
          transactionId: transaction._id,
        },
      });

    } catch (error) {
      console.error("Mobile Payment Error:", error.message);

      // Update transaction status if it was created
      if (transaction) {
        await transactionModel.findByIdAndUpdate(transaction._id, {
          status: 'FAILED',
          error: error.response?.data?.message || error.message
        });
      }

      return res.status(500).json({
        error: "Payment processing error",
        details: error.response?.data || error.message
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

      // Check status with PhonePe
      client.getOrderStatus(id).then(async (response) => {
        console.log("PhonePe status response:", response);
        
        const state = response.state;
        
        // Execute config if payment completed
        if (state === "COMPLETED" && data.config) {
          try {
            const configData = JSON.parse(data.config);
            await axios(configData);
            data.config = null; // Clear config after execution
          } catch (configError) {
            console.error("Config execution error:", configError);
          }
        }
        
        data.status = state;
        data = await data.save();
        
        return res.status(200).json({ success: data });
        
      }).catch((error) => {
        console.error("PhonePe status check error:", error);
        
        // Return current data if PhonePe check fails
        return res.status(200).json({ 
          success: data,
          note: "PhonePe status check failed, returning cached status"
        });
      });

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
        data.status = state;
        
        // Execute config if payment completed
        if (state === 'COMPLETED' && data.config) {
          try {
            const configData = JSON.parse(data.config);
            await axios(configData);
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

  // Legacy payment method (for backward compatibility)
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
      redirectUrl: redirectUrl ,
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
        url: response.data?.data.instrumentResponse?.redirectInfo,
      });
    } catch (error) {
      console.error("Legacy Payment Error:", error);
      return res.status(500).json({ error: "Payment processing failed" });
    }
  }
}

module.exports = new Transaction();