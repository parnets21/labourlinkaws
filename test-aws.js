// Test file for AWS S3 connectivity
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config();

// Log the environment variables (redacted for security)
console.log("AWS Region:", process.env.AWS_REGION);
console.log("AWS Bucket:", process.env.AWS_S3_BUCKET_NAME);
console.log("AWS Key ID:", process.env.AWS_ACCESS_KEY_ID ? "Found" : "Missing");
console.log("AWS Secret Key:", process.env.AWS_SECRET_ACCESS_KEY ? "Found" : "Missing");

// Initialize S3 client with environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// List objects in the bucket to verify connectivity
async function listObjects() {
  try {
    console.log("Testing connection to AWS S3...");
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      MaxKeys: 10, // Limit to 10 objects
    };
    
    const command = new ListObjectsV2Command(params);
    const response = await s3Client.send(command);
    
    console.log("Connection successful!");
    console.log(`Found ${response.Contents ? response.Contents.length : 0} objects in bucket.`);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log("First few objects:");
      response.Contents.slice(0, 5).forEach(item => {
        console.log(` - ${item.Key} (${item.Size} bytes, last modified: ${item.LastModified})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error connecting to AWS S3:", error.message);
    
    // Additional error analysis
    if (error.Code === "NoSuchBucket") {
      console.error("The specified bucket does not exist. Check your AWS_S3_BUCKET_NAME value.");
    } else if (error.Code === "InvalidAccessKeyId") {
      console.error("The AWS access key ID is invalid. Check your AWS_ACCESS_KEY_ID value.");
    } else if (error.Code === "SignatureDoesNotMatch") {
      console.error("The AWS signature is invalid. Check your AWS_SECRET_ACCESS_KEY value.");
    } else if (error.Code === "AccessDenied") {
      console.error("Access denied. Check your IAM permissions for the bucket.");
    }
    
    return false;
  }
}

// Test upload function
async function testUpload() {
  try {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    console.log("\nTesting file upload to AWS S3...");
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `test-folder/test-file-${Date.now()}.txt`,
      Body: "This is a test file to verify AWS S3 upload functionality.",
      ContentType: "text/plain",
    };
    
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    console.log("Upload successful!");
    console.log(`File uploaded to: https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`);
    
    return true;
  } catch (error) {
    console.error("Error uploading to AWS S3:", error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const listResult = await listObjects();
  
  if (listResult) {
    await testUpload();
  }
  
  console.log("\nTest complete.");
}

runTests(); 