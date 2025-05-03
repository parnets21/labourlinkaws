// Test file for user file upload functionality
const fs = require('fs');
const { uploadFile2, deleteFile } = require('./middileware/aws');

// Create a mock file object that mimics a multer file
const createMockFile = (filename, type) => {
  // Create test file content
  const buffer = Buffer.from('This is a test file for user uploads');
  
  // Return an object that mimics multer's file object
  return {
    originalname: filename,
    buffer: buffer,
    mimetype: type
  };
};

// Test profile image upload
async function testProfileImageUpload() {
  try {
    console.log("\nTesting profile image upload...");
    
    // Create mock profile image
    const mockProfileImage = createMockFile('test-profile.jpg', 'image/jpeg');
    
    // Upload to S3
    const imageUrl = await uploadFile2(mockProfileImage, 'user-profiles');
    console.log("Profile image upload successful!");
    console.log(`Profile image URL: ${imageUrl}`);
    
    return imageUrl;
  } catch (error) {
    console.error("Error uploading profile image:", error.message);
    return null;
  }
}

// Test resume upload
async function testResumeUpload() {
  try {
    console.log("\nTesting resume upload...");
    
    // Create mock resume
    const mockResume = createMockFile('test-resume.pdf', 'application/pdf');
    
    // Upload to S3
    const resumeUrl = await uploadFile2(mockResume, 'user-resumes');
    console.log("Resume upload successful!");
    console.log(`Resume URL: ${resumeUrl}`);
    
    return resumeUrl;
  } catch (error) {
    console.error("Error uploading resume:", error.message);
    return null;
  }
}

// Test file deletion
async function testFileDeletion(fileUrl) {
  if (!fileUrl) return;
  
  try {
    console.log("\nTesting file deletion...");
    console.log(`Deleting file: ${fileUrl}`);
    
    // Delete the file from S3
    await deleteFile(fileUrl);
    console.log("File deletion successful!");
    
    return true;
  } catch (error) {
    console.error("Error deleting file:", error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log("=== TESTING USER FILE UPLOAD FUNCTIONALITY ===");
  
  // Test profile image upload
  const profileImageUrl = await testProfileImageUpload();
  
  // Test resume upload
  const resumeUrl = await testResumeUpload();
  
  // Test file deletion (cleanup)
  if (profileImageUrl) {
    await testFileDeletion(profileImageUrl);
  }
  
  if (resumeUrl) {
    await testFileDeletion(resumeUrl);
  }
  
  console.log("\nAll tests completed!");
}

// Run the tests
runTests(); 