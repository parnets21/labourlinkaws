/**
 * Role-Based Requirements Service
 * 
 * Determines required documents based on user role and validates document completeness.
 * Supports different user types: Employer, Employee/Individual Employer, New Startup Employer.
 */

class RoleBasedRequirementsService {
  constructor() {
    // Document requirements mapping by user role
    this.roleRequirements = {
      // Employer roles
      employer: {
        documents: ['gst', 'pan'],
        description: 'Employers must provide GST Certificate and PAN Card',
        userModel: 'Employer'
      },
      startup_employer: {
        documents: ['pan', 'tin'],
        description: 'New Startup Employers must provide PAN Card and TIN Certificate',
        userModel: 'Employer'
      },
      
      // Employee/Individual roles
      employee: {
        documents: ['pan', 'aadhar'],
        description: 'Employees must provide PAN Card and AADHAR Card',
        userModel: 'user'
      },
      individual_employer: {
        documents: ['pan', 'aadhar'],
        description: 'Individual Employers must provide PAN Card and AADHAR Card',
        userModel: 'user'
      }
    };

    // Document type descriptions
    this.documentDescriptions = {
      gst: {
        name: 'GST Certificate',
        description: 'Goods and Services Tax registration certificate',
        required_for: ['employer']
      },
      pan: {
        name: 'PAN Card',
        description: 'Permanent Account Number card issued by Income Tax Department',
        required_for: ['employer', 'startup_employer', 'employee', 'individual_employer']
      },
      aadhar: {
        name: 'AADHAR Card',
        description: 'Unique identification document issued by UIDAI',
        required_for: ['employee', 'individual_employer']
      },
      tin: {
        name: 'TIN Certificate',
        description: 'Tax Identification Number certificate',
        required_for: ['startup_employer']
      }
    };

    // Role display names
    this.roleDisplayNames = {
      employer: 'Employer',
      startup_employer: 'New Startup Employer',
      employee: 'Employee',
      individual_employer: 'Individual Employer'
    };
  }

  /**
   * Get required documents for a specific user role
   * @param {String} userRole - User role (employer, startup_employer, employee, individual_employer)
   * @returns {Object} - Required documents and descriptions
   */
  getRequiredDocuments(userRole) {
    try {
      if (!userRole) {
        return {
          success: false,
          error: 'User role is required',
          code: 'MISSING_ROLE'
        };
      }

      const normalizedRole = userRole.toLowerCase();
      const requirements = this.roleRequirements[normalizedRole];

      if (!requirements) {
        return {
          success: false,
          error: `Invalid user role: ${userRole}`,
          code: 'INVALID_ROLE',
          supportedRoles: Object.keys(this.roleRequirements)
        };
      }

      const documentDetails = requirements.documents.map(docType => ({
        type: docType,
        name: this.documentDescriptions[docType]?.name || docType,
        description: this.documentDescriptions[docType]?.description || '',
        required: true
      }));

      return {
        success: true,
        userRole: normalizedRole,
        userRoleDisplay: this.roleDisplayNames[normalizedRole],
        userModel: requirements.userModel,
        documents: requirements.documents,
        documentDetails: documentDetails,
        description: requirements.description,
        totalRequired: requirements.documents.length
      };

    } catch (error) {
      return {
        success: false,
        error: 'Error retrieving document requirements',
        code: 'RETRIEVAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate if user has uploaded all required documents for their role
   * @param {String} userRole - User role
   * @param {Array} uploadedDocuments - Array of uploaded document types
   * @returns {Object} - Validation result with missing documents
   */
  validateRoleDocuments(userRole, uploadedDocuments = []) {
    try {
      const requirements = this.getRequiredDocuments(userRole);
      
      if (!requirements.success) {
        return requirements;
      }

      const requiredDocs = requirements.documents;
      const uploadedTypes = Array.isArray(uploadedDocuments) 
        ? uploadedDocuments.map(doc => typeof doc === 'object' ? (doc.documentType || doc.type || doc) : doc)
        : uploadedDocuments.map(doc => doc.documentType || doc.type || doc);

      // Find missing documents
      const missingDocuments = requiredDocs.filter(docType => 
        !uploadedTypes.includes(docType)
      );

      // Find extra documents (not required for this role)
      const extraDocuments = uploadedTypes.filter(docType => 
        !requiredDocs.includes(docType)
      );

      const isComplete = missingDocuments.length === 0;

      const result = {
        success: true,
        isComplete: isComplete,
        userRole: userRole,
        required: requiredDocs,
        uploaded: uploadedTypes,
        missing: missingDocuments,
        extra: extraDocuments,
        completionPercentage: Math.round((uploadedTypes.filter(doc => requiredDocs.includes(doc)).length / requiredDocs.length) * 100)
      };

      // Add detailed missing document information
      if (missingDocuments.length > 0) {
        result.missingDetails = missingDocuments.map(docType => ({
          type: docType,
          name: this.documentDescriptions[docType]?.name || docType,
          description: this.documentDescriptions[docType]?.description || ''
        }));
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: 'Error validating role documents',
        code: 'VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Check if a document type is required for a specific role
   * @param {String} userRole - User role
   * @param {String} documentType - Document type to check
   * @returns {Boolean} - True if document is required for the role
   */
  isDocumentRequiredForRole(userRole, documentType) {
    try {
      const requirements = this.getRequiredDocuments(userRole);
      return requirements.success && requirements.documents.includes(documentType);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all supported user roles
   * @returns {Array} - Array of supported user roles with descriptions
   */
  getSupportedRoles() {
    return Object.keys(this.roleRequirements).map(role => ({
      role: role,
      displayName: this.roleDisplayNames[role],
      userModel: this.roleRequirements[role].userModel,
      documents: this.roleRequirements[role].documents,
      description: this.roleRequirements[role].description
    }));
  }

  /**
   * Get document information by type
   * @param {String} documentType - Document type
   * @returns {Object} - Document information
   */
  getDocumentInfo(documentType) {
    const docInfo = this.documentDescriptions[documentType];
    
    if (!docInfo) {
      return {
        success: false,
        error: `Unknown document type: ${documentType}`,
        code: 'UNKNOWN_DOCUMENT_TYPE'
      };
    }

    return {
      success: true,
      type: documentType,
      name: docInfo.name,
      description: docInfo.description,
      requiredForRoles: docInfo.required_for,
      roleDisplayNames: docInfo.required_for.map(role => this.roleDisplayNames[role])
    };
  }

  /**
   * Determine user role based on registration data
   * @param {Object} registrationData - User registration data
   * @returns {String} - Determined user role
   */
  determineUserRole(registrationData) {
    try {
      // Check if it's an employer registration
      if (registrationData.CompanyName || registrationData.companyName || 
          registrationData.isEmployer || registrationData.userType === 'employer') {
        
        // Check if it's a startup (no GST number)
        if (!registrationData.GstNum && !registrationData.gstNum) {
          return 'startup_employer';
        }
        
        return 'employer';
      }

      // Check if it's an individual employer
      if (registrationData.userRole === 'individual_employer' || 
          registrationData.isIndividualEmployer) {
        return 'individual_employer';
      }

      // Default to employee
      return 'employee';

    } catch (error) {
      // Default to employee if determination fails
      return 'employee';
    }
  }

  /**
   * Get role-specific validation messages
   * @param {String} userRole - User role
   * @param {Array} missingDocuments - Array of missing document types
   * @returns {Object} - Validation messages
   */
  getValidationMessages(userRole, missingDocuments = []) {
    try {
      const requirements = this.getRequiredDocuments(userRole);
      
      if (!requirements.success) {
        return {
          error: requirements.error,
          code: requirements.code
        };
      }

      if (missingDocuments.length === 0) {
        return {
          success: true,
          message: `All required documents for ${requirements.userRoleDisplay} have been uploaded.`,
          canProceed: true
        };
      }

      const missingNames = missingDocuments.map(docType => 
        this.documentDescriptions[docType]?.name || docType
      );

      return {
        success: false,
        message: `Missing required documents for ${requirements.userRoleDisplay}: ${missingNames.join(', ')}`,
        missingDocuments: missingDocuments,
        missingNames: missingNames,
        canProceed: false,
        actionRequired: 'Please upload the missing documents to continue with registration.'
      };

    } catch (error) {
      return {
        error: 'Error generating validation messages',
        code: 'MESSAGE_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate role transition (if user wants to change role)
   * @param {String} currentRole - Current user role
   * @param {String} newRole - New desired role
   * @param {Array} currentDocuments - Currently uploaded documents
   * @returns {Object} - Transition validation result
   */
  validateRoleTransition(currentRole, newRole, currentDocuments = []) {
    try {
      const currentReqs = this.getRequiredDocuments(currentRole);
      const newReqs = this.getRequiredDocuments(newRole);

      if (!currentReqs.success || !newReqs.success) {
        return {
          success: false,
          error: 'Invalid role for transition',
          code: 'INVALID_TRANSITION_ROLE'
        };
      }

      const currentTypes = currentDocuments.map(doc => doc.documentType || doc.type || doc);
      const additionalDocsNeeded = newReqs.documents.filter(doc => 
        !currentTypes.includes(doc)
      );
      const obsoleteDocuments = currentTypes.filter(doc => 
        !newReqs.documents.includes(doc)
      );

      return {
        success: true,
        canTransition: true,
        currentRole: currentRole,
        newRole: newRole,
        additionalDocumentsNeeded: additionalDocsNeeded,
        obsoleteDocuments: obsoleteDocuments,
        requiresAdditionalUpload: additionalDocsNeeded.length > 0,
        message: additionalDocsNeeded.length > 0 
          ? `Role change requires uploading: ${additionalDocsNeeded.join(', ')}`
          : 'Role change can proceed with existing documents'
      };

    } catch (error) {
      return {
        success: false,
        error: 'Error validating role transition',
        code: 'TRANSITION_ERROR',
        details: error.message
      };
    }
  }
}

module.exports = RoleBasedRequirementsService;