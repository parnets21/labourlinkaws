/**
 * Document Validation Service
 * 
 * Handles validation of uploaded documents including file format, size, and content validation.
 * Supports PDF, JPG, and PNG formats with a maximum file size of 5MB.
 */

class DocumentValidationService {
  constructor() {
    // Supported file formats
    this.allowedFormats = ['pdf', 'jpg', 'jpeg', 'png'];
    this.allowedMimeTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png'
    ];
    
    // Maximum file size: 5MB in bytes
    this.maxFileSize = 5 * 1024 * 1024;
    
    // Document type mappings
    this.documentTypes = {
      gst: 'GST Certificate',
      pan: 'PAN Card',
      aadhar: 'AADHAR Card',
      tin: 'TIN Certificate'
    };
  }

  /**
   * Validate file format based on MIME type and file extension
   * @param {Object} file - File object from multer
   * @param {Array} allowedFormats - Optional array of allowed formats
   * @returns {Object} - Validation result with isValid boolean and error message
   */
  validateFileFormat(file, allowedFormats = null) {
    try {
      const formats = allowedFormats || this.allowedFormats;
      const mimeTypes = allowedFormats ? this.getMimeTypesForFormats(allowedFormats) : this.allowedMimeTypes;
      
      if (!file) {
        return {
          isValid: false,
          error: 'No file provided',
          code: 'NO_FILE'
        };
      }

      // Check MIME type
      if (!mimeTypes.includes(file.mimetype)) {
        return {
          isValid: false,
          error: `Invalid file format. Only ${formats.join(', ').toUpperCase()} files are allowed`,
          code: 'INVALID_MIME_TYPE',
          allowedFormats: formats,
          receivedMimeType: file.mimetype
        };
      }

      // Check file extension
      const fileExtension = this.getFileExtension(file.originalname);
      if (!formats.includes(fileExtension)) {
        return {
          isValid: false,
          error: `Invalid file extension. Only ${formats.join(', ').toUpperCase()} files are allowed`,
          code: 'INVALID_EXTENSION',
          allowedFormats: formats,
          receivedExtension: fileExtension
        };
      }

      return {
        isValid: true,
        format: fileExtension,
        mimeType: file.mimetype
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating file format',
        code: 'VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate file size against maximum allowed size
   * @param {Object} file - File object from multer
   * @param {Number} maxSize - Optional maximum size in bytes
   * @returns {Object} - Validation result with isValid boolean and error message
   */
  validateFileSize(file, maxSize = null) {
    try {
      const sizeLimit = maxSize || this.maxFileSize;
      
      if (!file) {
        return {
          isValid: false,
          error: 'No file provided',
          code: 'NO_FILE'
        };
      }

      if (!file.size) {
        return {
          isValid: false,
          error: 'File size information not available',
          code: 'NO_SIZE_INFO'
        };
      }

      if (file.size > sizeLimit) {
        const maxSizeMB = (sizeLimit / (1024 * 1024)).toFixed(1);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        
        return {
          isValid: false,
          error: `File size too large. Maximum allowed size is ${maxSizeMB}MB`,
          code: 'FILE_TOO_LARGE',
          maxSize: sizeLimit,
          maxSizeMB: maxSizeMB,
          fileSize: file.size,
          fileSizeMB: fileSizeMB,
          compressionSuggestion: 'Please compress your file or use a smaller image resolution'
        };
      }

      return {
        isValid: true,
        fileSize: file.size,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2)
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating file size',
        code: 'VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Comprehensive document validation combining format and size checks
   * @param {Object} file - File object from multer
   * @param {String} documentType - Type of document (gst, pan, aadhar, tin)
   * @returns {Object} - Complete validation result
   */
  validateDocument(file, documentType) {
    try {
      const validationResult = {
        isValid: false,
        errors: [],
        warnings: [],
        documentType: documentType,
        documentName: this.documentTypes[documentType] || documentType
      };

      // Validate document type
      if (!this.documentTypes[documentType]) {
        validationResult.errors.push({
          field: 'documentType',
          message: `Invalid document type: ${documentType}`,
          code: 'INVALID_DOCUMENT_TYPE'
        });
        return validationResult;
      }

      // Validate file format
      const formatValidation = this.validateFileFormat(file);
      if (!formatValidation.isValid) {
        validationResult.errors.push({
          field: 'format',
          message: formatValidation.error,
          code: formatValidation.code,
          allowedFormats: formatValidation.allowedFormats,
          receivedMimeType: formatValidation.receivedMimeType,
          receivedExtension: formatValidation.receivedExtension
        });
      }

      // Validate file size
      const sizeValidation = this.validateFileSize(file);
      if (!sizeValidation.isValid) {
        validationResult.errors.push({
          field: 'size',
          message: sizeValidation.error,
          code: sizeValidation.code,
          maxSize: sizeValidation.maxSize,
          maxSizeMB: sizeValidation.maxSizeMB,
          fileSize: sizeValidation.fileSize,
          fileSizeMB: sizeValidation.fileSizeMB,
          compressionSuggestion: sizeValidation.compressionSuggestion
        });
      }

      // If no errors, validation passed
      if (validationResult.errors.length === 0) {
        validationResult.isValid = true;
        validationResult.fileInfo = {
          originalName: file.originalname,
          size: file.size,
          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
          mimeType: file.mimetype,
          format: formatValidation.format
        };
      }

      return validationResult;

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error during document validation',
          code: 'VALIDATION_ERROR',
          details: error.message
        }],
        documentType: documentType
      };
    }
  }

  /**
   * Validate multiple documents at once
   * @param {Array} files - Array of file objects
   * @param {Array} documentTypes - Array of document types corresponding to files
   * @returns {Object} - Validation results for all files
   */
  validateMultipleDocuments(files, documentTypes) {
    try {
      const results = {
        isValid: true,
        validDocuments: [],
        invalidDocuments: [],
        summary: {
          total: files.length,
          valid: 0,
          invalid: 0
        }
      };

      files.forEach((file, index) => {
        const documentType = documentTypes[index];
        const validation = this.validateDocument(file, documentType);
        
        if (validation.isValid) {
          results.validDocuments.push({
            index,
            documentType,
            file,
            validation
          });
          results.summary.valid++;
        } else {
          results.invalidDocuments.push({
            index,
            documentType,
            file,
            validation
          });
          results.summary.invalid++;
          results.isValid = false;
        }
      });

      return results;

    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating multiple documents',
        details: error.message
      };
    }
  }

  /**
   * Get file extension from filename
   * @param {String} filename - Original filename
   * @returns {String} - File extension in lowercase
   */
  getFileExtension(filename) {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Get MIME types for given formats
   * @param {Array} formats - Array of file formats
   * @returns {Array} - Array of corresponding MIME types
   */
  getMimeTypesForFormats(formats) {
    const mimeTypeMap = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png'
    };
    
    return formats.map(format => mimeTypeMap[format.toLowerCase()]).filter(Boolean);
  }

  /**
   * Validate GST number format (15-character alphanumeric)
   * @param {String} gstNumber - GST number to validate
   * @returns {Object} - Validation result with isValid boolean and error message
   */
  validateGstNumber(gstNumber) {
    try {
      if (!gstNumber) {
        return {
          isValid: false,
          error: 'GST number is required',
          code: 'GST_REQUIRED'
        };
      }

      // Remove any spaces and convert to uppercase
      const cleanGstNumber = gstNumber.toString().replace(/\s/g, '').toUpperCase();

      // GST number format: 15 characters alphanumeric
      // Pattern: 22AAAAA0000A1Z5 (2 digits + 10 alphanumeric + 1 digit + 1 alpha + 1 alphanumeric)
      const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

      if (cleanGstNumber.length !== 15) {
        return {
          isValid: false,
          error: 'GST number must be 15 characters in format: 22AAAAA0000A1Z5',
          code: 'GST_INVALID_LENGTH',
          expectedLength: 15,
          actualLength: cleanGstNumber.length,
          format: '22AAAAA0000A1Z5'
        };
      }

      if (!gstPattern.test(cleanGstNumber)) {
        return {
          isValid: false,
          error: 'GST number must be 15 characters in format: 22AAAAA0000A1Z5',
          code: 'GST_INVALID_FORMAT',
          format: '22AAAAA0000A1Z5',
          received: cleanGstNumber
        };
      }

      return {
        isValid: true,
        gstNumber: cleanGstNumber,
        format: 'Valid GST format'
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating GST number',
        code: 'GST_VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate PAN number format (10-character alphanumeric)
   * @param {String} panNumber - PAN number to validate
   * @returns {Object} - Validation result with isValid boolean and error message
   */
  validatePanNumber(panNumber) {
    try {
      if (!panNumber) {
        return {
          isValid: false,
          error: 'PAN number is required',
          code: 'PAN_REQUIRED'
        };
      }

      // Remove any spaces and convert to uppercase
      const cleanPanNumber = panNumber.toString().replace(/\s/g, '').toUpperCase();

      // PAN number format: 10 characters alphanumeric
      // Pattern: ABCDE1234F (5 letters + 4 digits + 1 letter)
      const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (cleanPanNumber.length !== 10) {
        return {
          isValid: false,
          error: 'PAN number must be 10 characters in format: ABCDE1234F',
          code: 'PAN_INVALID_LENGTH',
          expectedLength: 10,
          actualLength: cleanPanNumber.length,
          format: 'ABCDE1234F'
        };
      }

      if (!panPattern.test(cleanPanNumber)) {
        return {
          isValid: false,
          error: 'PAN number must be 10 characters in format: ABCDE1234F',
          code: 'PAN_INVALID_FORMAT',
          format: 'ABCDE1234F',
          received: cleanPanNumber
        };
      }

      return {
        isValid: true,
        panNumber: cleanPanNumber,
        format: 'Valid PAN format'
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating PAN number',
        code: 'PAN_VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate TAN (Tax Deduction and Collection Account Number) format
   * @param {String} tanNumber - TAN number to validate
   * @returns {Object} - Validation result with isValid boolean and error message
   */
  validateTanNumber(tanNumber) {
    try {
      if (!tanNumber) {
        return {
          isValid: false,
          error: 'TAN number is required',
          code: 'TAN_REQUIRED'
        };
      }

      // Remove any spaces and convert to uppercase
      const cleanTanNumber = tanNumber.toString().replace(/\s/g, '').toUpperCase();

      // TAN number format: 10 characters alphanumeric
      // Pattern: ABCD12345E (4 letters + 5 digits + 1 letter)
      const tanPattern = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;

      if (cleanTanNumber.length !== 10) {
        return {
          isValid: false,
          error: 'TAN number must be 10 characters in format: ABCD12345E',
          code: 'TAN_INVALID_LENGTH',
          expectedLength: 10,
          actualLength: cleanTanNumber.length,
          format: 'ABCD12345E'
        };
      }

      if (!tanPattern.test(cleanTanNumber)) {
        return {
          isValid: false,
          error: 'TAN number must be 10 characters in format: ABCD12345E (4 letters + 5 digits + 1 letter)',
          code: 'TAN_INVALID_FORMAT',
          format: 'ABCD12345E',
          received: cleanTanNumber
        };
      }

      return {
        isValid: true,
        tanNumber: cleanTanNumber,
        format: 'Valid TAN format'
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating TAN number',
        code: 'TAN_VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate Aadhar number format (12-digit numeric)
   * @param {String} aadharNumber - Aadhar number to validate
   * @returns {Object} - Validation result with isValid boolean and error message
   */
  validateAadharNumber(aadharNumber) {
    try {
      if (!aadharNumber) {
        return {
          isValid: false,
          error: 'Aadhar number is required',
          code: 'AADHAR_REQUIRED'
        };
      }

      // Remove any spaces and convert to string
      const cleanAadharNumber = aadharNumber.toString().replace(/\s/g, '');

      // Aadhar number format: 12 digits numeric only
      const aadharPattern = /^[0-9]{12}$/;

      if (cleanAadharNumber.length !== 12) {
        return {
          isValid: false,
          error: 'Aadhar number must be 12 digits',
          code: 'AADHAR_INVALID_LENGTH',
          expectedLength: 12,
          actualLength: cleanAadharNumber.length,
          format: '123456789012'
        };
      }

      if (!aadharPattern.test(cleanAadharNumber)) {
        return {
          isValid: false,
          error: 'Aadhar number must be 12 digits',
          code: 'AADHAR_INVALID_FORMAT',
          format: '123456789012',
          received: cleanAadharNumber
        };
      }

      return {
        isValid: true,
        aadharNumber: cleanAadharNumber,
        format: 'Valid Aadhar format'
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating Aadhar number',
        code: 'AADHAR_VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate document numbers based on type
   * @param {String} documentType - Type of document (gst, pan, aadhar)
   * @param {String} documentNumber - Document number to validate
   * @returns {Object} - Validation result
   */
  validateDocumentNumber(documentType, documentNumber) {
    try {
      switch (documentType.toLowerCase()) {
        case 'gst':
          return this.validateGstNumber(documentNumber);
        case 'pan':
          return this.validatePanNumber(documentNumber);
        case 'aadhar':
          return this.validateAadharNumber(documentNumber);
        default:
          return {
            isValid: false,
            error: `Document number validation not supported for type: ${documentType}`,
            code: 'UNSUPPORTED_DOCUMENT_TYPE'
          };
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Error validating document number',
        code: 'DOCUMENT_NUMBER_VALIDATION_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Validate employer document requirements (GST + PAN numbers)
   * @param {Object} employerData - Employer data containing GST and PAN information
   * @returns {Object} - Validation result for employer documents
   */
  validateEmployerDocumentNumbers(employerData) {
    try {
      const { hasGst, GstNum, PanNum } = employerData;
      const validationResult = {
        isValid: true,
        errors: [],
        validatedNumbers: {}
      };

      // If employer has GST, validate GST number
      if (hasGst === true || hasGst === 'true') {
        if (!GstNum) {
          validationResult.errors.push({
            field: 'GstNum',
            message: 'GST number is required when GST registration is selected',
            code: 'GST_NUMBER_REQUIRED'
          });
          validationResult.isValid = false;
        } else {
          const gstValidation = this.validateGstNumber(GstNum);
          if (!gstValidation.isValid) {
            validationResult.errors.push({
              field: 'GstNum',
              message: gstValidation.error,
              code: gstValidation.code,
              format: gstValidation.format
            });
            validationResult.isValid = false;
          } else {
            validationResult.validatedNumbers.gst = gstValidation.gstNumber;
          }
        }
      } else {
        // If no GST, PAN is mandatory
        if (!PanNum) {
          validationResult.errors.push({
            field: 'PanNum',
            message: 'PAN number is required when GST registration is not selected',
            code: 'PAN_NUMBER_REQUIRED'
          });
          validationResult.isValid = false;
        } else {
          const panValidation = this.validatePanNumber(PanNum);
          if (!panValidation.isValid) {
            validationResult.errors.push({
              field: 'PanNum',
              message: panValidation.error,
              code: panValidation.code,
              format: panValidation.format
            });
            validationResult.isValid = false;
          } else {
            validationResult.validatedNumbers.pan = panValidation.panNumber;
          }
        }
      }

      return validationResult;

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error validating employer document numbers',
          code: 'EMPLOYER_VALIDATION_ERROR',
          details: error.message
        }]
      };
    }
  }

  /**
   * Get human-readable error message for validation result
   * @param {Object} validationResult - Result from validateDocument
   * @returns {String} - User-friendly error message
   */
  getErrorMessage(validationResult) {
    if (validationResult.isValid) {
      return null;
    }

    if (validationResult.errors && validationResult.errors.length > 0) {
      return validationResult.errors.map(error => error.message).join('. ');
    }

    return 'Document validation failed';
  }

  /**
   * Get format-specific error messages for document numbers
   * @param {String} documentType - Type of document (gst, pan, aadhar)
   * @param {String} errorCode - Error code from validation
   * @returns {String} - Specific error message with format example
   */
  getDocumentNumberErrorMessage(documentType, errorCode) {
    const errorMessages = {
      gst: {
        GST_REQUIRED: 'GST number is required for employer registration',
        GST_INVALID_LENGTH: 'GST number must be 15 characters in format: 22AAAAA0000A1Z5',
        GST_INVALID_FORMAT: 'GST number must be 15 characters in format: 22AAAAA0000A1Z5',
        GST_VALIDATION_ERROR: 'Error validating GST number format'
      },
      pan: {
        PAN_REQUIRED: 'PAN number is required for registration',
        PAN_INVALID_LENGTH: 'PAN number must be 10 characters in format: ABCDE1234F',
        PAN_INVALID_FORMAT: 'PAN number must be 10 characters in format: ABCDE1234F',
        PAN_VALIDATION_ERROR: 'Error validating PAN number format'
      },
      aadhar: {
        AADHAR_REQUIRED: 'Aadhar number is required for job seeker registration',
        AADHAR_INVALID_LENGTH: 'Aadhar number must be 12 digits',
        AADHAR_INVALID_FORMAT: 'Aadhar number must be 12 digits',
        AADHAR_VALIDATION_ERROR: 'Error validating Aadhar number format'
      }
    };

    return errorMessages[documentType]?.[errorCode] || 'Invalid document number format';
  }

  /**
   * Check if document type is valid
   * @param {String} documentType - Document type to validate
   * @returns {Boolean} - True if valid document type
   */
  isValidDocumentType(documentType) {
    return Object.keys(this.documentTypes).includes(documentType);
  }

  /**
   * Get all supported document types
   * @returns {Object} - Object with document types and their descriptions
   */
  getSupportedDocumentTypes() {
    return { ...this.documentTypes };
  }

  /**
   * Get validation configuration including document number formats
   * @returns {Object} - Current validation configuration
   */
  getValidationConfig() {
    return {
      allowedFormats: [...this.allowedFormats],
      allowedMimeTypes: [...this.allowedMimeTypes],
      maxFileSize: this.maxFileSize,
      maxFileSizeMB: (this.maxFileSize / (1024 * 1024)).toFixed(1),
      supportedDocuments: { ...this.documentTypes },
      documentNumberFormats: {
        gst: {
          length: 15,
          pattern: '22AAAAA0000A1Z5',
          description: '15-character alphanumeric GST number'
        },
        pan: {
          length: 10,
          pattern: 'ABCDE1234F',
          description: '10-character alphanumeric PAN number'
        },
        aadhar: {
          length: 12,
          pattern: '123456789012',
          description: '12-digit numeric Aadhar number'
        }
      }
    };
  }
}

module.exports = DocumentValidationService;