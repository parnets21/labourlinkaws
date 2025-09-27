const transactionController=require("../Controller/PhonepeController");
const express=require('express');
const router=express.Router();

router.post("/addpaymentphonepay",transactionController.addPaymentPhone);
router.post("/addpaymentmobile",transactionController.addPaymentMobile);
router.post("/makepayment",transactionController.makepayment);
router.put("/updateStatuspayment/:id",transactionController.updateStatuspayment);
router.get("/getallpayment",transactionController.getallpayment);
router.post("/payment-callback",transactionController.paymentcallback);
router.get("/checkPayment/history/:userId",transactionController.getUserTransactionHistory);
router.get("/checkPayment/:id/:userId",transactionController.checkPayment);

// Enhanced transaction management routes
router.get("/transaction/details/:transactionId", transactionController.getTransactionDetails);
router.get("/transaction/statistics", transactionController.getTransactionStatistics);
router.post("/transaction/retry/:transactionId", transactionController.retryTransaction);
module.exports=router;  