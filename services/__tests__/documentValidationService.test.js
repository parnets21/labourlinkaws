/**
 * Basic tests for DocumentValidationService
 * These are simple unit tests to verify the service functionality
 */

const DocumentValidationService = require('../documentValidationService');

describe('DocumentValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new DocumentValidationService();
  });

  describe('validateFileFormat', () => {
    test('should accept valid PDF file', () => {
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf'
      };

      const result = validationService.validateFileFormat(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    test('should accept valid JPG file', () => {
      const mockFile = {
        originalname: 'document.jpg',
        mimetype: 'image/jpeg'
      };

      const result = validationService.validateFileFormat(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('jpg');
    });

    test('should reject invalid file format', () => {
      const mockFile = {
        originalname: 'document.txt',
        mimetype: 'text/plain'
      };

      const result = validationService.validateFileFormat(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('INVALID_MIME_TYPE');
      expect(result.allowedFormats).toEqual(['pdf', 'jpg', 'jpeg', 'png']);
    });

    test('should handle missing file', () => {
      const result = validationService.validateFileFormat(null);
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('NO_FILE');
    });
  });

  describe('validateFileSize', () => {
    test('should accept file within size limit', () => {
      const mockFile = {
        size: 1024 * 1024 // 1MB
      };

      const result = validationService.validateFileSize(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.fileSize).toBe(1024 * 1024);
    });

    test('should reject file exceeding size limit', () => {
      const mockFile = {
        size: 6 * 1024 * 1024 // 6MB (exceeds 5MB limit)
      };

      const result = validationService.validateFileSize(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FILE_TOO_LARGE');
      expect(result.compressionSuggestion).toBeDefined();
    });

    test('should handle missing file size', () => {
      const mockFile = {};

      const result = validationService.validateFileSize(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('NO_SIZE_INFO');
    });
  });

  describe('validateDocument', () => {
    test('should validate complete document successfully', () => {
      const mockFile = {
        originalname: 'pan-card.pdf',
        mimetype: 'application/pdf',
        size: 2 * 1024 * 1024 // 2MB
      };

      const result = validationService.validateDocument(mockFile, 'pan');
      
      expect(result.isValid).toBe(true);
      expect(result.documentType).toBe('pan');
      expect(result.errors).toHaveLength(0);
      expect(result.fileInfo).toBeDefined();
      expect(result.fileInfo.originalName).toBe('pan-card.pdf');
    });

    test('should reject document with multiple validation errors', () => {
      const mockFile = {
        originalname: 'document.txt',
        mimetype: 'text/plain',
        size: 10 * 1024 * 1024 // 10MB (too large)
      };

      const result = validationService.validateDocument(mockFile, 'gst');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should have both format and size errors
      const errorCodes = result.errors.map(error => error.code);
      expect(errorCodes).toContain('INVALID_MIME_TYPE');
      expect(errorCodes).toContain('FILE_TOO_LARGE');
    });

    test('should reject invalid document type', () => {
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024
      };

      const result = validationService.validateDocument(mockFile, 'invalid_type');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_DOCUMENT_TYPE');
    });
  });

  describe('utility methods', () => {
    test('should get file extension correctly', () => {
      expect(validationService.getFileExtension('document.pdf')).toBe('pdf');
      expect(validationService.getFileExtension('image.JPG')).toBe('jpg');
      expect(validationService.getFileExtension('file')).toBe('file');
      expect(validationService.getFileExtension('')).toBe('');
    });

    test('should validate document types', () => {
      expect(validationService.isValidDocumentType('pan')).toBe(true);
      expect(validationService.isValidDocumentType('gst')).toBe(true);
      expect(validationService.isValidDocumentType('aadhar')).toBe(true);
      expect(validationService.isValidDocumentType('tin')).toBe(true);
      expect(validationService.isValidDocumentType('invalid')).toBe(false);
    });

    test('should return validation configuration', () => {
      const config = validationService.getValidationConfig();
      
      expect(config.allowedFormats).toEqual(['pdf', 'jpg', 'jpeg', 'png']);
      expect(config.maxFileSizeMB).toBe('5.0');
      expect(config.supportedDocuments).toHaveProperty('pan');
      expect(config.supportedDocuments).toHaveProperty('gst');
    });
  });
});